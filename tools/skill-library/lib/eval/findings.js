// Expected findings with 1:1 assignment and over-reporting (SLV0-EVAL-26/-27, `eval findings`).
// Outputs are split into units (paragraphs, list items, table rows, headings). Each expected finding
// is assigned to at most one unit and each unit to at most one finding (maximum matching, critical
// findings first). Every cited `path:line`, `path#Lx-y` and commit ID is looked up in the fixture;
// what the fixture does not contain is an over-report. Measurements only: no verdict, reads only.
import path from 'node:path';
import { compareCodepoints } from '../core.js';
import { readTree, entryText, lineCount } from './tree.js';
import { normalizeText, findWord } from './textmatch.js';

/** Result code of an over-report (spec §8, group "Befund"); never a refusal. */
export const OVER_REPORT_RULE = 'SLV0-EVAL-27';

const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s/;
const TABLE_ROW = /^\s*\|/;
const HEADING = /^\s*#/;
/** `path:line[-end]` or `path#Lx[-[L]y]`; the path needs an extension starting with a letter. */
export const REF = /(?<![\w./-])((?:[\w.-]+\/)*[\w.-]*[\w-]\.[A-Za-z][A-Za-z0-9]*)(?::(\d+)(?:-(\d+))?|#L(\d+)(?:-L?(\d+))?)/g;
/** URLs (`scheme://…` up to the next whitespace) are never checked; masked before scanning. */
export const URL = /[A-Za-z][A-Za-z0-9+.-]*:\/\/\S*/g;
const HEX = /^[0-9a-f]{7,40}$/;
const EDGE_PUNCT = /^[\s()[\]{}<>"'`,;:!?.…*_|#„“”«»‚‘’]+|[\s()[\]{}<>"'`,;:!?.…*_|#„“”«»‚‘’]+$/gu;

/** Split an output into units {nr, zeile, text} (§7.4). */
export function splitUnits(text) {
  const units = [];
  let cur = null;
  const close = () => { if (cur) units.push(cur); cur = null; };
  text.split(/\r\n|\r|\n/).forEach((line, i) => {
    if (line.trim() === '') { close(); return; }
    const heading = HEADING.test(line);
    if (cur === null || heading || LIST_ITEM.test(line) || TABLE_ROW.test(line)) {
      close();
      cur = { zeile: i + 1, lines: [line] };
    } else {
      cur.lines.push(line);
    }
    if (heading) close();
  });
  close();
  return units.map((u, k) => ({ nr: k + 1, zeile: u.zeile, text: u.lines.join('\n') }));
}

/** Does a finding match a unit (normalised, lower-cased text)? */
export function findingMatches(befund, unitNorm) {
  const groupsOk = befund.token_gruppen.every((g) => g.some((alt) => findWord(unitNorm, alt) >= 0));
  if (!groupsOk) return false;
  if (befund.fundstelle_datei === undefined) return true;
  return findWord(unitNorm, befund.fundstelle_datei) >= 0 || findWord(unitNorm, path.posix.basename(befund.fundstelle_datei)) >= 0;
}

/**
 * Maximum 1:1 assignment (augmenting paths). Findings are processed critical first, then in case
 * order; units are tried in text order. Returns Map<findingIndex, unitIndex>.
 */
export function assignFindings(befunde, units) {
  const norm = units.map((u) => normalizeText(u.text).toLowerCase());
  const adj = befunde.map((b) => norm.map((t, ui) => (findingMatches(b, t) ? ui : -1)).filter((ui) => ui >= 0));
  const order = befunde.map((b, i) => i).sort((a, b) => {
    const ka = befunde[a].gewicht === 'kritisch' ? 0 : 1;
    const kb = befunde[b].gewicht === 'kritisch' ? 0 : 1;
    return ka - kb || a - b;
  });
  const unitOwner = new Array(units.length).fill(-1);
  const tryAssign = (bi, seen) => {
    for (const ui of adj[bi]) {
      if (seen[ui]) continue;
      seen[ui] = true;
      if (unitOwner[ui] === -1 || tryAssign(unitOwner[ui], seen)) { unitOwner[ui] = bi; return true; }
    }
    return false;
  };
  for (const bi of order) tryAssign(bi, new Array(units.length).fill(false));
  const out = new Map();
  unitOwner.forEach((bi, ui) => { if (bi >= 0) out.set(bi, ui); });
  return out;
}

export function hexWords(text) {
  return text.split(/\s+/u).map((t) => t.replace(EDGE_PUNCT, '')).filter((t) => HEX.test(t));
}

/** Over-reports of one output against fixture files [{path, lines, text}] and known commits. */
export function overReports(text, files, knownCommits) {
  const out = [];
  const rule = OVER_REPORT_RULE;
  text.split(/\r\n|\r|\n/).forEach((rawLine, i) => {
    const line = rawLine.replace(URL, (u) => ' '.repeat(u.length));
    for (const m of line.matchAll(REF)) {
      const verweis = m[0];
      let rel = m[1];
      while (rel.startsWith('./')) rel = rel.slice(2);
      const segs = rel.split('/');
      const cands = segs.includes('..') || segs.includes('.') ? [] : files.filter((f) => f.path === rel || f.path.endsWith(`/${rel}`));
      const start = Number(m[2] ?? m[4]);
      const end = Number(m[3] ?? m[5] ?? start);
      if (cands.length === 0) out.push({ code: 'ueberberichtung', rule, grund: 'pfad_fehlt', verweis, zeile: i + 1 });
      else if (start < 1 || end < start || !cands.some((f) => end <= f.lines)) out.push({ code: 'ueberberichtung', rule, grund: 'zeile_ausserhalb', verweis, zeile: i + 1 });
    }
    for (const w of hexWords(line)) {
      if (!/[0-9]/.test(w) || !/[a-f]/.test(w)) continue;
      const known = knownCommits.some((k) => k.startsWith(w) || w.startsWith(k));
      if (!known) out.push({ code: 'ueberberichtung', rule, grund: 'commit_unbekannt', verweis: w, zeile: i + 1 });
    }
  });
  return out;
}

/**
 * `eval findings` for one loaded case folder and outputs [{name, text}].
 * Returns {case_id, erwartete_befunde, kritisch, ausgaben}.
 */
export function findingsCheck({ caseObj, fixtureDir }, outputs) {
  const files = [...readTree(fixtureDir).entries()].filter(([, e]) => e.kind === 'file')
    .map(([p, e]) => { const t = entryText(e); return { path: p, text: t, lines: lineCount(t) }; });
  const knownCommits = [...new Set(files.flatMap((f) => hexWords(f.text)))].sort(compareCodepoints);
  const befunde = caseObj.erwartete_befunde ?? [];
  const gewicht = (b) => b.gewicht ?? 'normal';
  const ausgaben = outputs.map(({ name, text }) => {
    const units = splitUnits(text);
    const assignment = assignFindings(befunde, units);
    const getroffen = [];
    const verfehlt = [];
    befunde.forEach((b, bi) => {
      if (assignment.has(bi)) {
        const u = units[assignment.get(bi)];
        getroffen.push({ id: b.id, gewicht: gewicht(b), einheit: u.nr, zeile: u.zeile });
      } else {
        verfehlt.push(b.id);
      }
    });
    const kritischVerfehlt = befunde.filter((b, bi) => !assignment.has(bi) && gewicht(b) === 'kritisch').map((b) => b.id);
    const ueber = overReports(text, files, knownCommits);
    return {
      ausgabe: name,
      einheiten: units.length,
      getroffen,
      verfehlt,
      kritisch_verfehlt: kritischVerfehlt,
      ueberberichtungen: ueber,
      zaehlung: { getroffen: getroffen.length, verfehlt: verfehlt.length, kritisch_verfehlt: kritischVerfehlt.length, ueberberichtungen: ueber.length },
    };
  });
  return {
    case_id: caseObj.id,
    erwartete_befunde: befunde.length,
    kritisch: befunde.filter((b) => gewicht(b) === 'kritisch').length,
    ausgaben,
  };
}
