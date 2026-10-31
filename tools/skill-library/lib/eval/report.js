// Reports only from raw records (SLV0-EVAL-10/-11, SLV0-INV-06/-09).
// Every number carries numerator, denominator and the raw record IDs of its population. Levels
// M0–M5 and R, families and repeats are reported separately. R assertions are never counted
// together with other assertions. Rubric versions are listed and never mixed (SLV0-EVAL-15).
// No score, no ranking, no activation recommendation.
import { canonicalJson, sha256Hex, compareCodepoints } from '../core.js';
import { sumTokens } from '../tokens.js';
import { evalMsg, EvalRefusal, UsageError, requireSchema, schemaErrors } from './common.js';
import { RAW_SCHEMA } from './raw.js';
import { USAGE_FIELDS } from './normalize.js';
import { rubricVersionsOf, mixingMessages, rubricName } from './rubric.js';

export const REPORT_SCHEMA = 'eval-report';
const LEVELS = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'R'];
/** Field names that would carry a judgement (SLV0-INV-06); never allowed anywhere in a report. */
export const FORBIDDEN_KEYS = ['score', 'scores', 'empfehlung', 'recommendation', 'ranking', 'rank', 'winner', 'verdict', 'urteil', 'aktivieren', 'activate'];

const HINWEIS = 'Deskriptiv, nur aus Rohdatensätzen. Kein Score, keine Rangfolge, keine Aktivierungsempfehlung (SLV0-INV-06). '
  + 'Nenner sind Läufe bzw. Assertions, keine unabhängigen Stichproben; Familien und Wiederholungen getrennt lesen (SL1 §7). '
  + 'Fehlende Werte sind unbekannt, nicht 0 (SLV0-INV-05).';

const cmp = (a, b) => compareCodepoints(String(a), String(b));
const uniqSorted = (xs) => [...new Set(xs)].sort(cmp);

function zahl(zaehler, nenner, ids) {
  return { zaehler, nenner, rohdatensatz_ids: uniqSorted(ids) };
}

function groupBy(items, keyFn) {
  const m = new Map();
  for (const it of items) {
    const k = keyFn(it);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(it);
  }
  return [...m.entries()].sort(([a], [b]) => cmp(a, b));
}

/** {deterministisch, rubrik} blocks from non-R assertions of a set of records. */
function assertionBlocks(records) {
  const out = {};
  for (const art of ['deterministisch', 'rubrik']) {
    const rows = records.flatMap((r) => r.assertions.filter((a) => a.art === art && a.r_regel === null).map((a) => ({ run: r.run_id, e: a.ergebnis })));
    if (rows.length === 0) { out[art] = null; continue; }
    const ids = rows.map((x) => x.run);
    const n = rows.length;
    out[art] = {
      bestanden: zahl(rows.filter((x) => x.e === 'bestanden').length, n, ids),
      nicht_bestanden: zahl(rows.filter((x) => x.e === 'nicht_bestanden').length, n, ids),
      unklar: zahl(rows.filter((x) => x.e === 'unklar').length, n, ids),
    };
  }
  return out;
}

function levelReport(records) {
  const byVariant = groupBy(records, (r) => r.variante);
  const laeufe = byVariant.map(([v, rs]) => ({ variante: v, abgeschlossen: zahl(rs.filter((r) => r.status === 'completed').length, rs.length, rs.map((r) => r.run_id)) }));
  const assertions = byVariant.map(([v, rs]) => ({ variante: v, assertions: assertionBlocks(rs) }));
  const sep = '\u0000';
  const jeFall = groupBy(records, (r) => `${r.case_id}${sep}${r.variante}`).map(([, rs]) => ({ case_id: rs[0].case_id, variante: rs[0].variante, assertions: assertionBlocks(rs) }));
  const jeFamilie = groupBy(records, (r) => `${r.family_id}${sep}${r.variante}`).map(([, rs]) => ({ family_id: rs[0].family_id, variante: rs[0].variante, assertions: assertionBlocks(rs) }));
  const jeWdh = groupBy(records, (r) => `${r.case_id}${sep}${r.variante}${sep}${String(r.repeat_id).padStart(9, '0')}`)
    .map(([, rs]) => ({ case_id: rs[0].case_id, variante: rs[0].variante, repeat_id: rs[0].repeat_id, assertions: assertionBlocks(rs) }));
  const skillAufrufe = [];
  for (const [v, rs] of byVariant) {
    const pairs = new Map();
    for (const r of rs) {
      for (const a of r.skill_aufrufe.aufrufe) {
        if (a.bestaetigt !== true) continue;
        const key = `${a.skill ?? ''}${sep}${a.modus}`;
        if (!pairs.has(key)) pairs.set(key, { skill: a.skill, modus: a.modus, runs: new Set() });
        pairs.get(key).runs.add(r.run_id);
      }
    }
    for (const [, p] of [...pairs.entries()].sort(([a], [b]) => cmp(a, b))) {
      skillAufrufe.push({ variante: v, skill: p.skill, modus: p.modus, laeufe_mit_bestaetigtem_aufruf: zahl(p.runs.size, rs.length, rs.map((r) => r.run_id)) });
    }
  }
  const katalog = byVariant.map(([v, rs]) => ({ variante: v, laeufe: zahl(rs.filter((r) => r.katalog.status === 'unbekannt').length, rs.length, rs.map((r) => r.run_id)) }));
  const usage = byVariant.map(([v, rs]) => {
    const row = { variante: v };
    for (const f of USAGE_FIELDS) {
      row[f] = { ...sumTokens(rs.map((r) => r.usage.lauf[f]), `summe:${f}`), rohdatensatz_ids: uniqSorted(rs.map((r) => r.run_id)) };
    }
    return row;
  });
  return { laeufe, assertions, je_fall: jeFall, je_familie: jeFamilie, je_wiederholung: jeWdh, skill_aufrufe: skillAufrufe, katalog_unbekannt: katalog, usage };
}

/**
 * Build a report from validated raw records. Throws report_without_raw without any record and
 * rubric_version_mixed when two versions of one rubric (or a version other than a pinned one,
 * `rubricVersions`) occur (SLV0-EVAL-15).
 */
export function buildReport(records, { rubricVersions = [] } = {}) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new EvalRefusal([evalMsg('report_without_raw', 'report', 'keine Rohdatensätze; ein Bericht ohne Rohdaten wird nicht erzeugt')]);
  }
  records.forEach((r, i) => requireSchema(RAW_SCHEMA, r, `Rohdatensatz ${i + 1}`));
  const sorted = [...records].sort((a, b) => cmp(a.run_id, b.run_id));
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].run_id === sorted[i - 1].run_id) throw new UsageError(`doppelte run_id ${sorted[i].run_id}`);
  }
  const pinnedGroups = rubricVersions.map((v) => rubricName(v));
  if (new Set(pinnedGroups).size !== pinnedGroups.length) throw new UsageError('--rubric-version nennt zwei Versionen derselben Rubrik');
  const rubriken = rubricVersionsOf(sorted, rubricVersions);
  if (rubriken.messages.length > 0) throw new EvalRefusal(rubriken.messages);
  const ebenen = {};
  for (const level of LEVELS) {
    const rs = sorted.filter((r) => r.ebene === level);
    if (rs.length > 0) ebenen[level] = levelReport(rs);
  }
  const rRows = sorted.flatMap((r) => r.assertions.filter((a) => a.r_regel !== null).map((a) => ({ r, a })));
  const rPruefungen = groupBy(rRows, (x) => `${x.r.case_id}\u0000${x.r.variante}\u0000${x.a.r_regel}`).map(([, xs]) => {
    const ids = xs.map((x) => x.r.run_id);
    return {
      case_id: xs[0].r.case_id,
      variante: xs[0].r.variante,
      regel: xs[0].a.r_regel,
      verstoesse: zahl(xs.filter((x) => x.a.ergebnis === 'nicht_bestanden').length, xs.length, ids),
      unklar: zahl(xs.filter((x) => x.a.ergebnis === 'unklar').length, xs.length, ids),
    };
  });
  const rVerstoesse = rRows.filter((x) => x.a.ergebnis === 'nicht_bestanden').map(({ r, a }) => ({
    case_id: r.case_id, family_id: r.family_id, variante: r.variante, repeat_id: r.repeat_id,
    regel: a.r_regel, assertion_id: a.id, rohdatensatz_ids: [r.run_id],
  })).sort((x, y) => cmp(x.case_id, y.case_id) || cmp(x.variante, y.variante) || x.repeat_id - y.repeat_id || cmp(x.assertion_id, y.assertion_id));
  const report = {
    schema_version: 1,
    bericht: 'sl-eval-report@1',
    hinweis: HINWEIS,
    rohdaten: { anzahl: sorted.length, rohdatensatz_ids: sorted.map((r) => r.run_id), eingabe_sha256: sha256Hex(canonicalJson(sorted)) },
    rubrik_versionen: rubriken.versionen,
    ebenen,
    r_pruefungen: rPruefungen,
    r_verstoesse: rVerstoesse,
  };
  const check = checkReport(report, sorted.map((r) => r.run_id));
  if (check.schema_errors.length > 0 || check.messages.length > 0) {
    throw new Error(`interner Fehler: erzeugter Bericht verletzt den Vertrag: ${[...check.schema_errors, ...check.messages.map((m) => m.message)][0]}`);
  }
  return report;
}

/**
 * Check a report (SLV0-EVAL-10, INV-06/-09): schema, forbidden judgement fields, and that every
 * number names raw record IDs from the given raw set. Returns {schema_errors, messages}.
 */
export function checkReport(report, knownRunIds) {
  const known = new Set(knownRunIds);
  const messages = [];
  const schemaErrs = schemaErrors(REPORT_SCHEMA, report);
  const walk = (node, ptr) => {
    if (Array.isArray(node)) { node.forEach((x, i) => walk(x, `${ptr}/${i}`)); return; }
    if (node === null || typeof node !== 'object') return;
    for (const k of Object.keys(node)) {
      if (FORBIDDEN_KEYS.includes(k.toLowerCase())) schemaErrs.push(`${ptr}/${k}: Urteilsfeld nicht erlaubt (SLV0-INV-06)`);
    }
    const isNumber = ['zaehler', 'nenner', 'anzahl'].some((k) => typeof node[k] === 'number') || typeof node.wert === 'number';
    if (isNumber) {
      const ids = node.rohdatensatz_ids;
      if (!Array.isArray(ids) || ids.length === 0) {
        messages.push(evalMsg('report_without_raw', ptr || '/', 'Zahl ohne Rohdatensatz-IDs'));
      } else {
        const unknown = ids.filter((id) => !known.has(id));
        if (unknown.length > 0) messages.push(evalMsg('report_without_raw', ptr || '/', `Rohdatensatz-IDs ohne Rohdatensatz: ${unknown.slice(0, 5).join(', ')}`));
      }
    }
    for (const [k, v] of Object.entries(node)) walk(v, `${ptr}/${k}`);
  };
  walk(report, '');
  if (Array.isArray(report?.rubrik_versionen) && report.rubrik_versionen.every((v) => typeof v?.rubrik_version === 'string')) {
    messages.push(...mixingMessages(report.rubrik_versionen));
  }
  if (known.size === 0) messages.push(evalMsg('report_without_raw', 'report', 'keine Rohdatensätze zum Abgleich übergeben'));
  return { schema_errors: schemaErrs, messages };
}
