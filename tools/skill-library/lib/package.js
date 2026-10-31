// Package reading and package-scope rules (SLV0-PKG-01…06, -20…22; SLV0-VAL-01…14).
// Reads only; never follows symlinks; never writes (SLV0-INV-08).
import fs from 'node:fs';
import path from 'node:path';
import {
  compareCodepoints, firstInvalidUtf8, lineOfOffset, sha256Hex, hashOfFileMap,
  codepointLength, textStats, sortMessages,
} from './core.js';
import { parseFrontmatter } from './frontmatter.js';

/** Allowed frontmatter fields (SLV0-PKG-02). */
export const ALLOWED_FIELDS = ['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'];
export const NAME_MAX = 64; // SLV0-PKG-03
export const DESCRIPTION_MAX = 1024; // SLV0-PKG-04
export const COMPATIBILITY_MAX = 500; // SLV0-VAL-05
export const FILE_MAX_BYTES = 1024 * 1024; // SLV0-VAL-14
/** Size budgets, proposals only (SLV0-VAL-13, open O-6). Warnings, never errors. */
export const BUDGETS = {
  skillMdLines: 500,
  skillMdBytes: 8192,
  referenceBytes: 16384,
  packageBytes: 65536,
};

/** Code → rule ID (spec §5) and severity (spec §5/§8). */
export const RULES = {
  frontmatter_missing: ['SLV0-VAL-01', 'error'],
  frontmatter_unsupported: ['SLV0-VAL-02', 'error'],
  field_unknown: ['SLV0-VAL-03', 'error'],
  name_invalid: ['SLV0-VAL-04', 'error'],
  name_folder_mismatch: ['SLV0-VAL-04', 'error'],
  description_missing: ['SLV0-VAL-05', 'error'],
  description_too_long: ['SLV0-VAL-05', 'error'],
  field_too_long: ['SLV0-VAL-05', 'error'],
  reference_missing: ['SLV0-VAL-06', 'error'],
  reference_escapes_package: ['SLV0-VAL-06', 'error'],
  absolute_path: ['SLV0-VAL-06', 'error'],
  anchor_unresolved: ['SLV0-VAL-07', 'warning'],
  path_not_portable: ['SLV0-VAL-08', 'error'],
  case_collision: ['SLV0-VAL-08', 'error'],
  hidden_file: ['SLV0-VAL-08', 'error'],
  executable_content: ['SLV0-VAL-08', 'error'],
  entry_unsupported: ['SLV0-VAL-08', 'error'],
  symlink_in_package: ['SLV0-VAL-09', 'error'],
  encoding_invalid: ['SLV0-VAL-10', 'error'],
  bom_present: ['SLV0-VAL-10', 'error'],
  line_endings_crlf: ['SLV0-VAL-10', 'error'],
  project_binding_suspected: ['SLV0-VAL-11', 'warning'],
  reference_unused: ['SLV0-VAL-12', 'warning'],
  budget_exceeded: ['SLV0-VAL-13', 'warning'],
  file_too_large: ['SLV0-VAL-14', 'error'],
  adapter_missing: ['SLV0-VAL-15', 'error'],
  adapter_link_invalid: ['SLV0-VAL-15', 'error'],
  adapter_orphaned: ['SLV0-VAL-15', 'error'],
  registry_invalid: ['SLV0-VAL-16', 'error'],
  hash_mismatch: ['SLV0-VAL-16', 'error'],
  version_hash_conflict: ['SLV0-VAL-16', 'error'],
};

export function msg(code, pathStr, line, message) {
  const rule = RULES[code];
  if (!rule) throw new Error(`unknown message code ${code}`);
  return { path: pathStr, line: line ?? null, code, severity: rule[1], rule: rule[0], message };
}

const PORTABLE_SEGMENT = /^[A-Za-z0-9._-]+$/;
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * List all entries below absRoot without following symlinks. Directories that are symlinks are
 * reported as symlinks and never entered, so loops terminate (SLV0-VAL-09).
 */
export function listEntries(absRoot) {
  const out = [];
  const rec = (relDir) => {
    const absDir = relDir ? path.join(absRoot, ...relDir.split('/')) : absRoot;
    const names = fs.readdirSync(absDir).sort(compareCodepoints);
    for (const name of names) {
      const rel = relDir ? `${relDir}/${name}` : name;
      const st = fs.lstatSync(path.join(absDir, name));
      let kind = 'other';
      if (st.isSymbolicLink()) kind = 'symlink';
      else if (st.isDirectory()) kind = 'dir';
      else if (st.isFile()) kind = 'file';
      out.push({ rel, name, parent: relDir, kind, mode: st.mode, size: st.size });
      if (kind === 'dir') rec(rel);
    }
  };
  rec('');
  return out;
}

/** Slug rule of SLV0-VAL-07. */
export function headingSlug(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N} -]/gu, '').replace(/ /g, '-');
}

/** Lines of a Markdown text with fenced code blocks marked. */
function markdownLines(text) {
  const lines = text.split('\n');
  let fence = null;
  return lines.map((line, idx) => {
    const m = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (m) {
      if (fence === null) { fence = m[1][0]; return { idx, line, code: true }; }
      if (m[1][0] === fence) { fence = null; return { idx, line, code: true }; }
    }
    return { idx, line, code: fence !== null };
  });
}

export function headingSlugs(text) {
  const slugs = new Set();
  for (const { line, code } of markdownLines(text)) {
    if (code) continue;
    const m = /^ {0,3}#{1,6}[ \t]+(.*?)[ \t]*#*[ \t]*$/.exec(line);
    if (m) slugs.add(headingSlug(m[1]));
  }
  return slugs;
}

/**
 * Extract link targets: inline Markdown links/images `[..](target)` and code spans that start
 * with `references/` (SLV0-VAL-06). Fenced code blocks are skipped. Inline code spans are not
 * scanned for Markdown links.
 */
export function extractReferences(text) {
  const refs = [];
  for (const { idx, line, code } of markdownLines(text)) {
    if (code) continue;
    // Split line into code spans and prose.
    const parts = [];
    const re = /(`+)([\s\S]*?)\1/g;
    let last = 0;
    let m;
    while ((m = re.exec(line)) !== null) {
      parts.push({ prose: line.slice(last, m.index) });
      parts.push({ code: m[2].trim() });
      last = m.index + m[0].length;
    }
    parts.push({ prose: line.slice(last) });
    for (const p of parts) {
      if (p.code !== undefined) {
        if (/^references\/\S+$/.test(p.code)) refs.push({ target: p.code, line: idx + 1, kind: 'code', base: 'package' });
        continue;
      }
      const linkRe = /!?\[[^\]]*\]\(\s*<?([^)\s>]*)>?(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;
      let lm;
      while ((lm = linkRe.exec(p.prose)) !== null) {
        refs.push({ target: lm[1], line: idx + 1, kind: 'link', base: 'file' });
      }
    }
  }
  return refs;
}

function safeDecode(s) {
  try { return decodeURIComponent(s); } catch { return s; }
}

/**
 * Validate one package folder. `display` is the path prefix used in messages (repo-relative in
 * project scope, folder name in package scope); absolute paths never appear in output.
 * Returns {name, path, valid, content_hash, messages, files:[{rel, bytes(Buffer)}], frontmatter}.
 */
export function validatePackage(absDir, { display, folderName, projectStrings = null } = {}) {
  const folder = folderName ?? path.basename(absDir);
  const prefix = display ?? folder;
  const P = (rel) => (rel ? `${prefix}/${rel}` : prefix);
  const messages = [];
  const result = { name: folder, path: prefix, valid: false, content_hash: null, messages, files: [], frontmatter: null };

  const rootStat = fs.lstatSync(absDir);
  if (rootStat.isSymbolicLink()) {
    messages.push(msg('symlink_in_package', P(''), null, 'Paketordner ist ein Symlink; er wird nicht verfolgt'));
    result.messages = sortMessages(messages);
    return result;
  }
  if (!rootStat.isDirectory()) {
    messages.push(msg('entry_unsupported', P(''), null, 'Paket ist kein Ordner'));
    result.messages = sortMessages(messages);
    return result;
  }

  const entries = listEntries(absDir);
  const blocked = new Set(); // rel paths whose descendants are not reported again
  const isBlocked = (rel) => {
    for (let p = rel; p.includes('/');) {
      p = p.slice(0, p.lastIndexOf('/'));
      if (blocked.has(p)) return true;
    }
    return false;
  };
  const siblingsLower = new Map(); // parent -> Map(lower -> first rel)
  const files = []; // regular files that are allowed
  for (const e of entries) {
    if (isBlocked(e.rel)) { blocked.add(e.rel); continue; }
    // Case collisions among siblings (SLV0-VAL-08).
    const key = e.parent;
    if (!siblingsLower.has(key)) siblingsLower.set(key, new Map());
    const lower = e.name.toLowerCase();
    const seen = siblingsLower.get(key);
    if (seen.has(lower)) {
      messages.push(msg('case_collision', P(e.rel), null, `kollidiert ohne Groß-/Kleinschreibung mit ${P(seen.get(lower))}`));
    } else {
      seen.set(lower, e.rel);
    }
    if (e.kind === 'symlink') {
      messages.push(msg('symlink_in_package', P(e.rel), null, 'Symlink im Paket; wird nicht verfolgt'));
      blocked.add(e.rel);
      continue;
    }
    if (e.name.startsWith('.')) {
      messages.push(msg('hidden_file', P(e.rel), null, 'versteckter Eintrag'));
      blocked.add(e.rel);
      continue;
    }
    if (!PORTABLE_SEGMENT.test(e.name)) {
      messages.push(msg('path_not_portable', P(e.rel), null, 'Pfadsegment außerhalb [A-Za-z0-9._-]'));
    }
    const segs = e.rel.split('/');
    let allowed;
    if (segs.length === 1) {
      allowed = (e.name === 'SKILL.md' && e.kind === 'file')
        || (e.name === 'references' && e.kind === 'dir')
        || (e.name === 'agents' && e.kind === 'dir');
    } else if (segs[0] === 'references') {
      allowed = e.kind === 'file' || e.kind === 'dir';
    } else if (segs[0] === 'agents') {
      allowed = e.rel === 'agents/openai.yaml' && e.kind === 'file';
    } else {
      allowed = false;
    }
    if (!allowed) {
      messages.push(msg('entry_unsupported', P(e.rel), null, 'in V0 unzulässiger Eintrag (erlaubt: SKILL.md, references/, agents/openai.yaml)'));
      blocked.add(e.rel);
      continue;
    }
    if (e.kind !== 'file') continue;
    if ((e.mode & 0o111) !== 0) {
      messages.push(msg('executable_content', P(e.rel), null, 'Ausführungsbit gesetzt'));
    }
    if (e.size > FILE_MAX_BYTES) {
      messages.push(msg('file_too_large', P(e.rel), null, `${e.size} Bytes > ${FILE_MAX_BYTES}`));
      continue;
    }
    files.push(e);
  }

  // Read and check encoding (SLV0-VAL-10).
  const texts = new Map(); // rel -> text (only for valid UTF-8 files)
  const fileBytes = new Map();
  for (const e of files) {
    const buf = fs.readFileSync(path.join(absDir, ...e.rel.split('/')));
    fileBytes.set(e.rel, buf);
    let ok = true;
    if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
      messages.push(msg('bom_present', P(e.rel), 1, 'UTF-8-BOM am Dateianfang'));
    }
    const bad = firstInvalidUtf8(buf);
    if (bad >= 0) {
      messages.push(msg('encoding_invalid', P(e.rel), lineOfOffset(buf, bad), `ungültige UTF-8-Folge bei Byte ${bad}`));
      ok = false;
    }
    const cr = buf.indexOf(0x0d);
    if (cr >= 0) {
      const crlf = buf[cr + 1] === 0x0a;
      messages.push(msg('line_endings_crlf', P(e.rel), lineOfOffset(buf, cr), crlf ? 'Zeilenende CRLF statt LF' : 'Wagenrücklauf (CR) statt LF'));
    }
    if (ok) {
      let text = buf.toString('utf8');
      if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
      texts.set(e.rel, text);
    }
  }

  // Frontmatter (SLV0-VAL-01…05).
  const hasSkillMd = files.some((e) => e.rel === 'SKILL.md') || entries.some((e) => e.rel === 'SKILL.md' && e.kind === 'file');
  if (!hasSkillMd) {
    messages.push(msg('frontmatter_missing', P('SKILL.md'), null, 'SKILL.md fehlt'));
  } else if (texts.has('SKILL.md')) {
    const fm = parseFrontmatter(texts.get('SKILL.md'));
    result.frontmatter = fm;
    const at = P('SKILL.md');
    if (fm.status === 'missing') {
      messages.push(msg('frontmatter_missing', at, fm.line, fm.message));
    } else if (fm.status === 'unsupported') {
      messages.push(msg('frontmatter_unsupported', at, fm.line, `${fm.message}; kein Teilparse`));
    } else {
      for (const [key, { line }] of fm.fields) {
        if (!ALLOWED_FIELDS.includes(key)) messages.push(msg('field_unknown', at, line, `Feld "${key}" ist nicht zulässig (SLV0-PKG-02)`));
      }
      const name = fm.fields.get('name');
      if (!name) {
        messages.push(msg('name_invalid', at, null, 'Pflichtfeld "name" fehlt'));
      } else {
        const len = codepointLength(name.value);
        if (len < 1 || len > NAME_MAX || !NAME_PATTERN.test(name.value)) {
          messages.push(msg('name_invalid', at, name.line, `"name" verletzt SLV0-PKG-03 (1–${NAME_MAX} Zeichen, a-z 0-9 -, kein -- und kein - am Rand)`));
        } else if (name.value !== folder) {
          messages.push(msg('name_folder_mismatch', at, name.line, `"name" (${name.value}) ungleich Ordnername (${folder})`));
        }
      }
      const desc = fm.fields.get('description');
      const descLen = desc ? codepointLength(desc.value.trim()) : 0;
      if (!desc || descLen === 0) {
        messages.push(msg('description_missing', at, desc ? desc.line : null, 'Pflichtfeld "description" fehlt oder ist leer'));
      } else if (descLen > DESCRIPTION_MAX) {
        messages.push(msg('description_too_long', at, desc.line, `${descLen} Codepoints > ${DESCRIPTION_MAX}`));
      }
      const compat = fm.fields.get('compatibility');
      if (compat && codepointLength(compat.value) > COMPATIBILITY_MAX) {
        messages.push(msg('field_too_long', at, compat.line, `"compatibility" ${codepointLength(compat.value)} Zeichen > ${COMPATIBILITY_MAX}`));
      }
    }
  }

  // References and anchors (SLV0-VAL-06/-07/-12).
  const fileSet = new Set(files.map((e) => e.rel));
  const allFileRels = new Set(entries.filter((e) => e.kind === 'file').map((e) => e.rel));
  const linked = new Set();
  const slugCache = new Map();
  const slugsOf = (rel) => {
    if (!slugCache.has(rel)) slugCache.set(rel, texts.has(rel) ? headingSlugs(texts.get(rel)) : null);
    return slugCache.get(rel);
  };
  const mdFiles = [...texts.keys()].filter((rel) => rel === 'SKILL.md' || (rel.startsWith('references/') && rel.endsWith('.md')));
  for (const rel of mdFiles) {
    const at = P(rel);
    for (const ref of extractReferences(texts.get(rel))) {
      const raw = ref.target;
      if (raw === '') continue;
      if (/^[A-Za-z][A-Za-z0-9+.-]+:/.test(raw)) continue; // URL with scheme: not followed
      const hashAt = raw.indexOf('#');
      const rawPath = hashAt >= 0 ? raw.slice(0, hashAt) : raw;
      const anchor = hashAt >= 0 ? safeDecode(raw.slice(hashAt + 1)) : null;
      const target = safeDecode(rawPath);
      let resolved;
      if (target === '') {
        resolved = rel; // same-file anchor
      } else {
        if (target.includes('\\')) {
          messages.push(msg('path_not_portable', at, ref.line, `Verweis "${raw}" enthält "\\"`));
          continue;
        }
        if (target.startsWith('/') || /^[A-Za-z]:/.test(target)) {
          messages.push(msg('absolute_path', at, ref.line, `absoluter Pfad "${raw}"`));
          continue;
        }
        const baseDir = ref.base === 'package' ? '' : path.posix.dirname(rel) === '.' ? '' : path.posix.dirname(rel);
        const joined = path.posix.normalize(baseDir ? `${baseDir}/${target}` : target);
        if (joined === '..' || joined.startsWith('../')) {
          messages.push(msg('reference_escapes_package', at, ref.line, `Verweis "${raw}" verlässt das Paket`));
          continue;
        }
        resolved = joined.replace(/\/$/, '');
        if (!allFileRels.has(resolved)) {
          messages.push(msg('reference_missing', at, ref.line, `Verweisziel "${raw}" ist keine Datei im Paket`));
          continue;
        }
        if (resolved !== rel) linked.add(resolved);
      }
      if (anchor !== null && anchor !== '' && resolved.endsWith('.md') && fileSet.has(resolved)) {
        const slugs = slugsOf(resolved);
        if (slugs && !slugs.has(anchor)) {
          messages.push(msg('anchor_unresolved', at, ref.line, `Anker "#${anchor}" hat keine passende Überschrift in ${resolved} (Slug-Regel clientabhängig)`));
        }
      }
    }
  }
  for (const rel of [...fileSet].sort(compareCodepoints)) {
    if (rel.startsWith('references/') && !linked.has(rel)) {
      messages.push(msg('reference_unused', P(rel), null, 'Referenzdatei wird von keiner Paketdatei verlinkt'));
    }
  }

  // Project neutrality (SLV0-VAL-11): only with an explicit list.
  if (Array.isArray(projectStrings) && projectStrings.length > 0) {
    for (const [rel, text] of [...texts.entries()].sort((a, b) => compareCodepoints(a[0], b[0]))) {
      text.split('\n').forEach((line, i) => {
        for (const s of projectStrings) {
          if (s !== '' && line.includes(s)) {
            messages.push(msg('project_binding_suspected', P(rel), i + 1, `projektspezifische Zeichenkette "${s}"`));
          }
        }
      });
    }
  }

  // Size budgets (SLV0-VAL-13), warnings only.
  let total = 0;
  for (const e of files) {
    const buf = fileBytes.get(e.rel);
    total += buf.length;
    if (e.rel === 'SKILL.md') {
      const st = textStats(buf);
      if (st.lines > BUDGETS.skillMdLines) messages.push(msg('budget_exceeded', P(e.rel), null, `SKILL.md ${st.lines} Zeilen > ${BUDGETS.skillMdLines} (Vorschlag O-6)`));
      if (st.bytes > BUDGETS.skillMdBytes) messages.push(msg('budget_exceeded', P(e.rel), null, `SKILL.md ${st.bytes} Bytes > ${BUDGETS.skillMdBytes} (Vorschlag O-6)`));
    } else if (e.rel.startsWith('references/') && buf.length > BUDGETS.referenceBytes) {
      messages.push(msg('budget_exceeded', P(e.rel), null, `Referenzdatei ${buf.length} Bytes > ${BUDGETS.referenceBytes} (Vorschlag O-6)`));
    }
  }
  if (total > BUDGETS.packageBytes) {
    messages.push(msg('budget_exceeded', P(''), null, `Paket ${total} Bytes > ${BUDGETS.packageBytes} (Vorschlag O-6)`));
  }

  result.messages = sortMessages(messages);
  result.valid = !messages.some((m) => m.severity === 'error');
  result.files = files.map((e) => ({ rel: e.rel, bytes: fileBytes.get(e.rel) }))
    .sort((a, b) => compareCodepoints(a.rel, b.rel));
  if (result.valid) result.content_hash = contentHash(result.files);
  return result;
}

/** Map {relPath: fileHash} for a list of {rel, bytes}. */
export function fileHashMap(files, prefix = '') {
  const map = {};
  for (const f of files) map[prefix + f.rel] = sha256Hex(f.bytes);
  return map;
}

/** Content hash of a package (SLV0-PKG-22). */
export function contentHash(files) {
  return hashOfFileMap(fileHashMap(files));
}
