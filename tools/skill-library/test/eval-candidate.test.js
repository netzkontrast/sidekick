// Candidate binding (SLV0-EVAL-03, SLV0-FALL-31) and equality with skill_pilot.py variant_files.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { tmp, writeJson, readJson, runEvalCli, codesOf, BASELINE_V2, RESEARCH, NEEDS_PYTHON, callPilot, syntheticSource } from './eval-helpers.js';
import { freezeFromSource, packageSetHash } from '../lib/eval/snapshot.js';
import { bindCandidate, candidateSha256 } from '../lib/eval/candidate.js';
import { sha256Hex } from '../lib/core.js';

const SNAP = freezeFromSource(syntheticSource());
const ALPHA = '.agents/skills/alpha/SKILL.md';
const DESC_LINE = 'description: Synthetisch alpha. Nutze bei Tests. Nicht für Produktion.';

function cand(over = {}) {
  return {
    id: 'K-TEST',
    dimension: 'description',
    replacements: [{ path: ALPHA, before: DESC_LINE, after: 'description: Synthetisch alpha, enger. Nutze bei Tests. Nicht für Faktenfragen.' }],
    baseline_sha256: SNAP.package_set_sha256,
    ...over,
  };
}

function bindCli(t, candidates, snapshot = SNAP) {
  const dir = tmp(t);
  return runEvalCli(['bind', '--snapshot', writeJson(dir, 's.json', snapshot), '--candidates', writeJson(dir, 'k.json', { candidates })]);
}

test('SLV0-FALL-31 candidate with a foreign baseline (real K-DESC against baseline v2) → candidate_baseline_mismatch', (t) => {
  const r = runEvalCli(['bind', '--snapshot', BASELINE_V2, '--candidates', path.join(RESEARCH, 'skill-pilot-candidates.json'), '--id', 'K-DESC']);
  assert.equal(r.code, 1, r.stdout);
  assert.deepEqual(codesOf(r.json), ['candidate_baseline_mismatch']);
  assert.equal(r.json.candidates[0].accepted, false);
  const r2 = bindCli(t, [cand({ baseline_sha256: 'f'.repeat(64) })]);
  assert.deepEqual(codesOf(r2.json), ['candidate_baseline_mismatch']);
});

test('SLV0-FALL-31 candidate with two dimensions → candidate_multi_dimension', (t) => {
  const r = bindCli(t, [cand({ dimension: ['description', 'project-binding'] })]);
  assert.equal(r.code, 1);
  assert.deepEqual(codesOf(r.json), ['candidate_multi_dimension']);
  // A description candidate with a second replacement is a second change as well.
  const extra = { path: '.agents/skills/beta/references/work.md', before: 'Äußerst knapp.', after: 'Knapp.' };
  const r2 = bindCli(t, [cand({ replacements: [cand().replacements[0], extra] })]);
  assert.deepEqual(codesOf(r2.json), ['candidate_multi_dimension']);
  // A project-binding candidate must not touch the frontmatter (selection dimension).
  const r3 = bindCli(t, [cand({ dimension: 'project-binding' })]);
  assert.deepEqual(codesOf(r3.json), ['candidate_multi_dimension']);
});

test('SLV0-FALL-31 ambiguous, missing or unknown-file replacement → replacement_not_unique', (t) => {
  const twice = cand({ dimension: 'project-binding', replacements: [{ path: '.agents/skills/alpha/references/work.md', before: 'Schritt eins.', after: 'Schritt zwei.' }] });
  const missing = cand({ id: 'K-MISS', dimension: 'project-binding', replacements: [{ path: ALPHA, before: 'gibt es nicht', after: 'x' }] });
  const unknown = cand({ id: 'K-UNK', dimension: 'project-binding', replacements: [{ path: '.agents/skills/alpha/references/neu.md', before: 'x', after: 'y' }] });
  const r = bindCli(t, [twice, missing, unknown]);
  assert.equal(r.code, 1);
  assert.deepEqual(codesOf(r.json), ['replacement_not_unique', 'replacement_not_unique', 'replacement_not_unique']);
  assert.deepEqual(r.json.candidates.map((c) => c.accepted), [false, false, false]);
});

test('SLV0-FALL-31 description candidate that changes the body → candidate_multi_dimension', (t) => {
  const body = cand({ replacements: [{ path: ALPHA, before: '# alpha', after: 'description: # alpha' }] });
  const partial = cand({ id: 'K-PART', replacements: [{ path: ALPHA, before: 'description: Synthetisch alpha.', after: 'description: Anders.' }] });
  const newline = cand({ id: 'K-NL', replacements: [{ path: ALPHA, before: DESC_LINE, after: 'description: a\nallowed-tools: Bash' }] });
  const ref = cand({ id: 'K-REF', replacements: [{ path: '.agents/skills/beta/references/work.md', before: 'Äußerst knapp.', after: 'description: x' }] });
  const r = bindCli(t, [body, partial, newline, ref]);
  assert.deepEqual(codesOf(r.json), ['candidate_multi_dimension', 'candidate_multi_dimension', 'candidate_multi_dimension', 'candidate_multi_dimension']);
});

test('SLV0-EVAL-03 valid candidates are bound: hashes reported, snapshot unchanged', (t) => {
  const before = JSON.stringify(SNAP);
  const portable = cand({ id: 'K-PORT', dimension: 'project-binding', replacements: [{ path: ALPHA, before: 'Nutze die konfigurierte Ablage; in Demo gilt `ablage/`.', after: 'Nutze die konfigurierte Ablage.' }] });
  const r = bindCli(t, [cand(), portable]);
  assert.equal(r.code, 0, r.stdout);
  assert.deepEqual(r.json.messages, []);
  for (const c of r.json.candidates) {
    assert.equal(c.accepted, true);
    assert.equal(c.baseline_sha256, SNAP.package_set_sha256);
    assert.notEqual(c.variant_package_set_sha256, SNAP.package_set_sha256);
    assert.deepEqual(c.changed_files.map((f) => f.path), [ALPHA]);
    assert.equal(c.changed_files[0].before_sha256, SNAP.files[ALPHA].sha256);
  }
  assert.equal(JSON.stringify(SNAP), before);
});

test('SLV0-EVAL-03 bound files and candidate hash equal skill_pilot.py variant_files and digest(canonical)', NEEDS_PYTHON, () => {
  const portable = cand({ id: 'K-PORT', dimension: 'project-binding', replacements: [{ path: ALPHA, before: 'Nutze die konfigurierte Ablage; in Demo gilt `ablage/`.', after: 'Nutze die konfigurierte Ablage.' }] });
  for (const c of [cand(), portable]) {
    const { files, record } = bindCandidate(SNAP, c);
    const py = callPilot('variant_files', [SNAP, c]);
    assert.deepEqual(files, py);
    assert.equal(record.variant_package_set_sha256, packageSetHash(py));
    assert.equal(candidateSha256(c), sha256Hex(callPilot('canonical', [c])));
  }
});

test('SLV0-EVAL-03 real K-DESC rebased onto baseline v2 binds to exactly the grilling description line', () => {
  const base = readJson(BASELINE_V2);
  const kdesc = readJson(path.join(RESEARCH, 'skill-pilot-candidates.json')).candidates.find((c) => c.id === 'K-DESC');
  const line = base.files['.agents/skills/grilling/SKILL.md'].content.split('\n').find((l) => l.startsWith('description:'));
  const rebased = { ...kdesc, baseline_sha256: base.package_set_sha256, replacements: [{ ...kdesc.replacements[0], before: line }] };
  const { record } = bindCandidate(base, rebased);
  assert.equal(record.dimension, 'description');
  assert.deepEqual(record.changed_files.map((f) => f.path), ['.agents/skills/grilling/SKILL.md']);
});
