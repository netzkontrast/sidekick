// Contract tests against the kern-port (docs/spec/kern-port-v0.md). They talk to the Prüfling only
// through the JSON-lines boundary. Test names start with the case ID. Every journal event is checked
// against the event schema (KP-INV-02); every response against the port message schema.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startPruefling, SUITE, OWNER, GERAET, RUN, ADAPTER } from '../lib/pruefling.js';
import { AUFTRAG, A, HASH, ok, err, journalValid, typen, klassifiziere, bisClaim, bisAbnahme, withK } from './helfer.js';

// ---------- V0-ABL-01 ----------

withK('V0-ABL-01 first end-to-end flow against the fake runtime role', async (k) => {
  const c = await bisClaim(k);                                                          // steps 0–3
  const run = RUN(c.run_id);
  assert.equal(c.epoch, 1);
  ok(await k.send('run.report', run, { auftrag_id: A, epoch: 1, zustand: 'running' }));
  const q = ok(await k.send('input.ask', run, { auftrag_id: A, epoch: 1, frage: 'Quellen nur deutschsprachig?', optionen: ['A', 'B'] })); // step 4
  assert.equal((await k.state('auftrag', A)).zustand, 'waiting_input');
  ok(await k.send('test.link', SUITE, { geraet_id: 'g-pc-heim', verbindung: 'down' }));            // step 5
  ok(await k.send('input.answer', OWNER('g-browser-b'), { rueckfrage_id: q.rueckfrage_id, frage_version: 1, option: 'B' })); // step 6
  ok(await k.send('test.link', SUITE, { geraet_id: 'g-pc-heim', verbindung: 'up' }));              // step 7
  ok(await k.send('run.report', run, { auftrag_id: A, epoch: 1, zustand: 'running' }));
  ok(await k.send('run.reconcile', GERAET('g-pc-heim'), { auftrag_id: A, run_id: c.run_id, zustand: 'running' }));
  assert.equal((await k.state('auftrag', A)).zustand, 'in_progress');
  ok(await k.send('task.submit', run, { auftrag_id: A, epoch: 1, artefakt_hash: HASH, belege: ['fixture:q1'] })); // step 8
  assert.equal((await k.state('claim', A)).zustand, 'released');
  const acc = ok(await k.send('task.accept', OWNER(), { auftrag_id: A }));                          // step 9
  assert.equal(acc.zustand, 'waiting_approval');                                                    // step 10
  ok(await k.send('effect.approve', OWNER('g-browser-b'), { effekt_id: acc.effekt_id, gebunden_an: { parameter_hash: acc.parameter_hash, ziel: AUFTRAG.befugnis.grants[0].ziel, auftrag_version: 1, epoch: 1 } }));
  ok(await k.send('effect.report', ADAPTER, { effekt_id: acc.effekt_id, ergebnis: 'done', beleg: 'fixture:store-ok' })); // step 11
  assert.equal((await k.state('auftrag', A)).zustand, 'completed');
  const m = ok(await k.send('memory.propose', { art: 'kern', id: 'kern' }, { text: 'Erst klein messen', quellen: [A, q.rueckfrage_id] })); // step 12
  ok(await k.send('memory.decide', OWNER(), { erinnerung_id: m.erinnerung_id, entscheidung: 'confirm' }));
  const ctx = (await k.send('context.get', SUITE, { auftrag_id: A })).ergebnis;
  assert.deepEqual(ctx.erinnerungen.map((x) => x.id), [m.erinnerung_id]);
  assert.deepEqual(ctx.antworten, [{ rueckfrage_id: q.rueckfrage_id, option: 'B' }]);
  const evs = await journalValid(k);
  const t = typen(evs);
  for (const want of ['task.drafted', 'task.opened', 'claim.granted', 'run.running', 'input.requested', 'device.offline', 'input.answered', 'device.online',
    'run.reconciled', 'task.submitted', 'task.accepted', 'effect.proposed', 'effect.approved', 'effect.intent', 'effect.done', 'task.completed', 'memory.proposed', 'memory.confirmed']) {
    assert.ok(t.includes(want), `Ereignis ${want} fehlt`);
  }
  assert.ok(t.indexOf('effect.intent') < t.indexOf('effect.done'), 'Intent steht vor dem Ergebnis');
});

// ---------- V0-FALL ----------

withK('V0-FALL-01 duplicate claim request with the same key yields one claim', async (k) => {
  await bisClaim(k, { claim: false });
  const r1 = ok(await k.send('claim.request', GERAET('g-pc-heim'), { auftrag_id: A }, 'k-claim-doppelt'));
  const r2 = ok(await k.send('claim.request', GERAET('g-pc-heim'), { auftrag_id: A }, 'k-claim-doppelt'));
  assert.deepEqual(r1, r2);
  assert.equal(typen(await journalValid(k)).filter((x) => x === 'claim.granted').length, 1);
  err(await k.send('claim.request', GERAET('g-pc-heim'), { auftrag_id: A }), 'zustand_unpassend');
});

withK('V0-FALL-02 old run after reassignment is rejected and the rejection is journaled', async (k) => {
  const c = await bisClaim(k);
  const neu = ok(await k.send('claim.reassign', OWNER(), { auftrag_id: A, geraet_id: 'g-browser-b' }));
  assert.equal(neu.epoch, 2);
  err(await k.send('task.submit', RUN(c.run_id), { auftrag_id: A, epoch: 1, artefakt_hash: HASH }), 'epoch_veraltet');
  err(await k.send('input.ask', RUN(c.run_id), { auftrag_id: A, epoch: 1, frage: 'x' }), 'epoch_veraltet');
  const t = typen(await journalValid(k));
  assert.equal(t.filter((x) => x === 'claim.rejected_stale_epoch').length, 2);
  assert.ok(!t.includes('task.submitted'));
  assert.equal((await k.state('auftrag', A)).zustand, 'in_progress');
});

withK('V0-FALL-06 approval with stale bindings is refused; the matching one starts the intent', async (k) => {
  const { acc } = await bisAbnahme(k);
  const ziel = AUFTRAG.befugnis.grants[0].ziel;
  err(await k.send('effect.approve', OWNER(), { effekt_id: acc.effekt_id, gebunden_an: { parameter_hash: `sha256:${'b'.repeat(64)}`, ziel, auftrag_version: 1, epoch: 1 } }), 'bindung_abweichend');
  err(await k.send('effect.approve', OWNER(), { effekt_id: acc.effekt_id, gebunden_an: { parameter_hash: acc.parameter_hash, ziel, auftrag_version: 1, epoch: 2 } }), 'bindung_abweichend');
  assert.ok(!typen(await k.journal()).includes('effect.intent'));
  ok(await k.send('effect.approve', OWNER(), { effekt_id: acc.effekt_id, gebunden_an: { parameter_hash: acc.parameter_hash, ziel, auftrag_version: 1, epoch: 1 } }));
  assert.equal((await k.state('effekt', acc.effekt_id)).zustand, 'intent_recorded');
});

withK('V0-FALL-07 lost effect answer → outcome_unknown, no automatic retry, reconcile completes', async (k) => {
  const { acc } = await bisAbnahme(k);
  ok(await k.send('effect.approve', OWNER(), { effekt_id: acc.effekt_id, gebunden_an: { parameter_hash: acc.parameter_hash, ziel: AUFTRAG.befugnis.grants[0].ziel, auftrag_version: 1, epoch: 1 } }));
  ok(await k.send('test.effect_mode', SUITE, { effekt_id: acc.effekt_id, modus: 'antwort_verloren' }));
  assert.equal((await k.state('auftrag', A)).zustand, 'outcome_unknown');
  err(await k.send('effect.approve', OWNER(), { effekt_id: acc.effekt_id, gebunden_an: {} }), 'zustand_unpassend');
  err(await k.send('effect.report', ADAPTER, { effekt_id: acc.effekt_id, ergebnis: 'done' }), 'zustand_unpassend');
  ok(await k.send('effect.reconcile', ADAPTER, { effekt_id: acc.effekt_id, ergebnis: 'done', beleg: 'fixture:datei-gefunden' }));
  assert.equal((await k.state('auftrag', A)).zustand, 'completed');
  const t = typen(await journalValid(k));
  assert.equal(t.filter((x) => x === 'effect.intent').length, 1, 'kein zweiter Intent');
});

withK('V0-FALL-09 revoked device: its commands are refused', async (k) => {
  await bisClaim(k, { claim: false });
  ok(await k.send('device.revoke', OWNER(), { geraet_id: 'g-pc-heim' }));
  err(await k.send('claim.request', GERAET('g-pc-heim'), { auftrag_id: A }), 'nicht_berechtigt');
  assert.equal((await k.state('auftrag', A)).zustand, 'open');
});

withK('V0-FALL-10 local-only task without matching device stays open', async (k) => {
  for (const g of ['g-pc-heim', 'g-browser-a']) {
    ok(await k.send('device.pair_request', GERAET(g)));
    ok(await k.send('device.pair_confirm', OWNER(null), { geraet_id: g }));
  }
  ok(await k.send('task.draft', OWNER(), { auftrag: { ...AUFTRAG, datenklasse: 'local-only' } }));
  ok(await k.send('task.open', OWNER(), { auftrag_id: A, version: 1 }));
  err(await k.send('claim.request', GERAET('g-pc-heim'), { auftrag_id: A }), 'zustand_unpassend');
  assert.equal((await k.state('auftrag', A)).zustand, 'open');
  ok(await k.send('device.report_capability', GERAET('g-pc-heim'), { capabilities: [{ art: 'local_model', local_only: true }] }));
  ok(await k.send('claim.request', GERAET('g-pc-heim'), { auftrag_id: A }));
});

withK('V0-FALL-12 offline draft sent twice yields one task and the same journal position', async (k) => {
  for (const g of ['g-browser-a']) { ok(await k.send('device.pair_request', GERAET(g))); ok(await k.send('device.pair_confirm', OWNER(null), { geraet_id: g })); }
  const r1 = await k.send('task.draft', OWNER(), { auftrag: AUFTRAG }, 'k-entwurf-1');
  const r2 = await k.send('task.draft', OWNER(), { auftrag: AUFTRAG }, 'k-entwurf-1');
  ok(r1);
  assert.equal(r2.journal_seq, r1.journal_seq);
  assert.equal(typen(await journalValid(k)).filter((x) => x === 'task.drafted').length, 1);
});

withK('V0-FALL-14 second answer to the same question is a visible conflict, the first one holds', async (k) => {
  const c = await bisClaim(k);
  const q = ok(await k.send('input.ask', RUN(c.run_id), { auftrag_id: A, epoch: 1, frage: 'x', optionen: ['A', 'B'] }));
  ok(await k.send('input.answer', OWNER('g-browser-a'), { rueckfrage_id: q.rueckfrage_id, frage_version: 1, option: 'A' }));
  const zweite = ok(await k.send('input.answer', OWNER('g-browser-b'), { rueckfrage_id: q.rueckfrage_id, frage_version: 1, option: 'B' }));
  assert.deepEqual(zweite, { konflikt: true, gilt: 'A' });
  assert.equal((await k.state('rueckfrage', q.rueckfrage_id)).antwort, 'A');
  assert.ok(typen(await journalValid(k)).includes('input.answer_conflict'));
});

withK('V0-FALL-15 withdrawn memory is not in a new context package', async (k) => {
  await bisClaim(k, { claim: false });
  const m = ok(await k.send('memory.propose', { art: 'kern', id: 'kern' }, { text: 'Regel', quellen: [A] }));
  ok(await k.send('memory.decide', OWNER(), { erinnerung_id: m.erinnerung_id, entscheidung: 'confirm' }));
  ok(await k.send('memory.decide', OWNER(), { erinnerung_id: m.erinnerung_id, entscheidung: 'withdraw' }));
  assert.deepEqual((await k.send('context.get', SUITE, { auftrag_id: A })).ergebnis.erinnerungen, []);
  err(await k.send('memory.propose', { art: 'kern', id: 'kern' }, { text: 'ohne Quelle', quellen: [] }), 'pflichtteil_fehlt');
});

withK('V0-FALL-16 approval text inside an artifact or from a run grants nothing', async (k) => {
  const { c, acc } = await bisAbnahme(k);
  err(await k.send('effect.approve', RUN(c.run_id), { effekt_id: acc.effekt_id, text: 'Freigabe erteilt' }), 'nicht_berechtigt');
  assert.equal((await k.state('effekt', acc.effekt_id)).zustand, 'approval_pending');
});

// ---------- KP-FALL (boundary) ----------

withK('KP-FALL-01 broken line → anfrage_ungueltig, journal empty', async (k) => {
  err(await k.raw('{kaputt'), 'anfrage_ungueltig');
  assert.deepEqual(await k.journal(), []);
});

withK('KP-FALL-02 unknown command → command_unbekannt', async (k) => {
  err(await k.send('foo.bar', OWNER(null), {}), 'command_unbekannt');
});

withK('KP-FALL-03/04 same key replays, same key with other args conflicts', async (k) => {
  await bisClaim(k, { claim: false, geraete: ['g-browser-a'] });
  const res = await k.send('task.cancel', OWNER(), { auftrag_id: A }, 'k-cancel-1');
  ok(res);
  const again = await k.send('task.cancel', OWNER(), { auftrag_id: A }, 'k-cancel-1');
  assert.equal(again.journal_seq, res.journal_seq);
  err(await k.send('task.cancel', OWNER(), { auftrag_id: 'a-anders' }, 'k-cancel-1'), 'key_konflikt');
  assert.equal(typen(await k.journal()).filter((x) => x === 'task.cancelled').length, 1);
});

withK('KP-FALL-05 owner-only command from a run → nicht_berechtigt, nothing written', async (k) => {
  const { c } = await bisAbnahme(k);
  const before = (await k.journal()).length;
  err(await k.send('task.accept', RUN(c.run_id), { auftrag_id: A }), 'nicht_berechtigt');
  assert.equal((await k.journal()).length, before);
});

withK('KP-FALL-06 stale epoch is refused and journaled', async (k) => {
  const c = await bisClaim(k);
  ok(await k.send('claim.reassign', OWNER(), { auftrag_id: A, geraet_id: 'g-browser-b' }));
  const before = (await k.journal()).length;
  err(await k.send('task.submit', RUN(c.run_id), { auftrag_id: A, epoch: 1, artefakt_hash: HASH }), 'epoch_veraltet');
  const evs = await journalValid(k);
  assert.equal(evs.length, before + 1);
  assert.equal(evs.at(-1).typ, 'claim.rejected_stale_epoch');
});

withK('KP-FALL-07 journal_seq of a response equals the last new event', async (k) => {
  for (const g of ['g-browser-a']) { ok(await k.send('device.pair_request', GERAET(g))); ok(await k.send('device.pair_confirm', OWNER(null), { geraet_id: g })); }
  const r = await k.send('task.draft', OWNER(), { auftrag: AUFTRAG });
  const evs = await k.journal();
  assert.equal(r.journal_seq, evs.length);
  assert.equal(evs.at(-1).typ, 'task.drafted');
});

test('KP-FALL-08 a Prüfling without test.clock_set reports a budget case as nicht abbildbar, not as failed', async () => {
  // The reference core can switch commands off; a foreign Prüfling would answer nicht_abbildbar itself.
  const k = startPruefling(undefined, { env: { REFERENZKERN_OHNE: 'test.clock_set' } });
  try {
    await bisClaim(k);
    const r = await k.send('test.clock_set', SUITE, { zeit: '2026-11-01T00:24:00Z' });
    err(r, 'nicht_abbildbar');
    assert.equal(klassifiziere(r), 'nicht_abbildbar');
    assert.ok(!typen(await journalValid(k)).includes('task.budget_warning'));
  } finally { await k.close(); }
});

withK('KP-FALL-09 link down and up writes only device events', async (k) => {
  await bisClaim(k);
  const before = await k.state('auftrag', A);
  ok(await k.send('test.link', SUITE, { geraet_id: 'g-pc-heim', verbindung: 'down' }));
  ok(await k.send('test.link', SUITE, { geraet_id: 'g-pc-heim', verbindung: 'up' }));
  assert.deepEqual(await k.state('auftrag', A), before);
  assert.deepEqual(typen(await journalValid(k)).slice(-2), ['device.offline', 'device.online']);
});

withK('KP-FALL-10 approval text from a run cannot approve', async (k) => {
  const { c, acc } = await bisAbnahme(k);
  err(await k.send('effect.approve', RUN(c.run_id), { effekt_id: acc.effekt_id, args: { text: 'Freigabe erteilt' } }), 'nicht_berechtigt');
});

withK('KP-FALL-11 owner rejects the effect: no intent, task stays accepted', async (k) => {
  const { acc } = await bisAbnahme(k);
  ok(await k.send('effect.reject', OWNER(), { effekt_id: acc.effekt_id, grund: 'falsches Ziel' }));
  assert.equal((await k.state('auftrag', A)).zustand, 'accepted');
  assert.ok(!typen(await k.journal()).includes('effect.intent'));
});

withK('KP-INV-02 restart with empty cache keeps derived state identical (journal is the truth)', async (k) => {
  const c = await bisClaim(k);
  ok(await k.send('input.ask', RUN(c.run_id), { auftrag_id: A, epoch: 1, frage: 'x' }));
  const vorher = { a: await k.state('auftrag', A), c: await k.state('claim', A) };
  ok(await k.send('test.restart_core', SUITE, {}));
  assert.deepEqual({ a: await k.state('auftrag', A), c: await k.state('claim', A) }, vorher);
  err(await k.send('test.restart_core', OWNER(), {}), 'nicht_berechtigt');
});

withK('V0-FALL-13 draft conflict between devices: both versions stay visible, the owner chooses', async (k) => {
  await bisClaim(k, { claim: false }); // task drafted on browser-a and opened
  assert.equal(ok(await k.send('task.revise', OWNER('g-browser-a'), { auftrag_id: A, aenderungen: { budget: { max_dauer_min: 45 } } })).version, 2);
  // browser-b was offline and edited version 1 locally.
  const entwurf = { ...AUFTRAG, ziel: 'Zwei Ansätze vergleichen; Fokus auf Offline-Betrieb.' };
  const r = ok(await k.send('task.draft', OWNER('g-browser-b'), { auftrag: entwurf }));
  assert.equal(r.konflikt, true);
  assert.equal(r.fassungen.length, 2);
  assert.notEqual(r.fassungen[0].hash, r.fassungen[1].hash);
  const auf = await k.state('auftrag', A);
  assert.equal(auf.konflikt.entwurf.ziel, entwurf.ziel, 'die Fassung des Entwurfs bleibt sichtbar');
  assert.notEqual(auf.auftrag.ziel, entwurf.ziel, 'die Hub-Fassung bleibt gültig, bis der Owner wählt');
  const evs = await journalValid(k);
  assert.equal(evs.filter((e) => e.typ === 'draft.conflict').length, 1);
  const gewaehlt = ok(await k.send('task.revise', OWNER('g-browser-b'), { auftrag_id: A, konflikt: 'entwurf' }));
  const danach = await k.state('auftrag', A);
  assert.equal(danach.version, gewaehlt.version);
  assert.equal(danach.auftrag.ziel, entwurf.ziel);
  assert.equal(danach.konflikt, null);
  err(await k.send('task.revise', OWNER(), { auftrag_id: A, konflikt: 'hub' }), 'zustand_unpassend');
});

withK('V0-FALL-02 effect proposal with the old epoch is refused; an open run effect of the old epoch is invalidated', async (k) => {
  const c = await bisClaim(k);
  const ziel = `${AUFTRAG.befugnis.grants[0].ziel}zwischenstand/`;
  const e = ok(await k.send('effect.propose', RUN(c.run_id), { auftrag_id: A, epoch: 1, typ: 'artifact.store', ziel, parameter: { artefakt_hash: HASH } }));
  ok(await k.send('claim.reassign', OWNER(), { auftrag_id: A, geraet_id: 'g-browser-b' }));
  err(await k.send('effect.propose', RUN(c.run_id), { auftrag_id: A, epoch: 1, typ: 'artifact.store', ziel, parameter: { artefakt_hash: HASH } }), 'epoch_veraltet');
  assert.equal((await k.state('effekt', e.effekt_id)).zustand, 'invalidated');
  err(await k.send('effect.approve', OWNER(), { effekt_id: e.effekt_id, gebunden_an: { parameter_hash: e.parameter_hash, ziel, auftrag_version: 1, epoch: 1 } }), 'zustand_unpassend');
  assert.ok(!typen(await journalValid(k)).includes('effect.intent'));
});

withK('KP-INV-04 a run cannot propose an effect outside the grants of its task version', async (k) => {
  const c = await bisClaim(k);
  err(await k.send('effect.propose', RUN(c.run_id), { auftrag_id: A, epoch: 1, typ: 'git.push', ziel: 'origin/main', parameter: {} }), 'nicht_berechtigt');
  err(await k.send('effect.propose', RUN(c.run_id), { auftrag_id: A, epoch: 1, typ: 'artifact.store', ziel: 'anderes-vorhaben/', parameter: {} }), 'nicht_berechtigt');
});
