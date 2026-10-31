// USD cap in the ledger (SLV0-EVAL-43/-44, SLV0-FALL-86…89) and paired comparison in the report
// (SLV0-EVAL-45/-46, SLV0-FALL-90…95).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tmp, writeJson, runEvalCli, codesOf, RESEARCH } from './eval-helpers.js';
import { initLedger, reserveStart, recordResult, readLedger, summarize } from '../lib/eval/ledger.js';
import { normalizeTrace } from '../lib/eval/normalize.js';
import { buildRawRecord } from '../lib/eval/raw.js';
import { buildReport, checkReport } from '../lib/eval/report.js';
import { mcnemarExact, mulberry32 } from '../lib/eval/paired.js';
import { schemaErrors } from '../lib/eval/common.js';

// ---------- Ledger ----------

function cappedLedger(t) {
  const file = path.join(tmp(t), 'ledger.jsonl');
  const r = runEvalCli(['ledger', 'init', '--ledger', file, '--limit', '10', '--budget-usd', '1.00', '--reserve-usd', '0.20']);
  assert.equal(r.code, 0, r.stdout);
  return file;
}

test('SLV0-FALL-86 USD cap: third reservation over cap minus reserve → budget_usd_exhausted, ledger unchanged', (t) => {
  const file = cappedLedger(t);
  for (const id of ['T-1', 'T-2']) {
    const r = runEvalCli(['ledger', 'reserve', '--ledger', file, '--trial-id', id, '--projected-usd', '0.30']);
    assert.equal(r.code, 0, r.stdout);
    assert.equal(r.json.reservation.projected_usd, 0.3);
  }
  const before = fs.readFileSync(file);
  const r = runEvalCli(['ledger', 'reserve', '--ledger', file, '--trial-id', 'T-3', '--projected-usd', '0.30']);
  assert.equal(r.code, 1, r.stdout);
  assert.deepEqual(codesOf(r.json), ['budget_usd_exhausted']);
  assert.equal(r.json.messages[0].rule, 'SLV0-EVAL-43');
  assert.deepEqual(fs.readFileSync(file), before);
  assert.equal(fs.existsSync(`${file}.lock`), false);
  for (const e of readLedger(file)) assert.deepEqual(schemaErrors('eval-ledger', e), []);
});

test('SLV0-FALL-87 known cost frees the projection, unknown cost stays bound; status shows the balance', (t) => {
  const file = cappedLedger(t);
  reserveStart(file, 'T-1', { projectedUsd: '0.30' });
  reserveStart(file, 'T-2', { projectedUsd: '0.30' });
  assert.equal(runEvalCli(['ledger', 'result', '--ledger', file, '--attempt-id', '1', '--outcome', 'completed', '--cost-usd', '0.05']).code, 0);
  recordResult(file, { attemptId: 2, outcome: 'client_error' });
  const r = runEvalCli(['ledger', 'reserve', '--ledger', file, '--trial-id', 'T-3', '--projected-usd', '0.40']);
  assert.equal(r.code, 0, r.stdout);
  const k = runEvalCli(['ledger', 'status', '--ledger', file]).json.summary.kostendeckel;
  assert.deepEqual(k, {
    budget_usd: 1, reserve_usd: 0.2, bekannt_usd: 0.05, gebunden_usd: 0.75, verfuegbar_usd: 0.05, reservierungen_ohne_bekannte_kosten: 2,
  });
  const results = readLedger(file).filter((e) => e.kind === 'result');
  assert.deepEqual(results.map((e) => e.cost_usd), [0.05, null]);
  for (const e of readLedger(file)) assert.deepEqual(schemaErrors('eval-ledger', e), []);
});

test('SLV0-FALL-88 operator errors around the cap exit 2 and write nothing', (t) => {
  const dir = tmp(t);
  const plain = path.join(dir, 'plain.jsonl');
  initLedger(plain, { limit: 3 });
  const capped = cappedLedger(t);
  const snap = () => [fs.readFileSync(plain), fs.readFileSync(capped)];
  const before = snap();
  const cases = [
    ['ledger', 'reserve', '--ledger', plain, '--trial-id', 'T-1', '--projected-usd', '0.1'],
    ['ledger', 'reserve', '--ledger', capped, '--trial-id', 'T-1'],
    ['ledger', 'init', '--ledger', path.join(dir, 'a.jsonl'), '--limit', '2', '--reserve-usd', '0.1'],
    ['ledger', 'init', '--ledger', path.join(dir, 'b.jsonl'), '--limit', '2', '--budget-usd', '0.5', '--reserve-usd', '0.5'],
    ['ledger', 'reserve', '--ledger', capped, '--trial-id', 'T-1', '--projected-usd', '-0.1'],
    ['ledger', 'init', '--ledger', path.join(dir, 'c.jsonl'), '--limit', '2', '--budget-usd', '0'],
    ['ledger', 'reserve', '--ledger', capped, '--trial-id', 'T-1', '--projected-usd', '0.1234567'],
  ];
  for (const args of cases) assert.equal(runEvalCli(args).code, 2, args.join(' '));
  assert.deepEqual(snap(), before);
  for (const f of ['a.jsonl', 'b.jsonl', 'c.jsonl']) assert.equal(fs.existsSync(path.join(dir, f)), false);
});

test('SLV0-FALL-89 ledger without cap records a given cost and shows no cap', (t) => {
  const file = path.join(tmp(t), 'ledger.jsonl');
  initLedger(file, { limit: 2 });
  reserveStart(file, 'T-1');
  recordResult(file, { attemptId: 1, outcome: 'completed', costUsd: '0.1' });
  reserveStart(file, 'T-2');
  recordResult(file, { attemptId: 2, outcome: 'completed' });
  const results = readLedger(file).filter((e) => e.kind === 'result');
  assert.equal(results[0].cost_usd, 0.1);
  assert.equal(Object.hasOwn(results[1], 'cost_usd'), false, 'no cap, no cost given: field stays absent as before');
  assert.equal(summarize(readLedger(file)).kostendeckel, null);
  for (const e of readLedger(file)) assert.deepEqual(schemaErrors('eval-ledger', e), []);
});

// ---------- Paired comparison ----------

const NORMALIZED = normalizeTrace(fs.readFileSync(path.join(RESEARCH, 'eval-runs', 'e1', 'RW-01.normalized.json')), 'RW-01');

function rec({ run, caseId, family, variante, repeat = 1, results }) {
  return buildRawRecord({
    run_id: run, case_id: caseId, family_id: family, repeat_id: repeat, attempt_id: 1, split: 'dev', ebene: 'M1', variante,
    skills: variante === 'B0' ? [] : [{ name: 'resuming-work', sha256: 'b'.repeat(64) }],
    client: { name: 'claude', version: '2.1.316', flags: ['-p'] },
    eval_version: 'sl1-design@2026-10-30', rubrik_version: null, fall_hash: 'a'.repeat(64),
    eingabe_ref: `fixtures/${caseId}`, ausgabe_ref: null, spur_ref: 'eval-runs/e1/RW-01.normalized.json',
    assertions: results.map((e, i) => ({ id: `A-${i + 1}`, art: 'deterministisch', bewerter: 'spur-regel@1', ergebnis: e, r_regel: null })),
    latenz_ms: null, fehler: null,
  }, NORMALIZED);
}

const P = 'bestanden';
const F = 'nicht_bestanden';

/** Pairs per case: [B1 result, B0 result]. */
function records(spec) {
  const out = [];
  spec.forEach(([caseId, family, b1, b0]) => {
    out.push(rec({ run: `${caseId}-B1`, caseId, family, variante: 'B1', results: b1 }));
    if (b0 !== null) out.push(rec({ run: `${caseId}-B0`, caseId, family, variante: 'B0', results: b0 }));
  });
  return out;
}

test('SLV0-FALL-90 four pairs a=1 b=0 c=3 d=0 → table and exact McNemar p = 0.25', () => {
  const rs = records([['f1', 'fa', [P], [P]], ['f2', 'fa', [F], [P]], ['f3', 'fb', [F, P], [P]], ['f4', 'fb', [F], [P, P]]]);
  const report = buildReport(rs);
  assert.deepEqual(schemaErrors('eval-report', report), []);
  assert.deepEqual(checkReport(report, rs.map((r) => r.run_id)).messages, []);
  const [g] = report.ebenen.M1.gepaart;
  assert.equal(g.minuend, 'B1');
  assert.equal(g.subtrahend, 'B0');
  assert.equal(g.paare.anzahl, 4);
  assert.equal(g.auswertbar.zaehler, 4);
  assert.deepEqual([g.beide_bestanden.zaehler, g.nur_minuend_bestanden.zaehler, g.nur_subtrahend_bestanden.zaehler, g.beide_nicht_bestanden.zaehler], [1, 0, 3, 0]);
  assert.equal(g.mcnemar_p.wert, 0.25);
  assert.equal(g.differenz_anteil.wert, -0.75);
  assert.equal(g.familien.anzahl, 2);
});

test('SLV0-FALL-91 run without assertions makes the pair unclear; run without partner forms no pair', () => {
  const rs = [...records([['f1', 'fa', [P], [F]], ['f2', 'fb', [], [P]]]), rec({ run: 'f9-B0', caseId: 'f9', family: 'fc', variante: 'B0', results: [P] })];
  const [g] = buildReport(rs).ebenen.M1.gepaart;
  assert.equal(g.paare.anzahl, 2);
  assert.equal(g.auswertbar.zaehler, 1);
  assert.equal(g.unklar.zaehler, 1);
  assert.equal(g.paare.rohdatensatz_ids.includes('f9-B0'), false);
});

test('SLV0-FALL-92 no discordant pairs → p = 1; exact values for small tables', () => {
  const rs = records([['f1', 'fa', [P], [P]], ['f2', 'fb', [F], [F]]]);
  assert.equal(buildReport(rs).ebenen.M1.gepaart[0].mcnemar_p.wert, 1);
  assert.equal(mcnemarExact(0, 0), 1);
  assert.equal(mcnemarExact(0, 3), 0.25);
  assert.equal(mcnemarExact(1, 9), 0.021484375);
  assert.equal(mcnemarExact(5, 5), 1);
  assert.ok(mcnemarExact(0, 2000) < 1e-12);
});

test('SLV0-FALL-93 bootstrap over families is reproducible per seed and bounded', () => {
  const rs = records([
    ['f1', 'fa', [P], [F]], ['f2', 'fa', [P], [P]], ['f3', 'fb', [F], [F]],
    ['f4', 'fb', [P], [F]], ['f5', 'fc', [P], [P]], ['f6', 'fc', [F], [P]],
  ]);
  const ci = (opts) => buildReport(rs, { paired: opts }).ebenen.M1.gepaart[0].intervall_95;
  const a = ci({ seed: 7 });
  const b = ci({ seed: 7 });
  const c = ci({ seed: 8, draws: 500 });
  assert.deepEqual(a, b);
  assert.equal(a.seed, 7);
  assert.equal(a.ziehungen, 2000);
  assert.equal(c.ziehungen, 500);
  for (const x of [a, c]) {
    assert.ok(x.untere.wert >= -1 && x.untere.wert <= x.obere.wert && x.obere.wert <= 1, JSON.stringify(x));
    assert.equal(x.untere.beleg, null);
  }
  // Default seed is fixed, so two default reports are identical.
  assert.deepEqual(buildReport(rs), buildReport(rs));
  // The generator itself is fixed: first values of mulberry32 for seed 1 (the published reference value is 0.6270739405881613).
  const g = mulberry32(1);
  assert.deepEqual([g(), g(), g()], [0.6270739405881613, 0.002735721180215478, 0.5274470399599522]);
});

test('SLV0-FALL-94 pairs from a single family → interval null with reason', () => {
  const rs = records([['f1', 'fa', [P], [F]], ['f2', 'fa', [F], [P]]]);
  const g = buildReport(rs).ebenen.M1.gepaart[0];
  assert.equal(g.intervall_95.untere.wert, null);
  assert.equal(g.intervall_95.obere.beleg, 'weniger als 2 Familien');
  assert.deepEqual(schemaErrors('eval-report', buildReport(rs)), []);
});

test('SLV0-FALL-95 invalid --seed and --bootstrap are operator errors (exit 2)', (t) => {
  const dir = tmp(t);
  const rs = records([['f1', 'fa', [P], [F]]]);
  for (const r of rs) writeJson(dir, `${r.run_id}.json`, r);
  for (const extra of [['--seed', '-1'], ['--bootstrap', '50'], ['--bootstrap', 'abc'], ['--bootstrap', '100001']]) {
    assert.equal(runEvalCli(['report', dir, ...extra]).code, 2, extra.join(' '));
  }
  const ok = runEvalCli(['report', dir, '--seed', '3', '--bootstrap', '100']);
  assert.equal(ok.code, 0, ok.stdout);
  assert.equal(ok.json.ebenen.M1.gepaart[0].intervall_95.seed, 3);
});
