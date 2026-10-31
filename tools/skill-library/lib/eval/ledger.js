// Append-only ledger (SLV0-EVAL-05, -07): JSON Lines, one entry per line, never rewritten.
// Every write takes an exclusive lock file `<ledger>.lock`; an existing lock is never removed by
// the tool (ledger_locked). The counter is a protocol, not a system-wide cost barrier.
import fs from 'node:fs';
import path from 'node:path';
import { schemaErrors, evalMsg, EvalRefusal, UsageError, isSha256 } from './common.js';

export const LEDGER_SCHEMA = 'eval-ledger';
export const MAX_LIMIT = 40; // owner live budget for the research phase (handover §7)
export const OUTCOMES = ['completed', 'failed_start', 'aborted', 'client_error'];
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function now() {
  return new Date().toISOString();
}

/** Parse and check an existing ledger; throws UsageError if it is damaged (never repaired). */
export function readLedger(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') throw new UsageError(`Ledger ${file} existiert nicht; zuerst eval ledger init`);
    throw err;
  }
  if (text.length > 0 && !text.endsWith('\n')) throw new UsageError(`Ledger ${file} endet nicht mit Zeilenumbruch (beschädigt?)`);
  const lines = text.split('\n').slice(0, -1);
  const entries = lines.map((line, i) => {
    let e;
    try { e = JSON.parse(line); } catch { throw new UsageError(`Ledger ${file} Zeile ${i + 1}: kein JSON`); }
    const errs = schemaErrors(LEDGER_SCHEMA, e);
    if (errs.length > 0) throw new UsageError(`Ledger ${file} Zeile ${i + 1}: ${errs[0]}`);
    if (e.seq !== i + 1) throw new UsageError(`Ledger ${file} Zeile ${i + 1}: seq ${e.seq} statt ${i + 1}`);
    return e;
  });
  if (entries.length === 0 || entries[0].kind !== 'ledger') throw new UsageError(`Ledger ${file} beginnt nicht mit einem ledger-Kopf`);
  if (entries.slice(1).some((e) => e.kind === 'ledger')) throw new UsageError(`Ledger ${file} hat mehr als einen Kopf`);
  return entries;
}

export function summarize(entries) {
  const head = entries[0];
  const reservations = entries.filter((e) => e.kind === 'reservation');
  const results = new Map(entries.filter((e) => e.kind === 'result').map((e) => [e.attempt_id, e]));
  return {
    limit: head.limit,
    manifest_sha256: head.manifest_sha256,
    starts_reserved: reservations.length,
    remaining: Math.max(0, head.limit - reservations.length),
    attempts: reservations.map((r) => ({
      attempt_id: r.attempt_id,
      trial_id: r.trial_id,
      status: r.status,
      outcome: results.get(r.attempt_id)?.outcome ?? null,
    })),
    split_events: entries.filter((e) => e.kind === 'split_access' || e.kind === 'split_selection').length,
  };
}

/**
 * Run `fn(entries)` under the exclusive lock; `fn` returns new entries (without seq/recorded_at)
 * to append, or throws. Nothing is appended when `fn` throws an EvalRefusal unless it carries
 * `appendBeforeRefusal` entries (used to protocol split access violations).
 */
export function withLock(file, fn) {
  const lock = `${file}.lock`;
  let fd;
  try {
    fd = fs.openSync(lock, 'wx', 0o600);
  } catch (err) {
    if (err.code === 'EEXIST') {
      throw new EvalRefusal([evalMsg('ledger_locked', path.basename(lock), 'Sperre existiert; sie wird nicht überschrieben oder entfernt. Prüfen, ob ein anderer Vorgang läuft')]);
    }
    throw err;
  }
  try {
    fs.closeSync(fd);
    const entries = readLedger(file);
    let toAppend;
    let refusal = null;
    try {
      toAppend = fn(entries);
    } catch (err) {
      if (!(err instanceof EvalRefusal) || !err.appendBeforeRefusal) throw err;
      toAppend = err.appendBeforeRefusal;
      refusal = err;
    }
    const stamped = toAppend.map((e, i) => ({ schema_version: 1, seq: entries.length + i + 1, recorded_at: now(), ...e }));
    for (const e of stamped) {
      const errs = schemaErrors(LEDGER_SCHEMA, e);
      if (errs.length > 0) throw new Error(`interner Fehler: Ledger-Eintrag ungültig: ${errs[0]}`);
    }
    if (stamped.length > 0) {
      const appendFd = fs.openSync(file, 'a');
      try {
        fs.writeSync(appendFd, stamped.map((e) => `${JSON.stringify(e)}\n`).join(''));
        fs.fsyncSync(appendFd);
      } finally {
        fs.closeSync(appendFd);
      }
    }
    if (refusal) throw refusal;
    return { entries: [...entries, ...stamped], appended: stamped };
  } finally {
    fs.unlinkSync(lock);
  }
}

/** Create a new ledger; never overwrites an existing file. */
export function initLedger(file, { limit, manifestSha256 = null }) {
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) throw new UsageError(`--limit muss eine Ganzzahl 1…${MAX_LIMIT} sein`);
  if (manifestSha256 !== null && !isSha256(manifestSha256)) throw new UsageError('Manifest-Hash ungültig');
  if (!fs.existsSync(path.dirname(path.resolve(file)))) throw new UsageError(`Elternverzeichnis von ${file} fehlt`);
  const head = { schema_version: 1, seq: 1, kind: 'ledger', recorded_at: now(), limit, manifest_sha256: manifestSha256 };
  try {
    fs.writeFileSync(file, `${JSON.stringify(head)}\n`, { flag: 'wx' });
  } catch (err) {
    if (err.code === 'EEXIST') throw new UsageError(`Ledger ${file} existiert bereits; es wird nie überschrieben`);
    throw err;
  }
  return head;
}

/** Reserve one start before it happens (reserved_before_start). */
export function reserveStart(file, trialId) {
  if (typeof trialId !== 'string' || !ID_RE.test(trialId)) throw new UsageError('--trial-id ungültig');
  const { appended, entries } = withLock(file, (existing) => {
    const head = existing[0];
    const used = existing.filter((e) => e.kind === 'reservation').length;
    if (used >= head.limit) {
      throw new EvalRefusal([evalMsg('budget_exhausted', file, `Start ${used + 1} überschreitet das freigegebene Limit ${head.limit}; nichts reserviert`)]);
    }
    return [{ kind: 'reservation', attempt_id: used + 1, trial_id: trialId, status: 'reserved_before_start', limit: head.limit }];
  });
  return { reservation: appended[0], summary: summarize(entries) };
}

/** Append the outcome of a reserved start as its own entry. One result per attempt. */
export function recordResult(file, { attemptId, outcome, traceSha256 = null, rawIds = [] }) {
  if (!Number.isInteger(attemptId) || attemptId < 1) throw new UsageError('--attempt-id muss eine positive Ganzzahl sein');
  if (!OUTCOMES.includes(outcome)) throw new UsageError(`--outcome muss eines von ${OUTCOMES.join(', ')} sein`);
  if (traceSha256 !== null && !isSha256(traceSha256)) throw new UsageError('--trace-sha256 ist kein SHA-256');
  for (const id of rawIds) if (!ID_RE.test(id)) throw new UsageError(`Rohdatensatz-ID ungültig: ${id}`);
  const { appended, entries } = withLock(file, (existing) => {
    if (!existing.some((e) => e.kind === 'reservation' && e.attempt_id === attemptId)) {
      throw new UsageError(`attempt_id ${attemptId} ist nicht reserviert`);
    }
    if (existing.some((e) => e.kind === 'result' && e.attempt_id === attemptId)) {
      throw new UsageError(`attempt_id ${attemptId} hat bereits ein Ergebnis; Nachträge werden nicht überschrieben`);
    }
    return [{ kind: 'result', attempt_id: attemptId, outcome, trace_sha256: traceSha256, raw_ids: rawIds }];
  });
  return { result: appended[0], summary: summarize(entries) };
}
