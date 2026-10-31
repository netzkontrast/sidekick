// IDs, topic names and dates for the questions CLI (docs/spec/questions-cli-v0.md §5.1, QCLI-INV-08).
// Paths are only ever built from values that passed these checks.

const SUFFIX = '[a-z0-9]+(?:-[a-z0-9]+)*';
const ID_RES = {
  Q: new RegExp(`^Q-([0-9]{8})-(${SUFFIX})$`),
  A: new RegExp(`^A-([0-9]{8})-(${SUFFIX})$`),
  R: new RegExp(`^R-([0-9]{8})-(${SUFFIX})$`),
};
export const MAX_ID_LENGTH = 80;
export const MAX_TOPIC_LENGTH = 64;
const TOPIC_RE = new RegExp(`^${SUFFIX}$`);

/** Question/answer/round ID tokens inside free text (for mappings and references). */
export const Q_TOKEN = new RegExp(`Q-[0-9]{8}-${SUFFIX}`, 'g');
export const A_TOKEN = new RegExp(`A-[0-9]{8}-${SUFFIX}`, 'g');
export const R_TOKEN = new RegExp(`R-[0-9]{8}-${SUFFIX}`, 'g');
/** "Q-… vN" pairs in round files and chat lines. */
export const Q_VERSION_PAIR = new RegExp(`(Q-[0-9]{8}-${SUFFIX})\\s+v([0-9]+)`, 'g');

/** Whether YYYYMMDD is a real calendar date. */
export function validDate8(s) {
  if (!/^[0-9]{8}$/.test(s)) return false;
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(4, 6));
  const d = Number(s.slice(6, 8));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** null when `id` is a valid ID of kind Q, A or R; otherwise a reason. */
export function idProblem(kind, id) {
  if (typeof id !== 'string') return 'keine Zeichenkette';
  if (id.length > MAX_ID_LENGTH) return `länger als ${MAX_ID_LENGTH} Zeichen`;
  const m = ID_RES[kind].exec(id);
  if (!m) return `entspricht nicht ${kind}-<YYYYMMDD>-<suffix> (Suffix aus a-z, 0-9 und einzelnen Bindestrichen)`;
  if (!validDate8(m[1])) return `${m[1]} ist kein gültiges Datum`;
  return null;
}

export function isId(kind, id) {
  return idProblem(kind, id) === null;
}

export function idSuffix(id) {
  return id.slice(11);
}

export function topicProblem(name) {
  if (typeof name !== 'string' || name.length === 0) return 'fehlt';
  if (name.length > MAX_TOPIC_LENGTH) return `länger als ${MAX_TOPIC_LENGTH} Zeichen`;
  if (!TOPIC_RE.test(name)) return 'nur a-z, 0-9 und einzelne Bindestriche erlaubt';
  return null;
}

/** Parse --now (ISO-8601) into a Date; null when invalid. */
export function parseNow(value) {
  if (value === undefined) return new Date();
  if (typeof value !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9:.]+(Z|[+-][0-9]{2}:?[0-9]{2})?)?$/.test(value)) return null;
  const d = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** YYYY-MM-DD in UTC. */
export function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

/** YYYYMMDD in UTC. */
export function date8(date) {
  return isoDate(date).replaceAll('-', '');
}
