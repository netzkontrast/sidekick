// Commands of the questions CLI (docs/spec/questions-cli-v0.md §4). Every command first checks everything and
// collects refusals, then returns the planned file changes; cli.js commits them atomically (QCLI-INV-09/-10).
import { compareCodepoints } from '../core.js';
import { idProblem, idSuffix } from './ids.js';
import {
  KINDS, PRIORITIES, LABEL_OF, parseQuestion, fieldValue, setFrontmatter, setField, setTitle,
  appendAnswer, appendHistory, buildQuestion, buildAnswerBlock, formatList, normalizeForCompare,
} from './record.js';
import {
  SESSION_STATES, parseIndex, setSession, setIndexField, indexFieldValue, appendRows, appendChatRound,
  addChatAnswerRef, buildIndex,
} from './topic-index.js';
import { DELIVERIES, parseRound, buildRound, chatRoundLine, recordRoundAnswer } from './round.js';
import {
  Refusal, msg, refuse, loadTopic, topicPaths, assertNoSymlink, questionIdsInRoot, readText,
} from './store.js';
import { validate, scanSecrets, SOURCE_SCHEMA, notHumanWord } from './payload.js';
import {
  effectiveAnswer, openConflicts, unmetPrerequisites, transitiveDependents, findCycle, nextReport, questionSummary,
} from './model.js';

const STR = { type: 'string' };
const REQ = { type: 'string', required: true };

// ---------- shared helpers ----------

/** Pending edits across files; each edit re-parses the current text. */
class Workspace {
  constructor() {
    this.files = new Map();
  }

  track(abs, rel, before) {
    if (!this.files.has(abs)) this.files.set(abs, { abs, rel, before, after: before });
    return this.files.get(abs);
  }

  text(abs) {
    return this.files.get(abs).after;
  }

  set(abs, text) {
    this.files.get(abs).after = text;
  }

  create(abs, rel, text) {
    this.files.set(abs, { abs, rel, before: null, after: text });
  }

  changes() {
    return [...this.files.values()].filter((f) => f.after !== f.before).sort((a, b) => compareCodepoints(a.rel, b.rel));
  }
}

function load(ctx) {
  const td = loadTopic(ctx.root, ctx.topic);
  if (td.index === null && td.questions.size === 0) {
    throw new Refusal([msg('topic_missing', `Thema ${ctx.topic} hat keinen Index (zuerst init)`, { path: `${ctx.topic}/index.md`, rule: 'QCLI-CMD-02' })]);
  }
  return td;
}

function requireIndex(td) {
  if (td.index === null) {
    throw new Refusal([msg('topic_missing', 'Themenindex fehlt (zuerst init)', { path: `${td.topic}/index.md`, rule: 'QCLI-CMD-02' })]);
  }
  const probs = td.index.doc.problems;
  if (probs.length > 0) {
    throw new Refusal(probs.map((p) => msg('index_invalid', `Index nicht bearbeitbar: ${p.message}`, { path: td.index.rel, rule: 'QCLI-INV-11', line: p.line })));
  }
}

/** Valid, editable question or a refusal message. */
function getQuestion(td, id, field) {
  if (typeof id !== 'string') return { error: msg('payload_invalid', `${field} fehlt`, { field, rule: 'QCLI-CMD-01' }) };
  const p = idProblem('Q', id);
  if (p) return { error: msg('id_invalid', `${field}: ${p}`, { field, rule: 'QCLI-INV-08' }) };
  const q = td.questions.get(id);
  if (!q) return { error: msg('question_unknown', `Frage ${id} gibt es im Thema nicht`, { field, rule: 'QCLI-CMD-01' }) };
  if (q.doc.problems.length > 0) {
    return { error: msg('question_invalid', `Frage ${id} nicht bearbeitbar: ${q.doc.problems.map((x) => x.message).join('; ')}`, { path: q.rel, rule: 'QCLI-INV-11' }) };
  }
  if (q.doc.frontmatter.id !== id) {
    return { error: msg('question_invalid', `Frontmatter-ID ${q.doc.frontmatter.id} ungleich Dateiname`, { path: q.rel, rule: 'QCLI-INV-11' }) };
  }
  return { q };
}

function questionOrCollect(td, id, field, errors) {
  const r = getQuestion(td, id, field);
  if (r.error) errors.push(r.error);
  return r.q ?? null;
}

function history(ctx, text) {
  return `${ctx.date}: ${text}`;
}

/** Apply a function to the parsed current text of a question in the workspace. */
function editQ(ws, q, fn) {
  ws.track(q.abs, q.rel, q.text);
  ws.set(q.abs, fn(parseQuestion(ws.text(q.abs))));
}

function setStatus(ws, q, status) {
  editQ(ws, q, (d) => (d.frontmatter.status === status ? d.text : setFrontmatter(d, 'status', status)));
}

function setReview(ws, q, value) {
  editQ(ws, q, (d) => (d.frontmatter.needs_review === value ? d.text : setFrontmatter(d, 'needs_review', String(value))));
}

function addHistory(ws, q, ctx, text) {
  editQ(ws, q, (d) => appendHistory(d, history(ctx, text)));
}

function editIndex(ws, td, fn) {
  ws.track(td.index.abs, td.index.rel, td.index.text);
  ws.set(td.index.abs, fn(parseIndex(ws.text(td.index.abs))));
}

function currentDoc(ws, q) {
  return parseQuestion(ws.files.has(q.abs) ? ws.text(q.abs) : q.text);
}

function sourceLine(ctx, s) {
  return `${s.time ?? ctx.date}, ${s.by}, ${s.channel} (${s.ref ?? 'keine Message-ID'})`;
}

function sourceProblems(source, field = 'source') {
  const out = [];
  if (!source || typeof source !== 'object' || !source.by || source.by.trim() === '' || !source.channel || source.channel.trim() === '') {
    out.push(msg('answer_source_missing', `${field}.by und ${field}.channel sind Pflicht: wer hat wo geantwortet`, { field, rule: 'QCLI-INV-01' }));
  }
  return out;
}

function notHumanProblems(source, field = 'source.by') {
  if (!source?.by) return [];
  const w = notHumanWord(source.by);
  return w ? [msg('answer_not_human', `${field} „${source.by}“ bezeichnet keinen antwortenden Menschen (${w}); Empfehlung, Default oder Frist sind nie eine Antwort`, { field, rule: 'QCLI-INV-02' })] : [];
}

/** Round mapping by ID: round file or chat line in the index; null when unknown. */
function roundMapping(td, ws, roundId) {
  const r = td.rounds.get(roundId);
  if (r) return { kind: 'file', round: r, mapping: parseRound(ws.files.has(r.abs) ? ws.text(r.abs) : r.text).mapping };
  if (td.index) {
    const cr = parseIndex(ws.files.has(td.index.abs) ? ws.text(td.index.abs) : td.index.text).chatRounds.find((c) => c.roundIds.includes(roundId));
    if (cr) return { kind: 'chat', mapping: cr.mapping };
  }
  return null;
}

function allAnswerIds(td) {
  const ids = new Set();
  for (const q of td.questions.values()) for (const a of q.doc.answers) ids.add(a.id);
  return ids;
}

function nextAnswerId(ctx, td, q, taken) {
  const base = `A-${ctx.d8}-${idSuffix(q.id)}`;
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const id = `${base}-${n}`;
    if (!taken.has(id)) return id;
  }
}

function dependencyProblems(td, deps, field, extra = new Map()) {
  const out = [];
  for (const [i, dep] of deps.entries()) {
    const f = `${field}[${i}]`;
    const p = idProblem('Q', dep);
    if (p) out.push(msg('id_invalid', `${f}: ${p}`, { field: f, rule: 'QCLI-INV-08' }));
    else if (!td.questions.has(dep) && !extra.has(dep)) out.push(msg('dependency_unknown', `${f}: Frage ${dep} gibt es im Thema nicht`, { field: f, rule: 'QCLI-CMD-03' }));
  }
  return out;
}

function cycleProblem(graph) {
  const c = findCycle(graph);
  return c ? [msg('dependency_cycle', `Abhängigkeitszyklus: ${c.join(' → ')}`, { rule: 'QCLI-CMD-03' })] : [];
}

function graphOf(td) {
  const g = new Map();
  for (const q of td.questions.values()) if (q.doc.problems.length === 0) g.set(q.id, q.doc.frontmatter.depends_on ?? []);
  return g;
}

// ---------- commands ----------

const INIT_SCHEMA = { title: REQ, goal: STR, non_goals: STR, context: STR, editor: STR };

export function cmdInit(ctx, payload) {
  refuse(validate(payload, INIT_SCHEMA));
  refuse(scanSecrets(payload));
  const p = topicPaths(ctx.root, ctx.topic);
  assertNoSymlink(ctx.root, p.questionsDir, `${ctx.topic}/questions`);
  assertNoSymlink(ctx.root, p.index, `${ctx.topic}/index.md`);
  if (readText(p.index) !== null) refuse([msg('topic_exists', `Thema ${ctx.topic} hat schon einen Index`, { path: `${ctx.topic}/index.md`, rule: 'QCLI-CMD-02' })]);
  const ws = new Workspace();
  ws.create(p.index, p.rel(p.index), buildIndex(payload));
  return { result: { created: p.rel(p.index), session: 'active' }, ws, dirs: [p.topicDir, p.questionsDir] };
}

const QUESTION_SCHEMA = {
  id: REQ,
  title: REQ,
  kind: { type: 'string', required: true, enum: KINDS },
  priority: { type: 'string', required: true, enum: PRIORITIES },
  context: REQ,
  occasion: REQ,
  impact: REQ,
  options: REQ,
  recommendation: REQ,
  question: STR,
  evidence_needed: STR,
  depends_on: { type: 'array', items: { type: 'string' } },
  short: STR,
};

export function cmdAdd(ctx, payload) {
  let items;
  if (payload && typeof payload === 'object' && !Array.isArray(payload) && Object.hasOwn(payload, 'questions')) {
    refuse(validate(payload, { questions: { type: 'array', required: true, nonEmpty: true, items: { type: 'object', props: QUESTION_SCHEMA } } }));
    items = payload.questions.map((q, i) => ({ q, prefix: `questions[${i}].` }));
  } else {
    refuse(validate(payload, QUESTION_SCHEMA));
    items = [{ q: payload, prefix: '' }];
  }
  refuse(scanSecrets(payload));
  const td = load(ctx);
  requireIndex(td);
  const errors = [];
  const inRoot = questionIdsInRoot(ctx.root);
  const batch = new Map();
  for (const { q, prefix } of items) {
    const p = idProblem('Q', q.id);
    if (p) {
      errors.push(msg('id_invalid', `${prefix}id: ${p}`, { field: `${prefix}id`, rule: 'QCLI-INV-08' }));
      continue;
    }
    if (inRoot.has(q.id)) errors.push(msg('id_collision', `${q.id} ist schon vergeben (${inRoot.get(q.id)})`, { field: `${prefix}id`, rule: 'QCLI-INV-08' }));
    else if (batch.has(q.id)) errors.push(msg('id_collision', `${q.id} kommt im Stapel doppelt vor`, { field: `${prefix}id`, rule: 'QCLI-INV-08' }));
    batch.set(q.id, q);
  }
  for (const { q, prefix } of items) {
    const deps = q.depends_on ?? [];
    errors.push(...dependencyProblems(td, deps, `${prefix}depends_on`, batch));
    if (deps.includes(q.id)) errors.push(msg('dependency_cycle', `${q.id} hängt von sich selbst ab`, { field: `${prefix}depends_on`, rule: 'QCLI-CMD-03' }));
  }
  if (errors.length === 0) {
    const g = graphOf(td);
    for (const q of batch.values()) g.set(q.id, q.depends_on ?? []);
    errors.push(...cycleProblem(g));
  }
  refuse(errors);
  const ws = new Workspace();
  const rows = [];
  const indexIds = new Set(td.index.doc.rows.map((r) => r.id));
  for (const q of batch.values()) {
    const abs = td.paths.question(q.id);
    const rel = td.paths.rel(abs);
    assertNoSymlink(ctx.root, abs, rel);
    ws.create(abs, rel, buildQuestion(q, ctx.date));
    if (!indexIds.has(q.id)) rows.push({ id: q.id, short: q.short ?? q.title });
  }
  rows.sort((a, b) => compareCodepoints(a.id, b.id));
  if (rows.length > 0) editIndex(ws, td, (d) => appendRows(d, rows));
  return { result: { added: [...batch.keys()] }, ws, dirs: [td.paths.questionsDir] };
}

const ASK_SCHEMA = {
  round_id: REQ,
  channel: { type: 'string', required: true, enum: ['chat', 'tool'] },
  tool: STR,
  delivery: { type: 'string', required: true, enum: DELIVERIES },
  questions: { type: 'array', required: true, nonEmpty: true, items: { type: 'object', props: { id: REQ, version: { type: 'int', required: true }, field: STR } } },
  asked: STR,
  context_version: STR,
};

export function cmdAsk(ctx, payload) {
  refuse(validate(payload, ASK_SCHEMA));
  if (payload.channel === 'tool' && !payload.tool) refuse([msg('payload_invalid', 'tool ist bei channel tool Pflicht', { field: 'tool', rule: 'QCLI-CMD-04' })]);
  refuse(scanSecrets(payload));
  const td = load(ctx);
  requireIndex(td);
  const errors = [];
  const session = td.index.doc.session;
  if (session === 'paused' || session === 'complete') errors.push(msg('session_paused', `Session ist ${session}; zuerst resume bzw. neues Interview`, { path: td.index.rel, rule: 'QCLI-CMD-04' }));
  const rp = idProblem('R', payload.round_id);
  if (rp) errors.push(msg('id_invalid', `round_id: ${rp}`, { field: 'round_id', rule: 'QCLI-INV-08' }));
  else if (td.rounds.has(payload.round_id) || td.index.doc.chatRounds.some((c) => c.roundIds.includes(payload.round_id))) {
    errors.push(msg('round_exists', `Runde ${payload.round_id} ist schon vergeben`, { field: 'round_id', rule: 'QCLI-INV-08' }));
  }
  const seen = new Set();
  const picked = [];
  payload.questions.forEach((item, i) => {
    const field = `questions[${i}].id`;
    if (seen.has(item.id)) {
      errors.push(msg('payload_invalid', `${item.id} doppelt in der Runde`, { field, rule: 'QCLI-CMD-04' }));
      return;
    }
    seen.add(item.id);
    const q = questionOrCollect(td, item.id, field, errors);
    if (!q) return;
    const fm = q.doc.frontmatter;
    if (item.version !== q.doc.version) {
      errors.push(msg('version_mismatch', `${q.id}: Version ${item.version} ist nicht die aktuelle (${q.doc.version})`, { field: `questions[${i}].version`, rule: 'QCLI-CMD-04' }));
    }
    const allowed = fm.status === 'asked'
      || (['open', 'deferred'].includes(fm.status) && !fm.needs_review)
      || (fm.status === 'answered' && fm.needs_review);
    if (!allowed) {
      const why = fm.status === 'answered' ? ' ohne Prüfbedarf (Korrektur über correct)'
        : fm.needs_review ? ' und prüfpflichtig (zuerst review oder revise)' : '';
      errors.push(msg('invalid_transition', `${q.id} ist ${fm.status}${why}; nicht fragbar`, { path: q.rel, rule: 'QCLI-CMD-04' }));
    }
    const unmet = unmetPrerequisites(td.questions, q);
    if (unmet.length > 0) {
      errors.push(msg('dependency_unmet', `${q.id}: Voraussetzungen nicht erfüllt: ${unmet.map((u) => `${u.id} (${u.reason})`).join(', ')}`, { path: q.rel, rule: 'QCLI-CMD-04' }));
    }
    picked.push({ q, item });
  });
  refuse(errors);
  const ws = new Workspace();
  const d = payload.delivery;
  const report = [];
  for (const { q, item } of picked) {
    const before = q.doc.frontmatter.status;
    let after = before;
    if (d === 'bestaetigt' && (before === 'open' || before === 'deferred')) after = 'asked';
    setStatus(ws, q, after);
    const note = {
      bestaetigt: `In ${payload.round_id} gestellt (Version ${item.version}), Zustellung bestätigt.`,
      unbekannt: `In ${payload.round_id} ausgegeben (Version ${item.version}), Zustellung unbekannt; Status unverändert.`,
      fehlgeschlagen: `${payload.round_id} fehlgeschlagen (Version ${item.version}); Status unverändert.`,
    }[d];
    addHistory(ws, q, ctx, before === 'deferred' && after === 'asked' ? `Wiederaufnahme. ${note}` : note);
    report.push({ id: q.id, version: item.version, status_before: before, status_after: after });
  }
  const dirs = [];
  if (payload.channel === 'tool') {
    const abs = td.paths.round(payload.round_id);
    const rel = td.paths.rel(abs);
    assertNoSymlink(ctx.root, abs, rel);
    ws.create(abs, rel, buildRound(payload, ctx.date));
    dirs.push(td.paths.roundsDir);
  } else {
    editIndex(ws, td, (doc) => appendChatRound(doc, chatRoundLine(payload)));
  }
  let sessionAfter = session;
  if (d !== 'fehlgeschlagen' && session !== 'waiting_user') {
    sessionAfter = 'waiting_user';
    editIndex(ws, td, (doc) => setSession(doc, 'waiting_user'));
  }
  return { result: { round_id: payload.round_id, delivery: d, questions: report, session: sessionAfter }, ws, dirs };
}

const ANSWER_BASE = {
  question_id: REQ,
  text: REQ,
  verbatim: { type: 'bool' },
  source: { type: 'object', props: SOURCE_SCHEMA },
  answer_id: STR,
  consequences: STR,
};

function answerLike(ctx, payload, mode) {
  const schema = mode === 'answer'
    ? { ...ANSWER_BASE, version: { type: 'int', required: true }, round_id: REQ }
    : { ...ANSWER_BASE, version: { type: 'int' }, round_id: STR, replaces: REQ };
  refuse(validate(payload, schema));
  const td = load(ctx);
  requireIndex(td);
  const errors = [];
  const q = questionOrCollect(td, payload.question_id, 'question_id', errors);
  errors.push(...sourceProblems(payload.source));
  errors.push(...notHumanProblems(payload.source));
  errors.push(...scanSecrets(payload));
  refuse(errors);
  const doc = q.doc;
  const fm = doc.frontmatter;
  if (fm.status === 'superseded') errors.push(msg('invalid_transition', `${q.id} ist superseded`, { path: q.rel, rule: 'QCLI-CMD-05' }));
  if (payload.version !== undefined && payload.version !== doc.version) {
    errors.push(msg('version_mismatch', `${q.id}: Antwort auf Version ${payload.version}, aktuell ist ${doc.version}; Antworten sind an ihre Version gebunden`, { field: 'version', rule: 'QCLI-INV-03' }));
  }
  if (mode === 'correct') {
    if (doc.answers.length === 0) errors.push(msg('invalid_transition', `${q.id} hat keine Antwort, die korrigiert werden könnte (answer verwenden)`, { path: q.rel, rule: 'QCLI-CMD-06' }));
    else if (!doc.answers.some((a) => a.id === payload.replaces)) errors.push(msg('answer_ref_unknown', `replaces: ${payload.replaces} ist keine Antwort von ${q.id}`, { field: 'replaces', rule: 'QCLI-CMD-06' }));
  }
  const ws = new Workspace();
  let round = null;
  if (payload.round_id !== undefined) {
    const rp = idProblem('R', payload.round_id);
    if (rp) errors.push(msg('id_invalid', `round_id: ${rp}`, { field: 'round_id', rule: 'QCLI-INV-08' }));
    else {
      round = roundMapping(td, ws, payload.round_id);
      const v = payload.version ?? doc.version;
      if (round === null) errors.push(msg('answer_unmapped', `Runde ${payload.round_id} ist unbekannt (weder Rundendatei noch Chat-Zeile)`, { field: 'round_id', rule: 'QCLI-CMD-05' }));
      else if (!round.mapping.some((m) => m.id === q.id && (mode === 'correct' || m.version === v))) {
        errors.push(msg('answer_unmapped', `${q.id} v${v} wurde in ${payload.round_id} nicht gestellt; Antworten gelten nur für zugeordnete Fragen`, { field: 'round_id', rule: 'QCLI-CMD-05' }));
      }
    }
  }
  const rec = fieldValue(doc, LABEL_OF.recommendation);
  if (rec && normalizeForCompare(payload.text) === normalizeForCompare(rec)) {
    errors.push(msg('recommendation_as_answer', 'Antworttext ist die Empfehlung der Frage; eine Empfehlung ist keine Antwort', { field: 'text', rule: 'QCLI-INV-02' }));
  }
  const taken = allAnswerIds(td);
  let answerId = payload.answer_id;
  if (answerId !== undefined) {
    const ap = idProblem('A', answerId);
    if (ap) errors.push(msg('id_invalid', `answer_id: ${ap}`, { field: 'answer_id', rule: 'QCLI-INV-08' }));
    else if (taken.has(answerId)) errors.push(msg('answer_id_collision', `${answerId} ist im Thema schon vergeben`, { field: 'answer_id', rule: 'QCLI-INV-08' }));
  } else {
    answerId = nextAnswerId(ctx, td, q, taken);
  }
  refuse(errors);

  const eff = effectiveAnswer(doc);
  const refLine = payload.round_id !== undefined
    ? `Version ${doc.version}, Runde ${payload.round_id}`
    : `Version ${doc.version}, Korrektur ohne Runde`;
  const block = {
    id: answerId,
    sourceLine: sourceLine(ctx, payload.source),
    refLine,
    text: payload.text,
    verbatim: payload.verbatim,
    replaces: mode === 'correct' ? payload.replaces : null,
    conflictWith: mode === 'answer' && eff ? eff.id : null,
    consequences: payload.consequences,
  };
  editQ(ws, q, (d) => appendAnswer(d, buildAnswerBlock(block)));
  const result = { question_id: q.id, answer_id: answerId, version: doc.version };
  if (mode === 'answer' && eff) {
    setReview(ws, q, true);
    addHistory(ws, q, ctx, `Zweite Antwort ${answerId} auf Version ${doc.version}; Konflikt mit ${eff.id}, die erste gilt bis zur Klärung; needs_review.`);
    Object.assign(result, { result: 'conflict_recorded', conflict_with: eff.id, effective_answer: eff.id });
  } else if (mode === 'answer') {
    setStatus(ws, q, 'answered');
    setReview(ws, q, false);
    addHistory(ws, q, ctx, `Antwort ${answerId} aus ${payload.round_id} erfasst (Version ${doc.version}).`);
    Object.assign(result, { result: 'answered', effective_answer: answerId });
  } else {
    setStatus(ws, q, 'answered');
    setReview(ws, q, false);
    addHistory(ws, q, ctx, `Korrektur ${answerId} ersetzt ${payload.replaces}; alte Antwort bleibt sichtbar.`);
    const deps = transitiveDependents(td.questions, q.id);
    for (const id of deps) {
      const dq = td.questions.get(id);
      setReview(ws, dq, true);
      addHistory(ws, dq, ctx, `Prüfpflichtig: Voraussetzung ${q.id} korrigiert (${answerId} ersetzt ${payload.replaces}).`);
    }
    Object.assign(result, { result: 'corrected', replaces: payload.replaces, effective_answer: answerId, needs_review_set: deps });
  }
  if (round) recordAnswerInRound(ws, td, round, payload.round_id, answerId);
  return { result, ws, dirs: [] };
}

function recordAnswerInRound(ws, td, round, roundId, answerId) {
  if (round.kind === 'chat') {
    editIndex(ws, td, (d) => addChatAnswerRef(d, roundId, answerId));
    return;
  }
  // Round status: answered when every mapped question has an answer from this round, else partial.
  const complete = round.mapping.every((m) => {
    const q = td.questions.get(m.id);
    if (!q) return false;
    return currentDoc(ws, q).answers.some((a) => a.round === roundId && (a.version === null || a.version === m.version));
  });
  const r = round.round;
  ws.track(r.abs, r.rel, r.text);
  ws.set(r.abs, recordRoundAnswer(parseRound(ws.text(r.abs)), answerId, complete ? 'answered' : 'partial'));
}

export function cmdAnswer(ctx, payload) {
  return answerLike(ctx, payload, 'answer');
}

export function cmdCorrect(ctx, payload) {
  return answerLike(ctx, payload, 'correct');
}

export function cmdDefer(ctx, payload) {
  refuse(validate(payload, { id: REQ, reason: REQ, resume_when: REQ }));
  refuse(scanSecrets(payload));
  const td = load(ctx);
  requireIndex(td);
  const errors = [];
  const q = questionOrCollect(td, payload.id, 'id', errors);
  refuse(errors);
  const st = q.doc.frontmatter.status;
  if (st !== 'open' && st !== 'asked') refuse([msg('invalid_transition', `${q.id} ist ${st}; vertagt werden nur open oder asked`, { path: q.rel, rule: 'QCLI-CMD-07' })]);
  const ws = new Workspace();
  setStatus(ws, q, 'deferred');
  addHistory(ws, q, ctx, `Vertagt – Grund: ${payload.reason}; Wiederaufnahme: ${payload.resume_when}`);
  return { result: { id: q.id, status_before: st, status_after: 'deferred' }, ws, dirs: [] };
}

export function cmdSupersede(ctx, payload) {
  refuse(validate(payload, { id: REQ, by: REQ, reason: REQ }));
  refuse(scanSecrets(payload));
  const td = load(ctx);
  requireIndex(td);
  const errors = [];
  const q = questionOrCollect(td, payload.id, 'id', errors);
  refuse(errors);
  if (q.doc.frontmatter.status === 'superseded') errors.push(msg('invalid_transition', `${q.id} ist schon superseded`, { path: q.rel, rule: 'QCLI-CMD-08' }));
  const target = td.questions.get(payload.by);
  if (idProblem('Q', payload.by) || !target || payload.by === q.id || target.doc.problems.length > 0 || target.doc.frontmatter.status === 'superseded') {
    errors.push(msg('supersede_target_invalid', `by: ${payload.by} ist keine andere, nicht ersetzte Frage des Themas`, { field: 'by', rule: 'QCLI-CMD-08' }));
  }
  refuse(errors);
  const ws = new Workspace();
  const before = q.doc.frontmatter.status;
  setStatus(ws, q, 'superseded');
  addHistory(ws, q, ctx, `Ersetzt durch ${payload.by} – ${payload.reason}`);
  const deps = transitiveDependents(td.questions, q.id);
  for (const id of deps) {
    const dq = td.questions.get(id);
    setReview(ws, dq, true);
    addHistory(ws, dq, ctx, `Prüfpflichtig: Voraussetzung ${q.id} ersetzt durch ${payload.by}.`);
  }
  return { result: { id: q.id, by: payload.by, status_before: before, status_after: 'superseded', needs_review_set: deps }, ws, dirs: [] };
}

const REVISE_FIELDS = {
  title: STR,
  kind: { type: 'string', enum: KINDS },
  priority: { type: 'string', enum: PRIORITIES },
  context: STR,
  occasion: STR,
  impact: STR,
  question: STR,
  options: STR,
  recommendation: STR,
  evidence_needed: STR,
  depends_on: { type: 'array', items: { type: 'string' } },
};

export function cmdRevise(ctx, payload) {
  refuse(validate(payload, { id: REQ, reason: REQ, fields: { type: 'object', required: true, props: REVISE_FIELDS } }));
  if (Object.keys(payload.fields).length === 0) refuse([msg('payload_invalid', 'fields nennt kein Feld', { field: 'fields', rule: 'QCLI-CMD-09' })]);
  refuse(scanSecrets(payload));
  const td = load(ctx);
  requireIndex(td);
  const errors = [];
  const q = questionOrCollect(td, payload.id, 'id', errors);
  refuse(errors);
  const doc = q.doc;
  const fm = doc.frontmatter;
  if (fm.status === 'superseded') errors.push(msg('invalid_transition', `${q.id} ist superseded`, { path: q.rel, rule: 'QCLI-CMD-09' }));
  const f = payload.fields;
  for (const k of Object.keys(f)) {
    if (k === 'title' || k === 'depends_on') continue;
    if (fieldValue(doc, LABEL_OF[k]) === null) errors.push(msg('question_invalid', `Feld „${LABEL_OF[k]}“ fehlt in der Datei; von Hand ergänzen`, { path: q.rel, rule: 'QCLI-INV-11' }));
  }
  if (f.depends_on) {
    errors.push(...dependencyProblems(td, f.depends_on, 'fields.depends_on'));
    if (f.depends_on.includes(q.id)) errors.push(msg('dependency_cycle', `${q.id} hängt von sich selbst ab`, { field: 'fields.depends_on', rule: 'QCLI-CMD-09' }));
    if (errors.length === 0) {
      const g = graphOf(td);
      g.set(q.id, f.depends_on);
      errors.push(...cycleProblem(g));
    }
  }
  refuse(errors);
  const ws = new Workspace();
  const changed = [];
  for (const [k] of [['title'], ...Object.entries(LABEL_OF)]) {
    if (f[k] === undefined) continue;
    if (k === 'title') editQ(ws, q, (d) => setTitle(d, f.title));
    else editQ(ws, q, (d) => setField(d, LABEL_OF[k], f[k]));
    changed.push(k === 'title' ? 'Titel' : LABEL_OF[k]);
  }
  if (f.depends_on) {
    editQ(ws, q, (d) => setFrontmatter(d, 'depends_on', formatList(f.depends_on)));
    changed.push('depends_on');
  }
  const version = doc.version + 1;
  editQ(ws, q, (d) => setField(d, 'Version', String(version)));
  let status = fm.status;
  if (status === 'asked') status = 'open';
  setStatus(ws, q, status);
  const review = doc.answers.length > 0 ? true : fm.needs_review;
  setReview(ws, q, review);
  addHistory(ws, q, ctx, `Version ${version} – ${payload.reason}; geändert: ${changed.join(', ')}.`);
  return { result: { id: q.id, version, status_before: fm.status, status_after: status, needs_review: review }, ws, dirs: [] };
}

export function cmdReview(ctx, payload) {
  refuse(validate(payload, { id: REQ, note: REQ, source: { type: 'object', props: SOURCE_SCHEMA } }));
  const td = load(ctx);
  requireIndex(td);
  const errors = [];
  const q = questionOrCollect(td, payload.id, 'id', errors);
  errors.push(...sourceProblems(payload.source));
  errors.push(...scanSecrets(payload));
  refuse(errors);
  if (!q.doc.frontmatter.needs_review) errors.push(msg('review_not_needed', `${q.id} ist nicht prüfpflichtig`, { path: q.rel, rule: 'QCLI-CMD-10' }));
  const conflicts = openConflicts(q.doc);
  if (conflicts.length > 0) {
    errors.push(msg('conflict_unresolved', `${q.id} hat einen offenen Konflikt (${conflicts.map((a) => a.id).join(', ')}); auflösen per correct mit der geltenden Antwort`, { path: q.rel, rule: 'QCLI-CMD-10' }));
  }
  if (q.doc.answers.length > 0) errors.push(...notHumanProblems(payload.source));
  refuse(errors);
  const ws = new Workspace();
  setReview(ws, q, false);
  addHistory(ws, q, ctx, `Prüfung abgeschlossen – ${payload.note} (Quelle: ${sourceLine(ctx, payload.source)})`);
  return { result: { id: q.id, needs_review: false }, ws, dirs: [] };
}

function sessionChange(ctx, from, to, check) {
  const td = load(ctx);
  requireIndex(td);
  const cur = td.index.doc.session;
  const problem = check(cur);
  if (problem) refuse([msg('invalid_transition', problem, { path: td.index.rel, rule: from })]);
  const ws = new Workspace();
  editIndex(ws, td, (d) => setSession(d, to));
  return { result: { session_before: cur, session_after: to }, ws, dirs: [] };
}

export function cmdPause(ctx) {
  return sessionChange(ctx, 'QCLI-CMD-11', 'paused', (cur) => (cur === 'paused' ? 'Session ist schon paused' : null));
}

export function cmdResume(ctx) {
  return sessionChange(ctx, 'QCLI-CMD-12', 'active', (cur) => (cur !== 'paused' ? `Session ist ${cur}, nicht paused` : null));
}

/** Read-only status, or --set with summary/confirmation (QCLI-CMD-13). */
export function cmdStatus(ctx, _payload, opts) {
  const td = load(ctx);
  const qs = [...td.questions.values()].sort((a, b) => compareCodepoints(a.id, b.id));
  const valid = qs.filter((q) => q.doc.problems.length === 0);
  const counts = { open: 0, asked: 0, answered: 0, deferred: 0, superseded: 0, needs_review: 0, invalid: qs.length - valid.length };
  for (const q of valid) {
    counts[q.doc.frontmatter.status] += 1;
    if (q.doc.frontmatter.needs_review) counts.needs_review += 1;
  }
  const session = td.index ? td.index.doc.session : null;
  if (opts.set === undefined) {
    return {
      result: {
        session,
        summary: td.index ? indexFieldValue(td.index.doc, 'Zusammenfassung') : null,
        confirmation: td.index ? indexFieldValue(td.index.doc, 'Bestätigung') : null,
        counts,
        questions: valid.map(questionSummary),
        invalid: qs.filter((q) => q.doc.problems.length > 0).map((q) => q.rel),
      },
      ws: null,
      dirs: [],
    };
  }
  requireIndex(td);
  const errors = scanSecrets({ summary: opts.summary, confirmation: opts.confirmation });
  refuse(errors);
  const summary = opts.summary ?? indexFieldValue(td.index.doc, 'Zusammenfassung');
  const confirmation = opts.confirmation ?? indexFieldValue(td.index.doc, 'Bestätigung');
  const pending = (v) => v === null || v === '' || /^ausstehend\.?$/i.test(v);
  if (opts.set === 'paused' && session === 'paused') errors.push(msg('invalid_transition', 'Session ist schon paused', { path: td.index.rel, rule: 'QCLI-CMD-13' }));
  if ((opts.set === 'awaiting_confirmation' || opts.set === 'complete') && pending(summary)) {
    errors.push(msg('summary_missing', `${opts.set} verlangt eine Zusammenfassung (--summary)`, { path: td.index.rel, rule: 'QCLI-CMD-13' }));
  }
  if (opts.set === 'complete') {
    if (pending(confirmation)) errors.push(msg('complete_blocked', 'complete verlangt eine Bestätigung mit Quelle (--confirmation)', { path: td.index.rel, rule: 'QCLI-CMD-13' }));
    const open = valid.filter((q) => ['open', 'asked'].includes(q.doc.frontmatter.status) || q.doc.frontmatter.needs_review).map((q) => q.id);
    if (open.length > 0) errors.push(msg('complete_blocked', `offene oder prüfpflichtige Fragen: ${open.join(', ')}`, { path: td.index.rel, rule: 'QCLI-CMD-13' }));
    if (counts.invalid > 0) errors.push(msg('complete_blocked', 'ungültige Fragedateien (check)', { path: td.index.rel, rule: 'QCLI-CMD-13' }));
  }
  refuse(errors);
  const ws = new Workspace();
  if (opts.summary !== undefined) editIndex(ws, td, (d) => setIndexField(d, 'Zusammenfassung', opts.summary));
  if (opts.confirmation !== undefined) editIndex(ws, td, (d) => setIndexField(d, 'Bestätigung', opts.confirmation));
  if (session !== opts.set) editIndex(ws, td, (d) => setSession(d, opts.set));
  return { result: { session_before: session, session_after: opts.set }, ws, dirs: [] };
}

export function cmdNext(ctx) {
  const td = load(ctx);
  return { result: { session: td.index ? td.index.doc.session : null, ...nextReport(td.questions) }, ws: null, dirs: [] };
}

export function cmdRender(ctx) {
  const td = load(ctx);
  requireIndex(td);
  const errors = [];
  for (const q of td.questions.values()) {
    if (q.doc.problems.length > 0 || q.doc.frontmatter.id !== q.id) errors.push(msg('question_invalid', `${q.id} nicht lesbar (check)`, { path: q.rel, rule: 'QCLI-INV-11' }));
  }
  for (const r of td.index.doc.rows) {
    if (!td.questions.has(r.id) || r.target !== `questions/${r.id}.md`) {
      errors.push(msg('index_row_orphan', `Indexzeile ${r.id} verweist auf keine passende Fragedatei (${r.target})`, { path: td.index.rel, line: r.line + 1, rule: 'QCLI-INV-06' }));
    }
  }
  refuse(errors);
  const listed = new Set(td.index.doc.rows.map((r) => r.id));
  const rows = [...td.questions.values()].filter((q) => !listed.has(q.id)).sort((a, b) => compareCodepoints(a.id, b.id))
    .map((q) => ({ id: q.id, short: q.doc.title }));
  const ws = new Workspace();
  if (rows.length > 0) editIndex(ws, td, (d) => appendRows(d, rows));
  return { result: { rows_added: rows.map((r) => r.id) }, ws, dirs: [] };
}

export const SESSION_SET_STATES = SESSION_STATES;
