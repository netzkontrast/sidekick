// Shared helpers for the eval harness (docs/spec/skill-library-v0.md §7, §8).
// Eval refusals carry stable codes (§8) and abort the operation; no partial result counts as success.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sortMessages } from '../core.js';
import { validateSchema } from '../schema.js';
import { UsageError } from '../project.js';

/** Eval code → rule ID (spec §7/§8). All eval codes are errors. */
export const EVAL_RULES = {
  snapshot_hash_mismatch: 'SLV0-EVAL-02',
  candidate_baseline_mismatch: 'SLV0-EVAL-03',
  candidate_multi_dimension: 'SLV0-EVAL-03',
  replacement_not_unique: 'SLV0-EVAL-03',
  workspace_exists: 'SLV0-EVAL-04',
  config_overwrite: 'SLV0-EVAL-04',
  budget_exhausted: 'SLV0-EVAL-05',
  ledger_locked: 'SLV0-EVAL-05',
  family_split_overlap: 'SLV0-EVAL-06',
  split_access_denied: 'SLV0-EVAL-07',
  split_consumed: 'SLV0-EVAL-07',
  trace_invalid: 'SLV0-EVAL-08',
  report_without_raw: 'SLV0-EVAL-10',
  rubric_invalid: 'SLV0-EVAL-13',
  rubric_id_duplicate: 'SLV0-EVAL-13',
  rubric_stale: 'SLV0-EVAL-14',
  rubric_mismatch: 'SLV0-EVAL-15',
  rubric_version_mixed: 'SLV0-EVAL-15',
  ledger_mismatch: 'SLV0-EVAL-16',
  case_not_in_manifest: 'SLV0-EVAL-17',
  case_hash_mismatch: 'SLV0-EVAL-17',
  source_commit_mismatch: 'SLV0-EVAL-18',
  worktree_dirty: 'SLV0-EVAL-18',
  evidence_not_found: 'SLV0-EVAL-21',
  evidence_missing: 'SLV0-EVAL-21',
  evidence_unquoted: 'SLV0-EVAL-21',
  no_discriminating_check: 'SLV0-EVAL-23',
  family_not_discriminating: 'SLV0-EVAL-25',
  core_verdict_unclear: 'SLV0-EVAL-25',
  commit_unknown: 'SLV0-EVAL-29',
  sha_mismatch: 'SLV0-EVAL-29',
  ref_not_pinned: 'SLV0-EVAL-29',
  path_missing: 'SLV0-EVAL-29',
  path_ambiguous: 'SLV0-EVAL-29',
  range_out_of_bounds: 'SLV0-EVAL-29',
  commit_unverified: 'SLV0-EVAL-29',
  pattern_invalid: 'SLV0-EVAL-31',
  path_escapes_root: 'SLV0-EVAL-31',
  pattern_unmatched: 'SLV0-EVAL-32',
  file_missing: 'SLV0-EVAL-32',
  not_regular_file: 'SLV0-EVAL-32',
  symlink_in_pack: 'SLV0-EVAL-32',
  path_forbidden: 'SLV0-EVAL-32',
  nested_repository: 'SLV0-EVAL-32',
  file_not_text: 'SLV0-EVAL-32',
  output_exists: 'SLV0-EVAL-34',
};

/** Codes reported as warnings: they never change the exit code (spec §8). */
export const EVAL_WARNINGS = new Set(['evidence_unquoted', 'no_discriminating_check', 'commit_unverified']);

export function evalMsg(code, pathStr, message, line = null) {
  const rule = EVAL_RULES[code];
  if (!rule) throw new Error(`unknown eval code ${code}`);
  return { path: pathStr, line, code, severity: EVAL_WARNINGS.has(code) ? 'warning' : 'error', rule, message };
}

/** Thrown when an eval operation is refused with one or more §8 codes (exit 1). */
export class EvalRefusal extends Error {
  constructor(messages, extra = {}) {
    super(messages.map((m) => `${m.code}: ${m.message}`).join('; '));
    this.messages = sortMessages(messages);
    this.extra = extra;
  }
}

export function refuse(code, pathStr, message, extra = {}) {
  throw new EvalRefusal([evalMsg(code, pathStr, message)], extra);
}

export { UsageError };

const SCHEMA_DIR = new URL('../../../../docs/spec/schemas/', import.meta.url);
const schemaCache = new Map();

/** Load docs/spec/schemas/<name>.schema.json. */
export function loadEvalSchema(name) {
  if (!schemaCache.has(name)) {
    const file = fileURLToPath(new URL(`${name}.schema.json`, SCHEMA_DIR));
    schemaCache.set(name, JSON.parse(fs.readFileSync(file, 'utf8')));
  }
  return schemaCache.get(name);
}

/** Schema errors as strings ("/pointer: message"); empty when valid. */
export function schemaErrors(name, value) {
  return validateSchema(loadEvalSchema(name), value).map((e) => `${e.pointer || '/'}: ${e.message}`);
}

/** Input files violating their schema are operator errors (exit 2), never repaired. */
export function requireSchema(name, value, label) {
  const errs = schemaErrors(name, value);
  if (errs.length > 0) throw new UsageError(`${label} verletzt ${name}.schema.json: ${errs.slice(0, 5).join('; ')}${errs.length > 5 ? ` (+${errs.length - 5})` : ''}`);
  return value;
}

export function readJsonFile(file, label = file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') throw new UsageError(`${label}: Datei nicht gefunden`);
    throw err;
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new UsageError(`${label}: kein gültiges JSON (${err.message})`);
  }
}

/**
 * Safe POSIX relative path inside a workspace: no absolute path, no "..", no backslash, no empty
 * or "." segment. Returns the segments.
 */
export function safeRelativeSegments(rel) {
  if (typeof rel !== 'string' || rel.length === 0 || rel.startsWith('/') || rel.includes('\\') || /^[A-Za-z]:/.test(rel)) return null;
  const segs = rel.split('/');
  if (segs.some((s) => s === '' || s === '.' || s === '..')) return null;
  return segs;
}

export function isSha256(v) {
  return typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
}
