// Snapshot freeze/verify (SLV0-EVAL-01/-02, SLV0-FALL-30) and equality with the research helper.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, runCli, NEEDS_SYMLINKS, makeRepo, defaultFiles } from './helpers.js';
import { tmp, writeJson, readJson, runEvalCli, codesOf, BASELINE_V2, GOLDEN_SET_HASH, NEEDS_PYTHON, callPilot, syntheticSource } from './eval-helpers.js';
import { freezeFromSource, verifySnapshot } from '../lib/eval/snapshot.js';
import { schemaErrors } from '../lib/eval/common.js';

test('SLV0-FALL-30 snapshot content changed after freezing → snapshot_hash_mismatch, exit 1', (t) => {
  const dir = tmp(t);
  const snap = readJson(BASELINE_V2);
  const first = Object.keys(snap.files)[0];
  snap.files[first].content += '\nNachträglich ergänzt.\n';
  const file = writeJson(dir, 'snap.json', snap);
  const r = runEvalCli(['verify', '--snapshot', file]);
  assert.equal(r.code, 1, r.stdout);
  assert.equal(r.json.refused, true);
  assert.ok(codesOf(r.json).includes('snapshot_hash_mismatch'));
  assert.ok(r.json.messages.some((m) => m.path === first && m.rule === 'SLV0-EVAL-02'));
  // Consumers refuse too: no binding, no preparation on a tampered snapshot.
  const cands = writeJson(dir, 'k.json', { candidates: [] });
  assert.equal(runEvalCli(['bind', '--snapshot', file, '--candidates', cands]).code, 1);
});

test('SLV0-FALL-30 recorded package-set hash changed (file hashes consistent) → snapshot_hash_mismatch', (t) => {
  const dir = tmp(t);
  const snap = readJson(BASELINE_V2);
  snap.package_set_sha256 = '0'.repeat(64);
  const r = runEvalCli(['verify', '--snapshot', writeJson(dir, 'snap.json', snap)]);
  assert.equal(r.code, 1);
  assert.deepEqual(codesOf(r.json), ['snapshot_hash_mismatch']);
});

test('SLV0-FALL-30 file hash and content changed together still break the package-set hash', () => {
  const snap = readJson(BASELINE_V2);
  const first = Object.keys(snap.files)[0];
  const forged = freezeFromSource({ source_commit: 'abcdef1', files: { [first]: 'x' } }).files[first];
  snap.files[first] = forged;
  assert.throws(() => verifySnapshot(snap), (err) => err.messages?.[0]?.code === 'snapshot_hash_mismatch');
});

test('SLV0-EVAL-02 verify of skill-pilot-baseline-v2.json succeeds with the golden package-set hash', () => {
  const r = runEvalCli(['verify', '--snapshot', BASELINE_V2]);
  assert.equal(r.code, 0, r.stdout);
  assert.equal(r.json.package_set_sha256, GOLDEN_SET_HASH);
  assert.equal(r.json.files, 25);
  assert.equal(r.json.packages.length, 8);
  assert.deepEqual(schemaErrors('eval-snapshot', readJson(BASELINE_V2)), []);
});

test('SLV0-EVAL-01 freeze from the baseline file contents reproduces skill-pilot-baseline-v2.json exactly', () => {
  const base = readJson(BASELINE_V2);
  const source = { source_commit: base.source_commit, files: Object.fromEntries(Object.entries(base.files).map(([p, r]) => [p, r.content])) };
  assert.deepEqual(freezeFromSource(source), base);
});

test('SLV0-EVAL-01 freeze equals skill_pilot.py freeze byte for byte (canonical JSON)', NEEDS_PYTHON, () => {
  const src = syntheticSource();
  const js = freezeFromSource(src);
  const py = callPilot('freeze', [src]);
  assert.deepEqual(js, py);
  assert.equal(JSON.stringify(js), JSON.stringify(py));
});

test('SLV0-EVAL-01 freeze --root on a repo equals the hash command and verifies; invalid package refuses', NEEDS_SYMLINKS, (t) => {
  const repo = makeRepo({ 'demo-skill': defaultFiles('demo-skill'), other: defaultFiles('other') });
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  const r = runEvalCli(['freeze', '--root', repo, '--source-commit', 'deadbeef']);
  assert.equal(r.code, 0, r.stdout);
  assert.deepEqual(schemaErrors('eval-snapshot', r.json), []);
  assert.equal(r.json.package_set_sha256, runCli(['hash', '--root', repo]).json.package_set_hash);
  assert.ok(Object.keys(r.json.files).every((p) => p.startsWith('.agents/skills/')));
  assert.equal(verifySnapshot(r.json).files, 6);

  fs.writeFileSync(path.join(repo, '.agents', 'skills', 'other', 'SKILL.md'), '# kein Frontmatter\n');
  const bad = runEvalCli(['freeze', '--root', repo, '--source-commit', 'deadbeef']);
  assert.equal(bad.code, 1);
  assert.ok(codesOf(bad.json).includes('frontmatter_missing'));
});

test('SLV0-EVAL-01 snapshot paths outside .agents/skills/ and missing source commit are usage errors', (t) => {
  const dir = tmp(t);
  const outside = writeJson(dir, 'src.json', { source_commit: 'abcdef1', files: { 'docs/x.md': 'x' } });
  assert.equal(runEvalCli(['freeze', '--source', outside]).code, 2);
  const escape = writeJson(dir, 'src2.json', { source_commit: 'abcdef1', files: { '.agents/skills/a/../../x': 'x' } });
  assert.equal(runEvalCli(['freeze', '--source', escape]).code, 2);
  assert.equal(runEvalCli(['freeze', '--root', REPO_ROOT]).code, 2);
});
