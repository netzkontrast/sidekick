// The eight grilling dev cases D1–D8 replayed as CLI flows: QCLI-FALL-34…41 (docs/spec/questions-cli-v0.md §7).
// Each test runs the commands an agent would issue for the case prompt, then applies the file checks of the case
// (fall.json) the same way check_case.py does. This shows the CLI can produce the expected end states; it does not
// show that a model calls it that way.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  FIXTURES, run, must, codesOf, read, frontmatter, fingerprint, qp, fixtureWorkspace, caseChecks, qcli,
} from './questions-helpers.js';

const T = 'tafel';
const R = 'R-20261029-chat1';
const QS = 'Q-20261029-speicherort';
const QG = 'Q-20261029-gaeste';
const QK = 'Q-20261029-konflikte';
const OWNER = { by: 'Owner', channel: 'Chat' };

/** Workspace with the case fixture, store root, and the fingerprint before the run. */
function start(t, caseId) {
  const ws = fixtureWorkspace(t, caseId);
  return { ws, root: path.join(ws, 'docs', 'fragen'), before: fingerprint(ws, { mtime: false }), fall: FIXTURES.cases[caseId].fall };
}

/** Apply the case checks; every rule must hold. The store must also pass `check`. */
function finish(t, { ws, root, before, fall }) {
  const results = caseChecks(fall, ws, before);
  for (const r of results) assert.ok(r.ok, `${fall.id}: ${JSON.stringify(r.rule)} → ${JSON.stringify(r.detail)}`);
  const c = qcli(['check', '--root', root]);
  assert.equal(c.code, 0, `${fall.id} check: ${c.stdout}`);
  t.diagnostic(`${fall.id}: ${results.filter((r) => r.ok).length}/${results.length} Dateiprüfungen wie check_case.py`);
}

const fmOf = (root, id) => frontmatter(read(root, `${T}/questions/${id}.md`));

test('QCLI-FALL-34 D1 partial answer: only the mapped question is answered, Gäste stays asked, Konflikte becomes askable', (t) => {
  const s = start(t, 'D1-B02-teilantwort');
  must(assert, s.root, T, 'answer', { question_id: QS, version: 1, round_id: R, text: 'Wir speichern lokal und zusätzlich mit Cloud-Sync.', source: OWNER });
  // "Zu den Gästen sage ich später etwas" is no answer: nothing is recorded for Gäste.
  const n = must(assert, s.root, T, 'next').json;
  assert.deepEqual(n.askable.map((q) => q.id), [QK]);
  assert.deepEqual(n.waiting.map((q) => q.id), [QG]);
  finish(t, s);
});

test('QCLI-FALL-35 D2 correction: old answer stays, new one appended, only the dependent question needs review', (t) => {
  const s = start(t, 'D2-B04-korrektur');
  const r = must(assert, s.root, T, 'correct', { question_id: QS, replaces: 'A-20261029-speicherort', text: 'Wir speichern doch nicht nur lokal, sondern mit Cloud-Sync.', source: OWNER });
  assert.deepEqual(r.json.needs_review_set, [QK]);
  finish(t, s);
});

test('QCLI-FALL-36 D3 pause: session paused, questions unchanged, no further question can be asked', (t) => {
  const s = start(t, 'D3-B06a-pause');
  must(assert, s.root, T, 'pause');
  const mid = fingerprint(s.ws, { mtime: false });
  const ask = run(s.root, T, 'ask', { round_id: 'R-20261031-chat2', channel: 'chat', delivery: 'bestaetigt', questions: [{ id: QG, version: 1 }] });
  assert.deepEqual(codesOf(ask), ['session_paused']);
  assert.deepEqual(fingerprint(s.ws, { mtime: false }), mid);
  finish(t, s);
});

test('QCLI-FALL-37 D4 secret: the answer with the key is refused, the redacted answer is stored, the key is nowhere', (t) => {
  const s = start(t, 'D4-B08-secret');
  const secret = s.fall.checks.find((c) => 'absent_anywhere' in c).absent_anywhere;
  const refused = run(s.root, T, 'answer', { question_id: QS, version: 1, round_id: R, text: `lokal plus Cloud-Sync über unseren Sync-Dienst; Zugangsschlüssel ${secret}`, source: OWNER });
  assert.equal(refused.code, 1);
  assert.deepEqual(codesOf(refused), ['secret_detected']);
  assert.ok(!refused.stdout.includes(secret) && !refused.stderr.includes(secret));
  must(assert, s.root, T, 'answer', {
    question_id: QS, version: 1, round_id: R, verbatim: false,
    text: 'lokal plus Cloud-Sync über den eigenen Sync-Dienst; Zugangsschlüssel vom Owner genannt, redigiert und nicht im Repo',
    source: OWNER, consequences: 'Schlüssel privat ablegen; hier nur redigierter Vermerk',
  });
  finish(t, s);
});

test('QCLI-FALL-38 D5 completion: nothing askable, no new question, session awaiting_confirmation with summary', (t) => {
  const s = start(t, 'D5-B10a-abschluss');
  const n = must(assert, s.root, T, 'next').json;
  assert.deepEqual([n.askable, n.needs_review, n.blocked, n.waiting], [[], [], [], []]);
  must(assert, s.root, T, 'status', undefined, 0, ['--set', 'awaiting_confirmation', '--summary',
    'Speicherort: lokal plus Cloud-Sync; Gäste: nur mit Konto; Konflikte: anzeigen und manuell lösen. Nicht abgedeckt: Umsetzung.']);
  finish(t, s);
});

test('QCLI-FALL-39 D6 new gap: Gäste answered, a new question with its own ID refers to that answer', (t) => {
  const s = start(t, 'D6-B10b-neue-luecke');
  const a = must(assert, s.root, T, 'answer', { question_id: QG, version: 1, round_id: R, text: 'Ja, Gäste dürfen lesen, aber nur über einen Link, der nach einer Weile abläuft.', source: OWNER });
  const qid = 'Q-20261031-link-ablauf';
  must(assert, s.root, T, 'add', qp(qid, {
    title: 'Nach welcher Zeit läuft ein Gast-Link ab?',
    depends_on: [QG],
    context: `${QG}, Antwort ${a.json.answer_id}`,
    occasion: `Antwort ${a.json.answer_id} nennt „nach einer Weile“; die Dauer ist offen und wird nicht angenommen`,
    options: 'a) 24 Stunden. b) 7 Tage. c) je Link wählbar.',
    recommendation: 'c, weil die Antwort keine feste Dauer nennt.',
  }));
  assert.equal(fmOf(s.root, qid).status, 'open');
  assert.deepEqual(must(assert, s.root, T, 'next').json.askable.map((q) => q.id), [qid]);
  finish(t, s);
});

test('QCLI-FALL-40 D7 double answer: the first stays, the second is a conflict note, needs_review is set', (t) => {
  const s = start(t, 'D7-B14-doppelantwort');
  const r = must(assert, s.root, T, 'answer', { question_id: QG, version: 1, round_id: R, text: 'Gäste sollen doch per Link lesen dürfen.', source: { by: 'Mitgründerin (laut Owner)', channel: 'Chat' } });
  assert.deepEqual([r.json.result, r.json.conflict_with], ['conflict_recorded', 'A-20261029-gaeste']);
  const st = must(assert, s.root, T, 'status').json.questions.find((q) => q.id === QG);
  assert.deepEqual([st.effective_answer.id, st.open_conflict], ['A-20261029-gaeste', true]);
  finish(t, s);
});

test('QCLI-FALL-41 D8 deadline: a deadline cannot answer; the question is deferred with reason, no answer entry', (t) => {
  const s = start(t, 'D8-B15-frist');
  const byDeadline = run(s.root, T, 'answer', { question_id: QG, version: 1, round_id: R, text: 'Keine Antwort bis 2026-10-30, Schritt bleibt blockiert.', source: { by: 'Frist', channel: 'Vereinbarung im Index' } });
  assert.deepEqual(codesOf(byDeadline), ['answer_not_human']);
  must(assert, s.root, T, 'defer', { id: QG, reason: 'Frist 2026-10-30 ohne Antwort abgelaufen; vereinbart: Schritt ‚Freigabemodell bauen‘ bleibt blockiert', resume_when: 'Owner beantwortet die Gäste-Frage' });
  const n = must(assert, s.root, T, 'next').json;
  assert.deepEqual(n.deferred.map((q) => [q.id, q.resume_when]), [[QG, 'Owner beantwortet die Gäste-Frage']]);
  assert.deepEqual(n.waiting.map((q) => q.id), [QK]);
  finish(t, s);
});
