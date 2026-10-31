// Round files for tool delivery (records.md "Runde bei Tool-Zustellung"; docs/spec/questions-cli-v0.md §5.5).
import { splitLines, joinLines, parseFields } from './record.js';
import { Q_VERSION_PAIR } from './ids.js';

export const ROUND_STATUSES = ['prepared', 'sent', 'partial', 'answered', 'failed'];
export const DELIVERIES = ['bestaetigt', 'unbekannt', 'fehlgeschlagen'];

export function parseRound(text) {
  const { lines, endsNl } = splitLines(text);
  const titleLine = lines.findIndex((l) => /^#\s+/.test(l));
  const doc = { text, lines, endsNl, problems: [] };
  doc.title = titleLine >= 0 ? lines[titleLine].replace(/^#\s+/, '').trim() : null;
  doc.fields = parseFields(lines, titleLine + 1, lines.length);
  const f = (label) => doc.fields.find((x) => x.label === label) ?? null;
  doc.statusField = f('Status');
  doc.status = doc.statusField ? doc.statusField.value : null;
  doc.resultField = f('Ergebnis');
  doc.mapping = [...text.matchAll(Q_VERSION_PAIR)].map((m) => ({ id: m[1], version: Number(m[2]) }));
  if (text.includes('\r')) doc.problems.push('Zeilenenden CRLF oder CR');
  if (doc.title === null) doc.problems.push('Überschrift (# R-…) fehlt');
  if (!ROUND_STATUSES.includes(doc.status)) doc.problems.push(`Status ${doc.status ?? '(fehlt)'} unbekannt`);
  return doc;
}

const DELIVERY_TEXT = { bestaetigt: 'bestätigt', unbekannt: 'unbekannt', fehlgeschlagen: 'fehlgeschlagen' };
export const ROUND_STATUS_FOR = { bestaetigt: 'sent', unbekannt: 'prepared', fehlgeschlagen: 'failed' };

export function deliveryText(delivery, date) {
  return delivery === 'unbekannt' ? 'unbekannt' : `${DELIVERY_TEXT[delivery]}, ${date}`;
}

export function buildRound(r, date) {
  const lines = [
    `# ${r.round_id}`,
    `Status: ${ROUND_STATUS_FOR[r.delivery]}`,
    `Kontextversion: ${r.context_version ?? 'unbekannt'}`,
    `Tool/Chat: ${r.tool}`,
    'Mapping:',
    ...r.questions.map((q, i) => `- ${q.field ?? `Feld ${i + 1}`} → ${q.id} v${q.version}`),
    `Gestellt: ${r.asked ?? 'Fragestellungen der Frage-Dateien'}`,
    `Zustellung / Zeitpunkt: ${deliveryText(r.delivery, date)}`,
    'Antwortquelle: ausstehend',
    'Ergebnis: ausstehend',
    `Fehler / Wiederaufnahme: ${r.delivery === 'fehlgeschlagen' ? 'Toolfehler; Fragen bleiben unverändert' : '–'}`,
  ];
  return joinLines(lines);
}

export function chatRoundLine(r) {
  const pairs = r.questions.map((q) => `${q.id} v${q.version}`).join(', ');
  return `Chat-Runden: ${r.round_id} – ${pairs} – ${r.asked ?? 'im Chat gestellt'} – Zustellung ${DELIVERY_TEXT[r.delivery]}`;
}

/** Add an answer reference to `Ergebnis` and set `Status`. */
export function recordRoundAnswer(doc, answerId, status) {
  const lines = [...doc.lines];
  const rf = doc.resultField;
  if (rf) {
    const v = rf.value.trim();
    const next = v === '' || v === 'ausstehend' || v === '–' ? answerId : `${v.split('\n').join(' ')}, ${answerId}`;
    lines.splice(rf.line, rf.end - rf.line, `Ergebnis: ${next}`);
  } else {
    lines.push(`Ergebnis: ${answerId}`);
  }
  if (doc.statusField) {
    // Line numbers before the result field are unchanged by the splice above when Status comes first.
    const idx = lines.findIndex((l) => l.startsWith('Status:'));
    lines[idx] = `Status: ${status}`;
  }
  return joinLines(lines, doc.endsNl);
}
