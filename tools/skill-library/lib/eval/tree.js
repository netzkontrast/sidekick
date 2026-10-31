// Read-only file trees for fixtures, baselines and workspaces (SLV0-EVAL-20/-22/-27).
// Never follows symlinks (they are recorded with their target) and skips `.git/` on every level.
// Paths are POSIX, relative to the root, ordered by code point (SLV0-INV-03).
import fs from 'node:fs';
import path from 'node:path';
import { compareCodepoints } from '../core.js';
import { UsageError } from './common.js';

/** Throw a usage error unless `dir` is an existing directory (not a symlink). */
export function requireDir(dir, label = dir) {
  let st;
  try { st = fs.lstatSync(dir); } catch { throw new UsageError(`${label}: Verzeichnis nicht gefunden`); }
  if (!st.isDirectory()) throw new UsageError(`${label}: kein Verzeichnis`);
  return dir;
}

/**
 * Read a directory tree. Returns Map<relPath, {kind: 'file', buf} | {kind: 'link', target}>,
 * keys sorted by code point. `.git` directories are skipped on every level.
 */
export function readTree(root) {
  const out = new Map();
  const walk = (rel) => {
    const abs = rel === '' ? root : path.join(root, ...rel.split('/'));
    for (const name of fs.readdirSync(abs).sort(compareCodepoints)) {
      const r = rel === '' ? name : `${rel}/${name}`;
      const st = fs.lstatSync(path.join(abs, name));
      if (st.isSymbolicLink()) out.set(r, { kind: 'link', target: fs.readlinkSync(path.join(abs, name)) });
      else if (st.isDirectory()) { if (name !== '.git') walk(r); }
      else if (st.isFile()) out.set(r, { kind: 'file', buf: fs.readFileSync(path.join(abs, name)) });
    }
  };
  walk('');
  return new Map([...out.entries()].sort(([a], [b]) => compareCodepoints(a, b)));
}

/** Text of a tree entry (UTF-8, invalid sequences replaced); null for links and missing entries. */
export function entryText(entry) {
  return entry && entry.kind === 'file' ? entry.buf.toString('utf8') : null;
}

/** Number of lines: line feeds plus one when the text does not end with a line feed (empty: 0). */
export function lineCount(text) {
  if (text.length === 0) return 0;
  let n = 0;
  for (let i = 0; i < text.length; i += 1) if (text.charCodeAt(i) === 10) n += 1;
  return text.endsWith('\n') ? n : n + 1;
}

/** Added, modified and deleted paths between two trees (regular files by bytes, links by target). */
export function diffTrees(before, after) {
  const added = [];
  const modified = [];
  const deleted = [];
  for (const [p, e] of after) {
    const b = before.get(p);
    if (!b) added.push(p);
    else if (b.kind !== e.kind || (e.kind === 'file' ? !b.buf.equals(e.buf) : b.target !== e.target)) modified.push(p);
  }
  for (const p of before.keys()) if (!after.has(p)) deleted.push(p);
  const sort = (xs) => xs.sort(compareCodepoints);
  return { added: sort(added), modified: sort(modified), deleted: sort(deleted), changed: sort([...added, ...modified, ...deleted]) };
}
