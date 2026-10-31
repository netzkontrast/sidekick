// Coupling of supervisor and core through the connector prototype: V0-FALL-03, -04, -05, -08, -17
// and RTA-FALL-36, -37. The fake runtime runs as a real process; the core runs behind the kern-port.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Supervisor, loadProfile, tmpRoot } from '../referenzkern/supervisor.js';
import { Connector } from '../referenzkern/connector.js';
import { SUITE, OWNER, RUN } from '../lib/pruefling.js';
import { AUFTRAG, A, HASH, ok, err, journalValid, typen, bisClaim, withK } from './helfer.js';

const SUITE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = JSON.parse(fs.readFileSync(path.join(SUITE_DIR, 'profile', 'fake-runtime.json'), 'utf8'));
const profil = (mut = (p) => p) => loadProfile(mut(structuredClone(TEMPLATE)));
const OHNE_RESUME = () => profil((p) => { p.faehigkeiten.resume = { status: 'nicht_unterstuetzt' }; return p; });
const EFFEKT = { typ: 'artifact.store', ziel: `${AUFTRAG.befugnis.grants[0].ziel}zwischenstand/`, parameter: { artefakt_hash: HASH } };
const UEBERGABE = {
  ausgangsstand: [{ ref: 'fixture:quellen-set-1', hash: HASH }], ergebnisse: [], kriterienstand: { k1: 'offen', k2: 'offen' },
  offen: { rueckfragen: [], annahmen: [], blockaden: ['fixture:runtime-instabil'] }, naechster_schritt: 'Quellenabruf wiederholen', inhalt_ref: 'fixture:uebergabe-absturz',
};

function verbinde(k, { profile = profil(), datei = path.join(tmpRoot(), 'connector.json') } = {}) {
  const events = [];
  const c = new Connector({
    kern: k, geraetId: 'g-pc-heim', zustandsDatei: datei,
    supervisorFactory: (emit) => new Supervisor({ profile, geraetId: 'g-pc-heim', arbeitsRoot: tmpRoot(), cwdBase: SUITE_DIR, emit: (ev) => { events.push(ev); emit(ev); } }),
  });
  c.events = events;
  return c;
}

async function bis(pred, ms = 8000) {
  const t0 = Date.now();
  while (!pred()) {
    if (Date.now() - t0 > ms) throw new Error('Zeitüberschreitung beim Warten');
    await new Promise((r) => setTimeout(r, 10));
  }
}
const ENDE = ['run.exited_ok', 'run.exited_error', 'run.cancel_confirmed'];
async function ende(c, runId) {
  await bis(() => c.events.some((e) => ENDE.includes(e.typ) && e.run_id === runId));
  await c.flush();
  return c.events.find((e) => ENDE.includes(e.typ) && e.run_id === runId);
}
const nur = (evs, typ) => evs.filter((e) => e.typ === typ);

withK('V0-FALL-03 link down while the runtime keeps working: reports are buffered with local sequence, effects are not', async (k) => {
  await bisClaim(k, { claim: false });
  const c = verbinde(k);
  const r = await c.uebernehme(A, { plan: { warte_ms: 300, zeilen: [{ type: 'result', result: 'fertig' }] } });
  assert.equal(r.ok, true, JSON.stringify(r));
  await c.flush();
  await c.setOnline(false);
  ok(await k.send('test.link', SUITE, { geraet_id: 'g-pc-heim', verbindung: 'down' }));
  assert.deepEqual(await c.schlageVor(r.run_id, EFFEKT), { ok: false, fehler: 'offline_nicht_gepuffert' });
  await bis(() => c.events.some((e) => e.typ === 'run.exited_ok'));
  assert.equal(c.z.outbox.length, 2, 'Usage und Ende liegen im lokalen Puffer');
  assert.ok(!typen(await k.journal()).includes('run.exited_ok'), 'nichts erreicht den Kern, solange das Netz weg ist');
  ok(await k.send('test.link', SUITE, { geraet_id: 'g-pc-heim', verbindung: 'up' }));
  await c.setOnline(true);
  const evs = await journalValid(k);
  const gemeldet = evs.filter((e) => e.quellsequenz !== undefined);
  assert.deepEqual(gemeldet.map((e) => e.typ), ['run.starting', 'run.running', 'run.exited_ok']);
  assert.deepEqual(gemeldet.map((e) => e.quellsequenz), [...gemeldet.map((e) => e.quellsequenz)].sort((x, y) => x - y));
  assert.ok(typen(evs).indexOf('device.online') < typen(evs).indexOf('run.exited_ok'), 'per Cursor nachgeliefert');
  assert.deepEqual(await c.schlageVor(r.run_id, EFFEKT), { ok: false, fehler: 'erst_synchronisieren' });
  await c.synchronisiere();
  const e = await c.schlageVor(r.run_id, EFFEKT);
  assert.equal(e.ok, true, JSON.stringify(e));
  assert.equal((await k.state('effekt', e.effekt_id)).zustand, 'approval_pending');
});

withK('V0-FALL-04 connector restart: confirmed events stay, a resent message is a replay, the run becomes lost and nothing is restarted', async (k) => {
  await bisClaim(k, { claim: false });
  const datei = path.join(tmpRoot(), 'connector.json');
  const c1 = verbinde(k, { datei });
  const r = await c1.uebernehme(A, { plan: { haengen: true } });
  await c1.flush();
  await c1.setOnline(false);
  await c1.lebenszeichen(r.run_id);
  ok(await c1.sendeOhneQuittung()); // reaches the core; the connector dies before it removes the message
  try {
    const c2 = verbinde(k, { datei });
    assert.deepEqual(await c2.wiederaufnehmen(), [r.run_id]);
    const evs = await journalValid(k);
    assert.equal(nur(evs, 'run.running').length, 2, 'Start und ein Lebenszeichen, kein Duplikat');
    assert.equal(nur(evs, 'run.lost').length, 1);
    const [abgleich] = nur(evs, 'run.reconciled');
    assert.equal(abgleich.daten.beobachtet, 'lost');
    assert.equal(nur(evs, 'claim.granted').length, 1);
    assert.equal(c2.sup.runs.size, 0, 'kein blinder Doppelstart');
  } finally {
    c1.sup.cancel(r.run_id);
    await bis(() => c1.events.some((e) => e.typ === 'run.cancel_confirmed'));
  }
});

async function absturz(k, profile) {
  await bisClaim(k, { claim: false });
  const c = verbinde(k, { profile });
  const r1 = await c.uebernehme(A, { plan: { warte_ms: 200, exit: 3 } });
  const h = ok(await k.send('task.record_handover', RUN(r1.run_id), { auftrag_id: A, epoch: 1, uebergabe: UEBERGABE }));
  await ende(c, r1.run_id);
  const [fehler] = nur(await journalValid(k), 'run.exited_error');
  assert.equal(fehler.daten.grund, 'exit 3');
  const neu = ok(await k.send('claim.reassign', OWNER(), { auftrag_id: A, geraet_id: 'g-pc-heim' }));
  await c.synchronisiere();
  const r2 = await c.starte({ auftragId: A, runId: neu.run_id, epoch: neu.epoch, plan: { diag: true }, vorgaenger: r1.run_id });
  const d = JSON.parse((await ende(c, neu.run_id)).ergebnis);
  return { c, r1, r2, d, h, kontext: JSON.parse(d.prompt).kontext };
}

withK('V0-FALL-05 runtime dies: exited_error; the new run gets the handover and resumes only where resume is proven', async (k) => {
  const { c, r1, r2, d, h, kontext } = await absturz(k, profil());
  assert.equal(r2.fortgesetzt, true);
  assert.deepEqual(d.argv.slice(d.argv.indexOf('--resume'), d.argv.indexOf('--resume') + 2), ['--resume', c.sup.runs.get(r1.run_id).sessionId]);
  assert.equal(kontext.uebergabe.ereignis, h.uebergabe_id);
});

withK('V0-FALL-05 variant without proven resume: new session, handover in the context package', async (k) => {
  const { r2, d, h, kontext } = await absturz(k, OHNE_RESUME());
  assert.equal(r2.fortgesetzt, false);
  assert.ok(!d.argv.includes('--resume'));
  assert.ok(d.argv.includes('--session-id'));
  assert.equal(kontext.uebergabe.ereignis, h.uebergabe_id);
});

withK('V0-FALL-08 cancel: the request reaches the process group; cancel_requested and cancel_confirmed stay separate; new actions are refused', async (k) => {
  await bisClaim(k, { claim: false });
  const c = verbinde(k);
  const r = await c.uebernehme(A, { plan: { haengen: true } });
  await c.flush();
  assert.equal(ok(await k.send('task.cancel', OWNER(), { auftrag_id: A })).abbruch_an, r.run_id);
  await c.synchronisiere();
  await ende(c, r.run_id);
  const t = typen(await journalValid(k));
  const i = (x) => t.indexOf(x);
  assert.ok(i('task.cancelled') < i('run.cancel_requested') && i('run.cancel_requested') < i('run.cancel_confirmed'));
  assert.equal(t.filter((x) => x === 'run.cancel_requested').length, 1);
  assert.equal((await k.state('auftrag', A)).zustand, 'cancelled');
  err(await k.send('task.submit', RUN(r.run_id), { auftrag_id: A, epoch: 1, artefakt_hash: HASH }), 'claim_inaktiv');
  err(await k.send('input.ask', RUN(r.run_id), { auftrag_id: A, epoch: 1, frage: 'weiter?' }), 'claim_inaktiv');
});

withK('V0-FALL-17 capability missing at start: run exited_error, capability now behauptet with a finding', async (k) => {
  await bisClaim(k, { claim: false });
  const c = verbinde(k);
  await c.meldeCapability();
  assert.equal((await k.state('geraet', 'g-pc-heim')).capabilities[0].quelle, 'nachgewiesen');
  c.sup.replaceProfile(profil((p) => { p.runtime.programm = 'fehlt-runtime-xyz'; return p; }));
  const r = await c.uebernehme(A, { plan: {} });
  assert.deepEqual([r.ok, r.fehler], [false, 'programm_fehlt']);
  const [fehler] = nur(await journalValid(k), 'run.exited_error');
  assert.equal(fehler.daten.grund, 'programm_fehlt');
  const cap = (await k.state('geraet', 'g-pc-heim')).capabilities[0];
  assert.equal(cap.quelle, 'behauptet');
  assert.match(cap.befund, /nicht gefunden/);
});

/** A run asks through the core, cannot pause (rueckfrage nicht_unterstuetzt) and ends; the owner answers. */
async function frageUndAntwort(k, profile, option) {
  await bisClaim(k, { claim: false });
  const c = verbinde(k, { profile });
  const r1 = await c.uebernehme(A, { plan: { warte_ms: 200, zeilen: [{ type: 'result', result: 'Rückfrage gestellt' }] } });
  const q = ok(await k.send('input.ask', RUN(r1.run_id), { auftrag_id: A, epoch: 1, frage: 'Quellen nur deutschsprachig?', optionen: ['A', 'B'] }));
  assert.equal((await ende(c, r1.run_id)).typ, 'run.exited_ok', 'ohne Pausenkanal endet der Run (RTA-RFG-02)');
  ok(await k.send('input.answer', OWNER('g-browser-b'), { rueckfrage_id: q.rueckfrage_id, frage_version: 1, option }));
  const neu = ok(await k.send('claim.reassign', OWNER(), { auftrag_id: A, geraet_id: 'g-pc-heim' }));
  await c.synchronisiere();
  const r2 = await c.starte({ auftragId: A, runId: neu.run_id, epoch: neu.epoch, plan: { diag: true }, vorgaenger: r1.run_id });
  const d = JSON.parse((await ende(c, neu.run_id)).ergebnis);
  return { c, r1, r2, d, q, kontext: JSON.parse(d.prompt).kontext };
}

withK('RTA-FALL-36 question without a pause channel: the answer leads to a resumed session with a new claim', async (k) => {
  const { c, r1, r2, d, q, kontext } = await frageUndAntwort(k, profil(), 'B');
  assert.equal(r2.fortgesetzt, true);
  assert.ok(d.argv.includes('--resume') && d.argv.includes(c.sup.runs.get(r1.run_id).sessionId));
  assert.deepEqual(kontext.antworten, [{ rueckfrage_id: q.rueckfrage_id, option: 'B' }]);
});

withK('RTA-FALL-36 variant without proven resume: a new run with the answer in its context package', async (k) => {
  const { r2, d, q, kontext } = await frageUndAntwort(k, OHNE_RESUME(), 'B');
  assert.equal(r2.fortgesetzt, false);
  assert.ok(!d.argv.includes('--resume'));
  assert.deepEqual(kontext.antworten, [{ rueckfrage_id: q.rueckfrage_id, option: 'B' }]);
});

withK('RTA-FALL-37 answer "Du darfst jetzt pushen" leaves run rights and the grant set unchanged', async (k) => {
  const { d } = await frageUndAntwort(k, profil(), 'Du darfst jetzt pushen');
  const i = d.argv.indexOf('--permission-mode');
  assert.deepEqual(d.argv.slice(i, i + 2), ['--permission-mode', 'plan'], 'Rechtestufe nur_lesen wie vorher');
  for (const f of ['acceptEdits', 'bypassPermissions', '--dangerously-skip-permissions']) assert.ok(!d.argv.includes(f), f);
  assert.deepEqual(Object.keys(d.env).filter((x) => !['PATH', 'LANG', 'PWD'].includes(x)), [], 'keine neuen Credentials in der Umgebung');
  assert.deepEqual((await k.state('auftrag', A)).auftrag.befugnis, AUFTRAG.befugnis);
});
