// Project scope: all packages under .agents/skills/ plus the .claude/skills/ adapter (SLV0-VAL-15)
// and the package-set hash (SLV0-PKG-23). Reads only.
import fs from 'node:fs';
import path from 'node:path';
import { compareCodepoints, hashOfFileMap, sortMessages } from './core.js';
import { validatePackage, fileHashMap, msg } from './package.js';

export const PACKAGES_DIR = '.agents/skills';
export const ADAPTER_DIR = '.claude/skills';

function lstatOrNull(p) {
  try { return fs.lstatSync(p); } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return null;
    throw err;
  }
}

export class UsageError extends Error {}

/**
 * Validate all packages of a repository. Options: {projectStrings, adapters (default true)}.
 * Returns {packages, messages, package_set_hash}.
 */
export function validateProject(repoRoot, { projectStrings = null, adapters = true } = {}) {
  const pkgRoot = path.join(repoRoot, ...PACKAGES_DIR.split('/'));
  const st = lstatOrNull(pkgRoot);
  if (!st || !st.isDirectory()) throw new UsageError(`kein Ordner ${PACKAGES_DIR} unter dem Projektwurzelverzeichnis`);
  const messages = [];
  const packages = [];
  const names = fs.readdirSync(pkgRoot).sort(compareCodepoints);
  let setOk = true;
  for (const name of names) {
    const abs = path.join(pkgRoot, name);
    const est = fs.lstatSync(abs);
    const display = `${PACKAGES_DIR}/${name}`;
    if (est.isSymbolicLink() || est.isDirectory()) {
      const res = validatePackage(abs, { display, folderName: name, projectStrings });
      packages.push(res);
      messages.push(...res.messages);
      if (!res.valid) setOk = false;
    } else if (name.startsWith('.')) {
      messages.push(msg('hidden_file', display, null, `versteckter Eintrag in ${PACKAGES_DIR}`));
      setOk = false;
    } else {
      messages.push(msg('entry_unsupported', display, null, `Eintrag in ${PACKAGES_DIR} ist kein Paketordner`));
      setOk = false;
    }
  }

  if (adapters) messages.push(...checkAdapters(repoRoot, packages.map((p) => p.name)));

  let packageSetHash = null;
  if (setOk) {
    const map = {};
    for (const p of packages) Object.assign(map, fileHashMap(p.files, `${PACKAGES_DIR}/${p.name}/`));
    packageSetHash = hashOfFileMap(map);
  }
  return { packages, messages: sortMessages(messages), package_set_hash: packageSetHash };
}

/** SLV0-VAL-15: relative symlink .claude/skills/<name> → .agents/skills/<name> within the repo. */
export function checkAdapters(repoRoot, packageNames) {
  const messages = [];
  const adapterRoot = path.join(repoRoot, ...ADAPTER_DIR.split('/'));
  const ast = lstatOrNull(adapterRoot);
  const present = ast && ast.isDirectory() ? fs.readdirSync(adapterRoot).sort(compareCodepoints) : [];
  const pkgSet = new Set(packageNames);
  for (const name of packageNames) {
    const display = `${ADAPTER_DIR}/${name}`;
    const lst = lstatOrNull(path.join(adapterRoot, name));
    if (!lst) {
      messages.push(msg('adapter_missing', display, null, `kein Adapter für Paket ${name}`));
      continue;
    }
    if (!lst.isSymbolicLink()) {
      messages.push(msg('adapter_link_invalid', display, null, 'Adapter ist kein Symlink (Kopie oder Datei)'));
      continue;
    }
    const target = fs.readlinkSync(path.join(adapterRoot, name));
    if (path.isAbsolute(target) || target.startsWith('/') || /^[A-Za-z]:[\\/]/.test(target) || target.includes('\\')) {
      messages.push(msg('adapter_link_invalid', display, null, `Symlinkziel "${target}" ist nicht relativ (POSIX)`));
      continue;
    }
    // Lexical resolution relative to the link's directory; must stay in the repo.
    const resolved = path.posix.normalize(`${ADAPTER_DIR}/${target}`).replace(/\/$/, '');
    const expected = `${PACKAGES_DIR}/${name}`;
    if (resolved === '..' || resolved.startsWith('../')) {
      messages.push(msg('adapter_link_invalid', display, null, `Symlinkziel "${target}" verlässt das Repo`));
    } else if (resolved !== expected) {
      messages.push(msg('adapter_link_invalid', display, null, `Symlinkziel "${target}" löst auf ${resolved} statt ${expected} auf`));
    }
  }
  for (const name of present) {
    if (!pkgSet.has(name)) {
      messages.push(msg('adapter_orphaned', `${ADAPTER_DIR}/${name}`, null, 'Adapter ohne Paket'));
    }
  }
  return messages;
}
