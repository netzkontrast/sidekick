// `questions check`: read-only invariant check of a store or one topic (docs/spec/questions-cli-v0.md §6.3, QCLI-CMD-15).
import fs from 'node:fs';
import path from 'node:path';
import { sortMessages, compareCodepoints } from '../core.js';
import { idProblem, topicProblem } from './ids.js';
import { LABEL_OF, fieldValue, normalizeForCompare } from './record.js';
import { findSecrets } from './secrets.js';
import { loadTopic, listTopics, msg, Refusal } from './store.js';
import { effectiveAnswer, openConflicts, findCycle, deferInfo } from './model.js';

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) if (text.charCodeAt(i) === 10) line += 1;
  return line;
}

function secretMessages(text, rel) {
  return findSecrets(text).map((f) => msg('secret_detected', `secret-artiger Wert (Muster ${f.pattern}); redigieren`, { path: rel, line: lineOf(text, f.index), rule: 'QCLI-INV-07' }));
}

const W = { severity: 'warning' };

function checkQuestion(q, td, out) {
  const d = q.doc;
  for (const p of d.problems) out.push(msg('question_invalid', p.message, { path: q.rel, line: p.line, rule: 'QCLI-INV-11' }));
  out.push(...secretMessages(q.text, q.rel));
  if (d.problems.length > 0) return;
  const fm = d.frontmatter;
  const fmIdProblem = idProblem('Q', fm.id);
  if (fmIdProblem) out.push(msg('id_invalid', `Frontmatter-ID: ${fmIdProblem}`, { path: q.rel, rule: 'QCLI-INV-08' }));
  if (fm.id !== q.id) out.push(msg('id_mismatch', `Frontmatter-ID ${fm.id} ungleich Dateiname ${q.id}`, { path: q.rel, rule: 'QCLI-INV-08' }));
  if (fm.status === 'answered' && d.answers.length === 0) {
    out.push(msg('answered_without_answer', 'Status answered ohne Antwort-Eintrag', { path: q.rel, rule: 'QCLI-INV-01' }));
  }
  const ids = new Set(d.answers.map((a) => a.id));
  const rec = fieldValue(d, LABEL_OF.recommendation);
  for (const a of d.answers) {
    const line = a.line + 1;
    if (idProblem('A', a.id)) out.push(msg('id_invalid', `Antwort-ID ${a.id}: ${idProblem('A', a.id)}`, { path: q.rel, line, rule: 'QCLI-INV-08' }));
    if (a.source === '') out.push(msg('answer_source_missing', `Antwort ${a.id} ohne Quelle`, { path: q.rel, line, rule: 'QCLI-INV-01' }));
    if (a.version === null) out.push(msg('answer_version_unknown', `Antwort ${a.id}: Bezug ohne Version`, { path: q.rel, line, rule: 'QCLI-INV-03', ...W }));
    for (const ref of [a.replaces, a.conflictWith]) {
      if (ref && !ids.has(ref)) out.push(msg('answer_ref_unknown', `Antwort ${a.id} verweist auf unbekannte Antwort ${ref}`, { path: q.rel, line, rule: 'QCLI-INV-05' }));
    }
    if (rec && normalizeForCompare(a.text) === normalizeForCompare(rec)) {
      out.push(msg('recommendation_as_answer', `Antwort ${a.id} gleicht der Empfehlung (von Hand prüfen)`, { path: q.rel, line, rule: 'QCLI-INV-02', ...W }));
    }
  }
  if ((fm.status === 'open' || fm.status === 'asked') && effectiveAnswer(d) !== null) {
    out.push(msg('status_answer_mismatch', `Status ${fm.status} trotz wirksamer Antwort ${effectiveAnswer(d).id} auf Version ${d.version}`, { path: q.rel, rule: 'QCLI-INV-01' }));
  }
  if (openConflicts(d).length > 0 && !fm.needs_review) {
    out.push(msg('conflict_without_review', 'offener Konflikt ohne needs_review: true', { path: q.rel, rule: 'QCLI-INV-03' }));
  }
  for (const dep of fm.depends_on ?? []) {
    const p = idProblem('Q', dep);
    const target = td.questions.get(dep);
    if (p || !target) out.push(msg('dependency_unknown', `depends_on ${dep}: ${p ?? 'Frage gibt es im Thema nicht'}`, { path: q.rel, rule: 'QCLI-CMD-03' }));
    else if (target.doc.frontmatter.status === 'superseded') out.push(msg('dependency_superseded', `depends_on ${dep} ist superseded`, { path: q.rel, rule: 'QCLI-CMD-08', ...W }));
  }
  if (fm.status === 'deferred' && !deferInfo(d)) out.push(msg('defer_reason_missing', 'deferred ohne Vertagungseintrag (Grund, Wiederaufnahme) im Verlauf', { path: q.rel, rule: 'QCLI-CMD-07', ...W }));
  if (fm.status === 'superseded' && !d.history.some((h) => /Q-[0-9]{8}-/.test(h.text) && /ersetz/i.test(h.text))) {
    out.push(msg('supersede_ref_missing', 'superseded ohne Verweis auf die ersetzende Frage im Verlauf', { path: q.rel, rule: 'QCLI-CMD-08', ...W }));
  }
  if (td.index && !td.index.doc.rows.some((r) => r.id === q.id)) {
    out.push(msg('index_stale', `Frage ${q.id} fehlt im Index (render)`, { path: td.index.rel, rule: 'QCLI-INV-06', ...W }));
  }
}

export function checkTopic(td) {
  const out = [];
  if (td.index === null) {
    out.push(msg('index_missing', 'Themenindex index.md fehlt', { path: `${td.topic}/index.md`, rule: 'QCLI-INV-06' }));
  } else {
    for (const p of td.index.doc.problems) out.push(msg(p.code, p.message, { path: td.index.rel, line: p.line, rule: 'QCLI-INV-06' }));
    out.push(...secretMessages(td.index.text, td.index.rel));
    for (const r of td.index.doc.rows) {
      if (!td.questions.has(r.id) || r.target !== `questions/${r.id}.md`) {
        out.push(msg('index_row_orphan', `Indexzeile ${r.id} verweist auf keine passende Fragedatei (${r.target})`, { path: td.index.rel, line: r.line + 1, rule: 'QCLI-INV-06' }));
      }
    }
  }
  for (const b of td.badNames) out.push(msg('id_invalid', `Dateiname ist keine gültige Frage-ID: ${b.reason}`, { path: b.rel, rule: 'QCLI-INV-08' }));
  const answerOwners = new Map();
  for (const q of [...td.questions.values()].sort((a, b) => compareCodepoints(a.id, b.id))) {
    checkQuestion(q, td, out);
    for (const a of q.doc.answers) {
      if (answerOwners.has(a.id)) out.push(msg('answer_id_duplicate', `Antwort-ID ${a.id} auch in ${answerOwners.get(a.id)}`, { path: q.rel, line: a.line + 1, rule: 'QCLI-INV-08' }));
      else answerOwners.set(a.id, q.rel);
    }
  }
  const graph = new Map();
  for (const q of td.questions.values()) if (q.doc.problems.length === 0) graph.set(q.id, q.doc.frontmatter.depends_on ?? []);
  const cycle = findCycle(graph);
  if (cycle) out.push(msg('dependency_cycle', `Abhängigkeitszyklus: ${cycle.join(' → ')}`, { path: `${td.topic}/questions`, rule: 'QCLI-CMD-03' }));
  for (const r of td.rounds.values()) {
    const probs = [...r.doc.problems];
    if (!r.idOk) probs.push(`Dateiname ist keine gültige Runden-ID: ${idProblem('R', r.id)}`);
    else if (r.doc.title !== r.id) probs.push(`Überschrift ${r.doc.title} ungleich Dateiname`);
    for (const p of probs) out.push(msg('round_invalid', p, { path: r.rel, rule: 'QCLI-CMD-04' }));
    for (const m of r.doc.mapping) {
      if (!td.questions.has(m.id)) out.push(msg('round_ref_unknown', `Runde nennt unbekannte Frage ${m.id}`, { path: r.rel, rule: 'QCLI-CMD-04', ...W }));
    }
    out.push(...secretMessages(r.text, r.rel));
  }
  for (const t of td.temps) out.push(msg('temp_file_left', 'temporäre Datei eines abgebrochenen Laufs', { path: t, rule: 'QCLI-INV-09', ...W }));
  return out;
}

/** Check one topic or every topic under the root. Directories without index.md and questions/ are skipped. */
export function checkStore(root, topic) {
  const topics = topic !== undefined ? [topic] : listTopics(root).filter((t) => topicProblem(t) === null);
  const checked = [];
  const messages = [];
  let questions = 0;
  for (const t of topics) {
    const dir = path.join(root, t);
    if (topic === undefined && !fs.existsSync(path.join(dir, 'index.md')) && !fs.existsSync(path.join(dir, 'questions'))) continue;
    let td;
    try {
      td = loadTopic(root, t);
    } catch (err) {
      if (!(err instanceof Refusal)) throw err;
      messages.push(...err.messages);
      continue;
    }
    checked.push(t);
    questions += td.questions.size;
    messages.push(...checkTopic(td));
  }
  const sorted = sortMessages(messages.map((m) => ({ ...m, path: m.path ?? '' })));
  const errors = sorted.filter((m) => m.severity === 'error').length;
  return { topics: checked, questions, summary: { errors, warnings: sorted.length - errors }, messages: sorted };
}
