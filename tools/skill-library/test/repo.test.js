// Golden tests against the repository state (SLV0-FALL-01) and the frozen snapshot (SLV0-FALL-23).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, runCli, NEEDS_SYMLINKS, tempDir } from './helpers.js';
import { hashOfFileMap, sha256Hex } from '../lib/core.js';

const SNAPSHOT = path.join(REPO_ROOT, 'research', 'skills-meta-prompting', 'skill-pilot-baseline-v2.json');
const GOLDEN_SET_HASH = '4ad5b6dbae228982fe3ba7df6552d9e7029af0fc0c972dde09ad9406f2473967';
// Handover §9 (profile sl-hash-v0, commit 06869bc6), recomputed here from the frozen snapshot.
const EXPECTED_CONTENT_HASHES = {
  'evaluating-changes': '8b18e432f756812ef1f54b497d260edc6c9fa01229a9e6fa73defbbca0e2ed67',
  grilling: '7fb06a3e5dc31280b4a780adb67f0d32a51cc99676be13091a7b311e85aadb76',
  'planning-work-packages': 'd6a4f2ccd9e072682a1dba07ff0fbe3912e34d90162997814657cd102a9971b0',
  'researching-repositories': 'f164ff6cfe32280bda3d6bb4acce5adcac176837a6c4951879ea4397a536acbc',
  'resuming-work': 'e81b02eba819c68ba58c19576963af2ba38c2f544b5f41d6e7af25eba30fedf1',
  'reviewing-decision-gates': 'fb0236ab1f16442a01f84559829e7d61f81101ef588d816985a7946ab462e177',
  'specifying-behavior': '9bdc2b8250fa1f16d2a5a18a75c0c13bdfa361f36b3879b8a3286462bc9d7df3',
  'testing-system-boundaries': '76f9c4e25c2d630a32ec246136c63f799cbc326679a8c4188f21f0751f1973c9',
};

test('SLV0-FALL-01 repo skills and .claude/skills: 0 errors, 0 warnings, exit 0, nine content hashes', NEEDS_SYMLINKS, () => {
  // Deliberately breaks when a skill in the working tree becomes invalid (handover §6).
  const r = runCli(['validate', '--scope', 'project', '--root', REPO_ROOT]);
  assert.equal(r.code, 0, r.stdout);
  assert.equal(r.json.checked_level, 'M0');
  assert.deepEqual(r.json.summary, { errors: 0, warnings: 0, packages: 9, valid_packages: 9 });
  assert.deepEqual(r.json.messages, []);
  assert.equal(r.json.packages.length, 9);
  for (const p of r.json.packages) assert.match(p.content_hash, /^[0-9a-f]{64}$/);
});

test('SLV0-FALL-23 package-set hash of skill-pilot-baseline-v2.json equals golden value', () => {
  const r = runCli(['hash', '--snapshot', SNAPSHOT]);
  assert.equal(r.code, 0, r.stdout);
  assert.equal(r.json.package_set_hash, GOLDEN_SET_HASH);
  assert.equal(r.json.recorded_package_set_hash, GOLDEN_SET_HASH);
  assert.equal(r.json.files, 25);
});

test('SLV0-FALL-23/AK-04 per-package content hashes of the frozen snapshot match handover §9', () => {
  const snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
  const perPackage = {};
  for (const [p, rec] of Object.entries(snap.files)) {
    const [, , name, ...rest] = p.split('/');
    perPackage[name] ??= {};
    perPackage[name][rest.join('/')] = sha256Hex(Buffer.from(rec.content, 'utf8'));
  }
  const actual = Object.fromEntries(Object.entries(perPackage).map(([n, m]) => [n, hashOfFileMap(m)]));
  assert.deepEqual(actual, EXPECTED_CONTENT_HASHES);
});

test('SLV0-FALL-23 tampered snapshot content is reported, no package-set hash', () => {
  const snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
  const first = Object.keys(snap.files)[0];
  snap.files[first].content += 'x';
  const dir = tempDir('slv0-snap-');
  try {
    const file = path.join(dir, 'snap.json');
    fs.writeFileSync(file, JSON.stringify(snap));
    const r = runCli(['hash', '--snapshot', file]);
    assert.equal(r.code, 1);
    assert.equal(r.json.package_set_hash, null);
    assert.ok(r.json.messages.some((m) => m.code === 'snapshot_hash_mismatch'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
