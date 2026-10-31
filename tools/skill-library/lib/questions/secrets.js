// Heuristic detection of secret-like values (docs/spec/questions-cli-v0.md QCLI-INV-07, QO-4).
// Findings name the pattern and position, never the matched value.

const PATTERNS = [
  { name: 'private-key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { name: 'sk-key', re: /(?<![A-Za-z0-9])sk-[A-Za-z0-9_-]{16,}/g, needsDigit: true },
  { name: 'stripe-key', re: /(?<![A-Za-z0-9])[rsp]k_(?:live|test)_[A-Za-z0-9]{16,}/g },
  { name: 'github-token', re: /(?<![A-Za-z0-9])(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/g },
  { name: 'aws-access-key', re: /(?<![A-Z0-9])(?:AKIA|ASIA)[0-9A-Z]{16}(?![0-9A-Z])/g },
  { name: 'google-api-key', re: /(?<![A-Za-z0-9])AIza[0-9A-Za-z_-]{30,}/g },
  { name: 'slack-token', re: /(?<![A-Za-z0-9])xox[abprs]-[A-Za-z0-9-]{10,}/g },
  { name: 'gitlab-token', re: /(?<![A-Za-z0-9])glpat-[A-Za-z0-9_-]{20,}/g },
  { name: 'jwt', re: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
  { name: 'hex-token', re: /(?<![A-Za-z0-9])[0-9a-fA-F]{32,}(?![A-Za-z0-9])/g },
];

const BASE64_RUN = /[A-Za-z0-9+/=_-]{40,}/g;
export const BASE64_MIN_ENTROPY = 4.5;

/** Shannon entropy in bits per character. */
export function entropy(s) {
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  const n = [...s].length;
  let h = 0;
  for (const c of counts.values()) {
    const p = c / n;
    h -= p * Math.log2(p);
  }
  return h;
}

function charClass(ch) {
  if (ch >= 'a' && ch <= 'z') return 1;
  if (ch >= 'A' && ch <= 'Z') return 2;
  if (ch >= '0' && ch <= '9') return 3;
  return 0;
}

/** A segment looks random when it is long and switches between lower, upper and digits often. */
function randomLookingSegment(seg) {
  if (seg.length < 16) return false;
  let transitions = 0;
  for (let i = 1; i < seg.length; i += 1) if (charClass(seg[i]) !== charClass(seg[i - 1])) transitions += 1;
  return transitions >= 4;
}

/**
 * Base64-like secret: at least 40 characters, lower, upper and digits, entropy >= 4.5 bit/char and at least one
 * random-looking segment between separators. Paths and slugs (word segments joined by / and -) do not qualify.
 */
function looksLikeBase64Secret(token) {
  if (!/[a-z]/.test(token) || !/[A-Z]/.test(token) || !/[0-9]/.test(token)) return false;
  if (entropy(token) < BASE64_MIN_ENTROPY) return false;
  return token.split(/[/+=_-]/).some(randomLookingSegment);
}

/**
 * Commit SHAs inside repository permalinks (…/blob/<sha>/…, …/tree/<sha>, …/commit/<sha>) are public identifiers,
 * not secrets; they are masked before scanning. A bare 40- or 64-digit hex value still counts as secret-like.
 */
const PERMALINK_SHA = /(\/(?:blob|tree|commit|commits|raw|blame)\/)([0-9a-f]{40}|[0-9a-f]{64})(?![0-9A-Za-z])/g;

/** Secret-like findings in `text`: [{pattern, index}], ordered by position, overlaps reported once. */
export function findSecrets(input) {
  if (typeof input !== 'string' || input.length === 0) return [];
  const text = input.replace(PERMALINK_SHA, (_m, prefix, sha) => prefix + 'x'.repeat(sha.length));
  const hits = [];
  for (const p of PATTERNS) {
    for (const m of text.matchAll(p.re)) {
      if (p.needsDigit && !/[0-9]/.test(m[0])) continue;
      hits.push({ pattern: p.name, index: m.index, end: m.index + m[0].length });
    }
  }
  for (const m of text.matchAll(BASE64_RUN)) {
    if (looksLikeBase64Secret(m[0])) hits.push({ pattern: 'base64-token', index: m.index, end: m.index + m[0].length });
  }
  hits.sort((a, b) => a.index - b.index || b.end - a.end);
  const out = [];
  let coveredUntil = -1;
  for (const h of hits) {
    if (h.index < coveredUntil) continue;
    out.push({ pattern: h.pattern, index: h.index });
    coveredUntil = h.end;
  }
  return out;
}

export const REDACTION_HINT = 'Wert nicht ins Repo schreiben: redigieren, z. B. „[redigiert: Zugangsschlüssel, privat abgelegt]“, '
  + 'und höchstens eine zulässige private Referenz nennen (workflow.md „Abschluss und Übergabe“).';
