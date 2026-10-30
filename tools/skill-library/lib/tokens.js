// Token counting with source labels (SLV0-TOK-01…08). No tokenizer, no network (SLV0-INV-04).
// Bytes, lines and words are exact; tokens are `unbekannt` unless an estimator is chosen.
import { textStats } from './core.js';

export const ESTIMATORS = {
  // ceil(UTF-8 bytes / 4). Named estimator, version 1. Not a tokenizer.
  'utf8-bytes-div-4@1': (bytes) => Math.ceil(bytes / 4),
};

const RANK = { unbekannt: 0, geschaetzt: 1, gemeldet: 2 };

export function unknownToken(bezug, grund) {
  return { wert: null, quelle: 'unbekannt', methode: null, bezug, beleg: grund };
}

export function estimateToken(bytes, estimator, bezug) {
  if (!estimator) return unknownToken(bezug, 'kein Schätzer gewählt (SLV0-TOK-04)');
  const fn = ESTIMATORS[estimator];
  if (!fn) throw new Error(`unbekannter Schätzer ${estimator}`);
  return { wert: fn(bytes), quelle: 'geschaetzt', methode: estimator, bezug, beleg: `${estimator} über ${bytes} UTF-8-Bytes` };
}

/**
 * Sum token records (SLV0-TOK-05): the weakest source wins; any unknown summand makes the sum
 * unknown; methods are never mixed (mixed methods → unknown).
 */
export function sumTokens(records, bezug) {
  if (records.length === 0) return unknownToken(bezug, 'leere Summe');
  let weakest = records[0].quelle;
  for (const r of records) if (RANK[r.quelle] < RANK[weakest]) weakest = r.quelle;
  if (weakest === 'unbekannt') return unknownToken(bezug, 'Summe enthält mindestens einen unbekannten Summanden (SLV0-TOK-05)');
  const methods = new Set(records.map((r) => r.methode));
  const sources = new Set(records.map((r) => r.quelle));
  if (methods.size > 1 || sources.size > 1) return unknownToken(bezug, 'Summe würde Methoden oder Quellen mischen (SLV0-TOK-05)');
  return {
    wert: records.reduce((acc, r) => acc + r.wert, 0),
    quelle: weakest,
    methode: records[0].methode,
    bezug,
    beleg: `Summe aus ${records.length} Werten`,
  };
}

/**
 * Count one valid package (result of validatePackage) per loading stage (SLV0-TOK-02).
 * Stages: katalog (`name` + "\n" + `description`), rumpf (SKILL.md without frontmatter),
 * one entry per other file, paket (sum of all files).
 */
export function countPackage(pkg, { estimator = null, tokenBudget = null } = {}) {
  const fm = pkg.frontmatter;
  const skill = pkg.files.find((f) => f.rel === 'SKILL.md');
  const stages = [];
  const katalogText = `${fm.fields.get('name').value}\n${fm.fields.get('description').value}`;
  const katalogBuf = Buffer.from(katalogText, 'utf8');
  stages.push({ bezug: 'katalog', ...textStats(katalogBuf), tokens: estimateToken(katalogBuf.length, estimator, 'katalog') });
  const body = skill.bytes.subarray(fm.bodyByteOffset);
  stages.push({ bezug: 'rumpf', ...textStats(body), tokens: estimateToken(body.length, estimator, 'rumpf') });
  const fileTokens = [];
  for (const f of pkg.files) {
    const t = estimateToken(f.bytes.length, estimator, f.rel);
    fileTokens.push(t);
    if (f.rel === 'SKILL.md') continue;
    stages.push({ bezug: f.rel, ...textStats(f.bytes), tokens: t });
  }
  const totals = pkg.files.reduce((acc, f) => {
    const s = textStats(f.bytes);
    return { bytes: acc.bytes + s.bytes, lines: acc.lines + s.lines, words: acc.words + s.words };
  }, { bytes: 0, lines: 0, words: 0 });
  const paket = { bezug: 'paket', ...totals, tokens: sumTokens(fileTokens, 'paket') };
  stages.push(paket);
  const warnings = [];
  // SLV0-TOK-07: a budget based on estimated tokens yields at most a warning.
  if (tokenBudget !== null && paket.tokens.quelle !== 'unbekannt' && paket.tokens.wert > tokenBudget) {
    warnings.push({
      path: pkg.path, line: null, code: 'budget_exceeded', severity: 'warning', rule: 'SLV0-TOK-07',
      message: `${paket.tokens.quelle} ${paket.tokens.wert} Tokens (${paket.tokens.methode}) > Budget ${tokenBudget}; nur Warnung`,
    });
  }
  return { name: pkg.name, path: pkg.path, content_hash: pkg.content_hash, stages, warnings };
}

const USAGE_FIELDS = ['input_tokens', 'output_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens'];

/**
 * Run usage from a normalized client trace (SLV0-TOK-06/-08): reported for the run with the
 * trace hash as evidence; never attributed to a single skill.
 */
export function runUsageFromTrace(trace) {
  const traceHash = typeof trace.trace_sha256 === 'string' ? trace.trace_sha256 : null;
  const model = typeof trace.reported_model === 'string' ? trace.reported_model : null;
  const usage = trace.usage && typeof trace.usage === 'object' ? trace.usage : null;
  const lauf = {};
  for (const field of USAGE_FIELDS) {
    const v = usage ? usage[field] : undefined;
    if (traceHash && Number.isInteger(v) && v >= 0) {
      lauf[field] = { wert: v, quelle: 'gemeldet', methode: `client-usage@${model ?? 'modell-unbekannt'}`, bezug: 'lauf', beleg: `trace_sha256:${traceHash}` };
    } else {
      lauf[field] = unknownToken('lauf', usage ? `Feld ${field} fehlt oder ist keine Ganzzahl` : 'Spur ohne Usage');
    }
  }
  const skills = new Set();
  for (const a of Array.isArray(trace.activation_evidence) ? trace.activation_evidence : []) {
    if (a && typeof a.skill === 'string') skills.add(a.skill);
  }
  const jeSkill = [...skills].sort().map((skill) => ({
    skill,
    tokens: unknownToken(`skill:${skill}`, 'Lauf-Usage wird keinem einzelnen Skill zugeschrieben (SLV0-TOK-06)'),
  }));
  const cost = typeof trace.reported_cost_usd === 'number' ? trace.reported_cost_usd : null;
  return {
    trace_sha256: traceHash,
    lauf_usage: lauf,
    je_skill: jeSkill,
    kosten_client_schaetzung: cost === null
      ? { wert: null, quelle: 'unbekannt', beleg: 'Spur ohne total_cost_usd' }
      : { wert: cost, quelle: 'gemeldet', beleg: `trace_sha256:${traceHash}`, hinweis: 'Client-Schätzung; tatsächliche Rechnung unbekannt (SLV0-TOK-08)' },
  };
}
