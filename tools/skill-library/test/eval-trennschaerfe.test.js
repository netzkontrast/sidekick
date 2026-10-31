// Discrimination, core and counter criterion in raw records and reports (SLV0-EVAL-24, SLV0-FALL-55/-56).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tmp, writeJson, writeTree, runEvalCli, RESEARCH } from './eval-helpers.js';
import { normalizeTrace } from '../lib/eval/normalize.js';
import { buildRawRecord } from '../lib/eval/raw.js';
import { buildReport, checkReport } from '../lib/eval/report.js';
import { schemaErrors } from '../lib/eval/common.js';

const NORMALIZED = normalizeTrace(fs.readFileSync(path.join(RESEARCH, 'eval-runs', 'e1', 'RW-01.normalized.json')), 'RW-01');

const det = (id, ergebnis, trennschaerfe, rolle = null) => ({ id, art: 'deterministisch', bewerter: 'sl-eval-check@1', ergebnis, r_regel: null, trennschaerfe, rolle });
const rub = (id, ergebnis, rolle = null) => ({ id, art: 'rubrik', bewerter: 'bewerter-session@1', ergebnis, r_regel: null, rolle });

function meta(runId, caseId, assertions) {
  return {
    run_id: runId, case_id: caseId, family_id: `fam-${caseId}`, repeat_id: 1, attempt_id: 1, split: 'select', ebene: 'M3', variante: 'B1',
    skills: [{ name: 'resuming-work', sha256: 'b'.repeat(64) }],
    client: { name: 'cli', version: '2.1.316', flags: ['-p'] },
    eval_version: 'sl1-design@2026-10-30', rubrik_version: null, fall_hash: 'a'.repeat(64),
    eingabe_ref: null, ausgabe_ref: null, spur_ref: 'eval-runs/e1/RW-01.normalized.json',
    assertions, latenz_ms: null, fehler: null,
  };
}
const raw = (runId, caseId, assertions) => buildRawRecord(meta(runId, caseId, assertions), NORMALIZED);

function rawDir(t, records) {
  const dir = tmp(t);
  fs.mkdirSync(path.join(dir, 'raw'));
  for (const r of records) writeJson(path.join(dir, 'raw'), `${r.run_id}.json`, r);
  return { dir, raw: path.join(dir, 'raw') };
}

const pair = (b) => (b === null ? null : [b.bestanden.zaehler, b.nicht_bestanden.zaehler, b.unklar.zaehler, b.bestanden.nenner]);

test('SLV0-FALL-55 report separates discriminating, preserving and unchecked assertions and flags a case without discriminating check', (t) => {
  const recs = [
    raw('R1', 'C-1', [det('D-1', 'bestanden', 'trennend'), det('D-2', 'bestanden', 'erhaltend'), det('D-3', 'nicht_bestanden', null), rub('K-1', 'bestanden')]),
    raw('R2', 'C-2', [det('D-4', 'bestanden', 'erhaltend'), det('D-5', 'bestanden', 'erhaltend')]),
    raw('R3', 'C-2', [det('D-4', 'bestanden', null), det('D-5', 'nicht_bestanden', 'erhaltend')]),
  ];
  const rep = buildReport(recs);
  assert.deepEqual(schemaErrors('eval-report', rep), []);
  assert.deepEqual(checkReport(rep, ['R1', 'R2', 'R3']), { schema_errors: [], messages: [] });
  const a = rep.ebenen.M3.assertions[0].assertions;
  assert.deepEqual(pair(a.deterministisch), [5, 2, 0, 7]);
  assert.deepEqual(pair(a.nulllauf.trennend), [1, 0, 0, 1]);
  assert.deepEqual(pair(a.nulllauf.erhaltend), [3, 1, 0, 4]);
  assert.deepEqual(pair(a.nulllauf.ungeprueft), [1, 1, 0, 2]);
  assert.equal(a.konjunktiv, null);
  const c1 = rep.ebenen.M3.je_fall.find((f) => f.case_id === 'C-1').assertions;
  assert.deepEqual(c1.nulllauf.trennend.bestanden.rohdatensatz_ids, ['R1']);
  // C-2: every deterministic assertion marked (D-4 via R2), none discriminating.
  assert.deepEqual(rep.hinweise.map((h) => [h.code, h.case_id, h.assertion_ids, h.rohdatensatz_ids]), [['no_discriminating_check', 'C-2', ['D-4', 'D-5'], ['R2', 'R3']]]);
  // Records without marks: no hint, unchecked only.
  const plain = buildReport([raw('P1', 'C-9', [det('D-9', 'bestanden', null)])]);
  assert.deepEqual([plain.hinweise, pair(plain.ebenen.M3.assertions[0].assertions.nulllauf.ungeprueft)], [[], [1, 0, 0, 1]]);

  // Usage errors (exit 2): discrimination on a rubric assertion, two core roles, a role on an R assertion,
  // contradicting marks of one assertion within a case.
  const dir = tmp(t);
  const normFile = writeJson(dir, 'n.json', NORMALIZED);
  const rubricMarked = { ...rub('K-2', 'bestanden'), trennschaerfe: 'trennend' };
  const cli = runEvalCli(['raw', '--meta', writeJson(dir, 'm.json', meta('X1', 'C-1', [rubricMarked])), '--normalized', normFile]);
  assert.equal(cli.code, 2, cli.stdout);
  assert.match(cli.json.error.message, /trennschaerfe/);
  assert.throws(() => raw('X2', 'C-1', [rub('K-1', 'bestanden', 'kern'), det('D-1', 'bestanden', 'trennend', 'kern')]), /rolle kern/);
  assert.throws(() => raw('X3', 'C-1', [{ ...rub('K-R', 'bestanden', 'gegen'), r_regel: 'R-01' }]), /R-Assertion/);
  const clash = rawDir(t, [recs[0], raw('R4', 'C-1', [det('D-1', 'bestanden', 'erhaltend')])]);
  const rc = runEvalCli(['report', clash.raw]);
  assert.equal(rc.code, 2, rc.stdout);
  assert.match(rc.json.error.message, /widersprüchliche trennschaerfe/);
});

test('SLV0-FALL-56 core and counter criterion are combined per sample, never as a product of rates', (t) => {
  const s = (id, k, g) => raw(id, 'C-K', [rub('KERN', k, 'kern'), ...(g === null ? [] : [det('GEGEN', g, 'trennend', 'gegen')])]);
  const recs = [
    s('S1', 'bestanden', 'nicht_bestanden'),
    s('S2', 'nicht_bestanden', 'bestanden'),
    s('S3', 'bestanden', 'bestanden'),
    s('S4', 'bestanden', 'unklar'),
    s('S5', 'bestanden', null),
  ];
  const { raw: dir } = rawDir(t, recs);
  const r = runEvalCli(['report', dir]);
  assert.equal(r.code, 0, r.stdout + r.stderr);
  const k = r.json.ebenen.M3.assertions[0].assertions.konjunktiv;
  assert.deepEqual(pair(k.kern_und_gegen), [1, 2, 1, 4]);
  assert.deepEqual(k.kern_und_gegen.bestanden.rohdatensatz_ids, ['S1', 'S2', 'S3', 'S4']);
  assert.deepEqual([k.ohne_kern_oder_gegen.zaehler, k.ohne_kern_oder_gegen.nenner], [1, 5]);
  // Per repeat the block is per sample as well.
  assert.deepEqual(pair(r.json.ebenen.M3.je_fall[0].assertions.konjunktiv.kern_und_gegen), [1, 2, 1, 4]);
  // Kern alone passes 3 of 4 paired samples and Gegen 2 of 4; their product 3/8 appears nowhere.
  const ratios = [];
  const walk = (n) => {
    if (Array.isArray(n)) { n.forEach(walk); return; }
    if (!n || typeof n !== 'object') return;
    if (typeof n.zaehler === 'number') ratios.push(n.zaehler / n.nenner);
    Object.values(n).forEach(walk);
  };
  walk(r.json);
  assert.ok(!ratios.includes(3 / 8), 'no product of rates');
  assert.ok(ratios.includes(1 / 4));

  // A case with gegen_kriterium but without kern_kriterium violates the case schema (exit 2).
  const root = tmp(t);
  writeTree(path.join(root, 'C-G', 'fixture'), { 'a.md': 'x\n' });
  writeJson(path.join(root, 'C-G'), 'fall.json', { id: 'C-G', prompt: 'p', gegen_kriterium: 'X' });
  const g = runEvalCli(['nullrun', '--cases', path.join(root, 'C-G')]);
  assert.equal(g.code, 2);
  assert.match(g.json.error.message, /kern_kriterium/);
  writeJson(path.join(root, 'C-G'), 'fall.json', { id: 'C-G', prompt: 'p', kern_kriterium: 'C-G-P01', gegen_kriterium: 'C-G-P01' });
  assert.equal(runEvalCli(['nullrun', '--cases', path.join(root, 'C-G')]).code, 2);
});
