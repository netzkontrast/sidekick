// Split manifest and role-based access (SLV0-EVAL-06/-07, SLV0-FALL-34).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tmp, writeJson, runEvalCli, codesOf, RESEARCH } from './eval-helpers.js';
import { readLedger } from '../lib/eval/ledger.js';
import { buildManifest } from '../lib/eval/split.js';
import { caseSha256 } from '../lib/eval/prepare.js';
import { schemaErrors } from '../lib/eval/common.js';

const CASES = [
  { id: 'D-01', family_id: 'fam-dev', split: 'dev', prompt: 'a' },
  { id: 'S-01', family_id: 'fam-sel', split: 'select', prompt: 'b' },
  { id: 'T-01', family_id: 'fam-test', split: 'test', prompt: 'c' },
  { id: 'T-02', family_id: 'fam-test', split: 'test', prompt: 'c2' },
  { id: 'R-01', family_id: 'fam-r', split: 'regression', prompt: 'd' },
];
const K1 = '1'.repeat(64);
const K2 = '2'.repeat(64);

function setup(t) {
  const dir = tmp(t);
  const manifest = writeJson(dir, 'manifest.json', buildManifest(CASES, 'M-TEST'));
  const ledger = path.join(dir, 'ledger.jsonl');
  const init = runEvalCli(['ledger', 'init', '--ledger', ledger, '--limit', '40', '--manifest', manifest]);
  assert.equal(init.code, 0, init.stdout);
  const access = (role, split, cand = null) => runEvalCli(['split', 'access', '--ledger', ledger, '--manifest', manifest, '--role', role, '--split', split, ...(cand ? ['--candidate-sha256', cand] : [])]);
  const select = (role, cand) => runEvalCli(['split', 'select', '--ledger', ledger, '--manifest', manifest, '--role', role, '--candidate-sha256', cand]);
  return { dir, manifest, ledger, access, select };
}

test('SLV0-FALL-34 a family in dev and test → family_split_overlap', (t) => {
  const dir = tmp(t);
  const overlapping = [...CASES, { id: 'D-02', family_id: 'fam-test', split: 'dev', prompt: 'paraphrase' }];
  const r = runEvalCli(['split', 'manifest', '--cases', writeJson(dir, 'c.json', { cases: overlapping }), '--manifest-id', 'M-X']);
  assert.equal(r.code, 1, r.stdout);
  assert.deepEqual(codesOf(r.json), ['family_split_overlap']);
  assert.equal(r.json.messages[0].path, 'fam-test');
  // A hand-written manifest with the same overlap is refused by check, access and ledger init.
  const manifest = { schema_version: 1, manifest_id: 'M-X', cases: overlapping.map((c) => ({ case_id: c.id, family_id: c.family_id, split: c.split, case_sha256: caseSha256(c) })) };
  const file = writeJson(dir, 'm.json', manifest);
  assert.deepEqual(codesOf(runEvalCli(['split', 'check', '--manifest', file]).json), ['family_split_overlap']);
  assert.equal(runEvalCli(['ledger', 'init', '--ledger', path.join(dir, 'l.jsonl'), '--limit', '1', '--manifest', file]).code, 1);
  assert.equal(fs.existsSync(path.join(dir, 'l.jsonl')), false);
});

test('SLV0-FALL-34 test access before a logged selection → split_access_denied, and the violation is logged', (t) => {
  const { ledger, access } = setup(t);
  const r = access('evaluator', 'test', K1);
  assert.equal(r.code, 1, r.stdout);
  assert.deepEqual(codesOf(r.json), ['split_access_denied']);
  const last = readLedger(ledger).at(-1);
  assert.equal(last.kind, 'split_access');
  assert.equal(last.decision, 'denied');
  assert.equal(last.code, 'split_access_denied');
  assert.deepEqual(last.case_ids, []);
  // The author can never read test or select, nor log a selection.
  assert.deepEqual(codesOf(access('author', 'test', K1).json), ['split_access_denied']);
  assert.deepEqual(codesOf(access('author', 'select').json), ['split_access_denied']);
  assert.deepEqual(codesOf(access('evaluator', 'dev').json), ['split_access_denied']);
  assert.equal(readLedger(ledger).filter((e) => e.decision === 'denied').length, 4);
});

test('SLV0-FALL-34 second candidate on a consumed test split → split_consumed', (t) => {
  const { ledger, access, select } = setup(t);
  assert.equal(select('evaluator', K1).code, 0);
  const ok = access('evaluator', 'test', K1);
  assert.equal(ok.code, 0, ok.stdout);
  assert.deepEqual(ok.json.entry.case_ids, ['T-01', 'T-02']);
  // Same candidate again (e.g. repeats) stays allowed; another candidate is refused.
  assert.equal(access('evaluator', 'test', K1).code, 0);
  assert.deepEqual(codesOf(select('evaluator', K2).json), ['split_consumed']);
  const r = access('evaluator', 'test', K2);
  assert.equal(r.code, 1);
  assert.deepEqual(codesOf(r.json), ['split_consumed']);
  assert.equal(readLedger(ledger).at(-1).code, 'split_consumed');
  for (const e of readLedger(ledger)) assert.deepEqual(schemaErrors('eval-ledger', e), []);
});

test('SLV0-EVAL-07 roles read their own split; regression is open to both and is not a test set', (t) => {
  const { access, select } = setup(t);
  assert.deepEqual(access('author', 'dev').json.entry.case_ids, ['D-01']);
  assert.deepEqual(access('evaluator', 'select').json.entry.case_ids, ['S-01']);
  assert.deepEqual(access('author', 'regression').json.entry.case_ids, ['R-01']);
  assert.deepEqual(access('evaluator', 'regression').json.entry.case_ids, ['R-01']);
  assert.deepEqual(codesOf(select('author', K1).json), ['split_access_denied']);
});

test('SLV0-EVAL-06 pilot cases with split "diagnostic" are refused (not a SL1 §5.5 split)', () => {
  const r = runEvalCli(['split', 'manifest', '--cases', path.join(RESEARCH, 'skill-pilot-cases.json'), '--manifest-id', 'M-PILOT']);
  assert.equal(r.code, 2, r.stdout);
  assert.match(r.json.error.message, /PIL-03: split/);
});

test('SLV0-EVAL-06 manifest is schema-valid, case hashes are verifiable, ledger is bound to it', (t) => {
  const dir = tmp(t);
  const casesFile = writeJson(dir, 'cases.json', { cases: CASES });
  const m = runEvalCli(['split', 'manifest', '--cases', casesFile, '--manifest-id', 'M-PILOT']);
  assert.equal(m.code, 0, m.stdout);
  assert.deepEqual(schemaErrors('eval-split-manifest', m.json), []);
  const file = writeJson(dir, 'm.json', m.json);
  const chk = runEvalCli(['split', 'check', '--manifest', file, '--cases', casesFile]);
  assert.equal(chk.code, 0, chk.stdout);
  assert.deepEqual(chk.json.case_hash_problems, []);
  const changed = JSON.parse(fs.readFileSync(casesFile, 'utf8'));
  changed.cases[0].prompt += ' geändert';
  const chk2 = runEvalCli(['split', 'check', '--manifest', file, '--cases', writeJson(dir, 'c2.json', changed)]);
  assert.equal(chk2.code, 1);
  assert.equal(chk2.json.case_hash_problems.length, 1);
  // A ledger without bound manifest, or bound to another manifest, refuses split commands.
  const unbound = path.join(dir, 'u.jsonl');
  runEvalCli(['ledger', 'init', '--ledger', unbound, '--limit', '1']);
  assert.equal(runEvalCli(['split', 'access', '--ledger', unbound, '--manifest', file, '--role', 'author', '--split', 'dev']).code, 2);
});
