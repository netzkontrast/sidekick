// Topic index (records.md "Themenindex"; docs/spec/questions-cli-v0.md §5.4).
// The index is a projection: links and short questions only, plus the session status (QCLI-INV-06).
import { splitLines, joinLines } from './record.js';
import { Q_VERSION_PAIR, R_TOKEN } from './ids.js';

export const SESSION_STATES = ['active', 'waiting_user', 'blocked_research', 'paused', 'awaiting_confirmation', 'complete'];
export const TABLE_HEADER = '| ID / Datei | Kurzfrage |';
export const TABLE_SEPARATOR = '|---|---|';
export const PENDING = 'ausstehend';

const ROW_RE = /^\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|(.*)\|\s*$/;
const SEPARATOR_RE = /^\|(\s*:?-{3,}:?\s*\|)+\s*$/;
const CHAT_RE = /^Chat-Runde[n]?\b[^:]*:/;

export function parseIndex(text) {
  const problems = [];
  if (text.charCodeAt(0) === 0xfeff) problems.push({ code: 'index_invalid', message: 'Index beginnt mit BOM', line: 1 });
  if (text.includes('\r')) problems.push({ code: 'index_invalid', message: 'Zeilenenden CRLF oder CR', line: null });
  const { lines, endsNl } = splitLines(text);
  const doc = { text, lines, endsNl, problems, rows: [], chatRounds: [], session: null, sessionLine: null, header: null };
  for (let i = 0; i < lines.length; i += 1) {
    const l = lines[i];
    if (doc.titleLine === undefined && /^#\s+/.test(l)) {
      doc.titleLine = i;
      doc.title = l.replace(/^#\s+/, '').trim();
    }
    const sm = /^Session:\s*(.*)$/.exec(l);
    if (sm && doc.sessionLine === null) {
      doc.sessionLine = i;
      doc.session = sm[1].trim();
    }
    if (doc.header === null && l.startsWith('|') && i + 1 < lines.length && SEPARATOR_RE.test(lines[i + 1])) {
      doc.header = i;
    }
    const rm = ROW_RE.exec(l);
    if (rm && rm[1].trim().startsWith('Q-')) doc.rows.push({ id: rm[1].trim(), target: rm[2].trim(), short: rm[3].trim(), line: i });
    if (CHAT_RE.test(l)) {
      const pairs = [...l.matchAll(Q_VERSION_PAIR)].map((m) => ({ id: m[1], version: Number(m[2]) }));
      doc.chatRounds.push({ line: i, text: l, roundIds: l.match(R_TOKEN) ?? [], mapping: pairs });
    }
  }
  if (doc.sessionLine === null) problems.push({ code: 'index_invalid', message: 'Zeile Session: fehlt', line: null });
  else if (!SESSION_STATES.includes(doc.session)) problems.push({ code: 'session_invalid', message: `Session ${doc.session} unbekannt`, line: doc.sessionLine + 1 });
  // Table region: header, separator, then rows and blank lines that are followed by further rows.
  if (doc.header !== null) {
    let end = doc.header + 2;
    let i = end;
    while (i < lines.length) {
      if (lines[i].startsWith('|')) {
        end = i + 1;
        i += 1;
      } else if (lines[i].trim() === '') {
        i += 1;
      } else {
        break;
      }
    }
    doc.tableEnd = end;
    doc.outsideRows = doc.rows.filter((r) => r.line < doc.header || r.line >= end);
  } else {
    doc.outsideRows = doc.rows;
  }
  return doc;
}

function edit(doc, fn) {
  const lines = [...doc.lines];
  fn(lines);
  return joinLines(lines, doc.endsNl);
}

export function setSession(doc, state) {
  return edit(doc, (lines) => { lines[doc.sessionLine] = `Session: ${state}`; });
}

/** Set `Label: value`; inserts before "Bestätigung:"/at the end when missing. */
export function setIndexField(doc, label, value) {
  return edit(doc, (lines) => {
    const i = lines.findIndex((l) => l.startsWith(`${label}:`));
    if (i >= 0) {
      lines[i] = `${label}: ${value}`;
      return;
    }
    const before = lines.findIndex((l) => l.startsWith('Bestätigung:'));
    if (before >= 0 && label !== 'Bestätigung') lines.splice(before, 0, `${label}: ${value}`);
    else lines.push(`${label}: ${value}`);
  });
}

export function indexFieldValue(doc, label) {
  const l = doc.lines.find((x) => x.startsWith(`${label}:`));
  return l === undefined ? null : l.slice(label.length + 1).trim();
}

export function escapeCell(s) {
  return s.replaceAll('|', '\\|');
}

export function rowLine(id, short) {
  return `| [${id}](questions/${id}.md) | ${escapeCell(short)} |`;
}

/** Append rows after the last row of the table; insert a table after the header fields when missing. */
export function appendRows(doc, rows) {
  if (rows.length === 0) return doc.text;
  const newLines = rows.map((r) => rowLine(r.id, r.short));
  return edit(doc, (lines) => {
    if (doc.header !== null) {
      const tableRows = doc.rows.filter((r) => r.line >= doc.header && r.line < doc.tableEnd);
      const at = tableRows.length > 0 ? tableRows.at(-1).line + 1 : doc.header + 2;
      lines.splice(at, 0, ...newLines);
      return;
    }
    // No table: after the leading header field lines below the title.
    let at = (doc.titleLine ?? -1) + 1;
    while (at < lines.length && /^[A-Za-zÄÖÜäöüß][^:]{0,60}?:(\s|$)/.test(lines[at])) at += 1;
    const block = ['', TABLE_HEADER, TABLE_SEPARATOR, ...newLines];
    if (at < lines.length && lines[at].trim() !== '') block.push('');
    lines.splice(at, 0, ...block);
  });
}

/** Append a chat round line after the last chat round line, else at the end. */
export function appendChatRound(doc, line) {
  return edit(doc, (lines) => {
    const last = doc.chatRounds.at(-1);
    if (last) lines.splice(last.line + 1, 0, line);
    else lines.push(line);
  });
}

/** Add an answer reference to the chat round line of `roundId`. */
export function addChatAnswerRef(doc, roundId, answerId) {
  const cr = doc.chatRounds.find((c) => c.roundIds.includes(roundId));
  return edit(doc, (lines) => {
    const l = lines[cr.line];
    lines[cr.line] = / – Antworten: /.test(l) ? `${l}, ${answerId}` : `${l} – Antworten: ${answerId}`;
  });
}

export function buildIndex(p) {
  const goal = p.goal ?? PENDING;
  const lines = [
    `# ${p.title}`,
    'Session: active',
    `Ziel / Nicht-Ziele: ${p.non_goals ? `${goal} / nicht: ${p.non_goals}` : goal}`,
    `Kontext: ${p.context ?? PENDING}`,
    `Bearbeiter: ${p.editor ?? PENDING}`,
    '',
    TABLE_HEADER,
    TABLE_SEPARATOR,
    '',
    'Status und Abhängigkeiten ausschließlich in den Frage-Dateien führen.',
    `Nächste Runde / Forschungsblockade: ${PENDING}`,
    `Zusammenfassung: ${PENDING}`,
    `Bestätigung: ${PENDING}`,
  ];
  return joinLines(lines);
}
