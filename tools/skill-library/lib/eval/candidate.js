// Candidate binding (SLV0-EVAL-03). A candidate is a set of replacements against exactly one
// snapshot and exactly one dimension. It is never a package and never active.
import { canonicalJson, sha256Hex } from '../core.js';
import { evalMsg, EvalRefusal, UsageError, isSha256 } from './common.js';
import { verifySnapshot, packageSetHash } from './snapshot.js';

/** Dimensions the harness can check mechanically (same set as the research helper). */
export const DIMENSIONS = ['description', 'project-binding'];
const ID_RE = /^K-[A-Za-z0-9._-]{1,64}$/;

/** Accepts {candidates: [...]}, a list, or a single candidate object. */
export function parseCandidates(data) {
  let list;
  if (Array.isArray(data)) list = data;
  else if (data && typeof data === 'object' && Array.isArray(data.candidates)) list = data.candidates;
  else if (data && typeof data === 'object' && 'id' in data) list = [data];
  else throw new UsageError('Kandidatendatei braucht {candidates: [...]} oder ein Kandidatenobjekt');
  const seen = new Set();
  for (const c of list) {
    if (!c || typeof c !== 'object') throw new UsageError('Kandidat ist kein Objekt');
    if (typeof c.id !== 'string' || !ID_RE.test(c.id)) throw new UsageError(`Kandidaten-ID muss K-… sein: ${JSON.stringify(c.id)}`);
    if (seen.has(c.id)) throw new UsageError(`doppelte Kandidaten-ID ${c.id}`);
    seen.add(c.id);
    if (!isSha256(c.baseline_sha256)) throw new UsageError(`${c.id}: baseline_sha256 fehlt oder ist kein SHA-256`);
    if (!Array.isArray(c.replacements) || c.replacements.length === 0) throw new UsageError(`${c.id}: replacements fehlt oder ist leer`);
    for (const r of c.replacements) {
      if (!r || typeof r.path !== 'string' || typeof r.before !== 'string' || typeof r.after !== 'string' || r.before.length === 0) {
        throw new UsageError(`${c.id}: Ersetzung braucht path, before (nicht leer) und after`);
      }
    }
    const dims = Array.isArray(c.dimension) ? c.dimension : [c.dimension];
    if (dims.length === 0 || dims.some((d) => typeof d !== 'string')) throw new UsageError(`${c.id}: dimension fehlt`);
    if (dims.length === 1 && !DIMENSIONS.includes(dims[0])) throw new UsageError(`${c.id}: unbekannte Dimension ${dims[0]} (bekannt: ${DIMENSIONS.join(', ')})`);
  }
  return list;
}

export function candidateSha256(candidate) {
  return sha256Hex(canonicalJson(candidate));
}

/** Line range [startLine, endLine] (0-based) covered by text[offset, offset+len). */
function lineSpan(text, offset, len) {
  const before = text.slice(0, offset);
  const start = before.split('\n').length - 1;
  const end = start + text.slice(offset, offset + Math.max(len, 1)).split('\n').length - 1;
  return [start, end];
}

/** Frontmatter line range [1, closingLine-1] and the description line index of a SKILL.md text. */
function frontmatterInfo(text) {
  const lines = text.split('\n');
  if (lines[0] !== '---') return null;
  const close = lines.indexOf('---', 1);
  if (close < 0) return null;
  let description = -1;
  for (let i = 1; i < close; i += 1) if (lines[i].startsWith('description:')) description = i;
  return { first: 0, last: close, description, lines };
}

function countOccurrences(text, needle) {
  let n = 0;
  for (let i = text.indexOf(needle); i >= 0; i = text.indexOf(needle, i + 1)) n += 1;
  return n;
}

/**
 * Apply one candidate to a verified snapshot. Returns {files, record}; throws EvalRefusal with
 * candidate_baseline_mismatch, candidate_multi_dimension or replacement_not_unique.
 * Replacements apply in order, each against the current text (as in the research helper).
 */
export function bindCandidate(snapshot, candidate, { verified = false } = {}) {
  if (!verified) verifySnapshot(snapshot);
  const id = candidate.id;
  const reject = (code, message) => { throw new EvalRefusal([evalMsg(code, id, message)], { candidate_id: id }); };
  if (candidate.baseline_sha256 !== snapshot.package_set_sha256) {
    reject('candidate_baseline_mismatch', `Kandidat gehört zu Baseline ${candidate.baseline_sha256.slice(0, 12)}…, Snapshot hat ${snapshot.package_set_sha256.slice(0, 12)}…`);
  }
  const dims = Array.isArray(candidate.dimension) ? candidate.dimension : [candidate.dimension];
  if (new Set(dims).size > 1) reject('candidate_multi_dimension', `mehr als eine Dimension: ${dims.join(', ')}`);
  const dimension = dims[0];
  if (dimension === 'description' && candidate.replacements.length !== 1) {
    reject('candidate_multi_dimension', 'Beschreibungskandidat muss genau eine Ersetzung (die description-Zeile) haben');
  }
  const files = Object.fromEntries(Object.entries(snapshot.files).map(([p, r]) => [p, r.content]));
  const changed = new Map();
  candidate.replacements.forEach((change, idx) => {
    const where = `${change.path} (Ersetzung ${idx + 1})`;
    if (!Object.hasOwn(files, change.path)) reject('replacement_not_unique', `${where}: Datei nicht im Snapshot`);
    const text = files[change.path];
    const n = countOccurrences(text, change.before);
    if (n !== 1) reject('replacement_not_unique', `${where}: before kommt ${n}-mal vor statt genau einmal`);
    const offset = text.indexOf(change.before);
    const isSkill = change.path.endsWith('/SKILL.md');
    const fm = isSkill ? frontmatterInfo(text) : null;
    const [start, end] = lineSpan(text, offset, change.before.length);
    if (dimension === 'description') {
      const lineStart = offset === 0 || text[offset - 1] === '\n';
      const lineEnd = text[offset + change.before.length] === '\n' || offset + change.before.length === text.length;
      const ok = isSkill && fm && fm.description >= 0 && start === fm.description && end === fm.description
        && lineStart && lineEnd && change.before.startsWith('description:') && change.after.startsWith('description:')
        && !/[\r\n]/.test(change.after);
      if (!ok) reject('candidate_multi_dimension', `${where}: Beschreibungskandidat ändert mehr oder anderes als genau die description-Zeile`);
    } else if (fm && start <= fm.last && end >= fm.first) {
      // Frontmatter is what the client sees before activation (selection); another dimension.
      reject('candidate_multi_dimension', `${where}: Kandidat der Dimension ${dimension} berührt das Frontmatter (Auswahl-Dimension)`);
    }
    files[change.path] = text.slice(0, offset) + change.after + text.slice(offset + change.before.length);
    if (!changed.has(change.path)) changed.set(change.path, sha256Hex(Buffer.from(text, 'utf8')));
  });
  const changedFiles = [...changed.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([p, beforeHash]) => ({
    path: p, before_sha256: beforeHash, after_sha256: sha256Hex(Buffer.from(files[p], 'utf8')),
  }));
  return {
    files,
    record: {
      candidate_id: id,
      candidate_sha256: candidateSha256(candidate),
      dimension,
      baseline_sha256: snapshot.package_set_sha256,
      changed_files: changedFiles,
      variant_package_set_sha256: packageSetHash(files),
    },
  };
}
