// Test helpers: synthetic packages in temporary directories (never under .agents/skills/ of the repo).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const TOOL_DIR = fileURLToPath(new URL('..', import.meta.url));
export const CLI = path.join(TOOL_DIR, 'cli.js');
export const REPO_ROOT = path.resolve(TOOL_DIR, '..', '..');

const created = [];
process.on('exit', () => {
  for (const dir of created) fs.rmSync(dir, { recursive: true, force: true });
});

/** Temporary directory below the OS temp folder; removed when the test process exits. */
export function tempDir(prefix = 'slv0-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  created.push(dir);
  return dir;
}

export function skillMd(name, { description = 'Synthetisches Testpaket. Nutze bei Tests. Nicht für Produktion.', extraFront = '', body = '\n# Titel\n\nLies [Arbeit](references/work.md).\n' } = {}) {
  return `---\nname: ${name}\ndescription: ${description}\n${extraFront}---\n${body}`;
}

export const WORK_MD = '# Arbeit\n\n## Ohne Rückkanal\n\nText.\n';
export const OPENAI_YAML = 'interface:\n  display_name: "Test"\n';

/** Default file set of a valid synthetic package. */
export function defaultFiles(name) {
  return {
    'SKILL.md': skillMd(name),
    'references/work.md': WORK_MD,
    'agents/openai.yaml': OPENAI_YAML,
  };
}

/** Write files {rel: string|Buffer} into dir; returns dir. */
export function writeFiles(dir, files, order = null) {
  const keys = order ?? Object.keys(files);
  for (const rel of keys) {
    const abs = path.join(dir, ...rel.split('/'));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, files[rel]);
  }
  return dir;
}

/** Create a synthetic repo with packages {name: files} and correct relative adapters. */
export function makeRepo(packages, { adapters = true } = {}) {
  const root = tempDir('slv0-repo-');
  fs.mkdirSync(path.join(root, '.agents', 'skills'), { recursive: true });
  fs.mkdirSync(path.join(root, '.claude', 'skills'), { recursive: true });
  for (const [name, files] of Object.entries(packages)) {
    writeFiles(path.join(root, '.agents', 'skills', name), files);
    if (adapters) fs.symlinkSync(`../../.agents/skills/${name}`, path.join(root, '.claude', 'skills', name));
  }
  return root;
}

/** Create a standalone package folder; returns its absolute path. */
export function makePackage(name, files = defaultFiles(name)) {
  const dir = path.join(tempDir('slv0-pkg-'), name);
  fs.mkdirSync(dir);
  return writeFiles(dir, files);
}

export function runCli(args, { cwd = REPO_ROOT } = {}) {
  const res = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8' });
  let json = null;
  try { json = JSON.parse(res.stdout); } catch { /* keep null */ }
  return { code: res.status, stdout: res.stdout, stderr: res.stderr, json };
}

export function codes(messages) {
  return messages.map((m) => m.code);
}

/** Whether this file system allows creating symlinks (probed once). */
export const SYMLINKS_OK = (() => {
  const dir = tempDir('slv0-probe-');
  try {
    fs.symlinkSync('x', path.join(dir, 'l'));
    return true;
  } catch {
    return false;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
})();
/** Pass as test option: skipped with reason instead of passed when symlinks are unavailable. */
export const NEEDS_SYMLINKS = { skip: SYMLINKS_OK ? false : 'Dateisystem erlaubt keine Symlinks' };

/** Try to create a symlink; returns false when the file system does not allow it. */
export function trySymlink(target, linkPath) {
  try {
    fs.symlinkSync(target, linkPath);
    return true;
  } catch (err) {
    if (err.code === 'EPERM' || err.code === 'EACCES' || err.code === 'ENOSYS') return false;
    throw err;
  }
}
