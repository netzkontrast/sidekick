// Raw record per start (SLV0-EVAL-09, fields after SL1 §8). Built from caller metadata plus a
// normalized trace; observed facts (model, status, catalog, skill calls, usage, trace hash) come
// only from the trace and cannot be supplied by the caller. Optional cross-checks: a rubric
// (SLV0-EVAL-15) and the ledger (SLV0-EVAL-16); both are only read.
import { runUsageFromTrace } from '../tokens.js';
import { UsageError, requireSchema, evalMsg, EvalRefusal } from './common.js';
import { NORMALIZED_SCHEMA, NORMALIZER, pilotView } from './normalize.js';
import { bindRecordToRubric } from './rubric.js';
import { toRawBalance } from './costbalance.js';

export const RAW_SCHEMA = 'eval-raw-record';
const DERIVED = ['schema_version', 'modell', 'spur_sha256', 'status', 'katalog', 'skill_aufrufe', 'usage', 'kostenbilanz', 'normalisierer'];

/**
 * @param meta caller metadata (SL1 §8 fields that the trace cannot provide)
 * @param normalized normalized trace (SLV0-EVAL-08)
 * @param {{rubric?: object|null, ledger?: object[]|null, ledgerLabel?: string}} [opts]
 *   rubric: rubric object to bind (EVAL-15); ledger: parsed ledger entries to cross-check (EVAL-16)
 */
export function buildRawRecord(meta, normalized, { rubric = null, ledger = null, ledgerLabel = 'ledger' } = {}) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) throw new UsageError('Metadaten müssen ein JSON-Objekt sein');
  for (const k of DERIVED) {
    if (Object.hasOwn(meta, k)) throw new UsageError(`Metadatenfeld ${k} wird aus der normalisierten Spur abgeleitet und darf nicht gesetzt werden`);
  }
  requireSchema(NORMALIZED_SCHEMA, normalized, 'normalisierte Spur');
  const usage = runUsageFromTrace(pilotView(normalized));
  const record = {
    schema_version: 1,
    ...meta,
    modell: normalized.model,
    spur_sha256: normalized.trace_sha256,
    status: normalized.status,
    katalog: normalized.catalog,
    skill_aufrufe: {
      beobachtbar: normalized.activations.length > 0,
      abwesenheit_belegt: false,
      aufrufe: normalized.activations.map((a) => ({ skill: a.skill, modus: a.mode, bestaetigt: a.confirmed })),
    },
    usage: { lauf: usage.lauf_usage, je_skill: usage.je_skill, kosten_client_schaetzung: usage.kosten_client_schaetzung },
    kostenbilanz: toRawBalance(normalized.cost_balance ?? null), // SLV0-EVAL-33; null for older traces
    normalisierer: NORMALIZER,
  };
  if (rubric !== null) {
    // The rubric supplies rubrik_version when the metadata leave it open; checked before the schema.
    if (record.rubrik_version === undefined) record.rubrik_version = null;
    bindRecordToRubric(record, rubric);
  }
  requireSchema(RAW_SCHEMA, record, 'Rohdatensatz');
  if (record.variante === 'B0' && record.skills.length > 0) throw new UsageError('Variante B0 darf keine Skills nennen');
  const ids = record.assertions.map((a) => a.id);
  if (new Set(ids).size !== ids.length) throw new UsageError('doppelte Assertion-IDs');
  checkAssertionMarks(record);
  if (ledger !== null) checkAgainstLedger(record, ledger, ledgerLabel);
  return record;
}

/**
 * SLV0-EVAL-24: `trennschaerfe` only on deterministic non-R assertions; at most one `kern` and one
 * `gegen` role per record, never on an R assertion. Violations are usage errors (exit 2).
 */
export function checkAssertionMarks(record, label = 'Rohdatensatz') {
  const roles = { kern: 0, gegen: 0 };
  for (const a of record.assertions) {
    const t = a.trennschaerfe ?? null;
    if (t !== null && (a.art !== 'deterministisch' || a.r_regel !== null)) {
      throw new UsageError(`${label} ${record.run_id}: trennschaerfe nur an deterministischen Assertions ohne r_regel (${a.id})`);
    }
    const r = a.rolle ?? null;
    if (r !== null) {
      if (a.r_regel !== null) throw new UsageError(`${label} ${record.run_id}: R-Assertion ${a.id} darf keine rolle tragen`);
      roles[r] += 1;
      if (roles[r] > 1) throw new UsageError(`${label} ${record.run_id}: mehr als eine Assertion mit rolle ${r}`);
    }
  }
}

/**
 * SLV0-EVAL-16: the attempt is reserved in the ledger under trial ID `<case_id>--<variante>`;
 * a recorded result names the same trace hash and, if it lists raw IDs, this run_id.
 */
export function checkAgainstLedger(record, entries, label = 'ledger') {
  const messages = [];
  const reservation = entries.find((e) => e.kind === 'reservation' && e.attempt_id === record.attempt_id);
  if (!reservation) {
    messages.push(evalMsg('ledger_mismatch', label, `attempt_id ${record.attempt_id} ist im Ledger nicht reserviert`));
  } else {
    const expected = `${record.case_id}--${record.variante}`;
    if (reservation.trial_id !== expected) {
      messages.push(evalMsg('ledger_mismatch', label, `attempt_id ${record.attempt_id} ist für ${reservation.trial_id} reserviert, nicht für ${expected}`));
    }
    const result = entries.find((e) => e.kind === 'result' && e.attempt_id === record.attempt_id);
    if (result) {
      if (result.trace_sha256 !== null && result.trace_sha256 !== record.spur_sha256) {
        messages.push(evalMsg('ledger_mismatch', label, `Ergebnis zu attempt_id ${record.attempt_id} nennt Spur ${result.trace_sha256.slice(0, 12)}…, Rohdatensatz ${record.spur_sha256.slice(0, 12)}…`));
      }
      if (result.raw_ids.length > 0 && !result.raw_ids.includes(record.run_id)) {
        messages.push(evalMsg('ledger_mismatch', label, `Ergebnis zu attempt_id ${record.attempt_id} nennt raw_ids ${result.raw_ids.join(', ')}, nicht ${record.run_id}`));
      }
    }
  }
  if (messages.length > 0) throw new EvalRefusal(messages);
}
