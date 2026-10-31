// Split manifest and role-based split access (SLV0-EVAL-06/-07, SL1 §5.5).
// Access control is a protocol inside the tool, not secret protection; public fixtures are never
// holdout. Every decision, including violations, is appended to the ledger.
import { canonicalJson, sha256Hex, compareCodepoints } from '../core.js';
import { evalMsg, EvalRefusal, UsageError, requireSchema, isSha256 } from './common.js';
import { caseSha256 } from './prepare.js';
import { withLock } from './ledger.js';

export const MANIFEST_SCHEMA = 'eval-split-manifest';
export const SPLITS = ['dev', 'select', 'test', 'regression'];
export const ROLES = ['author', 'evaluator'];

/** Splits each role may read directly; `test` additionally needs a logged selection. */
const ROLE_SPLITS = { author: ['dev', 'regression'], evaluator: ['select', 'regression'] };

export function manifestSha256(manifest) {
  return sha256Hex(canonicalJson(manifest));
}

/** Throws family_split_overlap if a family appears in more than one split. */
export function checkManifest(manifest, label = 'manifest') {
  requireSchema(MANIFEST_SCHEMA, manifest, label);
  const ids = new Set();
  for (const c of manifest.cases) {
    if (ids.has(c.case_id)) throw new UsageError(`doppelte case_id ${c.case_id} im Manifest`);
    ids.add(c.case_id);
  }
  const bySplit = new Map();
  for (const c of manifest.cases) {
    if (!bySplit.has(c.family_id)) bySplit.set(c.family_id, new Set());
    bySplit.get(c.family_id).add(c.split);
  }
  const messages = [];
  for (const [family, splits] of [...bySplit.entries()].sort(([a], [b]) => compareCodepoints(a, b))) {
    if (splits.size > 1) {
      messages.push(evalMsg('family_split_overlap', family, `Familie liegt in mehreren Splits: ${[...splits].sort().join(', ')}`));
    }
  }
  if (messages.length > 0) throw new EvalRefusal(messages);
  const counts = Object.fromEntries(SPLITS.map((s) => [s, manifest.cases.filter((c) => c.split === s).length]));
  return { manifest_id: manifest.manifest_id, manifest_sha256: manifestSha256(manifest), cases: manifest.cases.length, je_split: counts };
}

/** Build a manifest from cases that carry `split` (e.g. skill-pilot-cases.json). */
export function buildManifest(cases, manifestId) {
  const manifest = {
    schema_version: 1,
    manifest_id: manifestId,
    cases: cases.map((c) => {
      if (!SPLITS.includes(c.split)) throw new UsageError(`${c.id}: split fehlt oder ist nicht ${SPLITS.join('|')}`);
      return { case_id: c.id, family_id: c.family_id, split: c.split, case_sha256: caseSha256(c) };
    }).sort((a, b) => compareCodepoints(a.case_id, b.case_id)),
  };
  checkManifest(manifest);
  return manifest;
}

/** Verify that the case files still hash to the manifest values. */
export function verifyCaseHashes(manifest, cases) {
  const byId = new Map(cases.map((c) => [c.id, c]));
  const problems = [];
  for (const m of manifest.cases) {
    const c = byId.get(m.case_id);
    if (!c) problems.push(`${m.case_id}: Fall fehlt`);
    else if (caseSha256(c) !== m.case_sha256) problems.push(`${m.case_id}: Fall-Hash weicht ab`);
    else if (c.family_id !== m.family_id) problems.push(`${m.case_id}: family_id weicht ab`);
  }
  return problems;
}

function boundManifest(entries, manifest) {
  const head = entries[0];
  const sha = manifestSha256(manifest);
  if (head.manifest_sha256 === null) throw new UsageError('Ledger ist an kein Split-Manifest gebunden (eval ledger init --manifest)');
  if (head.manifest_sha256 !== sha) throw new UsageError('Ledger ist an ein anderes Split-Manifest gebunden');
}

function testState(entries) {
  const selections = new Set(entries.filter((e) => e.kind === 'split_selection').map((e) => e.candidate_sha256));
  const consumedBy = entries.find((e) => e.kind === 'split_access' && e.split === 'test' && e.decision === 'granted')?.candidate_sha256 ?? null;
  return { selections, consumedBy };
}

function denied(entry, code, message) {
  const err = new EvalRefusal([evalMsg(code, `${entry.role}:${entry.split}`, message)]);
  err.appendBeforeRefusal = [{ ...entry, decision: 'denied', code, case_ids: [] }];
  return err;
}

/**
 * Request access to one split. Granted → returns the case IDs (and logs them). Denied → the
 * violation is logged, then split_access_denied / split_consumed is raised.
 */
export function accessSplit(ledgerFile, manifest, { role, split, candidateSha256 = null }) {
  if (!ROLES.includes(role)) throw new UsageError(`--role muss ${ROLES.join('|')} sein`);
  if (!SPLITS.includes(split)) throw new UsageError(`--split muss ${SPLITS.join('|')} sein`);
  if (candidateSha256 !== null && !isSha256(candidateSha256)) throw new UsageError('--candidate-sha256 ist kein SHA-256');
  checkManifest(manifest);
  const { appended } = withLock(ledgerFile, (entries) => {
    boundManifest(entries, manifest);
    const entry = { kind: 'split_access', role, split, candidate_sha256: candidateSha256 };
    if (split === 'test') {
      if (role !== 'evaluator') throw denied(entry, 'split_access_denied', 'nur die Auswertung darf test nach protokollierter Auswahl lesen');
      if (candidateSha256 === null) throw new UsageError('test-Zugriff braucht --candidate-sha256 des ausgewählten Kandidaten');
      const { selections, consumedBy } = testState(entries);
      if (consumedBy !== null && consumedBy !== candidateSha256) {
        throw denied(entry, 'split_consumed', 'test wurde bereits mit einem anderen Kandidaten genutzt; neue Runde braucht neue Testfälle');
      }
      if (!selections.has(candidateSha256)) {
        throw denied(entry, 'split_access_denied', 'keine protokollierte Auswahl für diesen Kandidatenhash');
      }
    } else if (!ROLE_SPLITS[role].includes(split)) {
      throw denied(entry, 'split_access_denied', `Rolle ${role} darf ${split} nicht lesen`);
    }
    const caseIds = manifest.cases.filter((c) => c.split === split).map((c) => c.case_id).sort(compareCodepoints);
    return [{ ...entry, decision: 'granted', code: null, case_ids: caseIds }];
  });
  return appended[0];
}

/** Log the selection of a candidate (evaluator only) before any test access. */
export function selectCandidate(ledgerFile, manifest, { role, candidateSha256 }) {
  if (!ROLES.includes(role)) throw new UsageError(`--role muss ${ROLES.join('|')} sein`);
  if (!isSha256(candidateSha256)) throw new UsageError('--candidate-sha256 fehlt oder ist kein SHA-256');
  checkManifest(manifest);
  const { appended } = withLock(ledgerFile, (entries) => {
    boundManifest(entries, manifest);
    const entry = { kind: 'split_access', role, split: 'test', candidate_sha256: candidateSha256 };
    if (role !== 'evaluator') throw denied(entry, 'split_access_denied', 'nur die Auswertung protokolliert die Auswahl');
    const { consumedBy } = testState(entries);
    if (consumedBy !== null && consumedBy !== candidateSha256) {
      throw denied(entry, 'split_consumed', 'test ist bereits von einem anderen Kandidaten verbraucht');
    }
    return [{ kind: 'split_selection', role, candidate_sha256: candidateSha256 }];
  });
  return appended[0];
}
