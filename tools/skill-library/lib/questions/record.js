// Canonical question files (records.md "Kanonische Frage"; docs/spec/questions-cli-v0.md §5.2/§5.3).
// Reading accepts hand-written files; every edit is line-exact, all other lines stay byte-identical (QCLI-INV-11).
import { A_TOKEN, R_TOKEN } from './ids.js';

export const STATUSES = ['open', 'asked', 'answered', 'deferred', 'superseded'];
export const KINDS = ['decision', 'fact'];
export const PRIORITIES = ['blocking', 'important', 'later'];
export const PLACEHOLDER = 'Noch keine. Empfehlung ist keine Antwort.';

/** Payload field → body label, in canonical order (records.md). */
export const BODY_FIELDS = [
  ['kind', 'Art'],
  ['priority', 'Priorität'],
  ['context', 'Kontext / Quelle'],
  ['occasion', 'Anlass'],
  ['impact', 'Auswirkung / blockierte Arbeit'],
  ['question', 'Fragestellung'],
  ['options', 'Optionen und Folgen'],
  ['recommendation', 'Empfehlung + sachlicher Grund'],
  ['evidence_needed', 'Benötigter Sachbeleg'],
];
export const LABEL_OF = Object.fromEntries(BODY_FIELDS);

export const ANSWER_LABELS = {
  id: 'Antwort-ID',
  source: 'Zeit / beantwortet von / Quelle',
  ref: 'Bezug',
  text: 'Antwort',
  replaces: 'Ersetzt Antwort',
  conflict: 'Konflikt mit',
  consequences: 'Folgen / Rückfragen',
};

const LABEL_RE = /^([A-Za-zÄÖÜäöüß][^:]{0,60}?):(?:[ \t]+(.*)|[ \t]*)$/;
const FM_KEY_RE = /^([A-Za-z_][A-Za-z0-9_-]*):(?:[ \t]+(.*)|[ \t]*)$/;

export function splitLines(text) {
  const endsNl = text.endsWith('\n');
  const lines = text.split('\n');
  if (endsNl) lines.pop();
  return { lines, endsNl };
}

export function joinLines(lines, endsNl = true) {
  return lines.join('\n') + (endsNl ? '\n' : '');
}

function unquote(s) {
  const t = s.trim();
  if (t.length >= 2 && ((t[0] === '"' && t.at(-1) === '"') || (t[0] === "'" && t.at(-1) === "'"))) return t.slice(1, -1);
  return t;
}

/** Flow list `[a, "b"]` → ['a', 'b']; null when not a flow list. */
function parseFlowList(raw) {
  const t = raw.trim();
  if (!t.startsWith('[') || !t.endsWith(']')) return null;
  const inner = t.slice(1, -1).trim();
  if (inner === '') return [];
  return inner.split(',').map((x) => unquote(x)).filter((x) => x !== '');
}

/** Format a list as written by the CLI: JSON flow style with double quotes. */
export function formatList(items) {
  return items.length === 0 ? '[]' : `[${items.map((x) => JSON.stringify(x)).join(', ')}]`;
}

/**
 * Field lines from `start` (inclusive) to `end` (exclusive): label lines with their continuation lines.
 * Continuation: a following non-blank line that is not a label line and not a heading.
 */
export function parseFields(lines, start, end) {
  const fields = [];
  let cur = null;
  for (let i = start; i < end; i += 1) {
    const l = lines[i];
    const m = LABEL_RE.exec(l);
    if (m) {
      cur = { label: m[1].trim(), line: i, end: i + 1, value: (m[2] ?? '').trim() };
      fields.push(cur);
    } else if (cur && l.trim() !== '' && !l.startsWith('#') && cur.end === i) {
      cur.value = cur.value === '' ? l.trim() : `${cur.value}\n${l.trim()}`;
      cur.end = i + 1;
    } else {
      cur = null;
    }
  }
  return fields;
}

function firstField(fields, label) {
  return fields.find((f) => f.label === label) ?? null;
}

/** Text of an answer without quotes and the (wörtlich)/(sinngemäß) marker, for comparisons. */
export function answerCore(value) {
  let t = (value ?? '').trim();
  t = t.replace(/\s*\((?:wörtlich|sinngemäß)[^)]*\)\s*$/u, '');
  t = t.replace(/^[„“"']+|[“”"']+$/gu, '');
  return t.trim();
}

/** Normalized text for "recommendation used as answer" comparison. */
export function normalizeForCompare(s) {
  return answerCore(s).toLowerCase().replace(/[„“”"'«»]/gu, '').replace(/\s+/gu, ' ').replace(/[.!;:,\s]+$/u, '').trim();
}

function refOf(value) {
  if (!value) return null;
  const m = value.match(A_TOKEN);
  return m ? m[0] : null;
}

function parseAnswers(lines, sec) {
  const answers = [];
  let cur = null;
  let inComment = false;
  for (let i = sec.line + 1; i < sec.end; i += 1) {
    const l = lines[i];
    if (inComment) {
      if (l.includes('-->')) inComment = false;
      continue;
    }
    if (l.includes('<!--')) {
      if (!l.includes('-->')) inComment = true;
      continue;
    }
    const m = LABEL_RE.exec(l);
    if (!m) continue;
    const label = m[1].trim();
    const value = (m[2] ?? '').trim();
    if (label === ANSWER_LABELS.id) {
      cur = { id: value, line: i, fields: {} };
      answers.push(cur);
    } else if (cur) {
      if (!(label in cur.fields)) cur.fields[label] = value;
    }
  }
  for (const a of answers) {
    const ref = a.fields[ANSWER_LABELS.ref] ?? '';
    const vm = /Version\s+([0-9]+)/.exec(ref);
    a.version = vm ? Number(vm[1]) : null;
    const rm = ref.match(R_TOKEN);
    a.round = rm ? rm[0] : null;
    a.source = (a.fields[ANSWER_LABELS.source] ?? a.fields.Quelle ?? '').trim();
    a.text = a.fields[ANSWER_LABELS.text] ?? '';
    a.replaces = refOf(a.fields[ANSWER_LABELS.replaces]);
    a.conflictWith = refOf(a.fields[ANSWER_LABELS.conflict]);
  }
  return answers;
}

function problem(code, message, line = null) {
  return { code, message, line: line === null ? null : line + 1 };
}

/**
 * Parse a question file. Returns a document with `problems` (structural errors; empty when the file can be
 * edited safely) and the parsed model.
 */
export function parseQuestion(text) {
  const problems = [];
  if (text.charCodeAt(0) === 0xfeff) problems.push(problem('question_invalid', 'Datei beginnt mit BOM'));
  if (text.includes('\r')) problems.push(problem('question_invalid', 'Zeilenenden CRLF oder CR'));
  const { lines, endsNl } = splitLines(text);
  const doc = { text, lines, endsNl, problems, frontmatter: {}, fmKeys: [], answers: [], history: [], sections: [], fields: [] };
  if (lines[0] !== '---') {
    problems.push(problem('question_invalid', 'Frontmatter fehlt (erste Zeile ist nicht ---)', 0));
    return doc;
  }
  const fmEnd = lines.indexOf('---', 1);
  if (fmEnd < 0) {
    problems.push(problem('question_invalid', 'Frontmatter nicht geschlossen', 0));
    return doc;
  }
  doc.fmEnd = fmEnd;
  let last = null;
  for (let i = 1; i < fmEnd; i += 1) {
    const l = lines[i];
    if (l.trim() === '' || l.trimStart().startsWith('#')) continue;
    const m = FM_KEY_RE.exec(l);
    if (m) {
      last = { key: m[1], line: i, end: i + 1, raw: (m[2] ?? '').trim(), items: null };
      doc.fmKeys.push(last);
      continue;
    }
    const item = /^\s+-\s+(.*)$/.exec(l);
    if (item && last && last.raw === '' && last.end === i) {
      (last.items ??= []).push(unquote(item[1]));
      last.end = i + 1;
      continue;
    }
    problems.push(problem('question_invalid', `Frontmatter-Zeile nicht lesbar: ${l.slice(0, 40)}`, i));
  }
  const key = (k) => doc.fmKeys.find((e) => e.key === k) ?? null;
  for (const k of ['id', 'status', 'needs_review', 'depends_on']) {
    if (!key(k)) problems.push(problem('question_invalid', `Frontmatter-Schlüssel ${k} fehlt`, 0));
  }
  const fm = doc.frontmatter;
  if (key('id')) fm.id = unquote(key('id').raw);
  if (key('status')) {
    fm.status = unquote(key('status').raw);
    if (!STATUSES.includes(fm.status)) problems.push(problem('question_invalid', `status ${fm.status} unbekannt`, key('status').line));
  }
  if (key('needs_review')) {
    const v = unquote(key('needs_review').raw);
    if (v === 'true' || v === 'false') fm.needs_review = v === 'true';
    else problems.push(problem('question_invalid', `needs_review ist weder true noch false`, key('needs_review').line));
  }
  if (key('depends_on')) {
    const e = key('depends_on');
    const list = e.items ?? (e.raw === '' ? [] : parseFlowList(e.raw));
    if (list === null) problems.push(problem('question_invalid', 'depends_on ist keine Liste', e.line));
    else fm.depends_on = list;
  }
  // Sections and header.
  for (let i = fmEnd + 1; i < lines.length; i += 1) {
    const hm = /^##\s+(.*)$/.exec(lines[i]);
    if (hm) doc.sections.push({ name: hm[1].trim(), line: i, end: lines.length });
  }
  for (let s = 0; s < doc.sections.length - 1; s += 1) doc.sections[s].end = doc.sections[s + 1].line;
  const headerEnd = doc.sections.length > 0 ? doc.sections[0].line : lines.length;
  for (let i = fmEnd + 1; i < headerEnd; i += 1) {
    if (/^#\s+/.test(lines[i])) {
      doc.titleLine = i;
      doc.title = lines[i].replace(/^#\s+/, '').trim();
      break;
    }
  }
  if (doc.titleLine === undefined) problems.push(problem('question_invalid', 'Überschrift (# Frage) fehlt', fmEnd + 1));
  doc.fields = parseFields(lines, (doc.titleLine ?? fmEnd) + 1, headerEnd);
  const vf = firstField(doc.fields, 'Version');
  if (!vf || !/^[1-9][0-9]*$/.test(vf.value)) problems.push(problem('question_invalid', 'Feld Version fehlt oder ist keine positive Ganzzahl', vf ? vf.line : fmEnd + 1));
  else doc.version = Number(vf.value);
  doc.versionField = vf;
  const answersSec = doc.sections.find((s) => s.name === 'Antworten');
  const historySec = doc.sections.find((s) => s.name === 'Verlauf');
  if (!answersSec) problems.push(problem('question_invalid', 'Abschnitt ## Antworten fehlt'));
  if (!historySec) problems.push(problem('question_invalid', 'Abschnitt ## Verlauf fehlt'));
  doc.answersSec = answersSec ?? null;
  doc.historySec = historySec ?? null;
  if (answersSec) doc.answers = parseAnswers(lines, answersSec);
  if (historySec) {
    for (let i = historySec.line + 1; i < historySec.end; i += 1) {
      if (/^-\s+/.test(lines[i])) doc.history.push({ line: i, text: lines[i].replace(/^-\s+/, '') });
    }
  }
  return doc;
}

/** Body field value by payload name or label (joined continuation lines). */
export function fieldValue(doc, label) {
  const f = firstField(doc.fields, label);
  return f ? f.value : null;
}

// ---------- line-exact edits; each returns new text ----------

function withLines(doc, fn) {
  const lines = [...doc.lines];
  fn(lines);
  return joinLines(lines, doc.endsNl);
}

/** Replace a frontmatter key's line (and block list items) by `key: value`. */
export function setFrontmatter(doc, key, value) {
  const e = doc.fmKeys.find((k) => k.key === key);
  if (!e) throw new Error(`frontmatter key ${key} missing`);
  return withLines(doc, (lines) => lines.splice(e.line, e.end - e.line, `${key}: ${value}`));
}

/** Replace a header field line (and its continuation lines) by `Label: value`. */
export function setField(doc, label, value) {
  const f = firstField(doc.fields, label);
  if (!f) throw new Error(`field ${label} missing`);
  return withLines(doc, (lines) => lines.splice(f.line, f.end - f.line, `${label}: ${value}`));
}

export function setTitle(doc, title) {
  return withLines(doc, (lines) => { lines[doc.titleLine] = `# ${title}`; });
}

function lastNonBlank(lines, from, to) {
  for (let i = to - 1; i >= from; i -= 1) if (lines[i].trim() !== '') return i;
  return -1;
}

/** Append an answer block at the end of ## Antworten; removes only the placeholder line (QCLI-INV-05). */
export function appendAnswer(doc, blockLines) {
  const sec = doc.answersSec;
  return withLines(doc, (lines) => {
    let end = sec.end;
    for (let i = sec.line + 1; i < end; i += 1) {
      if (lines[i].trim() === PLACEHOLDER) {
        lines.splice(i, 1);
        end -= 1;
        i -= 1;
      }
    }
    const lastIdx = lastNonBlank(lines, sec.line + 1, end);
    const insertAt = lastIdx < 0 ? sec.line + 1 : lastIdx + 1;
    const block = lastIdx < 0 ? [...blockLines] : ['', ...blockLines];
    lines.splice(insertAt, 0, ...block);
    const after = insertAt + block.length;
    if (after < lines.length && lines[after].trim() !== '') lines.splice(after, 0, '');
  });
}

/** Append `- entry` at the end of ## Verlauf. */
export function appendHistory(doc, entry) {
  const sec = doc.historySec;
  return withLines(doc, (lines) => {
    const lastIdx = lastNonBlank(lines, sec.line + 1, sec.end);
    const insertAt = lastIdx < 0 ? sec.line + 1 : lastIdx + 1;
    lines.splice(insertAt, 0, `- ${entry}`);
    const after = insertAt + 1;
    if (after < lines.length && /^#/.test(lines[after])) lines.splice(after, 0, '');
  });
}

/** Text of a new canonical question (records.md). */
export function buildQuestion(q, date) {
  const val = (k) => (q[k] === undefined || q[k] === null ? null : String(q[k]));
  const lines = [
    '---',
    `id: ${q.id}`,
    'status: open',
    'needs_review: false',
    `depends_on: ${formatList(q.depends_on ?? [])}`,
    '---',
    `# ${q.title}`,
    'Version: 1',
    `Erstellt: ${date}`,
    `Art: ${q.kind}`,
    `Priorität: ${q.priority}`,
    `Kontext / Quelle: ${val('context')}`,
    `Anlass: ${val('occasion')}`,
    `Auswirkung / blockierte Arbeit: ${val('impact')}`,
    `Fragestellung: ${val('question') ?? q.title}`,
    `Optionen und Folgen: ${val('options')}`,
    `Empfehlung + sachlicher Grund: ${val('recommendation')}`,
    `Benötigter Sachbeleg: ${val('evidence_needed') ?? 'keiner'}`,
    '',
    '## Antworten',
    PLACEHOLDER,
    '',
    '## Verlauf',
    `- ${date}: Erfasst.`,
  ];
  return joinLines(lines);
}

/** Lines of an answer block (records.md, spec §5.3). */
export function buildAnswerBlock(a) {
  const text = a.verbatim === false ? `${a.text} (sinngemäß)` : `„${a.text}“ (wörtlich)`;
  return [
    `${ANSWER_LABELS.id}: ${a.id}`,
    `${ANSWER_LABELS.source}: ${a.sourceLine}`,
    `${ANSWER_LABELS.ref}: ${a.refLine}`,
    `${ANSWER_LABELS.text}: ${text}`,
    `${ANSWER_LABELS.replaces}: ${a.replaces ?? 'keine'}`,
    `${ANSWER_LABELS.conflict}: ${a.conflictWith ?? 'keiner'}`,
    `${ANSWER_LABELS.consequences}: ${a.consequences ?? 'keine'}`,
  ];
}
