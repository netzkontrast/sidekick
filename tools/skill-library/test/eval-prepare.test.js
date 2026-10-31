// Trial preparation (SLV0-EVAL-04, SLV0-FALL-32).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { NEEDS_SYMLINKS, runCli } from './helpers.js';
import { tmp, writeJson, readJson, runEvalCli, codesOf, syntheticSource } from './eval-helpers.js';
import { freezeFromSource } from '../lib/eval/snapshot.js';

const SNAP = freezeFromSource(syntheticSource());
const CONFIG = 'Projektkonfiguration: Ablage ablage/. Nur synthetische Daten.\n\n';

function setup(t, cases, candidates = null) {
  const dir = tmp(t);
  const args = [
    'prepare',
    '--snapshot', writeJson(dir, 'snap.json', SNAP),
    '--cases', writeJson(dir, 'cases.json', { cases }),
    '--project-config', writeJson(dir, 'config.txt', CONFIG),
    '--output', path.join(dir, 'out'),
  ];
  if (candidates) args.push('--candidates', writeJson(dir, 'k.json', { candidates }));
  return { dir, out: path.join(dir, 'out'), args };
}

const CASE = { id: 'F-01', family_id: 'fam-a', split: 'dev', prompt: 'Synthetische Aufgabe.', allowed_skills: ['alpha'], variants: ['B0', 'B1'], files: { 'input/plan.md': 'Plan.\n' } };

function listTree(root) {
  const out = [];
  const rec = (rel) => {
    for (const name of fs.readdirSync(path.join(root, rel)).sort()) {
      const r = rel ? `${rel}/${name}` : name;
      const st = fs.lstatSync(path.join(root, r));
      out.push(st.isSymbolicLink() ? `${r} -> ${fs.readlinkSync(path.join(root, r))}` : r);
      if (st.isDirectory()) rec(r);
    }
  };
  rec('');
  return out;
}

test('SLV0-FALL-32 preparing into an existing directory → workspace_exists, nothing written', (t) => {
  const { out, args } = setup(t, [CASE]);
  fs.mkdirSync(out);
  fs.writeFileSync(path.join(out, 'keep.txt'), 'vorher');
  const r = runEvalCli(args);
  assert.equal(r.code, 1, r.stdout);
  assert.deepEqual(codesOf(r.json), ['workspace_exists']);
  assert.deepEqual(fs.readdirSync(out), ['keep.txt']);
  assert.equal(fs.readFileSync(path.join(out, 'keep.txt'), 'utf8'), 'vorher');
});

test('SLV0-FALL-32 case file that overwrites AGENTS.md (or .claude/, .agents/, CLAUDE.md) → config_overwrite, no output', (t) => {
  for (const bad of ['AGENTS.md', 'CLAUDE.md', '.claude/settings.json', '.agents/skills/alpha/SKILL.md', 'agents.md']) {
    const { out, args } = setup(t, [{ ...CASE, files: { [bad]: 'überschrieben' } }]);
    const r = runEvalCli(args);
    assert.equal(r.code, 1, `${bad}: ${r.stdout}`);
    assert.deepEqual(codesOf(r.json), ['config_overwrite'], bad);
    assert.equal(fs.existsSync(out), false, `${bad}: no partial output`);
  }
});

test('SLV0-FALL-47 local rules, MCP config and nested rule files → config_overwrite; similar names pass', (t) => {
  for (const bad of ['CLAUDE.local.md', '.mcp.json', 'docs/CLAUDE.md', 'sub/Agents.md']) {
    const { out, args } = setup(t, [{ ...CASE, files: { [bad]: 'eingeschleust' } }]);
    const r = runEvalCli(args);
    assert.equal(r.code, 1, `${bad}: ${r.stdout}`);
    assert.deepEqual(codesOf(r.json), ['config_overwrite'], bad);
    assert.equal(fs.existsSync(out), false, `${bad}: no partial output`);
  }
  const { args } = setup(t, [{ ...CASE, files: { 'docs/claude-notes.md': 'harmlos' } }]);
  const r = runEvalCli(args);
  assert.equal(r.code, 0, r.stdout);
});

test('SLV0-FALL-32 B0 arm has no package files and no adapter; config hash equals B1', NEEDS_SYMLINKS, (t) => {
  const { out, args } = setup(t, [CASE]);
  const r = runEvalCli(args);
  assert.equal(r.code, 0, r.stdout);
  assert.equal(r.json.model_starts, 0);
  const manifest = readJson(path.join(out, 'trials.json'));
  const [b0, b1] = manifest.trials;
  assert.equal(b0.variant, 'B0');
  assert.equal(b1.variant, 'B1');
  assert.deepEqual(listTree(path.join(out, b0.workspace)), ['input', 'input/plan.md']);
  assert.deepEqual(b0.skills, []);
  assert.equal(b0.variant_package_set_sha256, null);
  assert.equal(b0.project_configuration_sha256, b1.project_configuration_sha256);
  assert.equal(b0.prompt, b1.prompt);
  assert.ok(b0.prompt.startsWith(CONFIG));
  assert.equal(b0.case_sha256, b1.case_sha256);
  assert.equal(b1.variant_package_set_sha256, SNAP.package_set_sha256);
  assert.ok(manifest.trials.every((tr) => tr.planned_only === true));

  // B1: relative adapters (SLV0-VAL-15) that the validator accepts in project scope.
  const ws1 = path.join(out, b1.workspace);
  assert.ok(listTree(ws1).includes('.claude/skills/alpha -> ../../.agents/skills/alpha'));
  const v = runCli(['validate', '--scope', 'project', '--root', ws1]);
  assert.equal(v.code, 0, v.stdout);
  assert.equal(v.json.package_set_hash, SNAP.package_set_sha256);
});

test('SLV0-EVAL-04 candidate arm contains the bound variant; unknown variant is a usage error', NEEDS_SYMLINKS, (t) => {
  const k = {
    id: 'K-PORT', dimension: 'project-binding', baseline_sha256: SNAP.package_set_sha256,
    replacements: [{ path: '.agents/skills/alpha/SKILL.md', before: 'Nutze die konfigurierte Ablage; in Demo gilt `ablage/`.', after: 'Nutze die konfigurierte Ablage.' }],
  };
  const { out, args } = setup(t, [{ ...CASE, variants: ['B1', 'K-PORT'] }], [k]);
  const r = runEvalCli(args);
  assert.equal(r.code, 0, r.stdout);
  const trials = readJson(path.join(out, 'trials.json')).trials;
  const kt = trials.find((x) => x.variant === 'K-PORT');
  assert.match(kt.candidate_sha256, /^[0-9a-f]{64}$/);
  assert.notEqual(kt.variant_package_set_sha256, SNAP.package_set_sha256);
  const text = fs.readFileSync(path.join(out, kt.workspace, '.agents', 'skills', 'alpha', 'SKILL.md'), 'utf8');
  assert.ok(text.includes('Nutze die konfigurierte Ablage.\n'));
  assert.ok(!text.includes('in Demo gilt'));

  const bad = setup(t, [{ ...CASE, variants: ['K-NONE'] }]);
  assert.equal(runEvalCli(bad.args).code, 2);
  assert.equal(fs.existsSync(bad.out), false);
});

test('SLV0-EVAL-04 unsafe case paths are refused before anything is written', (t) => {
  for (const p of ['../aus.md', '/etc/x', 'a\\b.md', 'a/./b.md']) {
    const { out, args } = setup(t, [{ ...CASE, files: { [p]: 'x' } }]);
    assert.equal(runEvalCli(args).code, 2, p);
    assert.equal(fs.existsSync(out), false, p);
  }
});
