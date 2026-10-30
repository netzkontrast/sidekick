// Raw record per start (SLV0-EVAL-09, fields after SL1 §8). Built from caller metadata plus a
// normalized trace; observed facts (model, status, catalog, skill calls, usage, trace hash) come
// only from the trace and cannot be supplied by the caller.
import { runUsageFromTrace } from '../tokens.js';
import { UsageError, requireSchema } from './common.js';
import { NORMALIZED_SCHEMA, NORMALIZER, pilotView } from './normalize.js';

export const RAW_SCHEMA = 'eval-raw-record';
const DERIVED = ['schema_version', 'modell', 'spur_sha256', 'status', 'katalog', 'skill_aufrufe', 'usage', 'normalisierer'];

export function buildRawRecord(meta, normalized) {
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
    normalisierer: NORMALIZER,
  };
  requireSchema(RAW_SCHEMA, record, 'Rohdatensatz');
  if (record.variante === 'B0' && record.skills.length > 0) throw new UsageError('Variante B0 darf keine Skills nennen');
  const ids = record.assertions.map((a) => a.id);
  if (new Set(ids).size !== ids.length) throw new UsageError('doppelte Assertion-IDs');
  return record;
}
