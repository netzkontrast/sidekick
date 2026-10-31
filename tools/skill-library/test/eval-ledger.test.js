// Start ledger (SLV0-EVAL-05, SLV0-FALL-33): reserve before start, limit, failed starts count,
// existing lock is kept, append-only result entries.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tmp, runEvalCli, codesOf } from './eval-helpers.js';
import { initLedger, reserveStart, recordResult, readLedger, summarize } from '../lib/eval/ledger.js';
import { schemaErrors } from '../lib/eval/common.js';

test('SLV0-FALL-33 start 41 at limit 40 → budget_exhausted, ledger unchanged', (t) => {
  const file = path.join(tmp(t), 'ledger.jsonl');
  initLedger(file, { limit: 40 });
  for (let i = 1; i <= 40; i += 1) assert.equal(reserveStart(file, `T-${i}`).reservation.attempt_id, i);
  const before = fs.readFileSync(file);
  const r = runEvalCli(['ledger', 'reserve', '--ledger', file, '--trial-id', 'T-41']);
  assert.equal(r.code, 1, r.stdout);
  assert.deepEqual(codesOf(r.json), ['budget_exhausted']);
  assert.equal(r.json.command, 'eval ledger reserve');
  assert.deepEqual(fs.readFileSync(file), before);
  assert.equal(fs.existsSync(`${file}.lock`), false);
  assert.equal(summarize(readLedger(file)).remaining, 0);
});

test('SLV0-FALL-33 a failed start counts against the limit and its result is appended, not rewritten', (t) => {
  const file = path.join(tmp(t), 'ledger.jsonl');
  assert.equal(runEvalCli(['ledger', 'init', '--ledger', file, '--limit', '2']).code, 0);
  const r1 = runEvalCli(['ledger', 'reserve', '--ledger', file, '--trial-id', 'C0-B1']);
  assert.equal(r1.code, 0, r1.stdout);
  assert.equal(r1.json.reservation.status, 'reserved_before_start');
  const prefix = fs.readFileSync(file, 'utf8');
  const res = runEvalCli(['ledger', 'result', '--ledger', file, '--attempt-id', '1', '--outcome', 'failed_start']);
  assert.equal(res.code, 0, res.stdout);
  const after = fs.readFileSync(file, 'utf8');
  assert.ok(after.startsWith(prefix), 'earlier lines are untouched (append-only)');
  const status = runEvalCli(['ledger', 'status', '--ledger', file]).json.summary;
  assert.equal(status.starts_reserved, 1);
  assert.equal(status.remaining, 1);
  assert.deepEqual(status.attempts, [{ attempt_id: 1, trial_id: 'C0-B1', status: 'reserved_before_start', outcome: 'failed_start' }]);
  // Retry is a new start; then the limit is reached.
  assert.equal(runEvalCli(['ledger', 'reserve', '--ledger', file, '--trial-id', 'C0-B1']).json.reservation.attempt_id, 2);
  assert.deepEqual(codesOf(runEvalCli(['ledger', 'reserve', '--ledger', file, '--trial-id', 'C0-B1']).json), ['budget_exhausted']);
  // A second result for the same attempt is refused, nothing appended.
  const len = fs.readFileSync(file).length;
  assert.equal(runEvalCli(['ledger', 'result', '--ledger', file, '--attempt-id', '1', '--outcome', 'completed']).code, 2);
  assert.equal(fs.readFileSync(file).length, len);
  for (const e of readLedger(file)) assert.deepEqual(schemaErrors('eval-ledger', e), []);
});

test('SLV0-FALL-33 existing lock → ledger_locked; the lock stays and the ledger is unchanged', (t) => {
  const file = path.join(tmp(t), 'ledger.jsonl');
  initLedger(file, { limit: 40 });
  fs.writeFileSync(`${file}.lock`, 'fremd');
  const before = fs.readFileSync(file);
  for (const args of [['reserve', '--trial-id', 'T-1'], ['result', '--attempt-id', '1', '--outcome', 'completed']]) {
    const r = runEvalCli(['ledger', args[0], '--ledger', file, ...args.slice(1)]);
    assert.equal(r.code, 1, r.stdout);
    assert.deepEqual(codesOf(r.json), ['ledger_locked']);
  }
  assert.equal(fs.readFileSync(`${file}.lock`, 'utf8'), 'fremd');
  assert.deepEqual(fs.readFileSync(file), before);
});

test('SLV0-EVAL-05 init never overwrites; invalid limits and damaged ledgers are usage errors', (t) => {
  const dir = tmp(t);
  const file = path.join(dir, 'ledger.jsonl');
  initLedger(file, { limit: 3 });
  const before = fs.readFileSync(file);
  assert.equal(runEvalCli(['ledger', 'init', '--ledger', file, '--limit', '40']).code, 2);
  assert.deepEqual(fs.readFileSync(file), before);
  for (const limit of ['0', '41', 'x']) assert.equal(runEvalCli(['ledger', 'init', '--ledger', path.join(dir, `l${limit}.jsonl`), '--limit', limit]).code, 2);
  const damaged = path.join(dir, 'damaged.jsonl');
  fs.writeFileSync(damaged, `${fs.readFileSync(file, 'utf8')}{"seq": 7}\n`);
  assert.equal(runEvalCli(['ledger', 'reserve', '--ledger', damaged, '--trial-id', 'T']).code, 2);
  assert.equal(fs.existsSync(`${damaged}.lock`), false);
  assert.throws(() => recordResult(file, { attemptId: 9, outcome: 'completed' }), /nicht reserviert/);
});
