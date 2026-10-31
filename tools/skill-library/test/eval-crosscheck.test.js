// Cross-checks raw ↔ ledger, prepare ↔ split manifest, freeze ↔ Git (SLV0-EVAL-16/-17/-18,
// SLV0-FALL-44…46). Temporary directories and Git test repositories are removed after each test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { makeRepo, defaultFiles, NEEDS_SYMLINKS } from './helpers.js';
import { tmp, writeJson, readJson, runEvalCli, codesOf, syntheticSource, RESEARCH } from './eval-helpers.js';
import { normalizeTrace } from '../lib/eval/normalize.js';
import { buildRawRecord } from '../lib/eval/raw.js';
import { initLedger, reserveStart, recordResult, readLedger } from '../lib/eval/ledger.js';
import { freezeFromSource } from '../lib/eval/snapshot.js';
import { buildManifest } from '../lib/eval/split.js';
import { EvalRefusal } from '../lib/eval/common.js';

const NORMALIZED = normalizeTrace(fs.readFileSync(path.join(RESEARCH, 'eval-runs', 'e1', 'RW-01.normalized.json')), 'RW-01');

function meta(over = {}) {
  return {
    run_id: 'RUN-1', case_id: 'F-01', family_id: 'fam-a', repeat_id: 1, attempt_id: 1, split: 'dev', ebene: 'M3', variante: 'B1',
    skills: [{ name: 'resuming-work', sha256: 'b'.repeat(64) }],
    client: { name: 'claude', version: '2.1.314', flags: ['-p'] },
    eval_version: 'sl1-design@2026-10-30', rubrik_version: null, fall_hash: 'a'.repeat(64),
    eingabe_ref: null, ausgabe_ref: null, spur_ref: 'eval-runs/e1/RW-01.normalized.json',
    assertions: [{ id: 'A-1', art: 'deterministisch', bewerter: 'spur-regel@1', ergebnis: 'bestanden', r_regel: null }],
    latenz_ms: null, fehler: null,
    ...over,
  };
}

function refusal(fn) {
  try { fn(); } catch (err) { if (err instanceof EvalRefusal) return err.messages; throw err; }
  return [];
}

test('SLV0-FALL-44 raw --ledger: unreserved attempt, other trial, other trace, missing raw ID → ledger_mismatch; ledger unchanged', (t) => {
  const dir = tmp(t);
  const ledger = path.join(dir, 'ledger.jsonl');
  initLedger(ledger, { limit: 10 });
  reserveStart(ledger, 'F-01--B1'); // 1: result with another trace
  reserveStart(ledger, 'OTHER--B1'); // 2
  reserveStart(ledger, 'F-01--B1'); // 3: result names other raw IDs
  reserveStart(ledger, 'F-01--B1'); // 4: result matches
  reserveStart(ledger, 'F-01--B1'); // 5: no result yet
  recordResult(ledger, { attemptId: 1, outcome: 'completed', traceSha256: 'f'.repeat(64), rawIds: [] });
  recordResult(ledger, { attemptId: 3, outcome: 'completed', traceSha256: NORMALIZED.trace_sha256, rawIds: ['RUN-X'] });
  recordResult(ledger, { attemptId: 4, outcome: 'completed', traceSha256: NORMALIZED.trace_sha256, rawIds: ['RUN-1'] });
  const entries = readLedger(ledger);
  const before = fs.readFileSync(ledger);

  const cases = { 'nicht reserviert': 9, 'andere trial_id': 2, 'anderer Spur-Hash': 1, 'raw_ids ohne run_id': 3 };
  for (const [name, attempt] of Object.entries(cases)) {
    const msgs = refusal(() => buildRawRecord(meta({ attempt_id: attempt }), NORMALIZED, { ledger: entries, ledgerLabel: 'ledger.jsonl' }));
    assert.deepEqual(msgs.map((m) => m.code), ['ledger_mismatch'], name);
    assert.equal(msgs[0].rule, 'SLV0-EVAL-16');
  }
  for (const attempt of [4, 5]) {
    assert.equal(buildRawRecord(meta({ attempt_id: attempt }), NORMALIZED, { ledger: entries }).attempt_id, attempt);
  }

  // CLI reads the ledger without lock or write.
  const normFile = writeJson(dir, 'n.json', NORMALIZED);
  const bad = runEvalCli(['raw', '--meta', writeJson(dir, 'm1.json', meta({ attempt_id: 2 })), '--normalized', normFile, '--ledger', ledger]);
  assert.equal(bad.code, 1, bad.stdout);
  assert.deepEqual(codesOf(bad.json), ['ledger_mismatch']);
  assert.equal(bad.json.messages[0].path, 'ledger.jsonl');
  const good = runEvalCli(['raw', '--meta', writeJson(dir, 'm2.json', meta({ attempt_id: 4 })), '--normalized', normFile, '--ledger', ledger]);
  assert.equal(good.code, 0, good.stdout);
  assert.equal(good.json.run_id, 'RUN-1');
  assert.deepEqual(fs.readFileSync(ledger), before);
  assert.equal(fs.existsSync(`${ledger}.lock`), false);
  // A missing ledger is a usage error.
  assert.equal(runEvalCli(['raw', '--meta', path.join(dir, 'm2.json'), '--normalized', normFile, '--ledger', path.join(dir, 'fehlt.jsonl')]).code, 2);
});

const SNAP = freezeFromSource(syntheticSource());
const CONFIG = 'Projektkonfiguration: nur synthetische Daten.\n\n';
const CASES = [
  { id: 'F-01', family_id: 'fam-a', split: 'select', prompt: 'Aufgabe eins.', variants: ['B0', 'B1'] },
  { id: 'F-02', family_id: 'fam-b', split: 'test', prompt: 'Aufgabe zwei.' },
];

function prepareArgs(dir, cases, manifest) {
  return [
    'prepare',
    '--snapshot', writeJson(dir, 'snap.json', SNAP),
    '--cases', writeJson(dir, 'cases.json', { cases }),
    '--project-config', writeJson(dir, 'config.txt', CONFIG),
    '--output', path.join(dir, 'out'),
    '--manifest', writeJson(dir, 'manifest.json', manifest),
  ];
}

test('SLV0-FALL-45 prepare --manifest: case missing or changed → case_not_in_manifest / case_hash_mismatch, nothing written', (t) => {
  const manifest = buildManifest(CASES, 'M-1');
  {
    const dir = tmp(t);
    const extra = [...CASES, { id: 'F-03', family_id: 'fam-c', split: 'dev', prompt: 'neu' }];
    const r = runEvalCli(prepareArgs(dir, extra, manifest));
    assert.equal(r.code, 1, r.stdout);
    assert.deepEqual(codesOf(r.json), ['case_not_in_manifest']);
    assert.equal(r.json.messages[0].path, 'F-03');
    assert.equal(fs.existsSync(path.join(dir, 'out')), false);
  }
  {
    const dir = tmp(t);
    const changed = [{ ...CASES[0], prompt: 'Aufgabe eins, nachträglich geändert.' }, CASES[1]];
    const r = runEvalCli(prepareArgs(dir, changed, manifest));
    assert.equal(r.code, 1, r.stdout);
    assert.deepEqual(codesOf(r.json), ['case_hash_mismatch']);
    assert.equal(r.json.messages[0].rule, 'SLV0-EVAL-17');
    assert.equal(fs.existsSync(path.join(dir, 'out')), false);
  }
  {
    const dir = tmp(t);
    const overlap = structuredClone(manifest);
    overlap.cases.push({ case_id: 'F-09', family_id: 'fam-a', split: 'test', case_sha256: 'd'.repeat(64) });
    const r = runEvalCli(prepareArgs(dir, CASES, overlap));
    assert.equal(r.code, 1, r.stdout);
    assert.deepEqual(codesOf(r.json), ['family_split_overlap']);
    assert.equal(fs.existsSync(path.join(dir, 'out')), false);
  }
  {
    // Matching: split comes from the manifest, the manifest hash is recorded.
    const dir = tmp(t);
    const r = runEvalCli(prepareArgs(dir, CASES, manifest));
    assert.equal(r.code, 0, r.stdout);
    assert.match(r.json.split_manifest_sha256, /^[0-9a-f]{64}$/);
    const trials = readJson(path.join(dir, 'out', 'trials.json'));
    assert.deepEqual(trials.trials.map((x) => [x.trial_id, x.split]), [['F-01--B0', 'select'], ['F-01--B1', 'select'], ['F-02--B1', 'test']]);
    assert.equal(trials.split_manifest_sha256, r.json.split_manifest_sha256);
  }
});

// --- freeze --verify-git (SLV0-EVAL-18) ---

const GIT_OK = spawnSync('git', ['--version'], { encoding: 'utf8' }).status === 0;
const NEEDS_GIT = { skip: GIT_OK ? false : 'git nicht verfügbar' };
const GIT_ENV = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.invalid', GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.invalid' };

function git(repo, args) {
  const r = spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8', env: GIT_ENV });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}

function gitRepo() {
  const repo = makeRepo({ 'demo-skill': defaultFiles('demo-skill') });
  fs.writeFileSync(path.join(repo, 'README.md'), 'Test\n');
  fs.writeFileSync(path.join(repo, '.gitignore'), '*.tmp\n');
  git(repo, ['init', '-q']);
  git(repo, ['add', '-A']);
  git(repo, ['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'init']);
  return { repo, head: git(repo, ['rev-parse', 'HEAD']) };
}

/** Git state that must not change through --verify-git: HEAD, index file bytes, porcelain status. */
function gitState(repo) {
  // Index bytes first; the helper's own status must not refresh the index either.
  const index = fs.readFileSync(path.join(repo, '.git', 'index')).toString('hex');
  return { head: git(repo, ['rev-parse', 'HEAD']), index, status: git(repo, ['--no-optional-locks', 'status', '--porcelain', '--ignored']) };
}

test('SLV0-FALL-46 freeze --verify-git: HEAD and a clean .agents/skills/ are required; Git is only read', { ...NEEDS_SYMLINKS, ...(GIT_OK ? {} : NEEDS_GIT) }, () => {
  const { repo, head } = gitRepo();
  const freeze = (commit, extra = ['--verify-git']) => runEvalCli(['freeze', '--root', repo, '--source-commit', commit, ...extra]);

  const state0 = gitState(repo);
  const ok = freeze(head);
  assert.equal(ok.code, 0, ok.stdout);
  assert.equal(ok.json.source_commit, head);
  assert.deepEqual(gitState(repo), state0);

  const other = freeze('abcdef1234567');
  assert.equal(other.code, 1, other.stdout);
  assert.deepEqual(codesOf(other.json), ['source_commit_mismatch']);
  assert.equal(other.json.messages[0].rule, 'SLV0-EVAL-18');
  const abbreviated = freeze(head.slice(0, 12));
  assert.deepEqual(codesOf(abbreviated.json), ['source_commit_mismatch']);
  // Without --verify-git, Git is not consulted.
  assert.equal(freeze('abcdef1234567', []).code, 0);

  const skillMd = path.join(repo, '.agents', 'skills', 'demo-skill', 'SKILL.md');
  const original = fs.readFileSync(skillMd);
  for (const [name, change, undo] of [
    ['geändert', () => fs.appendFileSync(skillMd, 'x\n'), () => fs.writeFileSync(skillMd, original)],
    ['ungetrackt', () => fs.writeFileSync(path.join(repo, '.agents', 'skills', 'demo-skill', 'references', 'neu.md'), '# Neu\n'), () => fs.rmSync(path.join(repo, '.agents', 'skills', 'demo-skill', 'references', 'neu.md'))],
    ['ignoriert', () => fs.writeFileSync(path.join(repo, '.agents', 'skills', 'demo-skill', 'notiz.tmp'), 'x'), () => fs.rmSync(path.join(repo, '.agents', 'skills', 'demo-skill', 'notiz.tmp'))],
  ]) {
    change();
    const before = gitState(repo);
    const r = freeze(head);
    assert.equal(r.code, 1, `${name}: ${r.stdout}`);
    assert.deepEqual(codesOf(r.json), ['worktree_dirty'], name);
    assert.deepEqual(gitState(repo), before, `${name}: git state unchanged`);
    undo();
  }
  // Wrong commit and dirty tree are both reported.
  fs.appendFileSync(skillMd, 'x\n');
  assert.deepEqual(codesOf(freeze('abcdef1234567').json).sort(), ['source_commit_mismatch', 'worktree_dirty']);
  fs.writeFileSync(skillMd, original);

  // A change outside .agents/skills/ does not block.
  fs.appendFileSync(path.join(repo, 'README.md'), 'mehr\n');
  assert.equal(freeze(head).code, 0);

  // Usage errors: flag without --source-commit, flag with --source, no Git repository.
  assert.equal(runEvalCli(['freeze', '--root', repo, '--verify-git']).code, 2);
  const dir = path.dirname(repo);
  assert.equal(runEvalCli(['freeze', '--source', path.join(dir, 'x.json'), '--verify-git']).code, 2);
  const plain = makeRepo({ 'demo-skill': defaultFiles('demo-skill') });
  const noGit = runEvalCli(['freeze', '--root', plain, '--source-commit', head, '--verify-git']);
  assert.equal(noGit.code, 2, noGit.stdout);
  assert.match(noGit.json.error.message, /verify-git/);
});
