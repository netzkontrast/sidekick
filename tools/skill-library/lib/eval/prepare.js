// Prepare trial workspaces (SLV0-EVAL-04). Plans only: no client start (SLV0-INV-04).
// Everything is computed and checked in memory first; only then is the output directory created
// (never overwritten) and written with exclusive-create flags. With a split manifest every case
// must be listed with the same case hash (SLV0-EVAL-17).
import fs from 'node:fs';
import path from 'node:path';
import { canonicalJson, sha256Hex, compareCodepoints } from '../core.js';
import { PACKAGES_DIR, ADAPTER_DIR } from '../project.js';
import { TOOL_NAME, TOOL_VERSION } from '../core.js';
import { evalMsg, EvalRefusal, UsageError, safeRelativeSegments } from './common.js';
import { verifySnapshot, packageHashes, packageSetHash } from './snapshot.js';
import { bindCandidate, candidateSha256 } from './candidate.js';
import { checkManifest, manifestSha256 } from './split.js';

const CASE_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
// Configuration a client may pick up from the workspace: root entries, and rule files that clients
// also load from nested directories on demand (SLV0-EVAL-04).
const CONFIG_ROOTS = ['.claude', '.agents', '.mcp.json'];
const CONFIG_FILES = ['agents.md', 'claude.md', 'claude.local.md'];

/** Case files must not add or overwrite experiment configuration (case-insensitive). */
function touchesConfig(rel) {
  const segs = rel.split('/').map((s) => s.toLowerCase());
  return CONFIG_ROOTS.includes(segs[0]) || segs.some((s) => CONFIG_FILES.includes(s));
}

export function parseCases(data) {
  const list = Array.isArray(data) ? data : data && Array.isArray(data.cases) ? data.cases : null;
  if (!list || list.length === 0) throw new UsageError('Falldatei braucht {cases: [...]} mit mindestens einem Fall');
  const seen = new Set();
  for (const c of list) {
    if (!c || typeof c !== 'object') throw new UsageError('Fall ist kein Objekt');
    if (typeof c.id !== 'string' || !CASE_ID_RE.test(c.id)) throw new UsageError(`Fall-ID ungültig: ${JSON.stringify(c.id)}`);
    if (seen.has(c.id)) throw new UsageError(`doppelte Fall-ID ${c.id}`);
    seen.add(c.id);
    if (typeof c.family_id !== 'string' || !CASE_ID_RE.test(c.family_id)) throw new UsageError(`${c.id}: family_id fehlt oder ist ungültig`);
    if (typeof c.prompt !== 'string') throw new UsageError(`${c.id}: prompt fehlt`);
    if (c.files !== undefined && (typeof c.files !== 'object' || Array.isArray(c.files) || c.files === null)) throw new UsageError(`${c.id}: files muss ein Objekt {pfad: inhalt} sein`);
    for (const [p, v] of Object.entries(c.files ?? {})) {
      if (typeof v !== 'string') throw new UsageError(`${c.id}: Inhalt von ${p} ist kein String`);
    }
    if (c.variants !== undefined && (!Array.isArray(c.variants) || c.variants.some((v) => typeof v !== 'string'))) throw new UsageError(`${c.id}: variants muss eine Liste sein`);
  }
  return list;
}

/** SHA-256 over the canonical JSON of a case object (same as case_sha256 in the research helper). */
export function caseSha256(caseObj) {
  return sha256Hex(canonicalJson(caseObj));
}

/**
 * SLV0-EVAL-17: every case is in the split manifest with the same case hash. Checks all cases
 * before refusing; returns a map case_id → manifest row.
 */
export function checkCasesAgainstManifest(cases, splitManifest) {
  checkManifest(splitManifest, 'manifest');
  const rows = new Map(splitManifest.cases.map((m) => [m.case_id, m]));
  const messages = [];
  for (const c of cases) {
    const m = rows.get(c.id);
    if (!m) messages.push(evalMsg('case_not_in_manifest', c.id, `Fall fehlt im Split-Manifest ${splitManifest.manifest_id}`));
    else if (caseSha256(c) !== m.case_sha256) messages.push(evalMsg('case_hash_mismatch', c.id, `Fall-Hash weicht vom Split-Manifest ${splitManifest.manifest_id} ab (Fall nach dem Manifest geändert?)`));
  }
  if (messages.length > 0) throw new EvalRefusal(messages);
  return rows;
}

/**
 * @param {{snapshot, cases, candidates, projectConfig: string, output: string, splitManifest?: object|null}} args
 * @returns manifest (also written to <output>/trials.json)
 */
export function prepare({ snapshot, cases, candidates = [], projectConfig, output, splitManifest = null }) {
  verifySnapshot(snapshot);
  const manifestRows = splitManifest !== null ? checkCasesAgainstManifest(cases, splitManifest) : null;
  if (typeof projectConfig !== 'string' || projectConfig.length === 0) throw new UsageError('Projektkonfiguration fehlt oder ist leer');
  const outAbs = path.resolve(output);
  if (fs.existsSync(outAbs) || isLink(outAbs)) {
    throw new EvalRefusal([evalMsg('workspace_exists', output, 'Ziel existiert bereits; Vorbereiten braucht ein frisches Verzeichnis und überschreibt nie')]);
  }
  if (!fs.existsSync(path.dirname(outAbs))) throw new UsageError(`Elternverzeichnis von ${output} fehlt`);

  const byId = new Map();
  for (const c of candidates) byId.set(c.id, { candidate: c, ...bindCandidate(snapshot, c, { verified: true }) });
  const baseFiles = Object.fromEntries(Object.entries(snapshot.files).map(([p, r]) => [p, r.content]));
  const configSha = sha256Hex(projectConfig);

  const trials = [];
  const writes = []; // {trialId, files: {rel: content}, skills: [name]}
  for (const c of cases) {
    for (const rel of Object.keys(c.files ?? {})) {
      if (!safeRelativeSegments(rel)) throw new UsageError(`${c.id}: unsicherer Dateipfad ${rel}`);
      if (touchesConfig(rel)) {
        throw new EvalRefusal([evalMsg('config_overwrite', `${c.id}:${rel}`, 'Falldatei würde Experimentkonfiguration anlegen oder überschreiben (.claude/, .agents/, .mcp.json; AGENTS.md, CLAUDE.md, CLAUDE.local.md in jedem Verzeichnis)')]);
      }
    }
    const variants = c.variants ?? ['B1'];
    if (new Set(variants).size !== variants.length) throw new UsageError(`${c.id}: doppelte Variante`);
    for (const variant of variants) {
      if (variant !== 'B0' && variant !== 'B1' && !byId.has(variant)) throw new UsageError(`${c.id}: unbekannte Variante ${variant}`);
      const trialId = `${c.id}--${variant}`;
      let pkgFiles = {};
      if (variant === 'B1') pkgFiles = baseFiles;
      else if (variant !== 'B0') pkgFiles = byId.get(variant).files;
      const skills = variant === 'B0' ? [] : packageHashes(pkgFiles);
      writes.push({ trialId, pkgFiles, caseFiles: c.files ?? {}, skills: skills.map((s) => s.name) });
      trials.push({
        trial_id: trialId,
        case_id: c.id,
        family_id: c.family_id,
        split: manifestRows ? manifestRows.get(c.id).split : typeof c.split === 'string' ? c.split : null,
        variant,
        workspace: trialId,
        prompt: projectConfig + c.prompt,
        allowed_skills: Array.isArray(c.allowed_skills) ? c.allowed_skills : [],
        skills,
        project_configuration_sha256: configSha,
        case_sha256: caseSha256(c),
        baseline_sha256: snapshot.package_set_sha256,
        candidate_sha256: byId.has(variant) ? candidateSha256(byId.get(variant).candidate) : null,
        variant_package_set_sha256: variant === 'B0' ? null : packageSetHash(pkgFiles),
        planned_only: true,
      });
    }
  }
  const ids = trials.map((t) => t.trial_id);
  if (new Set(ids).size !== ids.length) throw new UsageError('doppelte Versuchs-IDs');

  const manifest = {
    schema_version: 1,
    tool: TOOL_NAME,
    tool_version: TOOL_VERSION,
    model_starts: 0,
    baseline_sha256: snapshot.package_set_sha256,
    source_commit: snapshot.source_commit,
    project_configuration_sha256: configSha,
    split_manifest_sha256: splitManifest !== null ? manifestSha256(splitManifest) : null,
    trials,
  };

  // Write phase. mkdir without `recursive` fails with EEXIST if a concurrent writer created it.
  try {
    fs.mkdirSync(outAbs);
  } catch (err) {
    if (err.code === 'EEXIST') throw new EvalRefusal([evalMsg('workspace_exists', output, 'Ziel existiert bereits')]);
    throw err;
  }
  for (const w of writes) {
    const root = path.join(outAbs, w.trialId);
    fs.mkdirSync(root);
    const all = { ...w.pkgFiles, ...w.caseFiles };
    for (const rel of Object.keys(all).sort(compareCodepoints)) writeExclusive(root, rel, all[rel]);
    if (w.skills.length > 0) {
      const adapterDir = path.join(root, ...ADAPTER_DIR.split('/'));
      fs.mkdirSync(adapterDir, { recursive: true });
      // Relative links as required by SLV0-VAL-15 (the research helper used absolute links).
      for (const name of w.skills) fs.symlinkSync(`../../${PACKAGES_DIR}/${name}`, path.join(adapterDir, name));
    }
  }
  writeExclusive(outAbs, 'trials.json', `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

function writeExclusive(root, rel, content) {
  const segs = safeRelativeSegments(rel);
  if (!segs) throw new UsageError(`unsicherer Pfad ${rel}`);
  const abs = path.join(root, ...segs);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, { flag: 'wx' });
}

function isLink(p) {
  try { return fs.lstatSync(p).isSymbolicLink(); } catch { return false; }
}
