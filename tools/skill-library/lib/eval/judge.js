// Evidence check for grader judgements (SLV0-EVAL-19…21, `eval judge check`).
// Finds every quote of a judgement again in the graded output (or the case fixture), checks
// absence claims, and takes away the force of an `erfuellt` without verified evidence (→ unklar).
// It never grades anything itself (SLV0-INV-06) and only reads.
import fs from 'node:fs';
import path from 'node:path';
import { codepointLength, compareCodepoints, sortMessages } from '../core.js';
import { evalMsg, UsageError, requireSchema, safeRelativeSegments } from './common.js';
import { readTree, entryText } from './tree.js';
import { NORM_ID, MIN_SEARCH_TERM, normalizeText, fragmentsOf, quotedParts, matchFragments, stripEdges } from './textmatch.js';

export const JUDGEMENT_SCHEMA = 'eval-judgement';
export const JUDGEMENT_FORMAT = 'sl-eval-judgement@1';
const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const STATUS = ['erfuellt', 'nicht_erfuellt', 'unklar'];

/**
 * Read a judgement into one internal form. New format: schema-checked (exit 2 on violation).
 * Older files without schema_version (§7.2): `ausgaben|faelle`, `kriterien|punkte`,
 * `status|urteil`, evidence from `beleg|zitat`.
 * @returns {{format: string, ausgaben: {code, fall, erfuelltLaut, kernLaut, kriterien: object[]}[]}}
 */
export function readJudgement(data, label) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new UsageError(`${label}: Bewertung muss ein JSON-Objekt sein`);
  if (Object.hasOwn(data, 'schema_version')) return readCurrent(data, label);
  return readLegacy(data, label);
}

function checkFall(fall, label, code) {
  if (fall !== null && !safeRelativeSegments(fall)) throw new UsageError(`${label}: Ausgabe ${code} nennt unsicheren Fallpfad ${JSON.stringify(fall)}`);
  return fall;
}

function readCurrent(data, label) {
  requireSchema(JUDGEMENT_SCHEMA, data, label);
  const ausgaben = Object.entries(data.ausgaben).map(([code, a]) => ({
    code,
    fall: checkFall(a.fall, label, code),
    erfuelltLaut: a.erfuellt ?? null,
    kernLaut: a.kern_erfuellt ?? null,
    kriterien: a.kriterien.map((k) => ({
      label: k.kriterium,
      status: k.status,
      art: k.beleg_art,
      quotes: k.beleg === undefined ? [] : Array.isArray(k.beleg) ? k.beleg : [k.beleg],
      term: k.suchbegriff ?? null,
      kern: k.kern === true,
      unquoted: false,
    })),
  }));
  return { format: JUDGEMENT_FORMAT, ausgaben };
}

function readLegacy(data, label) {
  const items = data.ausgaben ?? data.faelle;
  if (!items || typeof items !== 'object' || Array.isArray(items)) throw new UsageError(`${label}: ältere Bewertung braucht ein Objekt ausgaben oder faelle`);
  const ausgaben = [];
  for (const [code, a] of Object.entries(items)) {
    if (!CODE_RE.test(code)) throw new UsageError(`${label}: Ausgabe-Code ${JSON.stringify(code)} ist kein sicherer Dateiname`);
    const list = a?.kriterien ?? a?.punkte;
    if (!Array.isArray(list)) throw new UsageError(`${label}: Ausgabe ${code} ohne kriterien oder punkte`);
    const fall = typeof a.fall === 'string' ? a.fall : typeof a.aufgabe === 'string' ? a.aufgabe : null;
    ausgaben.push({
      code,
      fall: checkFall(fall, label, code),
      erfuelltLaut: Number.isInteger(a.erfuellt) ? a.erfuellt : null,
      kernLaut: typeof a.kern_erfuellt === 'boolean' ? a.kern_erfuellt : null,
      kriterien: list.map((k, i) => legacyCriterion(k, i, label, code)),
    });
  }
  return { format: 'aeltere-bewertung', ausgaben };
}

function legacyCriterion(k, i, label, code) {
  if (!k || typeof k !== 'object') throw new UsageError(`${label}: ${code} Kriterium ${i + 1} ist kein Objekt`);
  const status = k.status ?? k.urteil;
  if (!STATUS.includes(status)) throw new UsageError(`${label}: ${code} Kriterium ${i + 1} hat keinen gültigen status/urteil`);
  const rawLabel = k.kriterium ?? k.punkt ?? (k.nr !== undefined ? String(k.nr) : k.id) ?? `#${i + 1}`;
  const text = typeof (k.beleg ?? k.zitat) === 'string' ? (k.beleg ?? k.zitat).trim() : '';
  const base = { label: String(rawLabel), status, term: null, kern: false, unquoted: false };
  if (text === '' || text.toLowerCase().startsWith('fehlt')) return { ...base, art: 'fehlt', quotes: [] };
  const parts = quotedParts(text);
  // Quoted parts count only when at least one yields a checkable fragment; otherwise a short inner
  // quotation (e.g. a quoted name) would hide an evidence text that stands verbatim in the output.
  if (parts.some((p) => fragmentsOf(p).length > 0)) return { ...base, art: 'zitat', quotes: parts };
  return { ...base, art: 'zitat', quotes: [stripEdges(text)], unquoted: true };
}

/** Evaluate quotes against one normalised text. */
function quotesIn(text, quotes) {
  let gesamt = 0;
  let gefunden = 0;
  let inOrder = 0;
  let checkable = 0;
  let complete = 0;
  for (const q of quotes) {
    const frags = fragmentsOf(q);
    if (frags.length === 0) continue;
    checkable += 1;
    const m = matchFragments(text, frags);
    gesamt += frags.length;
    gefunden += m.anywhere;
    inOrder += m.inOrder;
    if (m.complete) complete += 1;
  }
  return { gesamt, gefunden, inOrder, checkable, verified: checkable > 0 && complete === checkable };
}

/** Quotes against the files of a fixture: each quote must stand completely in one file. */
function quotesInFixture(files, quotes) {
  let gesamt = 0;
  let gefunden = 0;
  let inOrder = 0;
  let checkable = 0;
  let complete = 0;
  const fundstellen = [];
  for (const q of quotes) {
    const frags = fragmentsOf(q);
    if (frags.length === 0) continue;
    checkable += 1;
    gesamt += frags.length;
    gefunden += frags.filter((f) => files.some((x) => x.text.includes(f))).length;
    let best = null;
    for (const x of files) {
      const m = matchFragments(x.text, frags);
      if (best === null || m.inOrder > best.m.inOrder || (m.complete && !best.m.complete)) best = { path: x.path, m };
      if (m.complete) break;
    }
    inOrder += best ? best.m.inOrder : 0;
    if (best?.m.complete) { complete += 1; fundstellen.push(best.path); }
  }
  return { gesamt, gefunden, inOrder, checkable, verified: checkable > 0 && complete === checkable, fundstellen };
}

/**
 * Check a judgement against outputs (`<outputsDir>/<code>.md`) and optional fixtures
 * (`<fixturesDir>/<fall>/fixture/`). Returns {format, zaehlung, ausgaben, kriterien, messages}.
 */
export function checkJudgement(judgement, { outputsDir, fixturesDir = null, label = 'bewertung' }) {
  const messages = [];
  const fixtureCache = new Map();
  const fixtureOf = (fall) => {
    if (fixturesDir === null || fall === null) return null;
    if (!fixtureCache.has(fall)) {
      const dir = path.join(fixturesDir, ...fall.split('/'), 'fixture');
      let files = null;
      if (fs.existsSync(dir) && fs.lstatSync(dir).isDirectory()) {
        files = [...readTree(dir).entries()].filter(([, e]) => e.kind === 'file').map(([p, e]) => ({ path: p, text: normalizeText(entryText(e)) }));
      }
      fixtureCache.set(fall, files);
    }
    return fixtureCache.get(fall);
  };

  const rows = [];
  const perOutput = [];
  const unquoted = [];
  for (const a of [...judgement.ausgaben].sort((x, y) => compareCodepoints(x.code, y.code))) {
    const file = path.join(outputsDir, `${a.code}.md`);
    if (!fs.existsSync(file)) throw new UsageError(`Ausgabe ${a.code}.md fehlt unter ${path.basename(outputsDir)}`);
    const raw = fs.readFileSync(file).toString('utf8');
    const out = normalizeText(raw);
    const outLower = out.toLowerCase();
    const fixture = fixtureOf(a.fall);
    const own = [];
    a.kriterien.forEach((k, i) => {
      const where = `${a.code}/${i + 1}`;
      const row = {
        ausgabe: a.code, fall: a.fall, nr: i + 1, kriterium: k.label, status: k.status, beleg_art: k.art,
        ergebnis: 'ohne_beleg', status_geprueft: k.status, fragmente: { gesamt: 0, gefunden: 0, in_reihenfolge: 0 }, fundstelle: null, hinweise: [],
      };
      let detail = '';
      if (k.art === 'zitat') {
        const r = quotesIn(out, k.quotes);
        row.fragmente = { gesamt: r.gesamt, gefunden: r.gefunden, in_reihenfolge: r.inOrder };
        if (r.checkable === 0) detail = 'kein Fragment mit mindestens 12 Zeichen';
        else if (r.verified) { row.ergebnis = 'verifiziert'; row.fundstelle = 'ausgabe'; }
        else {
          row.ergebnis = 'nicht_gefunden';
          detail = r.gefunden === r.gesamt ? 'Fragmente stehen nicht in dieser Reihenfolge in der Ausgabe' : `${r.gesamt - r.gefunden} von ${r.gesamt} Fragmenten nicht in der Ausgabe`;
          if (fixture && quotesInFixture(fixture, k.quotes).verified) { row.hinweise.push('nur_in_fixture'); detail += '; steht in der Fixture (Belegart wäre fixture)'; }
        }
      } else if (k.art === 'fixture') {
        if (fixture === null) {
          const r = quotesIn('', k.quotes);
          row.fragmente = { gesamt: r.gesamt, gefunden: 0, in_reihenfolge: 0 };
          if (r.checkable === 0) detail = 'kein Fragment mit mindestens 12 Zeichen';
          else { row.ergebnis = 'nicht_gefunden'; detail = 'Fixture nicht verfügbar (--fixtures und fall)'; }
        } else {
          const r = quotesInFixture(fixture, k.quotes);
          row.fragmente = { gesamt: r.gesamt, gefunden: r.gefunden, in_reihenfolge: r.inOrder };
          if (r.checkable === 0) detail = 'kein Fragment mit mindestens 12 Zeichen';
          else if (r.verified) { row.ergebnis = 'verifiziert'; row.fundstelle = `fixture:${[...new Set(r.fundstellen)].join(',')}`; }
          else { row.ergebnis = 'nicht_gefunden'; detail = 'Zitat steht in keiner einzelnen Fixture-Datei vollständig und in Reihenfolge'; }
        }
      } else if (k.art === 'abwesenheit') {
        const term = normalizeText(k.term ?? '').toLowerCase();
        if (codepointLength(term) < MIN_SEARCH_TERM) detail = `Suchbegriff nach Normalisierung kürzer als ${MIN_SEARCH_TERM} Zeichen`;
        else if (outLower.includes(term)) { row.ergebnis = 'nicht_gefunden'; detail = `Suchbegriff ${JSON.stringify(k.term)} steht in der Ausgabe`; }
        else { row.ergebnis = 'verifiziert'; row.fundstelle = 'ausgabe'; }
      } else {
        detail = 'Belegart fehlt';
      }
      if (k.unquoted) { row.hinweise.push('ohne_anfuehrungszeichen'); unquoted.push(where); }
      if (k.status === 'erfuellt' && row.ergebnis !== 'verifiziert') row.status_geprueft = 'unklar';
      if (row.ergebnis === 'nicht_gefunden') {
        messages.push(evalMsg('evidence_not_found', where, `${short(k.label)}: ${detail}${row.status_geprueft !== k.status ? '; erfuellt → unklar' : ''}`));
      } else if (row.ergebnis === 'ohne_beleg' && k.status === 'erfuellt') {
        messages.push(evalMsg('evidence_missing', where, `${short(k.label)}: erfuellt ohne gültigen Beleg (${detail}); → unklar`));
      }
      if (k.kern) row.hinweise.push('kern');
      own.push(row);
    });
    rows.push(...own);
    const kernRow = own.find((r) => r.hinweise.includes('kern')) ?? null;
    perOutput.push({
      ausgabe: a.code,
      fall: a.fall,
      kriterien: own.length,
      verifiziert: own.filter((r) => r.ergebnis === 'verifiziert').length,
      nicht_gefunden: own.filter((r) => r.ergebnis === 'nicht_gefunden').length,
      ohne_beleg: own.filter((r) => r.ergebnis === 'ohne_beleg').length,
      erfuellt_angegeben: own.filter((r) => r.status === 'erfuellt').length,
      erfuellt_laut_bewertung: a.erfuelltLaut,
      erfuellt_geprueft: own.filter((r) => r.status_geprueft === 'erfuellt').length,
      unklar_geprueft: own.filter((r) => r.status_geprueft === 'unklar').length,
      kern_erfuellt_laut_bewertung: a.kernLaut,
      kern_geprueft: kernRow ? kernRow.status_geprueft : null,
    });
  }
  if (unquoted.length > 0) {
    messages.push(evalMsg('evidence_unquoted', label, `${unquoted.length} Belege ohne Anführungszeichen als Zitat gelesen (${unquoted.slice(0, 5).join(', ')}${unquoted.length > 5 ? ', …' : ''})`));
  }
  const count = (key, v) => rows.filter((r) => r[key] === v).length;
  const sum = (k) => rows.reduce((n, r) => n + r.fragmente[k], 0);
  const zaehlung = {
    ausgaben: perOutput.length,
    kriterien: rows.length,
    verifiziert: count('ergebnis', 'verifiziert'),
    nicht_gefunden: count('ergebnis', 'nicht_gefunden'),
    ohne_beleg: count('ergebnis', 'ohne_beleg'),
    status_angegeben: Object.fromEntries(STATUS.map((s) => [s, count('status', s)])),
    status_geprueft: Object.fromEntries(STATUS.map((s) => [s, count('status_geprueft', s)])),
    herabgestuft: rows.filter((r) => r.status === 'erfuellt' && r.status_geprueft === 'unklar').length,
    fragmente: { gesamt: sum('gesamt'), gefunden: sum('gefunden'), in_reihenfolge: sum('in_reihenfolge'), nicht_gefunden: sum('gesamt') - sum('gefunden') },
  };
  return { format: judgement.format, normalisierung: NORM_ID, zaehlung, ausgaben: perOutput, kriterien: rows, messages: sortMessages(messages) };
}

function short(s) {
  const cps = [...s];
  return cps.length > 60 ? `${cps.slice(0, 60).join('')}…` : s;
}
