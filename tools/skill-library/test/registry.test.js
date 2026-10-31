// Registry checks SLV0-VAL-16, SLV0-PKG-10…15/-24 (SLV0-FALL-24).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, makeRepo, defaultFiles, runCli, codes, tempDir, NEEDS_SYMLINKS } from './helpers.js';
import { validateSchema, isDateTime } from '../lib/schema.js';
import { loadSchema } from '../lib/registry.js';

const EXAMPLE = path.join(REPO_ROOT, 'docs', 'spec', 'beispiele', 'skill-paket-demo.json');
const example = () => JSON.parse(fs.readFileSync(EXAMPLE, 'utf8'));

function writeRecords(records) {
  const dir = tempDir('slv0-reg-');
  return records.map((rec, i) => {
    const file = path.join(dir, `r${i}.json`);
    fs.writeFileSync(file, typeof rec === 'string' ? rec : JSON.stringify(rec, null, 2));
    return file;
  });
}

test('SLV0-PKG-10 spec example is schema-valid', () => {
  const r = runCli(['registry-check', EXAMPLE, '--schema-only']);
  assert.equal(r.code, 0, r.stdout);
  assert.deepEqual(r.json.messages, []);
  assert.equal(r.json.records[0].schema_valid, true);
});

test('SLV0-FALL-24 wrong hash: hash_mismatch', NEEDS_SYMLINKS, () => {
  const repo = makeRepo({ 'demo-skill': defaultFiles('demo-skill') });
  const good = runCli(['hash', '--root', repo]).json.packages[0].content_hash;
  const rec = example();
  rec.content_hash.value = good;
  const [okFile] = writeRecords([rec]);
  const ok = runCli(['registry-check', okFile, '--root', repo]);
  assert.equal(ok.code, 0, ok.stdout);
  assert.equal(ok.json.records[0].hash_checked, true);
  rec.content_hash.value = 'f'.repeat(64);
  const [badFile] = writeRecords([rec]);
  const bad = runCli(['registry-check', badFile, '--root', repo]);
  assert.equal(bad.code, 1);
  assert.deepEqual(codes(bad.json.messages), ['hash_mismatch']);
});

test('SLV0-FALL-24 two records x@1.0.0 with different hash: version_hash_conflict', () => {
  const a = example();
  a.version = '1.0.0';
  const b = structuredClone(a);
  b.content_hash.value = '0'.repeat(64);
  const files = writeRecords([a, b]);
  const r = runCli(['registry-check', ...files, '--schema-only']);
  assert.equal(r.code, 1);
  assert.deepEqual(codes(r.json.messages), ['version_hash_conflict', 'version_hash_conflict']);
  // Same version and same hash is not a conflict.
  const same = runCli(['registry-check', ...writeRecords([a, structuredClone(a)]), '--schema-only']);
  assert.equal(same.code, 0);
});

test('SLV0-FALL-24 status approved without status_evidence: registry_invalid', () => {
  const rec = example();
  rec.status = 'approved';
  delete rec.status_evidence;
  const r1 = runCli(['registry-check', ...writeRecords([rec]), '--schema-only']);
  assert.equal(r1.code, 1);
  assert.ok(codes(r1.json.messages).every((c) => c === 'registry_invalid'));
  rec.status_evidence = null;
  const r2 = runCli(['registry-check', ...writeRecords([rec]), '--schema-only']);
  assert.equal(r2.code, 1);
  assert.ok(codes(r2.json.messages).includes('registry_invalid'));
  rec.status_evidence = { merge_commit: 'abcdef1', decided_by: 'owner' };
  const r3 = runCli(['registry-check', ...writeRecords([rec]), '--schema-only']);
  assert.equal(r3.code, 0, r3.stdout);
});

test('SLV0-VAL-16 schema negatives: licensed origin without register ref, extra field, bad JSON, bad date', () => {
  const lic = example();
  lic.provenance.origin = 'lizenziert_uebernommen';
  const extra = { ...example(), status_by_tool: 'approved' };
  const date = { ...example(), created_at: '2026-02-30T00:00:00Z' };
  const skillMismatch = { ...example(), skill_id: 'other-skill' };
  for (const rec of [lic, extra, '{"kein json"', date, skillMismatch]) {
    const r = runCli(['registry-check', ...writeRecords([rec]), '--schema-only']);
    assert.equal(r.code, 1, JSON.stringify(rec));
    assert.ok(codes(r.json.messages).includes('registry_invalid'));
  }
});

test('SLV0-PKG-24 unknown hash profile is not compared; missing package gives no hash', () => {
  const rec = example();
  rec.content_hash.profile = 'sl-hash-v9';
  const repo = tempDir('slv0-norepo-');
  const r = runCli(['registry-check', ...writeRecords([rec]), '--root', repo]);
  assert.deepEqual(codes(r.json.messages), ['registry_invalid']);
  const r2 = runCli(['registry-check', ...writeRecords([example()]), '--root', repo]);
  assert.deepEqual(codes(r2.json.messages), ['hash_mismatch']);
  assert.match(r2.json.messages[0].message, /Paketordner fehlt/);
});

test('L4 schema checker: date-time and unsupported keyword handling', () => {
  assert.equal(isDateTime('2026-10-30T20:00:00Z'), true);
  assert.equal(isDateTime('2024-02-29T23:59:60+01:00'), true);
  assert.equal(isDateTime('2023-02-29T00:00:00Z'), false);
  assert.equal(isDateTime('2026-10-30 20:00:00Z'), false);
  assert.throws(() => validateSchema({ oneOf: [] }, 1), /nicht unterstützt/);
  assert.deepEqual(validateSchema(loadSchema(), example()), []);
});
