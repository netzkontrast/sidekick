// Fail-closed context pack (SLV0-EVAL-31…34, `eval context-pack`, spec §7.6).
// Selection first, as a record (files, hashes, token estimates); rendering second, only from that
// record. Every doubt aborts: an invalid pattern, a pattern without match, a missing file, a path
// escaping the root, a symlink, a forbidden path, a nested repository or a non-text file. There is
// never an empty pack and never an "everything" pack. Reads only; the only write is the bundle to an
// explicitly given new path, created exclusively (never overwritten).
import fs from 'node:fs';
import path from 'node:path';
import {
  TOOL_NAME, TOOL_VERSION, HASH_ALGORITHM, HASH_PROFILE,
  compareCodepoints, sha256Hex, hashOfFileMap, firstInvalidUtf8, textStats,
} from '../core.js';
import { estimateToken, sumTokens } from '../tokens.js';
import { evalMsg, EvalRefusal, UsageError, requireSchema } from './common.js';

export const PACK_FORMAT = 'sl-context-pack@1';
export const BUNDLE_FORMAT = 'sl-context-bundle@1';
/** Always active; an allowlist or `--deny` can only add to this list (SLV0-EVAL-32). */
export const DEFAULT_DENY = ['**/.git', '**/.env*', '**/kandidaten'];

const RESERVED = /[[\]{}!\\]/;
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f]/;

/**
 * Parse a pattern (§7.6). Returns {segs, glob} or {code, reason}. `segs` items are
 * {globstar: true} or {name, re}. With `allowWildcardOnly: false` a pattern made only of
 * `*`, `?` and `/` is invalid (it would select nearly everything).
 */
export function parsePattern(pattern, { allowWildcardOnly = false } = {}) {
  const bad = (reason) => ({ code: 'pattern_invalid', reason });
  if (typeof pattern !== 'string' || pattern.length === 0) return bad('leeres Muster');
  if (CONTROL.test(pattern)) return bad('Steuerzeichen');
  if (pattern.startsWith('/') || /^[A-Za-z]:/.test(pattern)) return { code: 'path_escapes_root', reason: 'absoluter Pfad' };
  if (RESERVED.test(pattern)) return bad('reserviertes Zeichen ([ ] { } ! \\)');
  const raw = pattern.split('/');
  if (raw.includes('..')) return { code: 'path_escapes_root', reason: '..-Segment' };
  if (pattern.endsWith('/')) return bad('/ am Ende (Verzeichnis: verz/** verwenden)');
  if (raw.some((s) => s === '' || s === '.')) return bad('leeres oder .-Segment');
  if (!allowWildcardOnly && /^[*?/]+$/.test(pattern)) return bad('nur Platzhalter');
  const segs = [];
  let glob = false;
  for (const s of raw) {
    if (s === '**') { segs.push({ globstar: true }); glob = true; continue; }
    if (s.includes('**')) return bad('** nur als ganzes Segment');
    if (/[*?]/.test(s)) glob = true;
    const re = s.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]');
    segs.push({ name: s, re: new RegExp(`^${re}$`, 'su') });
  }
  return { segs, glob };
}

/**
 * Segment matcher. mode 'full': the whole path matches. mode 'prefix': `pathSegs` names a
 * directory below which the pattern can still match something. A trailing `**` needs at least one
 * segment; elsewhere `**` matches zero or more segments.
 */
export function matchSegments(segs, pathSegs, mode = 'full', ci = false) {
  const memo = new Map();
  const segOk = (s, name) => (ci ? new RegExp(s.re.source, 'sui').test(name) : s.re.test(name));
  const m = (pi, si) => {
    const key = pi * 4096 + si;
    if (memo.has(key)) return memo.get(key);
    let r;
    if (si === pathSegs.length) r = mode === 'prefix' ? pi < segs.length : pi === segs.length;
    else if (pi === segs.length) r = false;
    else if (segs[pi].globstar) r = (pi + 1 < segs.length && m(pi + 1, si)) || m(pi + 1, si + 1) || m(pi, si + 1);
    else r = segOk(segs[pi], pathSegs[si]) && m(pi + 1, si + 1);
    memo.set(key, r);
    return r;
  };
  return m(0, 0);
}

/** First forbidden prefix of `rel` (the path itself or a parent directory), case-insensitive. */
function forbiddenPrefix(rel, deny) {
  const segs = rel.split('/');
  for (let n = 1; n <= segs.length; n += 1) {
    const prefix = segs.slice(0, n);
    const hit = deny.find((d) => matchSegments(d.parsed.segs, prefix, 'full', true));
    if (hit) return { prefix: prefix.join('/'), muster: hit.muster };
  }
  return null;
}

function lstatOrNull(abs) {
  try { return fs.lstatSync(abs); } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return null;
    throw err;
  }
}

const abs = (root, rel) => (rel === '' ? root : path.join(root, ...rel.split('/')));

/** Resolve a literal path pattern; component names must exist exactly (no case folding). */
function resolveLiteral(root, segs, label, msgs) {
  let rel = '';
  for (let i = 0; i < segs.length; i += 1) {
    const parent = abs(root, rel);
    const names = (() => { try { return fs.readdirSync(parent); } catch { return []; } })();
    const name = segs[i].name;
    rel = rel === '' ? name : `${rel}/${name}`;
    if (!names.includes(name)) { msgs.push(evalMsg('file_missing', rel, `${label}: Datei fehlt`)); return null; }
    const st = fs.lstatSync(abs(root, rel));
    if (st.isSymbolicLink()) { msgs.push(evalMsg('symlink_in_pack', rel, `${label}: Symlink im Pfad; Symlinks werden nicht verfolgt`)); return null; }
    const last = i === segs.length - 1;
    if (!last && !st.isDirectory()) { msgs.push(evalMsg('file_missing', rel, `${label}: kein Verzeichnis im Pfad`)); return null; }
    if (last && !st.isFile()) { msgs.push(evalMsg('not_regular_file', rel, `${label}: keine reguläre Datei (Verzeichnis: verz/** verwenden)`)); return null; }
  }
  return rel;
}

/** Walk a glob below its literal base; returns {files, links, specials} as relative paths. */
function walkGlob(root, segs, label, msgs) {
  const out = { files: [], links: [], specials: [] };
  let base = '';
  let i = 0;
  for (; i < segs.length && !segs[i].globstar && !/[*?]/.test(segs[i].name); i += 1) {
    base = base === '' ? segs[i].name : `${base}/${segs[i].name}`;
    const st = lstatOrNull(abs(root, base));
    if (st === null || (!st.isDirectory() && !st.isSymbolicLink())) {
      msgs.push(evalMsg('pattern_unmatched', label, `Startordner ${base} fehlt; das Muster trifft nichts`));
      return null;
    }
    if (st.isSymbolicLink()) {
      msgs.push(evalMsg('symlink_in_pack', base, `${label}: Startordner ist ein Symlink; Symlinks werden nicht verfolgt`));
      return null;
    }
  }
  const walk = (rel) => {
    for (const name of fs.readdirSync(abs(root, rel)).sort(compareCodepoints)) {
      const r = rel === '' ? name : `${rel}/${name}`;
      const parts = r.split('/');
      const st = fs.lstatSync(abs(root, r));
      const full = matchSegments(segs, parts, 'full');
      if (st.isSymbolicLink()) { if (full || matchSegments(segs, parts, 'prefix')) out.links.push(r); }
      else if (st.isDirectory()) { if (matchSegments(segs, parts, 'prefix')) walk(r); }
      else if (st.isFile()) { if (full) out.files.push(r); }
      else if (full) out.specials.push(r);
    }
  };
  walk(base);
  return out;
}

/** Nearest directory below the root (parent of `rel`) holding its own `.git` entry, or null. */
function nestedRepo(root, rel) {
  const segs = rel.split('/');
  for (let n = 1; n < segs.length; n += 1) {
    const dir = segs.slice(0, n).join('/');
    if (lstatOrNull(abs(root, `${dir}/.git`)) !== null) return dir;
  }
  return null;
}

function displayDeny(entries) {
  return entries.map(({ muster, quelle }) => ({ muster, quelle }));
}

/**
 * Build a context pack. `allowlistBytes` is the raw allowlist file (its hash is recorded).
 * Returns the record (SLV0-EVAL-33); throws EvalRefusal with all collected codes, or UsageError.
 */
export function buildContextPack({ root, allowlistBytes, allowlistLabel = 'allowlist', extraDeny = [], estimator = null }) {
  let allowlist;
  try { allowlist = JSON.parse(allowlistBytes.toString('utf8')); } catch (err) {
    throw new UsageError(`${allowlistLabel}: kein gültiges JSON (${err.message})`);
  }
  requireSchema('eval-context-allowlist', allowlist, allowlistLabel);
  const msgs = [];

  // SLV0-EVAL-31: every pattern and deny entry is checked before any file access.
  const deny = [
    ...DEFAULT_DENY.map((m) => ({ muster: m, quelle: 'standard' })),
    ...(allowlist.sperre ?? []).map((m) => ({ muster: m, quelle: 'allowlist' })),
    ...extraDeny.map((m) => ({ muster: m, quelle: 'aufruf' })),
  ];
  for (const d of deny) {
    d.parsed = parsePattern(d.muster, { allowWildcardOnly: true });
    if (d.parsed.code) msgs.push(evalMsg(d.parsed.code, d.muster, `Sperrmuster (${d.quelle}): ${d.parsed.reason}`));
  }
  const patterns = allowlist.eingaben.map((e, index) => ({ index, muster: e.muster, wofuer: e.wofuer ?? null, parsed: parsePattern(e.muster) }));
  for (const p of patterns) {
    if (p.parsed.code) msgs.push(evalMsg(p.parsed.code, p.muster, `Muster ${p.index}: ${p.parsed.reason}`));
  }
  if (msgs.length > 0) throw new EvalRefusal(msgs, { stufe: 'muster' });

  // SLV0-EVAL-32: resolve every pattern; collect all problems.
  const selected = new Map(); // rel -> Set(index)
  const forbiddenGroups = new Map(); // prefix -> {muster: deny, labels: Set, n}
  const noteForbidden = (rel, label) => {
    const f = forbiddenPrefix(rel, deny);
    if (!f) return false;
    const g = forbiddenGroups.get(f.prefix) ?? { deny: f.muster, labels: new Set(), n: 0 };
    g.labels.add(label);
    g.n += 1;
    forbiddenGroups.set(f.prefix, g);
    return true;
  };
  const counts = new Map();
  for (const p of patterns) {
    const label = `Muster ${p.index} (${p.muster})`;
    const hits = [];
    if (!p.parsed.glob) {
      const rel = p.parsed.segs.map((s) => s.name).join('/');
      if (noteForbidden(rel, label)) continue; // never touched
      const got = resolveLiteral(root, p.parsed.segs, label, msgs);
      if (got !== null) hits.push(got);
    } else {
      const walked = walkGlob(root, p.parsed.segs, label, msgs);
      if (walked === null) continue;
      for (const r of walked.links) if (!noteForbidden(r, label)) msgs.push(evalMsg('symlink_in_pack', r, `${label}: Symlink im Suchbereich; Symlinks werden nicht verfolgt`));
      for (const r of walked.specials) if (!noteForbidden(r, label)) msgs.push(evalMsg('not_regular_file', r, `${label}: keine reguläre Datei`));
      for (const r of walked.files) if (!noteForbidden(r, label)) hits.push(r);
      if (walked.files.length + walked.links.length + walked.specials.length === 0) {
        msgs.push(evalMsg('pattern_unmatched', p.muster, `${label}: trifft keine Datei`));
      }
    }
    for (const r of hits) {
      if (!selected.has(r)) selected.set(r, new Set());
      selected.get(r).add(p.index);
    }
    counts.set(p.index, hits.length);
  }
  for (const [prefix, g] of forbiddenGroups) {
    msgs.push(evalMsg('path_forbidden', prefix, `gesperrt durch ${g.deny}; ${g.n} Treffer von ${[...g.labels].join(', ')}; Inhalt nicht gelesen`));
  }

  const files = [];
  for (const rel of [...selected.keys()].sort(compareCodepoints)) {
    const repo = nestedRepo(root, rel);
    if (repo !== null) { msgs.push(evalMsg('nested_repository', rel, `liegt im eingebetteten Repository ${repo}/`)); continue; }
    const buf = fs.readFileSync(abs(root, rel));
    if (firstInvalidUtf8(buf) !== -1 || buf.includes(0)) { msgs.push(evalMsg('file_not_text', rel, 'kein UTF-8-Text (ungültige Folge oder NUL-Byte)')); continue; }
    files.push({ rel, buf, indices: [...selected.get(rel)].sort((a, b) => a - b) });
  }
  if (msgs.length > 0) throw new EvalRefusal(msgs, { stufe: 'auswahl' });
  if (files.length === 0) throw new Error('internal: empty pack without refusal'); // unreachable by construction

  // SLV0-EVAL-33: the record.
  const dateien = files.map(({ rel, buf, indices }) => ({
    pfad: rel,
    sha256: sha256Hex(buf),
    bytes: buf.length,
    zeilen: textStats(buf).lines,
    tokens: estimateToken(buf.length, estimator, rel),
    muster: indices,
  }));
  const map = Object.fromEntries(dateien.map((d) => [d.pfad, d.sha256]));
  return {
    record: {
      schema_version: 1,
      format: PACK_FORMAT,
      tool: TOOL_NAME,
      tool_version: TOOL_VERSION,
      hash: { algorithm: HASH_ALGORITHM, profile: HASH_PROFILE },
      kontextpaket_sha256: hashOfFileMap(map),
      allowlist: { sha256: sha256Hex(allowlistBytes), ziel: allowlist.ziel, rolle: allowlist.rolle ?? null },
      muster: patterns.map((p) => ({ index: p.index, muster: p.muster, art: p.parsed.glob ? 'glob' : 'pfad', wofuer: p.wofuer, dateien: counts.get(p.index) })),
      sperrliste: displayDeny(deny),
      schaetzer: estimator,
      dateien,
      summe: {
        dateien: dateien.length,
        bytes: dateien.reduce((a, d) => a + d.bytes, 0),
        zeilen: dateien.reduce((a, d) => a + d.zeilen, 0),
        tokens: sumTokens(dateien.map((d) => d.tokens), 'kontextpaket'),
      },
      bundle: null,
    },
    contents: new Map(files.map((f) => [f.rel, f.buf])),
  };
}

/** Shortest run of backticks that is longer than every run in `text` (at least `min`). */
function fenceFor(text, min) {
  let longest = 0;
  for (const m of text.matchAll(/`+/g)) longest = Math.max(longest, m[0].length);
  return '`'.repeat(Math.max(min, longest + 1));
}

function inlineCode(text) {
  const f = fenceFor(text, 1);
  const pad = text.startsWith('`') || text.endsWith('`') ? ' ' : '';
  return `${f}${pad}${text}${pad}${f}`;
}

function tokenText(t) {
  return t.quelle === 'unbekannt' ? 'unbekannt' : `${t.wert} (Schätzung ${t.methode})`;
}

/** Render the Markdown bundle (§7.6) from the finished record and the selected bytes only. */
export function renderBundle(record, contents) {
  const out = [
    '# Kontextpaket',
    '',
    `- Format: \`${BUNDLE_FORMAT}\``,
    `- Kontextpaket-Hash (sha256, sl-hash-v0): \`${record.kontextpaket_sha256}\``,
    `- Ziel: ${record.allowlist.ziel}`,
    `- Rolle: ${record.allowlist.rolle ?? '–'}`,
    `- Dateien: ${record.summe.dateien} · Bytes: ${record.summe.bytes} · Tokens: ${tokenText(record.summe.tokens)}`,
    '',
    'Nur die folgenden Dateien gehören zum Paket. Tokenzahlen sind Schätzungen, keine Messwerte.',
  ];
  record.dateien.forEach((d, i) => {
    const text = contents.get(d.pfad).toString('utf8');
    const fence = fenceFor(text, 3);
    out.push('', `## ${i + 1}. ${inlineCode(d.pfad)}`, '', `- sha256: \`${d.sha256}\` · Bytes: ${d.bytes} · Tokens: ${tokenText(d.tokens)}`, '', fence);
    out.push(`${text}${text.endsWith('\n') || text.length === 0 ? '' : '\n'}${fence}`);
  });
  return Buffer.from(`${out.join('\n')}\n`, 'utf8');
}

/** Write the bundle exclusively; an existing path (even a dangling symlink) → output_exists. */
export function writeBundle(file, buf) {
  const dir = path.dirname(path.resolve(file));
  let st;
  try { st = fs.statSync(dir); } catch { throw new UsageError(`--output: Ordner ${path.dirname(file)} fehlt`); }
  if (!st.isDirectory()) throw new UsageError(`--output: ${path.dirname(file)} ist kein Ordner`);
  if (lstatOrNull(file) !== null) throw new EvalRefusal([evalMsg('output_exists', path.basename(file), 'Zieldatei existiert; nichts wird überschrieben')]);
  try {
    fs.writeFileSync(file, buf, { flag: 'wx' });
  } catch (err) {
    if (err.code === 'EEXIST') throw new EvalRefusal([evalMsg('output_exists', path.basename(file), 'Zieldatei existiert; nichts wird überschrieben')]);
    throw err;
  }
  return { format: BUNDLE_FORMAT, sha256: sha256Hex(buf), bytes: buf.length };
}
