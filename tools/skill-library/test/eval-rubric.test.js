// Rubric per skill (SLV0-EVAL-13/-14/-15, SLV0-FALL-38…43).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, makeRepo, defaultFiles, NEEDS_SYMLINKS } from './helpers.js';
import { tmp, writeJson, runEvalCli, codesOf, RESEARCH } from './eval-helpers.js';
import { validateProject } from '../lib/project.js';
import { checkRubrics, checkRubricStructure } from '../lib/eval/rubric.js';
import { normalizeTrace } from '../lib/eval/normalize.js';
import { buildRawRecord } from '../lib/eval/raw.js';
import { buildReport, checkReport } from '../lib/eval/report.js';
import { EvalRefusal, schemaErrors } from '../lib/eval/common.js';

const RUBRIC_DIR = path.join(REPO_ROOT, 'docs', 'research', 'rubriken');
const H = 'c'.repeat(64);

function rubric(skill = 'demo-skill', over = {}) {
  const p = skill.split('-').map((s) => s[0]).join('').toUpperCase().padEnd(2, 'X').slice(0, 4);
  return {
    schema_version: 1,
    skill,
    rubrik_version: `${skill}@1`,
    paket_hash: { algorithm: 'sha256', profile: 'sl-hash-v0', value: H },
    grundlage: 'synthetisch',
    kriterien: [
      { id: `${p}-K01`, ebene: 'M3', pruefart: 'deterministisch', formulierung: 'Die Spur zeigt einen Skill-Aufruf.', r_regel: null, herkunft: 'Test' },
      { id: `${p}-K02`, ebene: 'M3', pruefart: 'rubrik', formulierung: 'Die Ausgabe nennt den nächsten Schritt.', r_regel: null, herkunft: 'Test' },
      { id: `${p}-K03`, ebene: 'R', pruefart: 'rubrik', formulierung: 'Keine Antwort wird angenommen.', r_regel: 'R-01', herkunft: 'Test' },
    ],
    fall_typen: [{ id: 'basis', beschreibung: 'Grundfall', kriterien: [`${p}-K01`, `${p}-K02`, `${p}-K03`], kern: `${p}-K02`, faelle: ['F-01'] }],
    ...over,
  };
}

const item = (r, fileName = `${r.skill}.json`) => ({ label: `rubriken/${fileName}`, fileName, rubric: r });
const codes = (res) => res.messages.map((m) => m.code);
const hashesFor = (...names) => new Map(names.map((n) => [n, H]));

test('SLV0-FALL-38 rubric schema and reference errors → rubric_invalid', () => {
  const variants = {
    'kern fehlt': (() => { const r = rubric(); delete r.fall_typen[0].kern; return r; })(),
    'kern nicht im Fall-Typ': (() => { const r = rubric(); r.fall_typen[0].kriterien = ['DS-K01', 'DS-K03']; return r; })(),
    'unbekanntes Kriterium': (() => { const r = rubric(); r.fall_typen[0].kriterien.push('DS-K99'); return r; })(),
    'R ohne r_regel': (() => { const r = rubric(); r.kriterien[2].r_regel = null; return r; })(),
    'M3 mit r_regel': (() => { const r = rubric(); r.kriterien[1].r_regel = 'R-02'; return r; })(),
    'Ebene M2': (() => { const r = rubric(); r.kriterien[0].ebene = 'M2'; return r; })(),
    'fremde Version': rubric('demo-skill', { rubrik_version: 'anderer-skill@1' }),
    'Score-Feld': rubric('demo-skill', { schwelle: 0.8 }),
  };
  for (const [name, r] of Object.entries(variants)) {
    const res = checkRubrics([item(r)], hashesFor('demo-skill'));
    assert.deepEqual([...new Set(codes(res))], ['rubric_invalid'], name);
  }
  const wrongName = checkRubrics([item(rubric(), 'grilling.json')], hashesFor('demo-skill'));
  assert.deepEqual(codes(wrongName), ['rubric_invalid']);
  assert.match(wrongName.messages[0].message, /Dateiname/);
  // The valid base rubric passes.
  assert.deepEqual(checkRubrics([item(rubric())], hashesFor('demo-skill')).messages, []);
  assert.equal(checkRubricStructure(rubric(), 'x').schemaOk, true);
});

test('SLV0-FALL-39 duplicate criterion IDs within and across rubrics → rubric_id_duplicate; two rubrics for one skill → rubric_invalid', () => {
  const inner = rubric();
  inner.kriterien.push({ ...inner.kriterien[0] });
  assert.deepEqual(codes(checkRubrics([item(inner)], hashesFor('demo-skill'))), ['rubric_id_duplicate']);

  const a = rubric('alpha-beta');
  const b = rubric('alpha-bravo'); // same prefix AB → same IDs in another rubric
  const across = checkRubrics([item(a), item(b)], hashesFor('alpha-beta', 'alpha-bravo'));
  assert.deepEqual([...new Set(codes(across))], ['rubric_id_duplicate']);
  assert.equal(across.messages.length, 3);
  assert.ok(across.messages.every((m) => m.path === 'rubriken/alpha-bravo.json'));

  const twice = checkRubrics([item(rubric()), { ...item(rubric('demo-skill', { kriterien: rubric().kriterien.map((k) => ({ ...k, id: k.id.replace('DS', 'DX') })), fall_typen: [{ ...rubric().fall_typen[0], kriterien: ['DX-K01'], kern: 'DX-K01' }] })), label: 'rubriken/b/demo-skill.json' }], hashesFor('demo-skill'));
  assert.deepEqual(codes(twice), ['rubric_invalid']);
  assert.match(twice.messages[0].message, /zweite Rubrik/);
});

test('SLV0-FALL-40 rubric bound to the content hash; one changed byte or a missing package → rubric_stale; snapshot of the old state passes', NEEDS_SYMLINKS, (t) => {
  const repo = makeRepo({ 'demo-skill': defaultFiles('demo-skill') });
  const dir = tmp(t);
  const hash = validateProject(repo, { adapters: false }).packages[0].content_hash;
  const rubDir = path.join(dir, 'rubriken');
  fs.mkdirSync(rubDir);
  const file = writeJson(rubDir, 'demo-skill.json', rubric('demo-skill', { paket_hash: { algorithm: 'sha256', profile: 'sl-hash-v0', value: hash } }));

  const ok = runEvalCli(['rubric', 'check', file, '--root', repo]);
  assert.equal(ok.code, 0, ok.stdout);
  assert.deepEqual(ok.json.messages, []);
  assert.equal(ok.json.hash_quelle, 'arbeitsbaum');
  assert.equal(ok.json.rubriken[0].aktueller_hash, hash);
  assert.equal(ok.json.rubriken[0].datei, 'demo-skill.json', 'no absolute path in the output');

  const freeze = runEvalCli(['freeze', '--root', repo, '--source-commit', 'abcdef1']);
  assert.equal(freeze.code, 0, freeze.stdout);
  const snap = writeJson(dir, 'snap.json', freeze.json);

  const skillMd = path.join(repo, '.agents', 'skills', 'demo-skill', 'SKILL.md');
  fs.appendFileSync(skillMd, 'x\n');
  const before = fs.readFileSync(file);
  const stale = runEvalCli(['rubric', 'check', rubDir, '--root', repo]);
  assert.equal(stale.code, 1, stale.stdout);
  assert.deepEqual(codesOf(stale.json), ['rubric_stale']);
  assert.equal(stale.json.messages[0].rule, 'SLV0-EVAL-14');
  assert.equal(stale.json.rubriken[0].gueltig, false);
  assert.deepEqual(fs.readFileSync(file), before, 'a stale rubric is never re-bound');

  const viaSnapshot = runEvalCli(['rubric', 'check', file, '--snapshot', snap]);
  assert.equal(viaSnapshot.code, 0, viaSnapshot.stdout);
  assert.equal(viaSnapshot.json.hash_quelle, 'snapshot');

  const ghost = writeJson(dir, 'ghost.json', rubric('ghost', { kriterien: rubric().kriterien.map((k) => ({ ...k, id: k.id.replace('DS', 'GH') })), fall_typen: [{ id: 'basis', beschreibung: 'x', kriterien: ['GH-K01'], kern: 'GH-K01', faelle: [] }] }));
  const missing = runEvalCli(['rubric', 'check', ghost, '--snapshot', snap]);
  assert.equal(missing.code, 1, missing.stdout);
  assert.deepEqual(codesOf(missing.json), ['rubric_stale']);
  // Usage errors: unknown action, no file.
  assert.equal(runEvalCli(['rubric', 'nope']).code, 2);
  assert.equal(runEvalCli(['rubric', 'check', path.join(dir, 'leer'), '--root', repo]).code, 2);
});

test('SLV0-FALL-41 the nine repository rubrics are valid and bound to the current packages', (t) => {
  const r = runEvalCli(['rubric', 'check', '--root', REPO_ROOT]);
  assert.equal(r.code, 0, r.stdout);
  assert.deepEqual(r.json.messages, []);
  const packages = validateProject(REPO_ROOT, { adapters: false }).packages.map((p) => p.name);
  assert.deepEqual(r.json.rubriken.map((x) => x.skill), packages);
  assert.equal(r.json.rubriken.length, 9);
  for (const row of r.json.rubriken) {
    assert.equal(row.gueltig, true, row.skill);
    // A package change bumps the rubric version (SLV0-EVAL-14); any positive version of the right skill is valid here.
    assert.match(row.rubrik_version, new RegExp(`^${row.skill}@[1-9][0-9]*$`));
    assert.equal(row.datei, `docs/research/rubriken/${row.skill}.json`);
    assert.ok(row.fall_typen.length > 0 && row.fall_typen.every((f) => typeof f.kern === 'string'), row.skill);
    assert.ok(row.je_ebene.M3 > 0, `${row.skill} has M3 criteria`);
    const data = JSON.parse(fs.readFileSync(path.join(RUBRIC_DIR, `${row.skill}.json`), 'utf8'));
    assert.deepEqual(schemaErrors('eval-rubric', data), []);
    t.diagnostic(`${row.skill}: ${row.kriterien} Kriterien (M3 ${row.je_ebene.M3}, M4 ${row.je_ebene.M4}, R ${row.je_ebene.R}; deterministisch ${row.deterministisch}), kern ${row.fall_typen[0].id}=${row.fall_typen[0].kern}`);
  }
});

// --- raw and report (SLV0-EVAL-15) ---

const E1 = path.join(RESEARCH, 'eval-runs', 'e1');
const NORMALIZED = normalizeTrace(fs.readFileSync(path.join(E1, 'RW-01.normalized.json')), 'RW-01');
const RW_RUBRIC = JSON.parse(fs.readFileSync(path.join(RUBRIC_DIR, 'resuming-work.json'), 'utf8'));
const RW_HASH = RW_RUBRIC.paket_hash.value;

function meta(over = {}) {
  return {
    run_id: 'RUN-1', case_id: 'RW-01', family_id: 'fam-rw', repeat_id: 1, attempt_id: 1, split: 'dev', ebene: 'M3', variante: 'B1',
    skills: [{ name: 'resuming-work', sha256: RW_HASH }],
    client: { name: 'claude', version: '2.1.314', flags: ['-p'] },
    eval_version: 'sl1-design@2026-10-30', rubrik_version: null, fall_hash: 'a'.repeat(64),
    eingabe_ref: null, ausgabe_ref: null, spur_ref: 'eval-runs/e1/RW-01.normalized.json',
    assertions: [
      { id: 'RW-K01', art: 'deterministisch', bewerter: 'spur-regel@1', ergebnis: 'bestanden', r_regel: null },
      { id: 'RW-K09', art: 'rubrik', bewerter: 'bewerter-session@1', ergebnis: 'bestanden', r_regel: null },
      { id: 'RW-K07', art: 'rubrik', bewerter: 'bewerter-session@1', ergebnis: 'bestanden', r_regel: 'R-04' },
      { id: 'D-extra', art: 'deterministisch', bewerter: 'spur-regel@1', ergebnis: 'bestanden', r_regel: null },
    ],
    latenz_ms: null, fehler: null,
    ...over,
  };
}

function refusalCodes(fn) {
  try { fn(); } catch (err) { if (err instanceof EvalRefusal) return err.messages.map((m) => m.code); throw err; }
  return [];
}

test('SLV0-FALL-42 raw --rubric takes the rubric version; mismatches → rubric_mismatch; B1 with another skill hash → rubric_stale', (t) => {
  const m = meta();
  delete m.rubrik_version;
  const rec = buildRawRecord(m, NORMALIZED, { rubric: RW_RUBRIC });
  assert.equal(rec.rubrik_version, 'resuming-work@1');
  assert.deepEqual(schemaErrors('eval-raw-record', rec), []);
  assert.equal(buildRawRecord(meta({ rubrik_version: 'resuming-work@1' }), NORMALIZED, { rubric: RW_RUBRIC }).rubrik_version, 'resuming-work@1');

  assert.deepEqual(refusalCodes(() => buildRawRecord(meta({ rubrik_version: 'resuming-work@2' }), NORMALIZED, { rubric: RW_RUBRIC })), ['rubric_mismatch']);
  const unknown = meta();
  unknown.assertions = [...unknown.assertions, { id: 'K-frei', art: 'rubrik', bewerter: 'b', ergebnis: 'bestanden', r_regel: null }];
  assert.deepEqual(refusalCodes(() => buildRawRecord(unknown, NORMALIZED, { rubric: RW_RUBRIC })), ['rubric_mismatch']);
  const wrongArt = meta();
  wrongArt.assertions[0] = { ...wrongArt.assertions[0], art: 'rubrik' };
  assert.deepEqual(refusalCodes(() => buildRawRecord(wrongArt, NORMALIZED, { rubric: RW_RUBRIC })), ['rubric_mismatch']);
  assert.deepEqual(refusalCodes(() => buildRawRecord(meta({ skills: [{ name: 'resuming-work', sha256: 'b'.repeat(64) }] }), NORMALIZED, { rubric: RW_RUBRIC })), ['rubric_stale']);
  // A candidate arm carries another hash by design; only B1 is bound.
  assert.equal(buildRawRecord(meta({ variante: 'K-TEST', skills: [{ name: 'resuming-work', sha256: 'b'.repeat(64) }] }), NORMALIZED, { rubric: RW_RUBRIC }).rubrik_version, 'resuming-work@1');

  // CLI: exit 1 with the code, nothing on stdout but the envelope.
  const dir = tmp(t);
  const normFile = writeJson(dir, 'n.json', NORMALIZED);
  const rubFile = path.join(RUBRIC_DIR, 'resuming-work.json');
  const bad = runEvalCli(['raw', '--meta', writeJson(dir, 'm.json', meta({ rubrik_version: 'resuming-work@2' })), '--normalized', normFile, '--rubric', rubFile]);
  assert.equal(bad.code, 1, bad.stdout);
  assert.deepEqual(codesOf(bad.json), ['rubric_mismatch']);
  const good = runEvalCli(['raw', '--meta', writeJson(dir, 'm2.json', m), '--normalized', normFile, '--rubric', rubFile]);
  assert.equal(good.code, 0, good.stdout);
  assert.equal(good.json.rubrik_version, 'resuming-work@1');
});

test('SLV0-FALL-43 a report never mixes rubric versions → rubric_version_mixed; different rubrics are listed', (t) => {
  const rec = (id, v) => buildRawRecord(meta({ run_id: id, rubrik_version: v }), NORMALIZED);
  const write = (records) => {
    const dir = tmp(t);
    for (const r of records) writeJson(dir, `${r.run_id}.json`, r);
    return dir;
  };
  const mixed = runEvalCli(['report', write([rec('A', 'grilling@1'), rec('B', 'grilling@2')])]);
  assert.equal(mixed.code, 1, mixed.stdout);
  assert.deepEqual(codesOf(mixed.json), ['rubric_version_mixed']);
  assert.equal(mixed.json.messages[0].rule, 'SLV0-EVAL-15');

  const twoDir = write([rec('A', 'grilling@1'), rec('B', 'researching-repositories@1'), rec('C', null)]);
  const two = runEvalCli(['report', twoDir]);
  assert.equal(two.code, 0, two.stdout);
  assert.deepEqual(two.json.rubrik_versionen, [
    { rubrik_version: 'grilling@1', rohdatensatz_ids: ['A'] },
    { rubrik_version: 'researching-repositories@1', rohdatensatz_ids: ['B'] },
  ]);
  assert.deepEqual(schemaErrors('eval-report', two.json), []);

  const pinned = runEvalCli(['report', twoDir, '--rubric-version', 'grilling@2']);
  assert.equal(pinned.code, 1, pinned.stdout);
  assert.deepEqual(codesOf(pinned.json), ['rubric_version_mixed']);
  assert.equal(runEvalCli(['report', twoDir, '--rubric-version', 'grilling@1']).code, 0);
  assert.equal(runEvalCli(['report', twoDir, '--rubric-version', 'grilling@1', '--rubric-version', 'grilling@2']).code, 2);

  // Versions without the <skill>@<n> form count as one rubric.
  assert.deepEqual(codesOf(runEvalCli(['report', write([rec('A', 'rubrik-e1v-e2-v1'), rec('B', 'rubrik-e1v-e2-v2')])]).json), ['rubric_version_mixed']);

  // A stored report that lists two versions of one rubric fails the check.
  const report = buildReport([rec('A', 'grilling@1')]);
  const doctored = { ...report, rubrik_versionen: [...report.rubrik_versionen, { rubrik_version: 'grilling@2', rohdatensatz_ids: ['A'] }] };
  assert.deepEqual(checkReport(doctored, ['A']).messages.map((m) => m.code), ['rubric_version_mixed']);
});
