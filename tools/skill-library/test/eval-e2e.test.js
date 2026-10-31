// End to end on real repository data (SLV0-EVAL-01/-02/-08/-09/-10) and harness boundaries
// (SLV0-INV-04/-08). Everything is written into a temporary directory removed after the test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT, runCli, NEEDS_SYMLINKS } from './helpers.js';
import { tmp, writeJson, runEvalCli, RESEARCH } from './eval-helpers.js';
import { schemaErrors } from '../lib/eval/common.js';

function headCommit() {
  const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

test('SLV0-EVAL-01…10 end to end: freeze repo, verify, normalize an E1 trace, raw record, report', NEEDS_SYMLINKS, (t) => {
  const dir = tmp(t, 'slv0-e2e-');
  const commit = headCommit() ?? '0000000';
  const setBefore = runCli(['hash', '--root', REPO_ROOT]).json.package_set_hash;

  const freeze = runEvalCli(['freeze', '--root', REPO_ROOT, '--source-commit', commit]);
  assert.equal(freeze.code, 0, freeze.stdout);
  const snapFile = writeJson(dir, 'snapshot.json', freeze.json);
  const verify = runEvalCli(['verify', '--snapshot', snapFile]);
  assert.equal(verify.code, 0, verify.stdout);
  assert.equal(verify.json.package_set_sha256, setBefore);

  const trace = path.join(RESEARCH, 'eval-runs', 'e1', 'RW-01.normalized.json');
  const norm = runEvalCli(['normalize', '--trace', trace]);
  assert.equal(norm.code, 0, norm.stdout);
  const normFile = writeJson(dir, 'RW-01.sl.json', norm.json);

  const skill = freeze.json.files['.agents/skills/resuming-work/SKILL.md'] ? 'resuming-work' : null;
  const meta = {
    run_id: 'E1-RW-01', case_id: 'RW-01', family_id: 'resume-handoff', repeat_id: 1, attempt_id: 11, split: 'dev', ebene: 'M2', variante: 'B1',
    skills: skill ? [{ name: skill, sha256: runCli(['hash', '--root', REPO_ROOT]).json.packages.find((p) => p.name === skill).content_hash }] : [],
    client: { name: 'claude', version: '2.1.314', flags: ['-p', '--output-format', 'stream-json'] },
    eval_version: 'sl1-design@2026-10-30', rubrik_version: null, fall_hash: 'c'.repeat(64),
    eingabe_ref: null, ausgabe_ref: null, spur_ref: 'research/skills-meta-prompting/eval-runs/e1/RW-01.normalized.json',
    assertions: [{ id: 'D-skill-resuming-work', art: 'deterministisch', bewerter: 'spur-regel@1', ergebnis: 'bestanden', r_regel: null }],
    latenz_ms: null, fehler: null,
  };
  const raw = runEvalCli(['raw', '--meta', writeJson(dir, 'meta.json', meta), '--normalized', normFile]);
  assert.equal(raw.code, 0, raw.stdout);
  fs.mkdirSync(path.join(dir, 'raw'));
  writeJson(path.join(dir, 'raw'), 'E1-RW-01.json', raw.json);

  const report = runEvalCli(['report', path.join(dir, 'raw')]);
  assert.equal(report.code, 0, report.stdout);
  assert.deepEqual(schemaErrors('eval-report', report.json), []);
  const reportFile = writeJson(dir, 'report.json', report.json);
  assert.equal(runEvalCli(['report', '--check', reportFile, path.join(dir, 'raw')]).code, 0);
  const calls = report.json.ebenen.M2.skill_aufrufe;
  assert.deepEqual(calls.map((c) => [c.skill, c.laeufe_mit_bestaetigtem_aufruf.zaehler, c.laeufe_mit_bestaetigtem_aufruf.nenner]), [['resuming-work', 1, 1]]);

  // Nothing in the repository's packages changed.
  assert.equal(runCli(['hash', '--root', REPO_ROOT]).json.package_set_hash, setBefore);
  t.diagnostic(`E2E commit=${commit} files=${verify.json.files} packages=${verify.json.packages.length} set=${verify.json.package_set_sha256}`);
  t.diagnostic(`E2E trace=${norm.json.trace_sha256} status=${norm.json.status} catalog=${norm.json.catalog.status}/${norm.json.catalog.skills.length} activations=${JSON.stringify(norm.json.activations)}`);
  t.diagnostic(`E2E raw usage.lauf.input_tokens=${JSON.stringify(raw.json.usage.lauf.input_tokens)}`);
  t.diagnostic(`E2E report rohdaten=${JSON.stringify(report.json.rohdaten)} M2.skill_aufrufe=${JSON.stringify(calls)}`);
});

test('SLV0-INV-04 eval modules import no network or process modules and never name the client binary', () => {
  const evalDir = fileURLToPath(new URL('../lib/eval/', import.meta.url));
  const NETWORK = /node:net|node:http|node:https|node:dgram|\bfetch\(|['"`]claude['"`]/;
  for (const f of fs.readdirSync(evalDir)) {
    const src = fs.readFileSync(path.join(evalDir, f), 'utf8');
    const imports = [...src.matchAll(/from '([^']+)'/g)].map((m) => m[1]);
    assert.ok(!NETWORK.test(src), `${f} uses a network API or names the client binary`);
    if (f === 'git.js') continue; // SLV0-EVAL-18, checked in the next test
    for (const imp of imports) {
      assert.ok(['node:fs', 'node:path', 'node:url', 'node:crypto'].includes(imp) || imp.startsWith('./') || imp.startsWith('../'), `${f} imports ${imp}`);
    }
    assert.ok(!/child_process|\bspawn|\bfork\(|(?<![.\w])exec(File|Sync|FileSync)?\(/.test(src), `${f} uses a process API`);
  }
});

test('SLV0-EVAL-18 only lib/eval/git.js starts a process, and only `git` via execFileSync', () => {
  const src = fs.readFileSync(fileURLToPath(new URL('../lib/eval/git.js', import.meta.url)), 'utf8');
  const imports = [...src.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[0]);
  assert.deepEqual(imports.filter((i) => i.includes('child_process')), ["import { execFileSync } from 'node:child_process';"]);
  for (const i of imports) {
    const from = /from '([^']+)'/.exec(i)[1];
    assert.ok(from === 'node:child_process' || from.startsWith('./') || from.startsWith('../'), `git.js imports ${from}`);
  }
  const calls = [...src.matchAll(/execFileSync\(([^,]+),/g)].map((m) => m[1].trim());
  assert.deepEqual(calls, ["'git'"]);
  assert.ok(!/\bspawn|\bfork\(|(?<![.\w])exec(File|Sync)?\(|shell:\s*true/.test(src), 'no other process API, no shell');
  // The read-only subcommands are fixed: rev-parse and status, never a writing one.
  const subcommands = [...src.matchAll(/git\(root, \['([a-z-]+)'/g)].map((m) => m[1]);
  assert.deepEqual(subcommands.sort(), ['rev-parse', 'status']);
  assert.match(src, /--no-optional-locks/);
});

test('SLV0-INV-08 read-only eval commands leave .agents/skills and the stored traces unchanged', (t) => {
  const dir = tmp(t);
  const trace = path.join(RESEARCH, 'eval-runs', 'e1', 'ST-04.normalized.json');
  const traceBefore = fs.readFileSync(trace);
  const setBefore = runCli(['hash', '--root', REPO_ROOT]).json.package_set_hash;
  const snapshot = path.join(RESEARCH, 'skill-pilot-baseline-v2.json');
  for (const args of [
    ['freeze', '--root', REPO_ROOT, '--source-commit', 'abcdef1'],
    ['verify', '--snapshot', snapshot],
    ['bind', '--snapshot', snapshot, '--candidates', path.join(RESEARCH, 'skill-pilot-candidates.json')],
    ['normalize', '--trace', trace],
    ['rubric', 'check', '--root', REPO_ROOT],
    ['split', 'check', '--manifest', writeJson(dir, 'm.json', { schema_version: 1, manifest_id: 'M', cases: [{ case_id: 'a', family_id: 'f', split: 'dev', case_sha256: 'd'.repeat(64) }] })],
  ]) {
    const r = runEvalCli(args, { cwd: dir });
    assert.ok([0, 1].includes(r.code), `${args.join(' ')}: ${r.stdout}${r.stderr}`);
  }
  assert.equal(runCli(['hash', '--root', REPO_ROOT]).json.package_set_hash, setBefore);
  assert.deepEqual(fs.readFileSync(trace), traceBefore);
  assert.deepEqual(fs.readdirSync(dir), ['m.json']);
});

test('SLV0-VAL-17 eval usage errors exit 2 with JSON on stdout', () => {
  for (const args of [[], ['bogus'], ['verify'], ['verify', '--snapshot'], ['ledger'], ['ledger', 'reserve'], ['split', 'nope'], ['normalize', '--trace', '/nicht/da'], ['freeze', '--source-commit', 'XYZ'], ['report', '--unknown']]) {
    const r = runEvalCli(args);
    assert.equal(r.code, 2, args.join(' '));
    assert.ok(r.json && r.json.error, `JSON error for ${args.join(' ')}`);
  }
});
