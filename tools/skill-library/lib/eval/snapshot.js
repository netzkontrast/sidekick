// Freeze and verify snapshots (SLV0-EVAL-01/-02, SLV0-PKG-23).
// Snapshot form equals the research helper (skill_pilot.py freeze) so existing baselines stay valid.
import { compareCodepoints, hashOfFileMap, sha256Hex } from '../core.js';
import { validateProject, PACKAGES_DIR } from '../project.js';
import { EvalRefusal, evalMsg, requireSchema, UsageError, safeRelativeSegments } from './common.js';
import { verifyGitSource } from './git.js';

export const SNAPSHOT_SCHEMA = 'eval-snapshot';
const COMMIT_RE = /^[0-9a-f]{7,64}$/;

function checkCommit(commit) {
  if (typeof commit !== 'string' || !COMMIT_RE.test(commit)) {
    throw new UsageError('Quellcommit muss 7–64 Hexadezimalzeichen (klein) haben');
  }
}

function checkSnapshotPath(p) {
  const segs = safeRelativeSegments(p);
  if (!segs || !p.startsWith(`${PACKAGES_DIR}/`) || segs.length < 4) {
    throw new UsageError(`Pfad nicht unter ${PACKAGES_DIR}/<paket>/: ${p} (SLV0-EVAL-01)`);
  }
}

/** Build a snapshot from {path: content}; paths sorted by code point. */
function build(sourceCommit, contents) {
  const files = {};
  for (const p of Object.keys(contents).sort(compareCodepoints)) {
    checkSnapshotPath(p);
    files[p] = { content: contents[p], sha256: sha256Hex(Buffer.from(contents[p], 'utf8')) };
  }
  if (Object.keys(files).length === 0) throw new UsageError('Snapshot ohne Dateien');
  const map = Object.fromEntries(Object.entries(files).map(([p, r]) => [p, r.sha256]));
  return { schema_version: 1, source_commit: sourceCommit, files, package_set_sha256: hashOfFileMap(map) };
}

/**
 * Freeze the packages of a repository working tree. Invalid packages get no hash (SLV0-PKG-20),
 * so any validator error refuses the snapshot. The source commit is stated by the caller; with
 * `verifyGit` it must equal HEAD and .agents/skills/ must be clean (SLV0-EVAL-18).
 */
export function freezeFromRepo(repoRoot, sourceCommit, { verifyGit = false } = {}) {
  checkCommit(sourceCommit);
  if (verifyGit) verifyGitSource(repoRoot, sourceCommit);
  const res = validateProject(repoRoot, { adapters: false });
  const errors = res.messages.filter((m) => m.severity === 'error');
  if (errors.length > 0 || res.package_set_hash === null) {
    throw new EvalRefusal(errors, { hinweis: 'Ungültige Pakete werden nicht eingefroren (SLV0-PKG-20); Details: validate.' });
  }
  const contents = {};
  for (const p of res.packages) {
    for (const f of p.files) contents[`${PACKAGES_DIR}/${p.name}/${f.rel}`] = f.bytes.toString('utf8');
  }
  const snap = build(sourceCommit, contents);
  if (snap.package_set_sha256 !== res.package_set_hash) throw new Error('interner Fehler: Paketsatz-Hash weicht vom Validator ab');
  return snap;
}

/** Freeze from the research helper's source form {source_commit, files: {path: content}}. */
export function freezeFromSource(source) {
  if (!source || typeof source !== 'object' || !source.files || typeof source.files !== 'object' || Array.isArray(source.files)) {
    throw new UsageError('Quelle braucht {source_commit, files: {pfad: inhalt}}');
  }
  checkCommit(source.source_commit);
  for (const [p, c] of Object.entries(source.files)) {
    if (typeof c !== 'string') throw new UsageError(`Inhalt von ${p} ist kein String`);
  }
  return build(source.source_commit, source.files);
}

/**
 * Recompute every file hash and the package-set hash (SLV0-EVAL-02). Throws EvalRefusal with
 * `snapshot_hash_mismatch` on any deviation; returns a summary otherwise.
 */
export function verifySnapshot(snap, label = 'snapshot') {
  requireSchema(SNAPSHOT_SCHEMA, snap, label);
  const messages = [];
  const map = {};
  for (const [p, rec] of Object.entries(snap.files)) {
    checkSnapshotPath(p);
    const h = sha256Hex(Buffer.from(rec.content, 'utf8'));
    if (h !== rec.sha256) messages.push(evalMsg('snapshot_hash_mismatch', p, `Dateihash ${rec.sha256.slice(0, 12)}… passt nicht zum Inhalt (${h.slice(0, 12)}…)`));
    map[p] = h;
  }
  const computed = hashOfFileMap(map);
  if (computed !== snap.package_set_sha256) {
    messages.push(evalMsg('snapshot_hash_mismatch', label, `Paketsatz-Hash ${snap.package_set_sha256.slice(0, 12)}… ungleich berechnet ${computed.slice(0, 12)}…`));
  }
  if (messages.length > 0) throw new EvalRefusal(messages);
  const packages = [...new Set(Object.keys(snap.files).map((p) => p.split('/')[2]))].sort(compareCodepoints);
  return { source_commit: snap.source_commit, files: Object.keys(map).length, packages, package_set_sha256: computed };
}

/** Content hash per package (sl-hash-v0) from a map {repoPath: content}. */
export function packageHashes(files) {
  const per = {};
  for (const [p, content] of Object.entries(files)) {
    const [, , name, ...rest] = p.split('/');
    per[name] ??= {};
    per[name][rest.join('/')] = sha256Hex(Buffer.from(content, 'utf8'));
  }
  return Object.keys(per).sort(compareCodepoints).map((name) => ({ name, sha256: hashOfFileMap(per[name]) }));
}

/** Package-set hash of a map {repoPath: content}. */
export function packageSetHash(files) {
  const map = {};
  for (const [p, c] of Object.entries(files)) map[p] = sha256Hex(Buffer.from(c, 'utf8'));
  return hashOfFileMap(map);
}
