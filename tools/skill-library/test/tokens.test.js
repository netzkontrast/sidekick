// Token counting SLV0-TOK-01…08 (SLV0-FALL-26…29).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makePackage, defaultFiles, runCli, tempDir, skillMd } from './helpers.js';
import { sumTokens, estimateToken, unknownToken, runUsageFromTrace } from '../lib/tokens.js';

function allTokenRecords(pkg) {
  return pkg.stages.map((s) => s.tokens);
}

test('SLV0-FALL-26 no estimator: all token values null/unbekannt; bytes, lines, words present', () => {
  const r = runCli(['tokens', '--scope', 'package', makePackage('demo')]);
  assert.equal(r.code, 0, r.stdout);
  assert.equal(r.json.estimator, null);
  const pkg = r.json.packages[0];
  assert.deepEqual(pkg.stages.map((s) => s.bezug), ['katalog', 'rumpf', 'agents/openai.yaml', 'references/work.md', 'paket']);
  for (const t of allTokenRecords(pkg)) {
    assert.equal(t.wert, null);
    assert.equal(t.quelle, 'unbekannt');
    assert.equal(t.methode, null);
    assert.equal(typeof t.beleg, 'string'); // reason, never 0/empty/false (SLV0-INV-05)
  }
  for (const s of pkg.stages) {
    for (const k of ['bytes', 'lines', 'words']) assert.ok(Number.isInteger(s[k]) && s[k] >= 0, `${s.bezug}.${k}`);
  }
  const files = defaultFiles('demo');
  const katalog = Buffer.byteLength('demo\nSynthetisches Testpaket. Nutze bei Tests. Nicht für Produktion.');
  assert.equal(pkg.stages[0].bytes, katalog);
  const body = files['SKILL.md'].slice(files['SKILL.md'].indexOf('---\n', 4) + 4);
  assert.equal(pkg.stages[1].bytes, Buffer.byteLength(body));
  const total = Object.values(files).reduce((a, c) => a + Buffer.byteLength(c), 0);
  assert.equal(pkg.stages[4].bytes, total);
});

test('SLV0-FALL-27 estimator utf8-bytes-div-4@1: values geschaetzt with method; sum with unknown is unbekannt', () => {
  const r = runCli(['tokens', '--scope', 'package', makePackage('demo'), '--estimator', 'utf8-bytes-div-4@1']);
  assert.equal(r.code, 0);
  const pkg = r.json.packages[0];
  for (const s of pkg.stages) {
    assert.equal(s.tokens.quelle, 'geschaetzt');
    assert.equal(s.tokens.methode, 'utf8-bytes-div-4@1');
    if (s.bezug !== 'paket') assert.equal(s.tokens.wert, Math.ceil(s.bytes / 4));
  }
  const est = estimateToken(10, 'utf8-bytes-div-4@1', 'a');
  const unk = unknownToken('b', 'test');
  assert.deepEqual(sumTokens([est, unk], 'summe'), { wert: null, quelle: 'unbekannt', methode: null, bezug: 'summe', beleg: sumTokens([est, unk], 'summe').beleg });
  assert.equal(sumTokens([est, est], 's').wert, 6);
  assert.equal(sumTokens([est, est], 's').quelle, 'geschaetzt');
  const reported = { wert: 5, quelle: 'gemeldet', methode: 'tok@1', bezug: 'x', beleg: 'y' };
  assert.equal(sumTokens([est, reported], 's').quelle, 'unbekannt'); // never mixes methods
});

test('SLV0-FALL-28 normalized trace with usage: run usage gemeldet with trace hash; per skill unbekannt', () => {
  const trace = {
    helper_version: 'skill-pilot-v1',
    trace_sha256: 'c'.repeat(64),
    status: 'completed',
    activation_evidence: [{ mode: 'skill_tool', skill: 'grilling', tool_use_id: 't1', confirmed: true }],
    usage: { input_tokens: 120, output_tokens: 30, cache_read_input_tokens: 0 },
    reported_cost_usd: 0.01,
    reported_model: 'synthetic-model',
  };
  const dir = tempDir('slv0-trace-');
  const file = path.join(dir, 'trace.json');
  fs.writeFileSync(file, JSON.stringify(trace));
  const r = runCli(['tokens', '--trace', file]);
  assert.equal(r.code, 0, r.stdout);
  assert.deepEqual(r.json.lauf_usage.input_tokens, { wert: 120, quelle: 'gemeldet', methode: 'client-usage@synthetic-model', bezug: 'lauf', beleg: `trace_sha256:${'c'.repeat(64)}` });
  assert.equal(r.json.lauf_usage.cache_read_input_tokens.wert, 0); // reported 0 stays 0
  assert.equal(r.json.lauf_usage.cache_creation_input_tokens.quelle, 'unbekannt'); // absent is not 0
  assert.deepEqual(r.json.je_skill.map((s) => [s.skill, s.tokens.quelle, s.tokens.wert]), [['grilling', 'unbekannt', null]]);
  assert.equal(r.json.kosten_client_schaetzung.wert, 0.01);
  const empty = runUsageFromTrace({ trace_sha256: 'd'.repeat(64), usage: null });
  assert.equal(empty.lauf_usage.input_tokens.quelle, 'unbekannt');
  assert.equal(empty.kosten_client_schaetzung.quelle, 'unbekannt');
});

test('SLV0-FALL-29 budget exceeded only by estimated tokens: at most a warning, exit 0', () => {
  const dir = makePackage('demo');
  const r = runCli(['tokens', '--scope', 'package', dir, '--estimator', 'utf8-bytes-div-4@1', '--token-budget', '10']);
  assert.equal(r.code, 0);
  assert.deepEqual(r.json.messages.map((m) => [m.code, m.severity]), [['budget_exceeded', 'warning']]);
  // Without estimator the budget cannot be evaluated: no message, no claim.
  const r2 = runCli(['tokens', '--scope', 'package', dir, '--token-budget', '10']);
  assert.equal(r2.code, 0);
  assert.deepEqual(r2.json.messages, []);
});

test('SLV0-TOK invalid package is not counted and exits 1', () => {
  const dir = makePackage('demo', { ...defaultFiles('demo'), 'SKILL.md': skillMd('falsch') });
  const r = runCli(['tokens', '--scope', 'package', dir]);
  assert.equal(r.code, 1);
  assert.deepEqual(r.json.packages, []);
  assert.deepEqual(r.json.not_counted, ['demo']);
});
