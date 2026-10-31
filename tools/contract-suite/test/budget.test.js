// Budget cases V0-FALL-18…26 (V0 §4.9, §5.1) over the kern-port boundary. Minutes are budget
// consumption on the simulated core clock; the claim is granted at minute 0.
import assert from 'node:assert/strict';
import path from 'node:path';
import { validateSchema } from '../../skill-library/lib/schema.js';
import { SUITE, OWNER, GERAET, RUN, ADAPTER } from '../lib/pruefling.js';
import { AUFTRAG, A, HASH, SPEC, readJson, ok, err, journalValid, typen, bisClaim, withK } from './helfer.js';

const UEBERGABE_SCHEMA = readJson(path.join(SPEC, 'schemas', 'uebergabe.schema.json'));
const START = Date.parse('2026-11-01T00:00:00Z');
const iso = (min) => new Date(START + min * 60_000).toISOString();
const bei = async (k, min) => ok(await k.send('test.clock_set', SUITE, { zeit: iso(min) }));
const budget = async (k) => (await k.send('state.get', SUITE, { entitaet: 'budget', id: A })).ergebnis;
const nur = (evs, typ) => evs.filter((e) => e.typ === typ);

/** Example task of §5.1: 30 min, 2 runs, warning at 0.8, repair limit 0.5. */
const BUDGET = { ...AUFTRAG, budget: { max_dauer_min: 30, max_runs: 2, vorwarnung_anteil: 0.8, reparatur_anteil_max: 0.5 } };
const UEBERGABE = (kriterienstand = { k1: 'offen', k2: 'erfuellt_laut_bearbeiter' }, extra = {}) => ({
  ausgangsstand: [{ ref: 'fixture:quellen-set-1', hash: HASH }],
  ergebnisse: [{ artefakt_hash: HASH, beleg: 'fixture:bericht-teil#quellen' }],
  kriterienstand,
  offen: { rueckfragen: [], annahmen: ['fixture:annahme-1'], blockaden: [] },
  naechster_schritt: 'Dritten Ansatz vergleichen',
  inhalt_ref: 'fixture:uebergabe-run-1',
  ...extra,
});

async function start(k, auftrag = BUDGET) {
  const c = await bisClaim(k, { auftrag });
  return { c, run: RUN(c.run_id) };
}

withK('V0-FALL-18 one warning at 24 min; partial submission with handover; nothing happens automatically afterwards', async (k) => {
  const { c, run } = await start(k);
  await bei(k, 23);
  assert.equal(nur(await k.journal(), 'task.budget_warning').length, 0);
  await bei(k, 24);
  const [w] = nur(await journalValid(k), 'task.budget_warning');
  assert.equal(w.daten.dimension, 'dauer');
  assert.equal(w.daten.erreicht_bei, iso(24));
  assert.equal(w.daten.aufforderung.an, c.run_id);
  assert.equal((await k.state('auftrag', A)).zustand, 'in_progress', 'die Vorwarnung ändert keinen Zustand');
  err(await k.send('task.submit_partial', run, { auftrag_id: A, epoch: 1, artefakt_hash: HASH }), 'pflichtteil_fehlt');
  assert.equal((await k.state('auftrag', A)).zustand, 'in_progress');
  const r = ok(await k.send('task.submit_partial', run, { auftrag_id: A, epoch: 1, artefakt_hash: HASH, belege: ['fixture:q1'], uebergabe: UEBERGABE() }));
  assert.deepEqual(r.offene_kriterien, ['k1']);
  assert.equal((await k.state('auftrag', A)).zustand, 'partially_submitted');
  assert.equal((await k.state('claim', A)).zustand, 'released');
  const [teil] = nur(await k.journal(), 'task.partially_submitted');
  assert.deepEqual(validateSchema(UEBERGABE_SCHEMA, teil.daten.uebergabe), [], 'Übergabepaket nach Schema');
  assert.equal(teil.daten.uebergabe.budgetstand.dauer_min, 24, 'Budgetstand rechnet der Kern, nicht der Run');
  await bei(k, 40);
  const t = typen(await journalValid(k));
  for (const verboten of ['task.failed', 'task.accepted', 'effect.proposed']) assert.ok(!t.includes(verboten), verboten);
  assert.equal(t.filter((x) => x === 'task.budget_warning').length, 1);
});

withK('V0-FALL-19 budget end at 30 min: failed with both handovers, claim expired, late submission refused', async (k) => {
  const { c, run } = await start(k);
  await bei(k, 24);
  await bei(k, 26);
  const h = ok(await k.send('task.record_handover', run, { auftrag_id: A, epoch: 1, uebergabe: UEBERGABE({ k1: 'offen', k2: 'unklar' }) }));
  assert.equal((await k.state('auftrag', A)).zustand, 'in_progress', 'eine Übergabe ändert den Zustand nicht');
  await bei(k, 30);
  let evs = await journalValid(k);
  const [failed] = nur(evs, 'task.failed');
  assert.equal(failed.daten.grund, 'budget_exhausted');
  assert.equal(failed.daten.uebergabe_run, h.uebergabe_id);
  const kern = evs.find((e) => e.id === failed.daten.uebergabe_kern);
  assert.equal(kern.daten.uebergabe.quelle, 'kern');
  assert.deepEqual(validateSchema(UEBERGABE_SCHEMA, kern.daten.uebergabe), []);
  assert.equal(kern.daten.uebergabe.budgetstand.dauer_min, 30);
  assert.deepEqual(kern.daten.uebergabe.kriterienstand, { k1: 'unklar', k2: 'unklar' });
  assert.deepEqual(failed.daten.aufforderung, { an: c.run_id, art: 'abbrechen' });
  assert.equal((await k.state('claim', A)).zustand, 'expired');
  // Cancel request and confirmation stay separately visible on the ended claim.
  ok(await k.send('run.report', run, { auftrag_id: A, epoch: 1, zustand: 'cancel_requested' }));
  ok(await k.send('run.report', run, { auftrag_id: A, epoch: 1, zustand: 'cancel_confirmed' }));
  await bei(k, 31);
  err(await k.send('task.submit', run, { auftrag_id: A, epoch: 1, artefakt_hash: HASH }), 'claim_inaktiv');
  evs = await journalValid(k);
  assert.equal(nur(evs, 'claim.rejected_inactive').length, 1);
  assert.ok(typen(evs).indexOf('run.cancel_requested') < typen(evs).indexOf('run.cancel_confirmed'));
  assert.equal((await k.state('auftrag', A)).zustand, 'failed');
  err(await k.send('task.open', OWNER(), { auftrag_id: A, version: 1 }), 'zustand_unpassend');
  err(await k.send('task.revise', OWNER(), { auftrag_id: A, aenderungen: { budget: { max_dauer_min: 60 } } }), 'zustand_unpassend');
});

withK('V0-FALL-19 variant without a run handover: failed points only to the core handover', async (k) => {
  await start(k);
  await bei(k, 30);
  const [failed] = nur(await journalValid(k), 'task.failed');
  assert.equal(failed.daten.uebergabe_run, null);
  assert.match(failed.daten.uebergabe_kern, /^ev-/);
});

withK('V0-FALL-20 core restart after the warning: no second warning, outage time counts, same values after refold', async (k) => {
  const { run } = await start(k);
  ok(await k.send('run.report_attempt', run, { auftrag_id: A, epoch: 1, bezug: 'quellen-abruf', ergebnis: 'failed' }));
  await bei(k, 24);
  await bei(k, 25);
  const vorher = await budget(k);
  ok(await k.send('test.restart_core', SUITE, {}));
  assert.deepEqual(await budget(k), vorher, 'Neuberechnung aus dem Journal ergibt dieselben Werte');
  await bei(k, 26);
  await bei(k, 27);
  const b = await budget(k);
  assert.equal(b.dauer_min, 27);
  assert.equal(b.fehlversuche, 1);
  assert.equal(nur(await k.journal(), 'task.budget_warning').length, 1);
  ok(await k.send('task.submit_partial', run, { auftrag_id: A, epoch: 1, artefakt_hash: HASH, uebergabe: UEBERGABE() }));
  assert.equal((await k.state('auftrag', A)).zustand, 'partially_submitted');
});

withK('V0-FALL-20 variant without partial submission: budget end at 30 min as without restart', async (k) => {
  await start(k);
  await bei(k, 24);
  await bei(k, 25);
  ok(await k.send('test.restart_core', SUITE, {}));
  await bei(k, 29);
  assert.equal((await k.state('auftrag', A)).zustand, 'in_progress');
  await bei(k, 30);
  assert.equal((await k.state('auftrag', A)).zustand, 'failed');
});

withK('V0-FALL-21 reassignment after the warning: old run fenced, budget and latest handover carry over', async (k) => {
  const { run } = await start(k);
  await bei(k, 24);
  const h = ok(await k.send('task.record_handover', run, { auftrag_id: A, epoch: 1, uebergabe: UEBERGABE() }));
  await bei(k, 25);
  const neu = ok(await k.send('claim.reassign', OWNER(), { auftrag_id: A, geraet_id: 'g-browser-b' }));
  assert.equal(neu.epoch, 2);
  await bei(k, 26);
  err(await k.send('task.submit_partial', run, { auftrag_id: A, epoch: 1, artefakt_hash: HASH, uebergabe: UEBERGABE() }), 'epoch_veraltet');
  const evs = await journalValid(k);
  assert.equal(nur(evs, 'claim.rejected_stale_epoch').length, 1);
  const warnungen = nur(evs, 'task.budget_warning');
  assert.equal(warnungen.filter((w) => w.daten.dimension === 'dauer').length, 1, 'keine zweite Vorwarnung für Dauer');
  assert.ok(warnungen.filter((w) => w.daten.dimension === 'runs').length <= 1, 'höchstens eine eigene Vorwarnung für Runs');
  assert.equal((await budget(k)).dauer_min, 26, 'die Dauer läuft weiter');
  const ctx = (await k.send('context.get', RUN(neu.run_id), { auftrag_id: A })).ergebnis;
  assert.equal(ctx.uebergabe.ereignis, h.uebergabe_id);
  assert.equal(ctx.budgetstand.dauer_min, 26);
  assert.ok(ctx.vorwarnungen.includes('v1:dauer'));
});

withK('V0-FALL-22 repair limit at 17 min, phase ends with the strategy change, one handover request after a new failure', async (k) => {
  const { run } = await start(k);
  const versuch = async (bezug, ergebnis, extra = {}) => ok(await k.send('run.report_attempt', run, { auftrag_id: A, epoch: 1, bezug, ergebnis, ...extra }));
  for (const min of [2, 8, 14]) { await bei(k, min); await versuch('quellen-abruf', 'failed'); }
  await bei(k, 16.5);
  assert.equal(nur(await k.journal(), 'task.repair_limit_reached').length, 0);
  await bei(k, 17);
  const [grenze] = nur(await journalValid(k), 'task.repair_limit_reached');
  assert.equal(grenze.daten.dimension, 'dauer');
  assert.equal(grenze.daten.erreicht_bei, iso(17));
  await bei(k, 18);
  err(await k.send('run.report_attempt', run, { auftrag_id: A, epoch: 1, bezug: 'quellen-abruf', ergebnis: 'strategy_changed' }), 'pflichtteil_fehlt');
  await versuch('quellen-abruf', 'strategy_changed', { begruendung: 'anderer Abrufweg' });
  await bei(k, 20);
  await versuch('quellen-abruf-2', 'failed');
  await versuch('quellen-abruf-2', 'failed');
  await bei(k, 29);
  const evs = await journalValid(k);
  assert.equal(nur(evs, 'task.repair_limit_reached').length, 1);
  assert.equal(nur(evs, 'task.handover_requested').length, 1);
  assert.ok(!typen(evs).includes('task.failed'));
  const b = await budget(k);
  assert.equal(b.fehlversuche, 5);
  assert.equal(b.reparatur_dauer_min, 16 + 9, 'Phase 2–18 und Phase ab 20 bis 29');
  ok(await k.send('test.restart_core', SUITE, {}));
  assert.deepEqual(await budget(k), b, 'neu berechnet wie angezeigt');
});

withK('V0-FALL-23 unclear effect stops the budget clock; the handover names it; evaluation resumes after reconciliation', async (k) => {
  const { run } = await start(k);
  await bei(k, 20);
  const ziel = `${AUFTRAG.befugnis.grants[0].ziel}zwischenstand/`;
  const e = ok(await k.send('effect.propose', run, { auftrag_id: A, epoch: 1, typ: 'artifact.store', ziel, parameter: { artefakt_hash: HASH } }));
  ok(await k.send('effect.approve', OWNER(), { effekt_id: e.effekt_id, gebunden_an: { parameter_hash: e.parameter_hash, ziel, auftrag_version: 1, epoch: 1 } }));
  assert.equal((await k.state('auftrag', A)).zustand, 'in_progress', 'ein Run-Effekt bewegt den Auftrag nicht');
  ok(await k.send('test.effect_mode', SUITE, { effekt_id: e.effekt_id, modus: 'antwort_verloren' }));
  assert.equal((await k.state('auftrag', A)).zustand, 'outcome_unknown');
  await bei(k, 35);
  assert.equal((await budget(k)).dauer_min, 20);
  const h = ok(await k.send('task.record_handover', run, { auftrag_id: A, epoch: 1, uebergabe: UEBERGABE() }));
  assert.deepEqual(h.unklare_wirkungen, [e.effekt_id]);
  let t = typen(await journalValid(k));
  assert.ok(!t.includes('task.budget_warning') && !t.includes('task.failed'));
  assert.equal(t.filter((x) => x === 'effect.intent').length, 1, 'keine automatische Wiederholung');
  assert.equal((await k.state('effekt', e.effekt_id)).zustand, 'outcome_unknown');
  ok(await k.send('effect.reconcile', ADAPTER, { effekt_id: e.effekt_id, ergebnis: 'done', beleg: 'fixture:abgleich' }));
  assert.equal((await k.state('auftrag', A)).zustand, 'in_progress');
  await bei(k, 39);
  const [w] = nur(await journalValid(k), 'task.budget_warning');
  assert.equal(w.daten.erreicht_bei, iso(39), 'Dauer 24 erst 4 min nach dem Abgleich');
  t = typen(await k.journal());
  assert.ok(!t.includes('task.completed'), 'ein Zwischenstand schließt den Auftrag nicht');
});

withK('V0-FALL-24 costs not reported: unknown, never 0; no cost warning; duration warns as usual', async (k) => {
  const { run } = await start(k, { ...BUDGET, budget: { ...BUDGET.budget, max_kosten_eur: 2 } });
  ok(await k.send('run.report_usage', run, { auftrag_id: A, epoch: 1, quelle: 'unbekannt' }));
  ok(await k.send('run.report_usage', run, { auftrag_id: A, epoch: 1, quelle: 'geschaetzt', kosten_eur: 5 }));
  await bei(k, 24);
  const b = await budget(k);
  assert.equal(b.kosten, 'unbekannt');
  assert.equal(b.kosten_eur, null);
  const w = nur(await journalValid(k), 'task.budget_warning');
  assert.deepEqual(w.map((x) => x.daten.dimension), ['dauer']);
  assert.equal((await k.state('auftrag', A)).zustand, 'in_progress');
});

async function bisTeil(k) {
  const { run } = await start(k);
  await bei(k, 27);
  return ok(await k.send('task.submit_partial', run, { auftrag_id: A, epoch: 1, artefakt_hash: HASH, uebergabe: UEBERGABE() }));
}

withK('V0-FALL-25 partially submitted stays as it is for 30 days; consumption stays at 27 min', async (k) => {
  await bisTeil(k);
  await bei(k, 30 * 24 * 60);
  assert.equal((await k.state('auftrag', A)).zustand, 'partially_submitted');
  const t = typen(await journalValid(k));
  for (const x of ['task.accepted', 'task.failed', 'task.cancelled']) assert.ok(!t.includes(x), x);
  assert.equal((await budget(k)).dauer_min, 27);
});

withK('V0-FALL-26 owner continues with version 2: new claim epoch 2 with handover; warning for v2 at 48 min, none for runs', async (k) => {
  await bisTeil(k);
  const r = ok(await k.send('task.revise', OWNER(), { auftrag_id: A, aenderungen: { budget: { max_dauer_min: 60, max_runs: 3 } } }));
  assert.deepEqual(r, { version: 2, zustand: 'open' });
  const c2 = ok(await k.send('claim.request', GERAET('g-pc-heim'), { auftrag_id: A, schritt: 'arbeit' }));
  assert.equal(c2.epoch, 2);
  const [teil] = nur(await k.journal(), 'task.partially_submitted');
  const ctx = (await k.send('context.get', RUN(c2.run_id), { auftrag_id: A })).ergebnis;
  assert.equal(ctx.auftrag_version, 2);
  assert.equal(ctx.uebergabe.ereignis, teil.id);
  await bei(k, 47);
  assert.ok(!(await budget(k)).vorwarnungen.includes('v2:dauer'));
  await bei(k, 48);
  const b = await budget(k);
  assert.equal(b.dauer_min, 48);
  assert.deepEqual(b.vorwarnungen, ['v1:dauer', 'v2:dauer']);
  const v2 = nur(await journalValid(k), 'task.budget_warning').filter((w) => w.auftrag_version === 2);
  assert.deepEqual(v2.map((w) => [w.daten.dimension, w.daten.erreicht_bei]), [['dauer', iso(48)]]);
});
