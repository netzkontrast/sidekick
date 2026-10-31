// Trace normalization (SLV0-EVAL-08, SLV0-INV-05, SLV0-FALL-35) and equality with skill_pilot.py.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tmp, writeJson, runEvalCli, codesOf, RESEARCH, NEEDS_PYTHON, callPilot } from './eval-helpers.js';
import { normalizeTrace, pilotView, restrictPilotOutput } from '../lib/eval/normalize.js';
import { schemaErrors } from '../lib/eval/common.js';
import { sha256Hex } from '../lib/core.js';

const SECRET_THOUGHT = 'GEHEIMER-DENKTEXT-7f3a';
const FREE_OUTPUT = 'FREIE-MODELLAUSGABE-91c2';

const jsonl = (...events) => `${events.map((e) => JSON.stringify(e)).join('\n')}\n`;
const INIT = {
  type: 'system', subtype: 'init', model: 'modell-x', cwd: '/home/jemand/privat',
  skills: ['alpha', 'beta'], tools: ['Read', 'Skill'],
  plugins: [{ name: 'p1', path: '/home/jemand/.plugins/p1', source: 'p1@lokal' }],
};
const RESULT = {
  type: 'result', subtype: 'success', is_error: false, result: FREE_OUTPUT, total_cost_usd: 0.0123,
  usage: { input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 30, cache_creation_input_tokens: 40, service_tier: 'standard', server_tool_use: { web_search_requests: 0 } },
};
const assistant = (...content) => ({ type: 'assistant', message: { role: 'assistant', content } });
const user = (...content) => ({ type: 'user', message: { role: 'user', content } });

const TRACES = {
  full: jsonl(
    INIT,
    assistant({ type: 'thinking', thinking: SECRET_THOUGHT }, { type: 'text', text: FREE_OUTPUT },
      { type: 'tool_use', id: 'tu_1', name: 'Skill', input: { skill: 'alpha', args: FREE_OUTPUT } }),
    user({ type: 'tool_result', tool_use_id: 'tu_1', content: FREE_OUTPUT }),
    assistant({ type: 'tool_use', id: 'tu_2', name: 'Read', input: { file_path: '/tmp/ws/.claude/skills/beta/SKILL.md' } }),
    user({ type: 'tool_result', tool_use_id: 'tu_2', content: 'x' }),
    assistant({ type: 'tool_use', id: 'tu_3', name: 'Read', input: { file_path: '/tmp/ws/input/plan.md' } }),
    RESULT,
  ),
  noInit: jsonl(assistant({ type: 'text', text: FREE_OUTPUT }), RESULT),
  unconfirmed: jsonl(
    INIT,
    assistant({ type: 'tool_use', id: 'tu_a', name: 'Skill', input: { skill: 'alpha' } }),
    assistant({ type: 'tool_use', id: 'tu_b', name: 'Skill', input: { skill: 'beta' } }),
    user({ type: 'tool_result', tool_use_id: 'tu_b', is_error: true, content: 'Unknown skill' }),
  ),
  empty: '',
  blank: '\n  \n\n',
  failed: jsonl(INIT, { ...RESULT, is_error: true, subtype: 'error_max_budget_usd' }),
};

function norm(name) {
  return normalizeTrace(Buffer.from(TRACES[name], 'utf8'), name);
}

test('SLV0-FALL-35 trace without init catalog → catalog unknown (null), not empty', () => {
  const n = norm('noInit');
  assert.deepEqual(n.catalog, { status: 'unbekannt', skills: null });
  assert.equal(n.tools, null);
  assert.equal(n.plugins, null);
  assert.equal(n.model, null);
  assert.equal(n.status, 'completed');
  assert.equal(pilotView(n).catalog_observed, false);
});

test('SLV0-FALL-35 skill call without successful answer is not confirmed', () => {
  const n = norm('unconfirmed');
  assert.deepEqual(n.activations, [
    { mode: 'skill_tool', skill: 'alpha', tool_use_id: 'tu_a', confirmed: null },
    { mode: 'skill_tool', skill: 'beta', tool_use_id: 'tu_b', confirmed: false },
  ]);
  assert.ok(n.activations.every((a) => a.confirmed !== true));
  assert.equal(n.status, 'incomplete_or_error');
});

test('SLV0-FALL-35 empty trace → no negative selection (absence_is_proven false), incomplete', () => {
  for (const name of ['empty', 'blank', 'failed']) {
    const n = norm(name);
    assert.equal(n.absence_is_proven, false, name);
    assert.equal(n.activation_observability, 'not_established', name);
    assert.deepEqual(n.activations, [], name);
    assert.equal(n.status, 'incomplete_or_error', name);
    assert.equal(n.quality_scored, false, name);
  }
  assert.equal(norm('empty').usage, null);
  assert.equal(norm('empty').catalog.status, 'unbekannt');
});

test('SLV0-FALL-35 thinking text and free model output never reach the output (positive list)', (t) => {
  const dir = tmp(t);
  const r = runEvalCli(['normalize', '--trace', writeJson(dir, 'spur.jsonl', TRACES.full)]);
  assert.equal(r.code, 0, r.stdout);
  for (const forbidden of [SECRET_THOUGHT, FREE_OUTPUT, '/home/jemand', 'service_tier', 'server_tool_use', 'input/plan.md']) {
    assert.ok(!r.stdout.includes(forbidden), `${forbidden} leaked`);
  }
  assert.deepEqual(schemaErrors('eval-normalized-trace', r.json), []);
  assert.deepEqual(r.json.activations, [
    { mode: 'skill_tool', skill: 'alpha', tool_use_id: 'tu_1', confirmed: true },
    { mode: 'file_read', skill: 'beta', tool_use_id: 'tu_2', confirmed: true },
  ]);
  assert.deepEqual(r.json.plugins, [{ name: 'p1', source: 'p1@lokal' }]);
  assert.deepEqual(r.json.usage, { input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 30, cache_creation_input_tokens: 40 });
  assert.equal(r.json.trace_sha256, sha256Hex(Buffer.from(TRACES.full, 'utf8')));
  assert.equal(r.json.client_cost_estimate_usd, 0.0123);
});

test('SLV0-EVAL-08 malformed trace → trace_invalid with line number, exit 1', (t) => {
  const dir = tmp(t);
  for (const [text, line] of [[`${JSON.stringify(INIT)}\n{kaputt\n`, 2], ['[1,2]\n', 1], ['"text"\n', 1]]) {
    const r = runEvalCli(['normalize', '--trace', writeJson(dir, `s${line}.jsonl`, text)]);
    assert.equal(r.code, 1, r.stdout);
    assert.deepEqual(codesOf(r.json), ['trace_invalid']);
    assert.equal(r.json.messages[0].line, line);
  }
  const bad = path.join(dir, 'bad-utf8.jsonl');
  fs.writeFileSync(bad, Buffer.from([0x7b, 0xff, 0x7d, 0x0a]));
  assert.deepEqual(codesOf(runEvalCli(['normalize', '--trace', bad]).json), ['trace_invalid']);
});

test('SLV0-EVAL-08 normalization equals skill_pilot.py normalize_trace on the positive-list fields', NEEDS_PYTHON, () => {
  for (const [name, text] of Object.entries(TRACES)) {
    const py = callPilot('normalize_trace', [text]);
    const js = normalizeTrace(Buffer.from(text, 'utf8'), name);
    const { quality_scored: _q, ...view } = pilotView(js); // eslint-disable-line no-unused-vars
    const { quality_scored: _p, ...expected } = restrictPilotOutput(py); // eslint-disable-line no-unused-vars
    assert.deepEqual(view, expected, name);
  }
});

test('SLV0-EVAL-08 importing every stored skill-pilot-v1 trace under eval-runs/ reproduces its positive-list fields', () => {
  const root = path.join(RESEARCH, 'eval-runs');
  const files = [];
  for (const sub of fs.readdirSync(root)) {
    const d = path.join(root, sub);
    if (!fs.statSync(d).isDirectory()) continue;
    for (const f of fs.readdirSync(d)) if (f.endsWith('.normalized.json')) files.push(path.join(d, f));
  }
  assert.ok(files.length >= 12, `found ${files.length}`);
  for (const f of files) {
    const bytes = fs.readFileSync(f);
    const original = JSON.parse(bytes.toString('utf8'));
    const n = normalizeTrace(bytes, path.basename(f));
    assert.equal(n.source_format, 'skill-pilot-v1');
    assert.equal(n.input_sha256, sha256Hex(bytes));
    assert.deepEqual(pilotView(n), restrictPilotOutput(original), f);
    assert.deepEqual(schemaErrors('eval-normalized-trace', n), [], f);
  }
});
