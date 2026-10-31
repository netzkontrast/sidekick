// Cost balance per context class and turn (SLV0-EVAL-35…38, SLV0-FALL-73…77). Synthetic stream-json only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tmp, writeJson, runEvalCli, RESEARCH } from './eval-helpers.js';
import { normalizeTrace } from '../lib/eval/normalize.js';
import { buildRawRecord } from '../lib/eval/raw.js';
import { buildReport, checkReport } from '../lib/eval/report.js';
import { schemaErrors } from '../lib/eval/common.js';
import { TURN_USAGE_FIELDS } from '../lib/eval/costbalance.js';

const jsonl = (...events) => `${events.map((e) => JSON.stringify(e)).join('\n')}\n`;
const bytes = (s) => Buffer.byteLength(s, 'utf8');
const jbytes = (v) => bytes(JSON.stringify(v));
const usage = (i, cc, cr, o) => ({ input_tokens: i, cache_creation_input_tokens: cc, cache_read_input_tokens: cr, output_tokens: o });
const INIT = { type: 'system', subtype: 'init', model: 'modell-x', skills: ['alpha'], tools: ['Read', 'Skill', 'Bash'] };
const asst = (id, u, ...content) => ({ type: 'assistant', message: { id, role: 'assistant', content, ...(u ? { usage: u } : {}) } });
const user = (...content) => ({ type: 'user', message: { role: 'user', content } });
const result = (u, cost = 0.5) => ({ type: 'result', subtype: 'success', is_error: false, result: 'ENDE-GEHEIM', total_cost_usd: cost, usage: u });

// Distinctive contents: none of them may appear in the normalized output.
const C = {
  think: 'DENKTEXT-GEHEIM-1',
  hello: 'Hallo-GEHEIM-ÄÖ',
  done: 'Fertig-GEHEIM',
  skillResult: 'Launching skill GEHEIM',
  skillBody: '# Alpha\nINHALT-GEHEIM',
  file: 'abc-GEHEIM',
  bash: 'ü-GEHEIM',
  orphan: 'zz-GEHEIM',
  sub: 'UNTERAGENT-GEHEIM',
  subResult: 'qq-GEHEIM',
};
const IMAGE = { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AAAA' } };
const IN = {
  skill: { skill: 'alpha' },
  readSkill: { file_path: '/w/.agents/skills/alpha/SKILL.md' },
  readFile: { file_path: '/w/src/a.js' },
  bash: { command: 'ls' },
};

const FULL = jsonl(
  INIT,
  asst('m1', usage(3, 100, 0, 1), { type: 'thinking', thinking: C.think }),
  asst('m1', usage(3, 100, 0, 10), { type: 'text', text: C.hello }, { type: 'tool_use', id: 'tu_s', name: 'Skill', input: IN.skill }),
  user({ type: 'tool_result', tool_use_id: 'tu_s', content: C.skillResult }),
  asst('m2', usage(5, 50, 100, 20),
    { type: 'tool_use', id: 'tu_r1', name: 'Read', input: IN.readSkill },
    { type: 'tool_use', id: 'tu_r2', name: 'Read', input: IN.readFile },
    { type: 'tool_use', id: 'tu_b', name: 'Bash', input: IN.bash }),
  user(
    { type: 'tool_result', tool_use_id: 'tu_r1', content: [{ type: 'text', text: C.skillBody }] },
    { type: 'tool_result', tool_use_id: 'tu_r2', content: C.file },
    { type: 'tool_result', tool_use_id: 'tu_b', content: C.bash },
    { type: 'tool_result', tool_use_id: 'tu_x', content: C.orphan },
    IMAGE,
  ),
  { ...asst('s1', usage(2, 20, 50, 10), { type: 'text', text: C.sub }), parent_tool_use_id: 'tu_b' },
  { ...user({ type: 'tool_result', tool_use_id: 'tu_q', content: C.subResult }), parent_tool_use_id: 'tu_b' },
  asst('m3', usage(7, 0, 150, 30), { type: 'text', text: C.done }),
  result(usage(15, 150, 300, 70), 0.42),
);

function classMap(cb) {
  return Object.fromEntries(cb.classes.map((c) => [c.class, [c.blocks, c.bytes, c.bytes_x_later_turns]]));
}

test('SLV0-FALL-73 turns, per-class bytes and bytes × later turns of a synthetic trace; no content leaves', (t) => {
  const n = normalizeTrace(Buffer.from(FULL, 'utf8'), 'voll');
  assert.deepEqual(schemaErrors('eval-normalized-trace', n), []);
  const cb = n.cost_balance;
  // Three main turns; m1 split over two events → usage of the last one; the subagent is no turn.
  assert.deepEqual(cb.turns, [
    { turn: 1, usage: { input_tokens: 3, output_tokens: 10, cache_read_input_tokens: 0, cache_creation_input_tokens: 100 } },
    { turn: 2, usage: { input_tokens: 5, output_tokens: 20, cache_read_input_tokens: 100, cache_creation_input_tokens: 50 } },
    { turn: 3, usage: { input_tokens: 7, output_tokens: 30, cache_read_input_tokens: 150, cache_creation_input_tokens: 0 } },
  ]);
  assert.deepEqual(cb.turn_usage_sum, { input_tokens: 15, output_tokens: 60, cache_read_input_tokens: 250, cache_creation_input_tokens: 150 });
  assert.deepEqual(cb.usage_remainder, { input_tokens: 0, output_tokens: 10, cache_read_input_tokens: 50, cache_creation_input_tokens: 0 });
  // Later turns: turn-1 blocks and the first user result 2, turn-2 blocks and results 1, turn 3 and subagent 0.
  const toolUse = jbytes(IN.skill) * 2 + jbytes(IN.readSkill) + jbytes(IN.readFile) + jbytes(IN.bash);
  assert.deepEqual(classMap(cb), {
    assistant_denken: [1, bytes(C.think), bytes(C.think) * 2],
    assistant_text: [2, bytes(C.hello) + bytes(C.done), bytes(C.hello) * 2],
    assistant_werkzeugaufruf: [4, jbytes(IN.skill) + jbytes(IN.readSkill) + jbytes(IN.readFile) + jbytes(IN.bash), toolUse],
    datei_lesen: [1, bytes(C.file), bytes(C.file)],
    nicht_zuordenbar: [2, bytes(C.orphan) + jbytes(IMAGE), bytes(C.orphan) + jbytes(IMAGE)],
    skill_laden: [2, bytes(C.skillResult) + bytes(C.skillBody), bytes(C.skillResult) * 2 + bytes(C.skillBody)],
    'tool_ergebnis:Bash': [1, bytes(C.bash), bytes(C.bash)],
    unteragent: [2, bytes(C.sub) + bytes(C.subResult), 0],
  });
  // Hand-checked literals for two classes (UTF-8: Ä, Ö and ü are two bytes each).
  assert.equal(bytes(C.hello), 17);
  assert.deepEqual(classMap(cb)['tool_ergebnis:Bash'], [1, 9, 9]);
  assert.deepEqual(classMap(cb).assistant_werkzeugaufruf, [4, 108, 125]);
  // No content in the output, also not via the CLI.
  const dir = tmp(t);
  const r = runEvalCli(['normalize', '--trace', writeJson(dir, 'spur.jsonl', FULL)]);
  assert.equal(r.code, 0, r.stdout);
  assert.deepEqual(r.json.cost_balance, cb);
  for (const s of [...Object.values(C), 'ENDE-GEHEIM', '/w/src']) assert.ok(!r.stdout.includes(s), `${s} leaked`);
});

test('SLV0-FALL-73 invariant: class sums equal the totals; turn sum + remainder equals the run usage', () => {
  const n = normalizeTrace(Buffer.from(FULL, 'utf8'), 'voll');
  const cb = n.cost_balance;
  assert.equal(cb.classes.reduce((a, c) => a + c.bytes, 0), cb.bytes_total);
  assert.equal(cb.classes.reduce((a, c) => a + c.bytes_x_later_turns, 0), cb.bytes_x_later_turns_total);
  // The total is every block of every user/assistant event, measured independently here.
  const ev = FULL.trim().split('\n').map((l) => JSON.parse(l)).filter((e) => e.type === 'user' || e.type === 'assistant');
  const payload = (b) => {
    if (b.type === 'text') return bytes(b.text);
    if (b.type === 'thinking') return bytes(b.thinking);
    if (b.type === 'tool_use') return jbytes(b.input);
    if (b.type === 'tool_result') return Array.isArray(b.content) ? b.content.reduce((a, x) => a + bytes(x.text), 0) : bytes(b.content);
    return jbytes(b);
  };
  assert.equal(cb.bytes_total, ev.flatMap((e) => e.message.content).reduce((a, b) => a + payload(b), 0));
  for (const f of TURN_USAGE_FIELDS) assert.equal(cb.turn_usage_sum[f] + cb.usage_remainder[f], n.usage[f], f);
  // The raw record carries the same balance under German field names; the caller cannot supply it.
  const rec = buildRawRecord(meta({}), n);
  assert.equal(rec.kostenbilanz.bytes_gesamt, cb.bytes_total);
  assert.equal(rec.kostenbilanz.klassen.reduce((a, k) => a + k.bytes_mal_folgeturns, 0), rec.kostenbilanz.bytes_mal_folgeturns_gesamt);
  assert.throws(() => buildRawRecord(meta({ kostenbilanz: null }), n), /abgeleitet/);
});

test('SLV0-FALL-74 missing usage stays unknown (null), never 0; pilot import has no balance', () => {
  const noTurnUsage = normalizeTrace(Buffer.from(jsonl(INIT,
    asst('m1', usage(1, 2, 3, 4), { type: 'text', text: 'a' }),
    asst('m2', null, { type: 'text', text: 'b' }),
    result(usage(1, 2, 3, 4)))), 'ohne-usage');
  assert.deepEqual(noTurnUsage.cost_balance.turns[1].usage, { input_tokens: null, output_tokens: null, cache_read_input_tokens: null, cache_creation_input_tokens: null });
  assert.ok(TURN_USAGE_FIELDS.every((f) => noTurnUsage.cost_balance.turn_usage_sum[f] === null && noTurnUsage.cost_balance.usage_remainder[f] === null));

  const noResult = normalizeTrace(Buffer.from(jsonl(INIT, asst('m1', usage(1, 2, 3, 4), { type: 'text', text: 'a' }))), 'ohne-result');
  assert.equal(noResult.cost_balance.turn_usage_sum.input_tokens, 1);
  assert.ok(TURN_USAGE_FIELDS.every((f) => noResult.cost_balance.usage_remainder[f] === null));

  const empty = normalizeTrace(Buffer.from(''), 'leer').cost_balance;
  assert.deepEqual(empty.turns, []);
  assert.ok(TURN_USAGE_FIELDS.every((f) => empty.turn_usage_sum[f] === null));
  assert.deepEqual([empty.classes, empty.bytes_total, empty.bytes_x_later_turns_total], [[], 0, 0]);

  const pilot = normalizeTrace(fs.readFileSync(path.join(RESEARCH, 'eval-runs', 'e1', 'RW-01.normalized.json')), 'RW-01');
  assert.equal(pilot.cost_balance, null);

  // In the report the unknown turn usage is `unbekannt`, never 0.
  const rep = buildReport([buildRawRecord(meta({}), noTurnUsage)]);
  const b1 = rep.ebenen.M3.kostenbilanz.je_variante[0];
  assert.equal(b1.usage_turns.input_tokens.quelle, 'unbekannt');
  assert.equal(b1.usage_turns.input_tokens.wert, null);
  assert.equal(b1.usage_rest.input_tokens.wert, null);
  assert.match(b1.usage_rest.input_tokens.beleg, /unbekannt/);
  assert.equal(b1.turns.wert, 2); // the turns themselves are known
});

// ---- Report -------------------------------------------------------------------------------

function meta(over) {
  return {
    run_id: 'RUN-1', case_id: 'C-1', family_id: 'F-1', repeat_id: 1, attempt_id: 1, split: 'dev', ebene: 'M3', variante: 'B1',
    skills: [{ name: 'alpha', sha256: 'b'.repeat(64) }],
    client: { name: 'claude', version: null, flags: [] },
    eval_version: 'test@1', rubrik_version: null, fall_hash: 'a'.repeat(64),
    eingabe_ref: null, ausgabe_ref: null, spur_ref: null,
    assertions: [{ id: 'A-1', art: 'deterministisch', bewerter: 'spur-regel@1', ergebnis: 'bestanden', r_regel: null }],
    latenz_ms: null, fehler: null,
    ...over,
  };
}

/** Synthetic run: optional skill load (one turn), then `turns` turns each reading `fileBytes` bytes. */
function simpleTrace({ turns, fileBytes, skillBytes = 0, cost = 0.5 }) {
  const ev = [INIT];
  const tot = usage(0, 0, 0, 0);
  const add = (u) => { for (const f of TURN_USAGE_FIELDS) tot[f] += u[f]; return u; };
  if (skillBytes > 0) {
    ev.push(asst('s0', add(usage(1, 500, 0, 5)), { type: 'tool_use', id: 'tu_s', name: 'Skill', input: { skill: 'alpha' } }));
    ev.push(user({ type: 'tool_result', tool_use_id: 'tu_s', content: 's'.repeat(skillBytes) }));
  }
  for (let k = 1; k <= turns; k += 1) {
    ev.push(asst(`m${k}`, add(usage(1, 10, 100 * k, 5)), { type: 'tool_use', id: `tu_${k}`, name: 'Read', input: { file_path: '/w/f.txt' } }));
    ev.push(user({ type: 'tool_result', tool_use_id: `tu_${k}`, content: 'x'.repeat(fileBytes) }));
  }
  ev.push(result(tot, cost));
  return normalizeTrace(Buffer.from(jsonl(...ev), 'utf8'), 'einfach');
}

function rec(runId, caseId, variante, trace, over = {}) {
  return buildRawRecord(meta({ run_id: runId, case_id: caseId, variante, skills: variante === 'B0' ? [] : meta({}).skills, ...over }), trace);
}

function pairRecords() {
  return [
    rec('B0-1', 'C-1', 'B0', simpleTrace({ turns: 2, fileBytes: 40, cost: 0.1 })),
    rec('B0-2', 'C-2', 'B0', simpleTrace({ turns: 3, fileBytes: 40, cost: 0.2 })),
    rec('B1-1', 'C-1', 'B1', simpleTrace({ turns: 3, fileBytes: 40, skillBytes: 400, cost: 0.25 })),
    rec('B1-2', 'C-2', 'B1', simpleTrace({ turns: 4, fileBytes: 40, skillBytes: 400, cost: 0.5 })),
    rec('B1-3', 'C-3', 'B1', simpleTrace({ turns: 9, fileBytes: 999, skillBytes: 400, cost: 2 })),
    rec('K-1', 'C-1', 'K-X', simpleTrace({ turns: 2, fileBytes: 40, skillBytes: 100, cost: 0.125 })),
    rec('K-2', 'C-2', 'K-X', simpleTrace({ turns: 2, fileBytes: 40, skillBytes: 100, cost: 0.125 })),
  ];
}

const sumOver = (rs, fn) => rs.reduce((a, r) => a + fn(r.kostenbilanz), 0);
const klasse = (kb, name, field) => kb.klassen.find((k) => k.klasse === name)?.[field] ?? 0;

test('SLV0-FALL-75 differences B1 − B0 and K − B1 only over shared cases, with both values and raw IDs', (t) => {
  const recs = pairRecords();
  const rep = buildReport(recs);
  assert.deepEqual(schemaErrors('eval-report', rep), []);
  assert.deepEqual(checkReport(rep, recs.map((r) => r.run_id)), { schema_errors: [], messages: [] });
  const kb = rep.ebenen.M3.kostenbilanz;
  assert.deepEqual(kb.je_variante.map((v) => [v.variante, v.laeufe_mit_bilanz.zaehler, v.laeufe_mit_bilanz.nenner, v.turns.wert]),
    [['B0', 2, 2, 5], ['B1', 3, 3, 3 + 1 + 4 + 1 + 9 + 1], ['K-X', 2, 2, 6]]);
  assert.deepEqual(kb.differenzen.map((d) => [d.minuend, d.subtrahend, d.case_ids]), [['B1', 'B0', ['C-1', 'C-2']], ['K-X', 'B1', ['C-1', 'C-2']]]);
  const [b1b0, kb1] = kb.differenzen;
  // C-3 (only B1) is not part of either difference.
  assert.deepEqual([b1b0.minuend_ids, b1b0.subtrahend_ids], [['B1-1', 'B1-2'], ['B0-1', 'B0-2']]);
  assert.deepEqual(kb1.subtrahend_ids, ['B1-1', 'B1-2']);
  assert.deepEqual(b1b0.turns.rohdatensatz_ids, ['B0-1', 'B0-2', 'B1-1', 'B1-2']);
  const b0 = recs.filter((r) => r.variante === 'B0');
  const b1 = recs.filter((r) => ['B1-1', 'B1-2'].includes(r.run_id));
  assert.deepEqual([b1b0.turns.minuend_wert, b1b0.turns.subtrahend_wert, b1b0.turns.wert], [9, 5, 4]);
  // skill_laden exists only in B1: B0 side is 0 (balance known), not unknown.
  const skill = b1b0.klassen.find((k) => k.klasse === 'skill_laden');
  assert.deepEqual([skill.bytes.minuend_wert, skill.bytes.subtrahend_wert, skill.bytes.wert], [800, 0, 800]);
  // bytes × later turns: the skill result is followed by all reading turns (3 resp. 4).
  assert.equal(skill.bytes_mal_folgeturns.wert, 400 * 3 + 400 * 4);
  const lesen = b1b0.klassen.find((k) => k.klasse === 'datei_lesen');
  assert.equal(lesen.bytes_mal_folgeturns.wert, sumOver(b1, (x) => klasse(x, 'datei_lesen', 'bytes_mal_folgeturns')) - sumOver(b0, (x) => klasse(x, 'datei_lesen', 'bytes_mal_folgeturns')));
  // Per-class differences add up to the total difference (invariant carried into the report).
  assert.equal(b1b0.klassen.reduce((a, k) => a + k.bytes.wert, 0), b1b0.bytes_gesamt.wert);
  assert.equal(b1b0.klassen.reduce((a, k) => a + k.bytes_mal_folgeturns.wert, 0), b1b0.bytes_mal_folgeturns_gesamt.wert);
  // Reported turn usage: B1 − B0 with the same method.
  const cr = b1b0.usage_turns.cache_read_input_tokens;
  assert.equal(cr.wert, sumOver(b1, (x) => x.usage_summe_turns.cache_read_input_tokens) - sumOver(b0, (x) => x.usage_summe_turns.cache_read_input_tokens));
  assert.match(cr.beleg, /gemeldet, client-usage@modell-x/);
  assert.equal(b1b0.kosten_usd.wert, (0.25 + 0.5) - (0.1 + 0.2)); // sums in run_id order, then the difference
  // Without estimator class tokens are unknown; with it they are estimated from the class bytes.
  const b1v = kb.je_variante.find((v) => v.variante === 'B1');
  assert.ok(b1v.klassen.every((k) => k.tokens.quelle === 'unbekannt' && k.tokens.wert === null));
  const est = buildReport(recs, { estimator: 'utf8-bytes-div-4@1' }).ebenen.M3.kostenbilanz.je_variante.find((v) => v.variante === 'B1');
  const sk = est.klassen.find((k) => k.klasse === 'skill_laden');
  assert.deepEqual([sk.tokens.quelle, sk.tokens.methode, sk.tokens.wert], ['geschaetzt', 'utf8-bytes-div-4@1', Math.ceil(1200 / 4)]);
  // CLI: --estimator, report --check, unknown estimator is a usage error.
  const dir = tmp(t);
  const rawDir = path.join(dir, 'raw');
  fs.mkdirSync(rawDir);
  for (const r of recs) writeJson(rawDir, `${r.run_id}.json`, r);
  const cli = runEvalCli(['report', rawDir, '--estimator', 'utf8-bytes-div-4@1']);
  assert.equal(cli.code, 0, cli.stdout);
  assert.equal(runEvalCli(['report', '--check', writeJson(dir, 'b.json', cli.json), rawDir]).code, 0);
  assert.equal(runEvalCli(['report', rawDir, '--estimator', 'tiktoken']).code, 2);
});

test('SLV0-FALL-75 a raw record without kostenbilanz (older format) makes its population unknown, not 0', () => {
  const recs = pairRecords();
  const old = structuredClone(recs.find((r) => r.run_id === 'B0-1'));
  delete old.kostenbilanz;
  assert.deepEqual(schemaErrors('eval-raw-record', old), []);
  const rep = buildReport([old, ...recs.filter((r) => r.run_id !== 'B0-1')]);
  assert.deepEqual(schemaErrors('eval-report', rep), []);
  const kb = rep.ebenen.M3.kostenbilanz;
  const b0 = kb.je_variante.find((v) => v.variante === 'B0');
  assert.deepEqual([b0.laeufe_mit_bilanz.zaehler, b0.laeufe_mit_bilanz.nenner], [1, 2]);
  for (const v of [b0.turns, b0.bytes_gesamt, b0.bytes_mal_folgeturns_gesamt, b0.usage_rest.output_tokens, ...b0.klassen.map((k) => k.bytes)]) {
    assert.equal(v.wert, null);
    assert.match(v.beleg, /ohne Kostenbilanz: B0-1/);
  }
  assert.equal(b0.usage_turns.output_tokens.quelle, 'unbekannt');
  const d = kb.differenzen.find((x) => x.subtrahend === 'B0');
  assert.deepEqual([d.turns.wert, d.turns.minuend_wert, d.turns.subtrahend_wert], [null, 9, null]);
  assert.ok(d.klassen.every((k) => k.bytes.wert === null));
  assert.equal(d.usage_turns.output_tokens.wert, null);
  // Cost still comes from the run usage (SLV0-TOK-08) and stays known.
  assert.equal(typeof d.kosten_usd.wert, 'number');
});

test('SLV0-FALL-76 cost per satisfied criterion: known, missing cost, nothing satisfied', () => {
  const tr = (cost) => simpleTrace({ turns: 1, fileBytes: 1, cost });
  const a = (id, ergebnis, art = 'deterministisch', r = null) => ({ id, art, bewerter: 'x@1', ergebnis, r_regel: r });
  const r1 = rec('R-1', 'C-1', 'B1', tr(0.25), { assertions: [a('A-1', 'bestanden'), a('A-2', 'bestanden', 'rubrik'), a('A-3', 'nicht_bestanden'), a('A-R', 'bestanden', 'rubrik', 'R-01')] });
  const r2 = rec('R-2', 'C-2', 'B1', tr(0.5), { assertions: [a('A-1', 'bestanden')] });
  const k = buildReport([r1, r2]).ebenen.M3.kostenbilanz.je_variante[0].kosten_je_erfuelltem_kriterium;
  assert.deepEqual([k.wert, k.quelle, k.kosten_usd.wert, k.erfuellte_kriterien.zaehler, k.erfuellte_kriterien.nenner], [0.25, 'berechnet', 0.75, 3, 4]);
  assert.deepEqual(k.rohdatensatz_ids, ['R-1', 'R-2']);

  const noCost = structuredClone(r2);
  noCost.usage.kosten_client_schaetzung = { wert: null, quelle: 'unbekannt', beleg: 'Spur ohne total_cost_usd' };
  const k2 = buildReport([r1, noCost]).ebenen.M3.kostenbilanz.je_variante[0].kosten_je_erfuelltem_kriterium;
  assert.deepEqual([k2.wert, k2.quelle, k2.kosten_usd.wert], [null, 'unbekannt', null]);
  assert.match(k2.beleg, /ohne Kostenschätzung: R-2/);

  const none = rec('R-3', 'C-3', 'B1', tr(0.5), { assertions: [a('A-1', 'nicht_bestanden'), a('A-R', 'bestanden', 'rubrik', 'R-01')] });
  const k3 = buildReport([none]).ebenen.M3.kostenbilanz.je_variante[0].kosten_je_erfuelltem_kriterium;
  assert.deepEqual([k3.wert, k3.quelle, k3.kosten_usd.wert, k3.erfuellte_kriterien.zaehler, k3.erfuellte_kriterien.nenner], [null, 'unbekannt', 0.5, 0, 1]);
  assert.match(k3.beleg, /kein erfülltes Kriterium/);
});

test('SLV0-FALL-77 stored M4 pilot traces (skill-pilot-v1) stay valid; balance unknown, run cost difference known', () => {
  const dir = path.join(RESEARCH, 'eval-runs', 'm4');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.normalized.json')).sort();
  assert.equal(files.length, 12);
  const recs = files.map((f) => {
    const [, task, variante, rep] = /^M4-(T\d)-(B[01])-r(\d)\.normalized\.json$/.exec(f);
    const n = normalizeTrace(fs.readFileSync(path.join(dir, f)), f);
    assert.equal(n.cost_balance, null);
    const r = rec(f.replace('.normalized.json', ''), `M4-${task}`, variante, n, { repeat_id: Number(rep), ebene: 'M4', skills: [] });
    assert.deepEqual(schemaErrors('eval-raw-record', r), []);
    assert.equal(r.kostenbilanz, null);
    return r;
  });
  const rep = buildReport(recs);
  assert.deepEqual(schemaErrors('eval-report', rep), []);
  const kb = rep.ebenen.M4.kostenbilanz;
  for (const v of kb.je_variante) {
    assert.deepEqual([v.laeufe_mit_bilanz.zaehler, v.turns.wert, v.usage_turns.cache_read_input_tokens.quelle], [0, null, 'unbekannt']);
  }
  // Run usage stays reported; the client cost difference is known (0.84 vs 0.36 USD in the M4 result).
  assert.equal(rep.ebenen.M4.usage[0].cache_read_input_tokens.quelle, 'gemeldet');
  const d = kb.differenzen[0];
  assert.deepEqual([d.minuend, d.subtrahend, d.case_ids], ['B1', 'B0', ['M4-T1', 'M4-T2', 'M4-T3']]);
  assert.deepEqual([Math.round(d.kosten_usd.minuend_wert * 100) / 100, Math.round(d.kosten_usd.subtrahend_wert * 100) / 100], [0.84, 0.36]);
  assert.equal(d.turns.wert, null);
});
