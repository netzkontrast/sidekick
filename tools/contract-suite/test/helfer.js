// Shared helpers of the kern-port tests: schema checks on every response and journal event,
// and the common preambles (devices paired, example task open, claim granted).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSchema } from '../../skill-library/lib/schema.js';
import { startPruefling, OWNER, GERAET, RUN } from '../lib/pruefling.js';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const SPEC = path.join(ROOT, 'docs', 'spec');
export const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const EVENT_SCHEMA = readJson(path.join(SPEC, 'schemas', 'ereignis.schema.json'));
const PORT_SCHEMA = readJson(path.join(SPEC, 'schemas', 'kern-port-nachricht.schema.json'));
export const AUFTRAG = { ...readJson(path.join(SPEC, 'beispiele', 'auftrag-recherche.json')), zustand: 'draft' };
export const A = AUFTRAG.id;
export const HASH = `sha256:${'a'.repeat(64)}`;

export function check(res) {
  assert.deepEqual(validateSchema(PORT_SCHEMA, res), [], JSON.stringify(res));
  return res;
}
export function ok(res) { check(res); assert.equal(res.ok, true, JSON.stringify(res.fehler)); return res.ergebnis; }
export function err(res, code) { check(res); assert.equal(res.ok, false, 'expected a refusal'); assert.equal(res.fehler.code, code, res.fehler.meldung); return res; }

export async function journalValid(k) {
  const evs = await k.journal();
  for (const ev of evs) assert.deepEqual(validateSchema(EVENT_SCHEMA, ev), [], JSON.stringify(ev));
  const seqs = new Map();
  for (const ev of evs) { const n = (seqs.get(ev.strom) ?? 0) + 1; assert.equal(ev.seq, n, `lückenlose seq im Strom ${ev.strom}`); seqs.set(ev.strom, n); }
  return evs;
}
export const typen = (evs) => evs.map((e) => e.typ);
/** Outcome class of a case step: a refusal with nicht_abbildbar is a finding, not a failure (KP-GRZ-05). */
export const klassifiziere = (res) => (res.ok ? 'ok' : res.fehler.code === 'nicht_abbildbar' ? 'nicht_abbildbar' : 'abgelehnt');

/** Pair devices, draft and open the example task, grant a claim to pc-heim. */
export async function bisClaim(k, { geraete = ['g-pc-heim', 'g-browser-a', 'g-browser-b'], claim = true, auftrag = AUFTRAG } = {}) {
  for (const g of geraete) {
    ok(await k.send('device.pair_request', GERAET(g)));
    ok(await k.send('device.pair_confirm', OWNER(null), { geraet_id: g }));
  }
  ok(await k.send('task.draft', OWNER(), { auftrag }));
  ok(await k.send('task.open', OWNER(), { auftrag_id: auftrag.id, version: auftrag.version }));
  if (!claim) return null;
  return ok(await k.send('claim.request', GERAET('g-pc-heim'), { auftrag_id: auftrag.id, schritt: 'arbeit' }));
}

export async function bisAbnahme(k) {
  const c = await bisClaim(k);
  const run = RUN(c.run_id);
  ok(await k.send('task.submit', run, { auftrag_id: A, epoch: c.epoch, artefakt_hash: HASH, belege: ['fixture:q1'] }));
  const acc = ok(await k.send('task.accept', OWNER(), { auftrag_id: A }));
  return { c, run, acc };
}

export const withK = (name, fn) => test(name, async () => {
  const k = startPruefling();
  try { await fn(k); } finally { await k.close(); }
});

