// Shared pure helpers: hashing, canonical JSON, ordering, UTF-8 checks, text statistics.
// Spec: docs/spec/skill-library-v0.md (SLV0-PKG-21/-22, SLV0-INV-03).
import { createHash } from 'node:crypto';

export const TOOL_NAME = 'skill-library';
export const TOOL_VERSION = '0.1.0';
export const HASH_PROFILE = 'sl-hash-v0';
export const HASH_ALGORITHM = 'sha256';
export const CHECKED_LEVEL = 'M0';

/** SHA-256 over raw bytes (or the UTF-8 bytes of a string), lowercase hex. */
export function sha256Hex(data) {
  return createHash('sha256').update(typeof data === 'string' ? Buffer.from(data, 'utf8') : data).digest('hex');
}

/** Compare two strings by Unicode code point (not UTF-16 code unit). */
export function compareCodepoints(a, b) {
  if (a === b) return 0;
  const ai = a[Symbol.iterator]();
  const bi = b[Symbol.iterator]();
  for (;;) {
    const x = ai.next();
    const y = bi.next();
    if (x.done && y.done) return 0;
    if (x.done) return -1;
    if (y.done) return 1;
    const cx = x.value.codePointAt(0);
    const cy = y.value.codePointAt(0);
    if (cx !== cy) return cx < cy ? -1 : 1;
  }
}

/**
 * Canonical JSON (SLV0-PKG-22): keys sorted by code point, separators "," and ":",
 * no whitespace, non-ASCII characters unescaped.
 */
export function canonicalJson(value) {
  if (value === null || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('canonical JSON: non-finite number');
    return JSON.stringify(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort(compareCodepoints);
    return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalJson(value[k])).join(',') + '}';
  }
  throw new Error('canonical JSON: unsupported value');
}

/** Hash of a map {path: fileHash} after SLV0-PKG-22/-23. */
export function hashOfFileMap(map) {
  return sha256Hex(canonicalJson(map));
}

/** Index of the first byte that breaks strict UTF-8, or -1 if the buffer is valid. */
export function firstInvalidUtf8(buf) {
  const n = buf.length;
  let i = 0;
  while (i < n) {
    const b = buf[i];
    if (b < 0x80) { i += 1; continue; }
    let need;
    if (b >= 0xc2 && b <= 0xdf) need = 1;
    else if (b >= 0xe0 && b <= 0xef) need = 2;
    else if (b >= 0xf0 && b <= 0xf4) need = 3;
    else return i;
    if (i + need > n - 1) return i; // truncated sequence
    const lo = b === 0xe0 ? 0xa0 : b === 0xf0 ? 0x90 : 0x80;
    const hi = b === 0xed ? 0x9f : b === 0xf4 ? 0x8f : 0xbf;
    if (buf[i + 1] < lo || buf[i + 1] > hi) return i;
    for (let k = 2; k <= need; k += 1) {
      if (buf[i + k] < 0x80 || buf[i + k] > 0xbf) return i;
    }
    i += need + 1;
  }
  return -1;
}

/** 1-based line number of a byte offset (counts LF bytes before it). */
export function lineOfOffset(buf, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < buf.length; i += 1) if (buf[i] === 0x0a) line += 1;
  return line;
}

/** Exact text statistics (SLV0-TOK-02, SLV0-VAL-13). Bytes, lines and words are not tokens. */
export function textStats(buf) {
  const text = buf.toString('utf8');
  let lines = 0;
  for (const byte of buf) if (byte === 0x0a) lines += 1;
  if (buf.length > 0 && buf[buf.length - 1] !== 0x0a) lines += 1;
  const words = text.split(/\s+/u).filter((w) => w.length > 0).length;
  return { bytes: buf.length, lines, words };
}

export function codepointLength(s) {
  let n = 0;
  for (const _ of s) n += 1; // eslint-disable-line no-unused-vars
  return n;
}

/** Stable message order (SLV0-VAL-17): path, line, code, then message text as tie-breaker. */
export function sortMessages(messages) {
  return [...messages].sort((a, b) => (
    compareCodepoints(a.path, b.path)
    || ((a.line ?? 0) - (b.line ?? 0))
    || compareCodepoints(a.code, b.code)
    || compareCodepoints(a.message, b.message)
  ));
}

export function countBySeverity(messages) {
  let errors = 0;
  let warnings = 0;
  for (const m of messages) {
    if (m.severity === 'error') errors += 1;
    else warnings += 1;
  }
  return { errors, warnings };
}
