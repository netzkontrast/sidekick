// Backward review cases V0-FALL-27…32 (V0 §4.10) over the kern-port boundary. The review instance
// is its own run with its own claim (schritt "pruefung") and sees the task only after its
// reconstruction is on record.
import assert from 'node:assert/strict';
import path from 'node:path';
import { validateSchema } from '../../skill-library/lib/schema.js';
import { SUITE, OWNER, GERAET, RUN } from '../lib/pruefling.js';
import { AUFTRAG, A, HASH, SPEC, readJson, ok, err, journalValid, typen, bisClaim, withK } from './helfer.js';

const BEFUND_SCHEMA = readJson(path.join(SPEC, 'schemas', 'rueckwaerts-befund.schema.json'));
const START = Date.parse('2026-11-01T00:00:00Z');
const bei = async (k, min) => ok(await k.send('test.clock_set', SUITE, { zeit: new Date(START + min * 60_000).toISOString() }));
const nur = (evs, typ) => evs.filter((e) => e.typ === typ);

const RW = { ...AUFTRAG, rueckwaertsabnahme: { verlangt: true, budget: { max_dauer_min: 5 } } };
const BEDINGUNGEN = [
  { text: 'nur quelloffene Ansätze', fundstelle: 'bericht.md#abschnitt-2' },
  { text: 'deutsch- und englischsprachige Quellen', fundstelle: 'bericht.md#quellen' },
  { text: 'drei Ansätze mit Empfehlung', fundstelle: 'bericht.md#fazit' },
];

/** Work run answers a question with B, submits; then a review claim is granted to pc-heim. */
async function bisPruefung(k, { auftrag = RW, pruefClaim = true } = {}) {
  const c = await bisClaim(k, { auftrag });
  const run = RUN(c.run_id);
  const q = ok(await k.send('input.ask', run, { auftrag_id: A, epoch: 1, frage: 'Quellen nur deutschsprachig?', optionen: ['A', 'B'] }));
  ok(await k.send('input.answer', OWNER('g-browser-b'), { rueckfrage_id: q.rueckfrage_id, frage_version: 1, option: 'B' }));
  const s = ok(await k.send('task.submit', run, { auftrag_id: A, epoch: 1, artefakt_hash: HASH, belege: ['fixture:q1'] }));
  if (!pruefClaim) return { c, run, q, pruefung: s.pruefung_id };
  const p = ok(await k.send('claim.request', GERAET('g-pc-heim'), { auftrag_id: A, schritt: 'pruefung' }));
  return { c, run, q, pruefung: p.pruefung_id, pr: RUN(p.run_id), pc: p };
}

const pruefung = (k, id) => k.state('pruefung', id);

withK('V0-FALL-27 blind reconstruction, then comparison: one finding "angenommen", the answer is part of the basis, nothing else changes', async (k) => {
  const { q, pruefung: id, pr, pc } = await bisPruefung(k);
  assert.equal(id, 'rw-1');
  assert.equal(pc.epoch, 1);
  assert.notEqual(pr.id, 'r-1', 'die Prüfinstanz ist nicht der Arbeitsrun');
  let evs = await journalValid(k);
  assert.equal(nur(evs, 'task.backward_review_requested').length, 1);
  assert.equal((await pruefung(k, id)).zustand, 'reconstructing');
  const phase1 = (await k.send('context.get', pr, { auftrag_id: A, schritt: 'pruefung' })).ergebnis;
  assert.deepEqual(phase1, { pruefung_id: id, phase: 1, artefakt_hash: HASH, eingabemanifest: [HASH] }, 'Phase 1 kennt nur das Artefakt');
  err(await k.send('review.submit_comparison', pr, { auftrag_id: A, epoch: 1, befunde: [] }), 'zustand_unpassend');
  ok(await k.send('review.submit_reconstruction', pr, { auftrag_id: A, epoch: 1, bedingungen: BEDINGUNGEN }));
  const phase2 = (await k.send('context.get', pr, { auftrag_id: A, schritt: 'pruefung' })).ergebnis;
  assert.equal(phase2.phase, 2);
  assert.equal(phase2.vergleichsgrundlage.ziel, AUFTRAG.ziel);
  assert.deepEqual(phase2.vergleichsgrundlage.antworten, [{ rueckfrage_id: q.rueckfrage_id, option: 'B' }]);
  assert.equal(phase2.eingabemanifest.length, 2, 'Manifest um die Vergleichsgrundlage ergänzt');
  const r = ok(await k.send('review.submit_comparison', pr, { auftrag_id: A, epoch: 1, befunde: [
    { klasse: 'angenommen', bezug_rekonstruktion: 1, fundstelle: 'bericht.md#abschnitt-2', inhalt_ref: 'fixture:befund-1' },
  ] }));
  assert.deepEqual(r.anzahl, { uebersehen: 0, angenommen: 1, anders_verstanden: 0 });
  evs = await journalValid(k);
  const befunde = nur(evs, 'task.backward_finding');
  assert.equal(befunde.length, 1);
  assert.deepEqual(validateSchema(BEFUND_SCHEMA, befunde[0].daten.befund), []);
  assert.equal(befunde[0].daten.befund.bezug_rekonstruktion, 1);
  assert.equal((await pruefung(k, id)).zustand, 'completed');
  assert.equal((await k.state('auftrag', A)).zustand, 'submitted');
  for (const x of ['task.accepted', 'effect.proposed', 'task.revised']) assert.ok(!typen(evs).includes(x), x);
  ok(await k.send('review.rate_finding', OWNER(), { pruefung_id: id, befund_id: befunde[0].daten.befund_id, bewertung: 'zutreffend' }));
  assert.equal((await pruefung(k, id)).befunde[0].bewertung, 'zutreffend');
  assert.equal((await k.state('auftrag', A)).zustand, 'submitted', 'eine Bewertung ist keine Abnahme');
});

withK('V0-FALL-28 comparison without deviation: completed with 0 findings; only the owner accepts', async (k) => {
  const { pruefung: id, pr } = await bisPruefung(k);
  ok(await k.send('review.submit_reconstruction', pr, { auftrag_id: A, epoch: 1, bedingungen: BEDINGUNGEN }));
  ok(await k.send('review.submit_comparison', pr, { auftrag_id: A, epoch: 1, befunde: [] }));
  const evs = await journalValid(k);
  const [fertig] = nur(evs, 'task.backward_review_completed');
  assert.deepEqual(fertig.daten.anzahl, { uebersehen: 0, angenommen: 0, anders_verstanden: 0 });
  assert.ok(!typen(evs).includes('task.accepted'));
  assert.equal((await k.state('auftrag', A)).zustand, 'submitted');
  assert.equal((await pruefung(k, id)).zustand, 'completed');
  ok(await k.send('task.accept', OWNER(), { auftrag_id: A }));
  const accepted = nur(await k.journal(), 'task.accepted');
  assert.equal(accepted.length, 1);
  assert.equal(accepted[0].akteur.art, 'owner');
});

withK('V0-FALL-29 a different second reconstruction is refused; the identical repeat yields the same result without an event', async (k) => {
  const { pruefung: id, pr } = await bisPruefung(k);
  const erst = ok(await k.send('review.submit_reconstruction', pr, { auftrag_id: A, epoch: 1, bedingungen: BEDINGUNGEN }));
  const n = (await k.journal()).length;
  err(await k.send('review.submit_reconstruction', pr, { auftrag_id: A, epoch: 1, bedingungen: BEDINGUNGEN.slice(1) }), 'zustand_unpassend');
  const wieder = ok(await k.send('review.submit_reconstruction', pr, { auftrag_id: A, epoch: 1, bedingungen: BEDINGUNGEN }));
  assert.deepEqual(wieder, erst);
  assert.equal((await k.journal()).length, n);
  assert.equal((await pruefung(k, id)).rekonstruktion_hash, erst.rekonstruktion_hash);
});

const OHNE_GRANT = { ...RW, befugnis: { grants: [] } };

withK('V0-FALL-30 acceptance during the review: refused without waiver; with waiver the review is not performed and later findings are refused', async (k) => {
  const { pruefung: id, pr } = await bisPruefung(k, { auftrag: OHNE_GRANT });
  err(await k.send('task.accept', OWNER(), { auftrag_id: A }), 'zustand_unpassend');
  assert.equal((await k.state('auftrag', A)).zustand, 'submitted');
  assert.equal((await pruefung(k, id)).zustand, 'reconstructing');
  ok(await k.send('task.accept', OWNER(), { auftrag_id: A, verzicht_rueckwaertsabnahme: true }));
  let evs = await journalValid(k);
  assert.ok(typen(evs).indexOf('task.backward_review_waived') < typen(evs).indexOf('task.accepted'));
  const p = await pruefung(k, id);
  assert.equal(p.zustand, 'not_performed');
  assert.equal(p.grund, 'verzicht');
  assert.equal((await k.state('auftrag', A)).zustand, 'accepted');
  assert.equal((await k.state('claim', `${A}#pruefung`)).zustand, 'expired');
  err(await k.send('review.submit_reconstruction', pr, { auftrag_id: A, epoch: 1, bedingungen: BEDINGUNGEN }), 'claim_inaktiv');
  evs = await journalValid(k);
  assert.equal(nur(evs, 'claim.rejected_inactive').length, 1);
  assert.ok(!typen(evs).includes('task.backward_finding'));
});

withK('V0-FALL-31 review budget of 5 min runs out: not performed with reason budget, never "no findings"; the owner still decides', async (k) => {
  const { pruefung: id } = await bisPruefung(k, { auftrag: OHNE_GRANT });
  await bei(k, 4.9);
  assert.equal((await pruefung(k, id)).zustand, 'reconstructing');
  await bei(k, 5);
  const p = await pruefung(k, id);
  assert.equal(p.zustand, 'not_performed');
  assert.equal(p.grund, 'budget');
  assert.equal(p.anzahl, null, '„nicht durchgeführt“ ist nicht „ohne Befund“');
  assert.equal((await k.state('auftrag', A)).zustand, 'submitted');
  assert.ok(!typen(await journalValid(k)).includes('task.accepted'));
  ok(await k.send('task.accept', OWNER(), { auftrag_id: A }));
  assert.equal((await k.state('auftrag', A)).zustand, 'accepted');
});

withK('V0-FALL-32 local-only review without a matching device online stays requested; no cloud device; only acceptance with waiver', async (k) => {
  const LOKAL = { ...OHNE_GRANT, datenklasse: 'local-only' };
  for (const g of ['g-pc-heim', 'g-browser-a', 'g-browser-b']) {
    ok(await k.send('device.pair_request', GERAET(g)));
    ok(await k.send('device.pair_confirm', OWNER(null), { geraet_id: g }));
  }
  ok(await k.send('device.report_capability', GERAET('g-pc-heim'), { capabilities: [{ art: 'local_model', local_only: true }] }));
  ok(await k.send('task.draft', OWNER(), { auftrag: LOKAL }));
  ok(await k.send('task.open', OWNER(), { auftrag_id: A, version: 1 }));
  const c = ok(await k.send('claim.request', GERAET('g-pc-heim'), { auftrag_id: A, schritt: 'arbeit' }));
  ok(await k.send('test.link', SUITE, { geraet_id: 'g-pc-heim', verbindung: 'down' }));
  const s = ok(await k.send('task.submit', RUN(c.run_id), { auftrag_id: A, epoch: 1, artefakt_hash: HASH }));
  const [req] = nur(await journalValid(k), 'task.backward_review_requested');
  assert.match(req.daten.hinweis, /local_model/);
  err(await k.send('claim.request', GERAET('g-browser-b'), { auftrag_id: A, schritt: 'pruefung' }), 'zustand_unpassend');
  assert.equal((await pruefung(k, s.pruefung_id)).zustand, 'requested');
  assert.equal(nur(await k.journal(), 'claim.granted').length, 1, 'nur der Arbeitsclaim, keine Vergabe an ein Cloud-Gerät');
  err(await k.send('task.accept', OWNER(), { auftrag_id: A }), 'zustand_unpassend');
  ok(await k.send('task.accept', OWNER(), { auftrag_id: A, verzicht_rueckwaertsabnahme: true }));
  assert.equal((await pruefung(k, s.pruefung_id)).grund, 'verzicht');
});
