// Parser for the supported YAML subset of SKILL.md frontmatter (SLV0-VAL-01/-02).
// Own rule set (spec: "Eigene Vorgabe bis O-5"): one `key: scalar` per line, scalars plain or
// quoted with " or ', `metadata` as one level of `  key: scalar`. Anything else is rejected as a
// whole ("Fehler statt Teilparse"); the parser never returns partially parsed fields.

const TOP_KEY = /^([A-Za-z0-9_-]+):(?: (.*))?$/;
const META_KEY = /^ {2}([A-Za-z0-9_.-]+):(?: (.*))?$/;
// YAML c-indicators that may not start a plain scalar.
const FORBIDDEN_PLAIN_START = new Set([',', '[', ']', '{', '}', '#', '&', '*', '!', '|', '>', '%', '@', '`']);
const DQ_ESCAPES = { '"': '"', '\\': '\\', '/': '/', n: '\n', t: '\t', r: '\r' };

/** Parse one scalar. Returns {ok:true,value} or {ok:false,reason}. */
export function parseScalar(raw) {
  const s = raw.replace(/[ \t]+$/u, '').replace(/^[ \t]+/u, '');
  if (s === '') return { ok: true, value: '' };
  const first = s[0];
  if (first === '"') {
    let out = '';
    let i = 1;
    for (; i < s.length; i += 1) {
      const c = s[i];
      if (c === '"') break;
      if (c === '\\') {
        const e = s[i + 1];
        if (e === 'u') {
          const hex = s.slice(i + 2, i + 6);
          if (!/^[0-9A-Fa-f]{4}$/.test(hex)) return { ok: false, reason: 'ungültige \\u-Escape-Folge' };
          out += String.fromCharCode(parseInt(hex, 16));
          i += 5;
        } else if (e !== undefined && Object.hasOwn(DQ_ESCAPES, e)) {
          out += DQ_ESCAPES[e];
          i += 1;
        } else {
          return { ok: false, reason: 'nicht unterstützte Escape-Folge' };
        }
      } else {
        out += c;
      }
    }
    if (i >= s.length) return { ok: false, reason: 'doppeltes Anführungszeichen nicht geschlossen' };
    if (i !== s.length - 1) return { ok: false, reason: 'Text nach geschlossenem Skalar' };
    return { ok: true, value: out };
  }
  if (first === "'") {
    let out = '';
    let i = 1;
    for (; i < s.length; i += 1) {
      if (s[i] === "'") {
        if (s[i + 1] === "'") { out += "'"; i += 1; continue; }
        break;
      }
      out += s[i];
    }
    if (i >= s.length) return { ok: false, reason: 'einfaches Anführungszeichen nicht geschlossen' };
    if (i !== s.length - 1) return { ok: false, reason: 'Text nach geschlossenem Skalar' };
    return { ok: true, value: out };
  }
  if (FORBIDDEN_PLAIN_START.has(first)) {
    return { ok: false, reason: `Skalar beginnt mit YAML-Indikator "${first}" (Anker, Tag, Alias, Blockskalar, Flusssammlung, Kommentar oder reserviert)` };
  }
  if ((first === '-' || first === '?' || first === ':') && (s.length === 1 || s[1] === ' ' || s[1] === '\t')) {
    return { ok: false, reason: `Skalar beginnt mit YAML-Indikator "${first}"` };
  }
  if (/:[ \t]/u.test(s) || s.endsWith(':')) return { ok: false, reason: 'ungequoteter Skalar enthält ": " (verschachtelte Abbildung)' };
  if (/[ \t]#/u.test(s)) return { ok: false, reason: 'ungequoteter Skalar enthält " #" (Kommentar)' };
  return { ok: true, value: s };
}

/**
 * Parse frontmatter from SKILL.md text (BOM already removed by caller if present).
 * Result:
 *   {status:'missing', line, message}
 *   {status:'unsupported', line, message}
 *   {status:'ok', fields: Map<key,{value,line}>, metadata: Map<key,{value,line}>|null,
 *    closingLine, bodyByteOffset}
 */
export function parseFrontmatter(text) {
  const lines = text.split('\n').map((l) => (l.endsWith('\r') ? l.slice(0, -1) : l));
  if (lines[0] !== '---') {
    return { status: 'missing', line: 1, message: 'SKILL.md beginnt nicht mit einer Zeile "---"' };
  }
  let close = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === '---') { close = i; break; }
  }
  if (close < 0) {
    return { status: 'missing', line: 1, message: 'Frontmatter wird nicht mit einer Zeile "---" geschlossen' };
  }
  const fields = new Map();
  let metadata = null;
  let inMeta = false;
  const unsupported = (i, message) => ({ status: 'unsupported', line: i + 1, message });
  for (let i = 1; i < close; i += 1) {
    const line = lines[i];
    if (line.trim() === '') continue;
    if (inMeta && line.startsWith('  ')) {
      const m = META_KEY.exec(line);
      if (!m) return unsupported(i, 'metadata-Eintrag ist nicht "  schluessel: skalar" (eine Ebene, zwei Leerzeichen)');
      if (metadata.has(m[1])) return unsupported(i, `Mehrfachschlüssel in metadata: ${m[1]}`);
      const sc = parseScalar(m[2] ?? '');
      if (!sc.ok) return unsupported(i, `metadata.${m[1]}: ${sc.reason}`);
      metadata.set(m[1], { value: sc.value, line: i + 1 });
      continue;
    }
    if (/^\s/u.test(line)) return unsupported(i, 'eingerückte Zeile außerhalb von metadata (Mehrzeilen-Skalar oder Verschachtelung)');
    const m = TOP_KEY.exec(line);
    if (!m) return unsupported(i, 'Zeile ist nicht "schluessel: skalar"');
    const key = m[1];
    if (fields.has(key)) return unsupported(i, `Mehrfachschlüssel: ${key}`);
    if (key === 'metadata') {
      if ((m[2] ?? '').trim() !== '') return unsupported(i, 'metadata muss eine Abbildung mit eingerückten Einträgen sein');
      metadata = new Map();
      inMeta = true;
      fields.set(key, { value: null, line: i + 1 });
      continue;
    }
    inMeta = false;
    const sc = parseScalar(m[2] ?? '');
    if (!sc.ok) return unsupported(i, `${key}: ${sc.reason}`);
    fields.set(key, { value: sc.value, line: i + 1 });
  }
  const headerText = lines.slice(0, close + 1).join('\n');
  // Byte offset of the body in the original text; CR characters are kept in the original, so
  // recompute from the original text up to the (close+1)-th LF.
  let lf = -1;
  for (let k = 0; k <= close; k += 1) {
    lf = text.indexOf('\n', lf + 1);
    if (lf < 0) break;
  }
  const bodyCharOffset = lf < 0 ? text.length : lf + 1;
  return {
    status: 'ok',
    fields,
    metadata,
    closingLine: close + 1,
    headerText,
    bodyByteOffset: Buffer.byteLength(text.slice(0, bodyCharOffset), 'utf8'),
  };
}
