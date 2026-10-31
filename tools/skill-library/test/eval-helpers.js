// Helpers for eval tests. Temporary directories are removed by the test itself (t.after).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { REPO_ROOT, CLI } from './helpers.js';

export const RESEARCH = path.join(REPO_ROOT, 'research', 'skills-meta-prompting');
export const BASELINE_V2 = path.join(RESEARCH, 'skill-pilot-baseline-v2.json');
export const GOLDEN_SET_HASH = '4ad5b6dbae228982fe3ba7df6552d9e7029af0fc0c972dde09ad9406f2473967';

/** Temp dir removed after the test (t.after). */
export function tmp(t, prefix = 'slv0-eval-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

export function writeJson(dir, name, value) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value, null, 2));
  return file;
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Run `cli.js eval <args>`; returns {code, json, stdout, stderr}. */
export function runEvalCli(args, { cwd = REPO_ROOT } = {}) {
  const res = spawnSync(process.execPath, [CLI, 'eval', ...args], { cwd, encoding: 'utf8' });
  let json = null;
  try { json = JSON.parse(res.stdout); } catch { /* keep null */ }
  return { code: res.status, stdout: res.stdout, stderr: res.stderr, json };
}

export function codesOf(json) {
  return (json?.messages ?? []).map((m) => m.code);
}

export const FIXTURES = path.join(REPO_ROOT, 'tools', 'skill-library', 'test', 'fixtures');

/**
 * Write a fixture bundle (test/fixtures/<name>.json: {herkunft, dateien: {pfad: {sha256, inhalt}}})
 * into a temporary directory removed after the test. Every file hash is checked first, so the
 * equality tests run on unchanged copies of the research data. Returns {root, herkunft, paths}.
 */
export function materializeBundle(t, name) {
  const bundle = JSON.parse(fs.readFileSync(path.join(FIXTURES, `${name}.json`), 'utf8'));
  const root = tmp(t, 'slv0-bundle-');
  for (const [rel, { sha256, inhalt }] of Object.entries(bundle.dateien)) {
    const actual = createHash('sha256').update(Buffer.from(inhalt, 'utf8')).digest('hex');
    if (actual !== sha256) throw new Error(`Bundle ${name}: Hash von ${rel} weicht ab`);
    const abs = path.join(root, ...rel.split('/'));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, inhalt);
  }
  return { root, herkunft: bundle.herkunft, paths: Object.keys(bundle.dateien) };
}

/** Write files {rel: content} below dir (directories created). */
export function writeTree(dir, files) {
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(dir, ...rel.split('/'));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return dir;
}

/** Python 3 available for equality tests against skill_pilot.py (skipped otherwise). */
export const PYTHON_OK = (() => {
  const r = spawnSync('python3', ['-I', '-B', '-c', 'import sys; print(sys.version_info[0])'], { encoding: 'utf8' });
  return r.status === 0 && r.stdout.trim() === '3';
})();
export const NEEDS_PYTHON = { skip: PYTHON_OK ? false : 'python3 nicht verfügbar' };

/**
 * Call a function of the research helper skill_pilot.py (unchanged, read-only import) with JSON
 * arguments; returns its JSON result. Isolated mode, no bytecode written.
 */
export function callPilot(fnName, args) {
  const code = [
    'import sys, json',
    `sys.path.insert(0, ${JSON.stringify(RESEARCH)})`,
    'import skill_pilot as s',
    'args = json.loads(sys.stdin.read())',
    `print(json.dumps(getattr(s, ${JSON.stringify(fnName)})(*args), ensure_ascii=False))`,
  ].join('\n');
  const r = spawnSync('python3', ['-I', '-B', '-c', code], { input: JSON.stringify(args), encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`python3 ${fnName} failed: ${r.stderr}`);
  return JSON.parse(r.stdout);
}

/** Small synthetic snapshot source with two packages. */
export function syntheticSource() {
  const skill = (name, desc) => `---\nname: ${name}\ndescription: ${desc}\n---\n\n# ${name}\n\nNutze die konfigurierte Ablage; in Demo gilt \`ablage/\`.\nLies [Arbeit](references/work.md).\n`;
  return {
    source_commit: 'abcdef1234567',
    files: {
      '.agents/skills/alpha/SKILL.md': skill('alpha', 'Synthetisch alpha. Nutze bei Tests. Nicht für Produktion.'),
      '.agents/skills/alpha/references/work.md': '# Arbeit\n\nSchritt eins.\nSchritt eins.\n',
      '.agents/skills/beta/SKILL.md': skill('beta', 'Synthetisch beta. Nutze bei Tests. Nicht für Produktion.'),
      '.agents/skills/beta/references/work.md': '# Arbeit\n\nÄußerst knapp.\n',
    },
  };
}
