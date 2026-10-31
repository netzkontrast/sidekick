// Case folders: fall.json (eval-case.schema.json) plus fixture/ (SLV0-EVAL-22, §7.3/§7.4).
// Loading validates the schema and what the schema cannot express: exactly one rule per check,
// unique check and finding IDs, safe paths, compilable patterns. Violations are usage errors (exit 2).
import fs from 'node:fs';
import path from 'node:path';
import { compareCodepoints } from '../core.js';
import { UsageError, readJsonFile, requireSchema, safeRelativeSegments } from './common.js';
import { requireDir } from './tree.js';
import { normalizeText } from './textmatch.js';

export const CASE_SCHEMA = 'eval-case';
export const RULES = ['frontmatter', 'frontmatter_in', 'contains', 'not_contains', 'regex', 'count_at_least', 'absent_anywhere', 'only_changed_under', 'no_new_files_under', 'new_file_under'];

/** ID of the check at index i: its own `id` or `<case_id>-P<nn>`. */
export function checkId(caseId, check, i) {
  return check.id ?? `${caseId}-P${String(i + 1).padStart(2, '0')}`;
}

/** Rule name of a check (exactly one, else usage error). */
export function ruleOf(check, where) {
  const rules = RULES.filter((r) => Object.hasOwn(check, r));
  if (rules.length !== 1) throw new UsageError(`${where}: Prüfung braucht genau eine Regel, hat ${rules.length === 0 ? 'keine' : rules.join(', ')}`);
  if (Object.hasOwn(check, 'file') && ['absent_anywhere', 'only_changed_under', 'no_new_files_under', 'new_file_under'].includes(rules[0])) {
    throw new UsageError(`${where}: Regel ${rules[0]} nimmt kein file`);
  }
  return rules[0];
}

/** Validate a parsed fall.json beyond its schema; returns the case object. */
export function validateCase(c, label) {
  requireSchema(CASE_SCHEMA, c, label);
  const ids = new Set();
  (c.checks ?? []).forEach((chk, i) => {
    const where = `${label} checks[${i}]`;
    ruleOf(chk, where);
    const id = checkId(c.id, chk, i);
    if (ids.has(id)) throw new UsageError(`${where}: doppelte Prüf-ID ${id}`);
    ids.add(id);
    if (chk.file !== undefined && !safeRelativeSegments(chk.file)) throw new UsageError(`${where}: unsicherer Pfad ${JSON.stringify(chk.file)}`);
    if (chk.regex !== undefined) {
      try { new RegExp(chk.regex); } catch (err) { throw new UsageError(`${where}: ungültiges Muster (${err.message})`); }
    }
    if (chk.count_at_least !== undefined) {
      const [s, n] = chk.count_at_least;
      if (typeof s !== 'string' || s.length === 0 || !Number.isInteger(n) || n < 1) throw new UsageError(`${where}: count_at_least erwartet [Text, Anzahl ≥ 1]`);
    }
  });
  if (c.kern_kriterium !== undefined && c.kern_kriterium === c.gegen_kriterium) throw new UsageError(`${label}: kern_kriterium und gegen_kriterium sind gleich`);
  const bids = new Set();
  for (const [i, b] of (c.erwartete_befunde ?? []).entries()) {
    if (bids.has(b.id)) throw new UsageError(`${label} erwartete_befunde[${i}]: doppelte ID ${b.id}`);
    bids.add(b.id);
    for (const g of b.token_gruppen) {
      for (const t of g) if (normalizeText(t.endsWith('*') ? t.slice(0, -1) : t).length === 0) throw new UsageError(`${label} erwartete_befunde[${i}]: leere Alternative`);
    }
    if (b.fundstelle_datei !== undefined && !safeRelativeSegments(b.fundstelle_datei)) throw new UsageError(`${label} erwartete_befunde[${i}]: unsicherer Pfad ${JSON.stringify(b.fundstelle_datei)}`);
  }
  return c;
}

/** Load one case folder: {dir, fixtureDir, caseObj}. */
export function loadCaseDir(dir) {
  requireDir(dir);
  const file = path.join(dir, 'fall.json');
  const label = `${path.basename(dir)}/fall.json`;
  const caseObj = validateCase(readJsonFile(file, label), label);
  const fixtureDir = path.join(dir, 'fixture');
  requireDir(fixtureDir, `${path.basename(dir)}/fixture`);
  return { dir, fixtureDir, caseObj };
}

/** A case folder, or a folder whose direct subfolders with fall.json are case folders (sorted). */
export function loadCaseDirs(dir) {
  requireDir(dir);
  if (fs.existsSync(path.join(dir, 'fall.json'))) return [loadCaseDir(dir)];
  const subs = fs.readdirSync(dir).sort(compareCodepoints)
    .filter((n) => fs.lstatSync(path.join(dir, n)).isDirectory() && fs.existsSync(path.join(dir, n, 'fall.json')));
  if (subs.length === 0) throw new UsageError(`${path.basename(dir)}: kein Fallordner (fall.json) gefunden`);
  const cases = subs.map((n) => loadCaseDir(path.join(dir, n)));
  const seen = new Set();
  for (const c of cases) {
    if (seen.has(c.caseObj.id)) throw new UsageError(`doppelte Fall-ID ${c.caseObj.id}`);
    seen.add(c.caseObj.id);
  }
  return cases;
}
