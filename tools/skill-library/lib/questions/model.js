// State semantics over parsed questions: effective answer, conflicts, dependencies, askable set.
// docs/spec/questions-cli-v0.md §2 (Wirksame Antwort, Offener Konflikt, Fragbar), QCLI-CMD-14.
import { compareCodepoints } from '../core.js';
import { fieldValue } from './record.js';

export const PRIORITY_ORDER = { blocking: 0, important: 1, later: 2 };

/** Answers bound to version `v`; an answer without a version counts for the current version (spec §5.3). */
export function answersForVersion(doc, v) {
  return doc.answers.filter((a) => (a.version === null ? v === doc.version : a.version === v));
}

/** The effective answer for the current version, or null. */
export function effectiveAnswer(doc) {
  let eff = null;
  for (const a of answersForVersion(doc, doc.version)) {
    if (a.replaces) eff = a;
    else if (a.conflictWith) continue;
    else if (eff === null) eff = a;
  }
  return eff;
}

/** Conflict entries not followed by a correcting (replacing) answer. */
export function openConflicts(doc) {
  const out = [];
  doc.answers.forEach((a, i) => {
    if (!a.conflictWith) return;
    const resolved = doc.answers.slice(i + 1).some((b) => b.replaces);
    if (!resolved) out.push(a);
  });
  return out;
}

export function isSettled(q) {
  const fm = q.doc.frontmatter;
  return fm.status === 'answered' && fm.needs_review === false;
}

/** Unmet prerequisites of a question: [{id, reason}] with reason not_answered | needs_review | superseded | unknown. */
export function unmetPrerequisites(questions, q) {
  const out = [];
  for (const dep of q.doc.frontmatter.depends_on ?? []) {
    const d = questions.get(dep);
    if (!d || d.doc.problems.length > 0) out.push({ id: dep, reason: 'unknown' });
    else if (d.doc.frontmatter.status === 'superseded') out.push({ id: dep, reason: 'superseded' });
    else if (d.doc.frontmatter.status !== 'answered') out.push({ id: dep, reason: 'not_answered' });
    else if (d.doc.frontmatter.needs_review) out.push({ id: dep, reason: 'needs_review' });
  }
  return out;
}

/** Transitive dependents of `id` (reverse depends_on), excluding superseded questions and `id` itself; sorted. */
export function transitiveDependents(questions, id) {
  const seen = new Set();
  const queue = [id];
  while (queue.length > 0) {
    const cur = queue.shift();
    for (const q of questions.values()) {
      if (q.doc.problems.length > 0 || seen.has(q.id) || q.id === id) continue;
      if ((q.doc.frontmatter.depends_on ?? []).includes(cur)) {
        seen.add(q.id);
        queue.push(q.id);
      }
    }
  }
  return [...seen].filter((x) => questions.get(x).doc.frontmatter.status !== 'superseded').sort(compareCodepoints);
}

/** A dependency cycle as a list of IDs, or null. `graph`: Map id → [deps]. */
export function findCycle(graph) {
  const state = new Map();
  const stack = [];
  const visit = (n) => {
    state.set(n, 1);
    stack.push(n);
    for (const m of graph.get(n) ?? []) {
      if (!graph.has(m)) continue;
      if (state.get(m) === 1) return [...stack.slice(stack.indexOf(m)), m];
      if (!state.has(m)) {
        const c = visit(m);
        if (c) return c;
      }
    }
    stack.pop();
    state.set(n, 2);
    return null;
  };
  for (const n of [...graph.keys()].sort(compareCodepoints)) {
    if (!state.has(n)) {
      const c = visit(n);
      if (c) return c;
    }
  }
  return null;
}

/** Resume condition from the last "Vertagt" history entry, if any. */
export function deferInfo(doc) {
  const e = [...doc.history].reverse().find((h) => /vertagt/i.test(h.text));
  if (!e) return null;
  const m = /Wiederaufnahme:\s*(.*)$/.exec(e.text);
  return { entry: e.text, resume_when: m ? m[1].trim() : null };
}

export function questionSummary(q) {
  const d = q.doc;
  const eff = effectiveAnswer(d);
  return {
    id: q.id,
    title: d.title ?? null,
    version: d.version ?? null,
    status: d.frontmatter.status ?? null,
    needs_review: d.frontmatter.needs_review ?? null,
    depends_on: d.frontmatter.depends_on ?? [],
    priority: fieldValue(d, 'Priorität'),
    answers: d.answers.length,
    effective_answer: eff ? { id: eff.id, text: eff.text } : null,
    open_conflict: openConflicts(d).length > 0,
  };
}

function priorityKey(q) {
  const p = PRIORITY_ORDER[fieldValue(q.doc, 'Priorität')] ?? 3;
  return [p, fieldValue(q.doc, 'Erstellt') ?? '', q.id];
}

function byPriority(a, b) {
  const ka = priorityKey(a);
  const kb = priorityKey(b);
  return ka[0] - kb[0] || compareCodepoints(ka[1], kb[1]) || compareCodepoints(ka[2], kb[2]);
}

/** QCLI-CMD-14: askable, needs_review, blocked, waiting, deferred. Only valid questions are considered. */
export function nextReport(questions) {
  const valid = [...questions.values()].filter((q) => q.doc.problems.length === 0);
  const brief = (q) => ({ id: q.id, title: q.doc.title, version: q.doc.version, priority: fieldValue(q.doc, 'Priorität'), status: q.doc.frontmatter.status });
  const askable = [];
  const blocked = [];
  for (const q of valid) {
    const fm = q.doc.frontmatter;
    if (fm.status !== 'open' || fm.needs_review) continue;
    const unmet = unmetPrerequisites(questions, q);
    if (unmet.length === 0) askable.push(q);
    else blocked.push({ q, unmet });
  }
  askable.sort(byPriority);
  blocked.sort((a, b) => byPriority(a.q, b.q));
  return {
    askable: askable.map(brief),
    needs_review: valid.filter((q) => q.doc.frontmatter.needs_review && q.doc.frontmatter.status !== 'superseded').sort(byPriority)
      .map((q) => ({ ...brief(q), open_conflict: openConflicts(q.doc).length > 0 })),
    blocked: blocked.map(({ q, unmet }) => ({ ...brief(q), unmet })),
    waiting: valid.filter((q) => q.doc.frontmatter.status === 'asked' && !q.doc.frontmatter.needs_review).sort(byPriority).map(brief),
    deferred: valid.filter((q) => q.doc.frontmatter.status === 'deferred').sort(byPriority)
      .map((q) => ({ ...brief(q), resume_when: deferInfo(q.doc)?.resume_when ?? null })),
  };
}
