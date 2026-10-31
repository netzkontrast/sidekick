// Read-only Git access for `eval freeze --verify-git` (SLV0-EVAL-18) and `eval cite-check`
// (SLV0-EVAL-28). This is the only harness module that starts a process, and it starts only `git`
// with fixed read-only subcommands (rev-parse, status, ls-tree, cat-file). Git is not a client or
// model (SLV0-INV-04). `--no-optional-locks` keeps `git status` from refreshing the index;
// `core.fsmonitor=false` keeps it from starting a monitor hook.
import { execFileSync } from 'node:child_process';
import { PACKAGES_DIR } from '../project.js';
import { evalMsg, EvalRefusal, UsageError } from './common.js';

function git(root, args) {
  return execFileSync('git', ['--no-optional-locks', '-c', 'core.fsmonitor=false', '-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** 7–40 lower-case hex characters: the only commit notation `cite-check` resolves (SLV0-EVAL-28). */
export const COMMIT_ID = /^[0-9a-f]{7,40}$/;

function reason(err) {
  const text = String(err?.stderr || err?.message || err).trim().split('\n')[0];
  return text.slice(0, 200);
}

/** Paths of a `git status --porcelain=v1 -z` output (rename/copy sources are skipped). */
function statusPaths(out) {
  const parts = out.split('\0').filter((p) => p.length > 0);
  const paths = [];
  for (let i = 0; i < parts.length; i += 1) {
    const xy = parts[i].slice(0, 2);
    paths.push(`${xy.trim() || '??'} ${parts[i].slice(3)}`);
    if (xy[0] === 'R' || xy[0] === 'C') i += 1;
  }
  return paths;
}

/**
 * SLV0-EVAL-18: `sourceCommit` equals `git rev-parse HEAD` (full hash) and nothing under
 * .agents/skills/ is modified, staged, untracked or ignored. Throws EvalRefusal
 * (source_commit_mismatch, worktree_dirty); UsageError if Git or the repository is unavailable.
 */
export function verifyGitSource(root, sourceCommit) {
  let head;
  try {
    head = git(root, ['rev-parse', '--verify', 'HEAD^{commit}']).trim();
  } catch (err) {
    throw new UsageError(`--verify-git: kein Git-Repository mit HEAD am Projektwurzelverzeichnis (${reason(err)})`);
  }
  let status;
  try {
    status = git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignored=matching', '--', PACKAGES_DIR]);
  } catch (err) {
    throw new UsageError(`--verify-git: git status fehlgeschlagen (${reason(err)})`);
  }
  const messages = [];
  if (head !== sourceCommit) {
    messages.push(evalMsg('source_commit_mismatch', 'HEAD', `--source-commit ${sourceCommit} ist nicht git rev-parse HEAD (${head}); verlangt ist der vollständige Hash`));
  }
  const dirty = statusPaths(status);
  if (dirty.length > 0) {
    messages.push(evalMsg('worktree_dirty', PACKAGES_DIR, `${dirty.length} geänderte, ungetrackte oder ignorierte Einträge: ${dirty.slice(0, 5).join(', ')}${dirty.length > 5 ? ' …' : ''}`));
  }
  if (messages.length > 0) throw new EvalRefusal(messages);
  return { head, clean: true };
}

/** Usage error unless `root` is a Git repository (work tree or bare). */
export function requireGitRepo(root) {
  try {
    git(root, ['rev-parse', '--git-dir']);
  } catch (err) {
    throw new UsageError(`--repo: kein Git-Repository (${reason(err)})`);
  }
}

/**
 * Full hash of the commit named by `id` (7–40 lower-case hex), or null when Git knows no such
 * commit or the abbreviation is ambiguous. Other notations are never passed to Git.
 */
export function resolveCommit(root, id) {
  if (!COMMIT_ID.test(id)) return null;
  try {
    return git(root, ['rev-parse', '--verify', '--quiet', `${id}^{commit}`]).trim();
  } catch {
    return null;
  }
}

/** Blobs of a commit's tree: [{path, mode, oid}] (`ls-tree -r -z --full-tree`, paths unquoted). */
export function listTree(root, commit) {
  let out;
  try {
    out = git(root, ['ls-tree', '-r', '-z', '--full-tree', commit]);
  } catch (err) {
    throw new UsageError(`git ls-tree fehlgeschlagen (${reason(err)})`);
  }
  return out.split('\0').filter((r) => r.length > 0).map((r) => {
    const tab = r.indexOf('\t');
    const [mode, type, oid] = r.slice(0, tab).split(' ');
    return { path: r.slice(tab + 1), mode, type, oid };
  }).filter((e) => e.type === 'blob');
}

/** Content of a blob as UTF-8 text (invalid sequences replaced). */
export function readBlob(root, oid) {
  try {
    return git(root, ['cat-file', 'blob', oid]);
  } catch (err) {
    throw new UsageError(`git cat-file fehlgeschlagen (${reason(err)})`);
  }
}
