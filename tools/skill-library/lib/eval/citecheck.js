// Citation coverage at a commit (SLV0-EVAL-28…30, `eval cite-check`).
// The search space is enumerated once: the regular files of a commit's tree, optionally limited to
// scopes (segment register). Every GitHub permalink, `path:line` reference and commit word of a
// Markdown report is related to that register and checked against Git (commit, path, line range).
// Coverage is reported as "X von Y Dateien belegt; nicht belegt: …". Reads only; Git is reached
// solely through ./git.js (SLV0-EVAL-18/-28).
import { compareCodepoints, sortMessages } from '../core.js';
import { evalMsg, EvalRefusal, UsageError, safeRelativeSegments } from './common.js';
import { COMMIT_ID, requireGitRepo, resolveCommit, listTree, readBlob } from './git.js';
import { REF, URL, hexWords } from './findings.js';
import { lineCount } from './tree.js';

const REGULAR = new Set(['100644', '100755']);
const STOP = '\\s?#)\\]>"\'`';
/** github.com/<owner>/<repo>/blob/<ref>/<path>[?query][#anchor] */
const PERMALINK = new RegExp(`https://github\\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)/blob/([^/${STOP}]+)/([^${STOP}]+)(\\?[^\\s#)\\]>"'\`]*)?(#[^\\s)\\]>"'\`]*)?`, 'g');
const LINE_ANCHOR = /^#L(\d+)(?:C\d+)?(?:-L(\d+)(?:C\d+)?)?[.,;:!]*$/;
const TRAILING_PUNCT = /[.,;:!]+$/;
const GITHUB_REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

/** Matcher for one `--scope` (prefix, or glob with `*`, `**`, `?`); usage error if unsafe. */
export function scopeMatcher(scope) {
  const isDir = scope.endsWith('/');
  const body = isDir ? scope.slice(0, -1) : scope;
  if (!safeRelativeSegments(body)) throw new UsageError(`--scope ${scope}: kein sicherer relativer Pfad`);
  if (!/[*?]/.test(body)) return (p) => p === body || p.startsWith(`${body}/`);
  let re = '';
  for (let i = 0; i < body.length; i += 1) {
    const c = body[i];
    if (c === '*' && body[i + 1] === '*') {
      i += 1;
      if (body[i + 1] === '/') { i += 1; re += '(?:.*/)?'; } else re += '.*';
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  const rx = new RegExp(`^${re}${isDir ? '/.*' : ''}$`, 'u');
  return (p) => rx.test(p);
}

/** Merge [from, to] ranges that overlap or touch; sorted. */
function mergeRanges(ranges) {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const out = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1]);
    else out.push([r[0], r[1]]);
  }
  return out;
}

/** Citations of one report line: permalinks first, then `path:line` refs outside URLs. */
function lineCitations(rawLine, lineNo) {
  const out = [];
  for (const m of rawLine.matchAll(PERMALINK)) {
    const anchor = m[6];
    let rel = m[4];
    let from = null;
    let to = null;
    if (anchor !== undefined) {
      const a = LINE_ANCHOR.exec(anchor);
      if (!a) continue; // another anchor (e.g. a heading) is no citation
      from = Number(a[1]);
      to = Number(a[2] ?? a[1]);
    } else {
      rel = rel.replace(TRAILING_PUNCT, '');
    }
    const verweis = anchor === undefined ? m[0].replace(TRAILING_PUNCT, '') : m[0];
    out.push({ art: 'permalink', zeile: lineNo, verweis, owner: m[1], repo: m[2], ref: m[3], rawPath: rel, von: from, bis: to });
  }
  const masked = rawLine.replace(URL, (u) => ' '.repeat(u.length));
  for (const m of masked.matchAll(REF)) {
    let rel = m[1];
    while (rel.startsWith('./')) rel = rel.slice(2);
    const from = Number(m[2] ?? m[4]);
    out.push({ art: 'fundstelle', zeile: lineNo, verweis: m[0], rawPath: rel, von: from, bis: Number(m[3] ?? m[5] ?? from) });
  }
  return { citations: out, masked };
}

/**
 * `eval cite-check`. Inputs: repository directory, commit (7–40 hex), report text and label,
 * scopes, optional `owner/repo`. Returns {result, code}; throws EvalRefusal (commit_unknown for
 * `--commit`) or UsageError.
 */
export function citeCheck({ repo, commit, reportText, reportLabel, scopes = [], github = null }) {
  if (!COMMIT_ID.test(commit ?? '')) throw new UsageError('--commit erwartet 7–40 Zeichen 0-9a-f (keine Ref-Namen)');
  if (github !== null && !GITHUB_REPO.test(github)) throw new UsageError('--github erwartet OWNER/REPO');
  const matchers = scopes.map((s) => ({ scope: s, match: scopeMatcher(s) }));
  requireGitRepo(repo);
  const full = resolveCommit(repo, commit);
  if (full === null) {
    throw new EvalRefusal([evalMsg('commit_unknown', '--commit', `${commit} ist kein eindeutiger Commit im Repository; kein Register`)]);
  }

  const files = listTree(repo, full).filter((e) => REGULAR.has(e.mode)).sort((a, b) => compareCodepoints(a.path, b.path));
  const byPath = new Map(files.map((f) => [f.path, f]));
  for (const { scope, match } of matchers) {
    if (!files.some((f) => match(f.path))) throw new UsageError(`--scope ${scope} trifft keine Datei am Commit ${full}`);
  }
  const inScope = (p) => matchers.length === 0 || matchers.some(({ match }) => match(p));
  const register = files.filter((f) => inScope(f.path));

  const lineCache = new Map();
  const linesOf = (f) => {
    if (!lineCache.has(f.oid)) lineCache.set(f.oid, lineCount(readBlob(repo, f.oid)));
    return lineCache.get(f.oid);
  };
  const commitCache = new Map();
  const resolveCached = (id) => {
    if (!commitCache.has(id)) commitCache.set(id, resolveCommit(repo, id));
    return commitCache.get(id);
  };

  const messages = [];
  const zitate = [];
  const commitWords = [];
  const covered = new Map(); // path -> {ranges, count}
  const githubLc = github?.toLowerCase() ?? null;

  reportText.split(/\r\n|\r|\n/).forEach((rawLine, i) => {
    const lineNo = i + 1;
    const { citations, masked } = lineCitations(rawLine, lineNo);
    for (const c of citations) {
      const entry = { art: c.art, zeile: c.zeile, verweis: c.verweis, pfad: c.rawPath, von: c.von, bis: c.bis, ergebnis: 'gueltig', code: null };
      const fail = (code, message) => {
        entry.ergebnis = 'ungueltig';
        entry.code = code;
        messages.push(evalMsg(code, reportLabel, `${c.verweis}: ${message}`, lineNo));
      };
      zitate.push(entry);
      let file = null;
      if (c.art === 'permalink') {
        if (githubLc !== null && `${c.owner}/${c.repo}`.toLowerCase() !== githubLc) { entry.ergebnis = 'fremd'; continue; }
        if (!COMMIT_ID.test(c.ref)) { fail('ref_not_pinned', `Ref ${c.ref} ist keine Commit-ID`); continue; }
        const resolved = resolveCached(c.ref);
        if (resolved === null) { fail('commit_unknown', `Commit ${c.ref} ist im Repository unbekannt oder mehrdeutig`); continue; }
        if (resolved !== full) { fail('sha_mismatch', `Commit ${c.ref} ist nicht der angegebene Commit ${full}`); continue; }
        let rel;
        try { rel = decodeURIComponent(c.rawPath); } catch { rel = null; }
        if (rel !== null) entry.pfad = rel;
        file = rel === null ? undefined : byPath.get(rel);
        if (!file) { fail('path_missing', `${entry.pfad} ist am Commit keine reguläre Datei`); continue; }
      } else {
        const segs = c.rawPath.split('/');
        file = segs.includes('..') || segs.includes('.') ? undefined : byPath.get(c.rawPath);
        if (!file && !segs.includes('..') && !segs.includes('.')) {
          const cands = files.filter((f) => f.path.endsWith(`/${c.rawPath}`));
          if (cands.length > 1) { fail('path_ambiguous', `passt auf ${cands.length} Dateien: ${cands.slice(0, 5).map((f) => f.path).join(', ')}`); continue; }
          file = cands[0];
        }
        if (!file) { fail('path_missing', `${c.rawPath} ist am Commit keine reguläre Datei`); continue; }
        entry.pfad = file.path;
      }
      const lines = linesOf(file);
      let range;
      if (c.von === null) {
        range = lines > 0 ? [1, lines] : null;
      } else {
        if (c.von < 1 || c.bis < c.von || c.bis > lines) { fail('range_out_of_bounds', `Zeilen ${c.von}–${c.bis} liegen nicht in 1–${lines} von ${file.path}`); continue; }
        range = [c.von, c.bis];
      }
      if (!inScope(file.path)) { entry.ergebnis = 'ausserhalb_bereich'; continue; }
      const cov = covered.get(file.path) ?? { ranges: [], count: 0 };
      if (range) cov.ranges.push(range);
      cov.count += 1;
      covered.set(file.path, cov);
    }
    for (const w of hexWords(masked)) {
      if (!/[0-9]/.test(w) || !/[a-f]/.test(w)) continue;
      const resolved = resolveCached(w);
      commitWords.push({ wort: w, zeile: lineNo, commit: resolved });
      if (resolved === null) messages.push(evalMsg('commit_unverified', reportLabel, `Hex-Wort ${w} ist im Repository kein Commit`, lineNo));
    }
  });

  const belegt = register.filter((f) => covered.has(f.path)).map((f) => {
    const cov = covered.get(f.path);
    const bereiche = mergeRanges(cov.ranges);
    return { pfad: f.path, zeilen: linesOf(f), bereiche, zeilen_belegt: bereiche.reduce((n, [a, b]) => n + b - a + 1, 0), zitate: cov.count };
  });
  const nichtBelegt = register.filter((f) => !covered.has(f.path)).map((f) => f.path);
  const count = (e) => zitate.filter((z) => z.ergebnis === e).length;
  const sorted = sortMessages(messages);
  const result = {
    commit: full,
    bericht: reportLabel,
    bereich: [...scopes],
    github,
    abdeckung: `${belegt.length} von ${register.length} Dateien belegt; nicht belegt: ${nichtBelegt.length > 0 ? nichtBelegt.join(', ') : 'keine'}`,
    zaehlung: {
      register: register.length,
      belegt: belegt.length,
      nicht_belegt: nichtBelegt.length,
      zitate: zitate.length,
      gueltig: count('gueltig'),
      ungueltig: count('ungueltig'),
      ausserhalb_bereich: count('ausserhalb_bereich'),
      fremd: count('fremd'),
      commit_woerter: commitWords.length,
      commit_woerter_unbekannt: commitWords.filter((w) => w.commit === null).length,
    },
    belegt,
    nicht_belegt: nichtBelegt,
    zitate,
    commit_woerter: commitWords,
    messages: sorted,
  };
  return { result, code: sorted.some((m) => m.severity === 'error') ? 1 : 0 };
}
