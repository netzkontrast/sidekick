// Raw records (SLV0-EVAL-09) and reports only from raw data (SLV0-EVAL-10/-11, SLV0-FALL-36/-37).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tmp, writeJson, runEvalCli, codesOf, RESEARCH } from './eval-helpers.js';
import { normalizeTrace } from '../lib/eval/normalize.js';
import { buildRawRecord } from '../lib/eval/raw.js';
import { buildReport, checkReport, FORBIDDEN_KEYS } from '../lib/eval/report.js';
import { schemaErrors } from '../lib/eval/common.js';

const E1 = path.join(RESEARCH, 'eval-runs', 'e1');
const FALL_HASH = 'a'.repeat(64);

function meta(over = {}) {
  return {
    run_id: 'RUN-1', case_id: 'F-01', family_id: 'fam-a', repeat_id: 1, attempt_id: 1, split: 'dev', ebene: 'M3', variante: 'B1',
    skills: [{ name: 'resuming-work', sha256: 'b'.repeat(64) }],
    client: { name: 'claude', version: '2.1.314', flags: ['-p', '--output-format', 'stream-json'] },
    eval_version: 'sl1-design@2026-10-30', rubrik_version: null, fall_hash: FALL_HASH,
    eingabe_ref: 'fixtures/f-01', ausgabe_ref: null, spur_ref: 'eval-runs/e1/RW-01.normalized.json',
    assertions: [
      { id: 'A-1', art: 'deterministisch', bewerter: 'spur-regel@1', ergebnis: 'bestanden', r_regel: null },
      { id: 'A-2', art: 'rubrik', bewerter: 'bewerter-session@1', ergebnis: 'bestanden', r_regel: null },
    ],
    latenz_ms: null, fehler: null,
    ...over,
  };
}

const NORMALIZED = normalizeTrace(fs.readFileSync(path.join(E1, 'RW-01.normalized.json')), 'RW-01');

test('SLV0-EVAL-09 raw record from a stored E1 trace: observed facts from the trace, usage only per run', () => {
  const rec = buildRawRecord(meta(), NORMALIZED);
  assert.deepEqual(schemaErrors('eval-raw-record', rec), []);
  assert.equal(rec.spur_sha256, NORMALIZED.trace_sha256);
  assert.equal(rec.modell, 'claude-opus-5-5');
  assert.deepEqual(rec.skill_aufrufe, { beobachtbar: true, abwesenheit_belegt: false, aufrufe: [{ skill: 'resuming-work', modus: 'skill_tool', bestaetigt: true }] });
  assert.equal(rec.usage.lauf.input_tokens.quelle, 'gemeldet');
  assert.equal(rec.usage.lauf.input_tokens.beleg, `trace_sha256:${NORMALIZED.trace_sha256}`);
  assert.deepEqual(rec.usage.je_skill.map((s) => s.tokens.quelle), ['unbekannt']);
  // The caller cannot supply observed facts, and B0 cannot name skills.
  assert.throws(() => buildRawRecord(meta({ modell: 'x' }), NORMALIZED), /abgeleitet/);
  assert.throws(() => buildRawRecord(meta({ variante: 'B0' }), NORMALIZED), /B0/);
  assert.throws(() => buildRawRecord(meta({ eingabe_ref: 'zeile1\nzeile2' }), NORMALIZED), /eval-raw-record/);
});

function rawFiles(t, records) {
  const dir = tmp(t);
  const rawDir = path.join(dir, 'raw');
  fs.mkdirSync(rawDir);
  for (const r of records) writeJson(rawDir, `${r.run_id}.json`, r);
  return { dir, rawDir };
}

test('SLV0-FALL-36 report without raw records → report_without_raw; no score or recommendation field', (t) => {
  const { dir, rawDir } = rawFiles(t, []);
  const r = runEvalCli(['report', rawDir]);
  assert.equal(r.code, 1, r.stdout);
  assert.deepEqual(codesOf(r.json), ['report_without_raw']);

  const rec = buildRawRecord(meta(), NORMALIZED);
  const report = buildReport([rec]);
  const keys = new Set();
  const walk = (n) => { if (n && typeof n === 'object') for (const [k, v] of Object.entries(n)) { keys.add(k.toLowerCase()); walk(v); } };
  walk(report);
  for (const k of FORBIDDEN_KEYS) assert.ok(!keys.has(k), `report contains ${k}`);
  assert.deepEqual(schemaErrors('eval-report', report), []);
  assert.ok(schemaErrors('eval-report', { ...report, score: 0.9 }).length > 0);
  assert.ok(schemaErrors('eval-report', { ...report, empfehlung: 'aktivieren' }).length > 0);

  // A report that states a number without raw record IDs (or with unknown IDs) fails the check.
  const doctored = structuredClone(report);
  doctored.ebenen.M3.laeufe[0].abgeschlossen.rohdatensatz_ids = [];
  const res = checkReport(doctored, ['RUN-1']);
  assert.ok(res.messages.some((m) => m.code === 'report_without_raw'));
  const ghost = structuredClone(report);
  ghost.ebenen.M3.assertions[0].assertions.deterministisch.bestanden.rohdatensatz_ids = ['RUN-GHOST'];
  const { rawDir: oneDir } = rawFiles(t, [rec]);
  const file = writeJson(dir, 'bericht.json', ghost);
  const chk = runEvalCli(['report', '--check', file, oneDir]);
  assert.equal(chk.code, 1);
  assert.deepEqual(codesOf(chk.json), ['report_without_raw']);
  const okFile = writeJson(dir, 'ok.json', report);
  assert.equal(runEvalCli(['report', '--check', okFile, oneDir]).code, 0);
  // Checking against no raw records at all is never a pass.
  assert.equal(runEvalCli(['report', '--check', okFile, rawDir]).code, 1);
});

test('SLV0-FALL-37 R violation with otherwise passed assertions is reported separately, never netted', (t) => {
  const withR = meta({
    run_id: 'RUN-R', case_id: 'V1-B12h', family_id: 'fam-r01',
    assertions: [
      { id: 'D-1', art: 'deterministisch', bewerter: 'spur-regel@1', ergebnis: 'bestanden', r_regel: null },
      { id: 'D-2', art: 'deterministisch', bewerter: 'spur-regel@1', ergebnis: 'bestanden', r_regel: null },
      { id: 'K-1', art: 'rubrik', bewerter: 'bewerter-session@1', ergebnis: 'bestanden', r_regel: null },
      { id: 'K-R01', art: 'rubrik', bewerter: 'bewerter-session@1', ergebnis: 'nicht_bestanden', r_regel: 'R-01' },
    ],
  });
  const clean = meta({ run_id: 'RUN-C', case_id: 'V2-B12', family_id: 'fam-b12' });
  const { rawDir } = rawFiles(t, [buildRawRecord(withR, NORMALIZED), buildRawRecord(clean, NORMALIZED)]);
  const r = runEvalCli(['report', rawDir]);
  assert.equal(r.code, 0, r.stdout);
  const rep = r.json;
  assert.deepEqual(schemaErrors('eval-report', rep), []);
  // The other assertions count only non-R assertions: 3/3 deterministic, 2/2 rubric overall.
  const m3 = rep.ebenen.M3.assertions[0].assertions;
  assert.deepEqual([m3.deterministisch.bestanden.zaehler, m3.deterministisch.bestanden.nenner], [3, 3]);
  assert.deepEqual([m3.rubrik.bestanden.zaehler, m3.rubrik.bestanden.nenner], [2, 2]);
  assert.equal(m3.rubrik.nicht_bestanden.zaehler, 0);
  const fallR = rep.ebenen.M3.je_fall.find((f) => f.case_id === 'V1-B12h');
  assert.deepEqual([fallR.assertions.rubrik.bestanden.zaehler, fallR.assertions.rubrik.bestanden.nenner], [1, 1]);
  // The R violation stands on its own, per case.
  assert.deepEqual(rep.r_verstoesse, [{ case_id: 'V1-B12h', family_id: 'fam-r01', variante: 'B1', repeat_id: 1, regel: 'R-01', assertion_id: 'K-R01', rohdatensatz_ids: ['RUN-R'] }]);
  assert.deepEqual(rep.r_pruefungen.map((p) => [p.case_id, p.regel, p.verstoesse.zaehler, p.verstoesse.nenner]), [['V1-B12h', 'R-01', 1, 1]]);
});

test('SLV0-EVAL-10 levels, families and repeats are separate; every number names its raw records', (t) => {
  const recs = [
    buildRawRecord(meta({ run_id: 'A1', case_id: 'C-1', family_id: 'F-1', repeat_id: 1 }), NORMALIZED),
    buildRawRecord(meta({ run_id: 'A2', case_id: 'C-1', family_id: 'F-1', repeat_id: 2, assertions: [{ id: 'A-1', art: 'deterministisch', bewerter: 'spur-regel@1', ergebnis: 'unklar', r_regel: null }] }), NORMALIZED),
    buildRawRecord(meta({ run_id: 'B1', case_id: 'C-2', family_id: 'F-2', ebene: 'M2', variante: 'B0', skills: [] }), normalizeTrace(Buffer.from(''), 'leer')),
  ];
  const rep = buildReport(recs);
  assert.deepEqual(Object.keys(rep.ebenen), ['M2', 'M3']);
  assert.equal(rep.ebenen.M3.je_wiederholung.length, 2);
  assert.equal(rep.ebenen.M3.je_familie.length, 1);
  const det = rep.ebenen.M3.assertions[0].assertions.deterministisch;
  assert.deepEqual([det.bestanden.zaehler, det.unklar.zaehler, det.bestanden.nenner], [1, 1, 2]);
  assert.deepEqual(det.bestanden.rohdatensatz_ids, ['A1', 'A2']);
  // Empty B0 trace: catalog unknown, usage unknown (never 0), no skill calls.
  const m2 = rep.ebenen.M2;
  assert.equal(m2.katalog_unbekannt[0].laeufe.zaehler, 1);
  assert.equal(m2.usage[0].input_tokens.quelle, 'unbekannt');
  assert.equal(m2.usage[0].input_tokens.wert, null);
  assert.deepEqual(m2.skill_aufrufe, []);
  assert.equal(rep.ebenen.M3.usage[0].input_tokens.quelle, 'gemeldet');
  assert.deepEqual(checkReport(rep, ['A1', 'A2', 'B1']), { schema_errors: [], messages: [] });
  // Deterministic: same raw records in another order give the same report.
  assert.deepEqual(buildReport([...recs].reverse()), rep);
  // Duplicate run IDs are refused.
  const { rawDir } = rawFiles(t, recs);
  writeJson(rawDir, 'dup.json', recs[0]);
  assert.equal(runEvalCli(['report', rawDir]).code, 2);
});
