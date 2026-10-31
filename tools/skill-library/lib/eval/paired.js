// Paired comparison of two variants within one level (SLV0-EVAL-45/-46, spec §7.9).
// Pairs are runs of minuend and subtrahend with the same case_id and repeat_id. A run passes when
// it has at least one non-R assertion and all of them passed; it fails when one failed; else it is
// unclear. Exact two-sided McNemar test on the discordant pairs, and a percentile bootstrap
// interval for the difference of pass shares with the family as resampling unit (mulberry32).
// Descriptive only: no field carries a judgement (SLV0-INV-06).
import { compareCodepoints } from '../core.js';
import { UsageError } from './common.js';

export const DEFAULT_SEED = 20261031;
export const DEFAULT_DRAWS = 2000;
export const MIN_DRAWS = 100;
export const MAX_DRAWS = 100000;
const VERFAHREN = 'perzentil-bootstrap über familien, mulberry32, untere ⌊0,025·(K−1)⌋, obere ⌈0,975·(K−1)⌉';

const cmp = (a, b) => compareCodepoints(String(a), String(b));
const uniqSorted = (xs) => [...new Set(xs)].sort(cmp);

/** Run outcome over non-R assertions (SLV0-EVAL-45). */
export function runOutcome(record) {
  const own = record.assertions.filter((a) => a.r_regel === null);
  if (own.some((a) => a.ergebnis === 'nicht_bestanden')) return 'nicht_bestanden';
  if (own.length > 0 && own.every((a) => a.ergebnis === 'bestanden')) return 'bestanden';
  return 'unklar';
}

function binomial(n, k) {
  let r = 1n;
  for (let i = 1n; i <= BigInt(k); i += 1n) r = (r * (BigInt(n) - BigInt(k) + i)) / i;
  return r;
}

/** Two-sided exact McNemar p-value, rounded to 12 decimals; 1 without discordant pairs. */
export function mcnemarExact(b, c) {
  const n = b + c;
  if (n === 0) return 1;
  let tail = 0n;
  for (let i = 0; i <= Math.min(b, c); i += 1) tail += binomial(n, i);
  const num = 2n * tail;
  const den = 1n << BigInt(n);
  if (num >= den) return 1;
  const scale = 10n ** 12n;
  return Number((num * scale + den / 2n) / den) / 1e12;
}

/** mulberry32: deterministic 32-bit generator returning numbers in [0, 1). */
export function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = s;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function zahl(zaehler, nenner, ids) {
  return nenner === 0 ? null : { zaehler, nenner, rohdatensatz_ids: uniqSorted(ids) };
}

function wertfeld(wert, ids, beleg) {
  return { wert, rohdatensatz_ids: uniqSorted(ids), beleg };
}

const round12 = (x) => Math.round(x * 1e12) / 1e12;

function share(pairs) {
  let diff = 0;
  for (const p of pairs) diff += (p.m === 'bestanden' ? 1 : 0) - (p.s === 'bestanden' ? 1 : 0);
  return diff / pairs.length;
}

function bootstrap(pairs, { seed, draws }) {
  const byFamily = new Map();
  for (const p of pairs) {
    if (!byFamily.has(p.family)) byFamily.set(p.family, []);
    byFamily.get(p.family).push(p);
  }
  const families = [...byFamily.keys()].sort(cmp);
  if (families.length < 2) return { lower: null, upper: null, grund: 'weniger als 2 Familien' };
  const rand = mulberry32(seed);
  const values = [];
  for (let k = 0; k < draws; k += 1) {
    const drawn = [];
    for (let i = 0; i < families.length; i += 1) drawn.push(...byFamily.get(families[Math.floor(rand() * families.length)]));
    values.push(share(drawn));
  }
  values.sort((x, y) => x - y);
  const K = values.length;
  return { lower: round12(values[Math.floor(0.025 * (K - 1))]), upper: round12(values[Math.ceil(0.975 * (K - 1))]), grund: null };
}

/** Variant pairs as in the cost balance (SLV0-EVAL-37): B1 − B0 and each K-… − B1. */
function variantPairs(variants) {
  const pairs = [];
  if (variants.includes('B1') && variants.includes('B0')) pairs.push(['B1', 'B0']);
  if (variants.includes('B1')) for (const v of variants) if (v.startsWith('K-')) pairs.push([v, 'B1']);
  return pairs;
}

export function checkPairedOptions({ seed = DEFAULT_SEED, draws = DEFAULT_DRAWS } = {}) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new UsageError('--seed erwartet eine Ganzzahl 0…4294967295');
  if (!Number.isInteger(draws) || draws < MIN_DRAWS || draws > MAX_DRAWS) throw new UsageError(`--bootstrap erwartet eine Ganzzahl ${MIN_DRAWS}…${MAX_DRAWS}`);
  return { seed, draws };
}

/** Block `gepaart` of one level (SLV0-EVAL-45/-46). */
export function levelPaired(records, options = {}) {
  const { seed, draws } = checkPairedOptions(options);
  const variants = uniqSorted(records.map((r) => r.variante));
  const out = [];
  for (const [mv, sv] of variantPairs(variants)) {
    const key = (r) => `${r.case_id}\u0000${r.repeat_id}`;
    const subs = new Map(records.filter((r) => r.variante === sv).map((r) => [key(r), r]));
    const pairs = [];
    for (const m of records.filter((r) => r.variante === mv).sort((x, y) => cmp(x.run_id, y.run_id))) {
      const s = subs.get(key(m));
      if (!s) continue;
      pairs.push({ family: m.family_id, ids: [m.run_id, s.run_id], m: runOutcome(m), s: runOutcome(s) });
    }
    if (pairs.length === 0) continue;
    const allIds = pairs.flatMap((p) => p.ids);
    const evaluable = pairs.filter((p) => p.m !== 'unklar' && p.s !== 'unklar');
    const evIds = evaluable.flatMap((p) => p.ids);
    const count = (fn) => zahl(evaluable.filter(fn).length, evaluable.length, evIds);
    const a = evaluable.filter((p) => p.m === 'bestanden' && p.s === 'bestanden').length;
    const b = evaluable.filter((p) => p.m === 'bestanden' && p.s !== 'bestanden').length;
    const c = evaluable.filter((p) => p.m !== 'bestanden' && p.s === 'bestanden').length;
    const none = evaluable.length === 0;
    const idsOrAll = none ? allIds : evIds;
    const ci = none ? { lower: null, upper: null, grund: 'keine auswertbaren Paare' } : bootstrap(evaluable, { seed, draws });
    out.push({
      minuend: mv,
      subtrahend: sv,
      paare: { anzahl: pairs.length, rohdatensatz_ids: uniqSorted(allIds) },
      auswertbar: zahl(evaluable.length, pairs.length, allIds),
      unklar: zahl(pairs.length - evaluable.length, pairs.length, allIds),
      beide_bestanden: count((p) => p.m === 'bestanden' && p.s === 'bestanden'),
      nur_minuend_bestanden: count((p) => p.m === 'bestanden' && p.s !== 'bestanden'),
      nur_subtrahend_bestanden: count((p) => p.m !== 'bestanden' && p.s === 'bestanden'),
      beide_nicht_bestanden: count((p) => p.m !== 'bestanden' && p.s !== 'bestanden'),
      familien: { anzahl: new Set(evaluable.map((p) => p.family)).size, rohdatensatz_ids: uniqSorted(idsOrAll) },
      mcnemar_p: none
        ? wertfeld(null, allIds, 'keine auswertbaren Paare')
        : wertfeld(mcnemarExact(b, c), evIds, `exakt, zweiseitig, n = ${b + c} ungleiche Paare (b = ${b}, c = ${c}); Paare als unabhängig behandelt`),
      differenz_anteil: none
        ? wertfeld(null, allIds, 'keine auswertbaren Paare')
        : wertfeld(round12((b - c) / evaluable.length), evIds, `(a + b)/N − (a + c)/N mit a = ${a}, N = ${evaluable.length}`),
      intervall_95: {
        untere: wertfeld(ci.lower, idsOrAll, ci.grund),
        obere: wertfeld(ci.upper, idsOrAll, ci.grund),
        ziehungen: draws,
        seed,
        verfahren: VERFAHREN,
      },
    });
  }
  return out;
}
