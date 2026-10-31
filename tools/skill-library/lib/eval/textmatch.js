// Text normalisation and matching for evidence and finding checks (SLV0-EVAL-20, -26).
// Normalisation `sl-judge-norm@1`: typographic quotes to ASCII, Markdown characters * ` | _ > #
// to spaces, whitespace runs to one space, edges trimmed. Pure functions, no I/O.
import { codepointLength } from '../core.js';

export const NORM_ID = 'sl-judge-norm@1';
export const MIN_FRAGMENT = 12;
export const MIN_SEARCH_TERM = 3;
const EDGE = new Set([...'„“”"«»‚‘’\'', ' ', '\t', '\n', '\r']);
/** Ellipsis markers that split a quote into fragments; bracketed forms first. */
const ELLIPSIS = /\s*(?:\(…\)|\[…\]|\(\.\.\.\)|\[\.\.\.\]|…|\.\.\.)\s*/u;
/** Quoted parts of an older evidence text: opening „ " « ‚, closing “ " » ‘, at least 6 characters. */
const QUOTED_PART = /[„"«‚]([^“"»‘]{6,})[“"»‘]/gu;

export function normalizeText(s) {
  return s
    .replace(/[„“”«»]/gu, '"')
    .replace(/[‚‘’]/gu, "'")
    .replace(/[*`|_>#]/g, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

/** Strip quote characters and whitespace from both ends (before normalising a fragment). */
export function stripEdges(s) {
  const cps = [...s];
  let a = 0;
  let b = cps.length;
  while (a < b && EDGE.has(cps[a])) a += 1;
  while (b > a && EDGE.has(cps[b - 1])) b -= 1;
  return cps.slice(a, b).join('');
}

/**
 * Normalised fragments of one quote: split at ellipses, edges stripped, fragments shorter than
 * MIN_FRAGMENT code points (after normalisation) dropped. Order is kept.
 */
export function fragmentsOf(quote) {
  return quote.split(ELLIPSIS).map((f) => normalizeText(stripEdges(f))).filter((f) => codepointLength(f) >= MIN_FRAGMENT);
}

/** Quoted parts of an older evidence text (§7.2); empty when the text has none. */
export function quotedParts(text) {
  return [...text.matchAll(QUOTED_PART)].map((m) => m[1]).filter((p) => codepointLength(normalizeText(p)) >= 6);
}

/**
 * Match normalised fragments against a normalised text.
 * anywhere: fragments occurring somewhere (order-independent, comparable to the research prototype);
 * inOrder: fragments found greedily in order without overlap; complete: all fragments in order.
 */
export function matchFragments(text, frags) {
  let pos = 0;
  let inOrder = 0;
  let anywhere = 0;
  for (const f of frags) {
    if (text.includes(f)) anywhere += 1;
    const i = text.indexOf(f, pos);
    if (i >= 0) { inOrder += 1; pos = i + f.length; }
  }
  return { anywhere, inOrder, complete: frags.length > 0 && inOrder === frags.length };
}

const ALNUM = /[\p{L}\p{N}]/u;

/**
 * Whole-word search in a normalised, lower-cased text: no letter or digit directly before or after
 * the match. A term ending in `*` matches as a prefix (no boundary on the right). Returns the index
 * of the first match or -1.
 */
export function findWord(text, term) {
  const prefix = term.endsWith('*');
  const t = normalizeText(prefix ? term.slice(0, -1) : term).toLowerCase();
  if (t.length === 0) return -1;
  let from = 0;
  for (;;) {
    const i = text.indexOf(t, from);
    if (i < 0) return -1;
    const before = i > 0 ? String.fromCodePoint(text.codePointAt(prevIndex(text, i))) : '';
    const afterCp = text.codePointAt(i + t.length);
    const after = afterCp === undefined ? '' : String.fromCodePoint(afterCp);
    const leftOk = before === '' || !ALNUM.test(before) || !ALNUM.test(String.fromCodePoint(t.codePointAt(0)));
    const lastCp = [...t].pop();
    const rightOk = prefix || after === '' || !ALNUM.test(after) || !ALNUM.test(lastCp);
    if (leftOk && rightOk) return i;
    from = i + 1;
  }
}

function prevIndex(text, i) {
  const c = text.charCodeAt(i - 1);
  return c >= 0xdc00 && c <= 0xdfff && i >= 2 ? i - 2 : i - 1;
}
