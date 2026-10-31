// Commands of the questions CLI: QCLI-FALL-01…24 (docs/spec/questions-cli-v0.md §7).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  NOW, DATE, run, must, codesOf, read, write, frontmatter, fingerprint, qp, OWNER, setup, askChat, answer, tmpRoot, qcli,
} from './questions-helpers.js';
import { trySymlink } from './helpers.js';

const QA = 'Q-20261031-a';
const QB = 'Q-20261031-b';
const QC = 'Q-20261031-c';
const QD = 'Q-20261031-d';
const R1 = 'R-20261031-chat1';
const qfile = (id, topic = 't') => `${topic}/questions/${id}.md`;
const fmOf = (root, id) => frontmatter(read(root, qfile(id)));

test('QCLI-FALL-01 init creates index and questions/; a second init is refused with topic_exists', (t) => {
  const root = tmpRoot(t);
  const r = must(assert, root, 'demo', 'init', { title: 'Demo', goal: 'Ziel', non_goals: 'Umsetzung', context: 'plan.md', editor: 'Test' });
  assert.deepEqual(r.json.changed, ['demo/index.md']);
  assert.equal(read(root, 'demo/index.md'), [
    '# Demo', 'Session: active', 'Ziel / Nicht-Ziele: Ziel / nicht: Umsetzung', 'Kontext: plan.md', 'Bearbeiter: Test', '',
    '| ID / Datei | Kurzfrage |', '|---|---|', '',
    'Status und Abhängigkeiten ausschließlich in den Frage-Dateien führen.',
    'Nächste Runde / Forschungsblockade: ausstehend', 'Zusammenfassung: ausstehend', 'Bestätigung: ausstehend', '',
  ].join('\n'));
  assert.ok(fs.statSync(path.join(root, 'demo', 'questions')).isDirectory());
  const before = fingerprint(root);
  const again = run(root, 'demo', 'init', { title: 'Anders' });
  assert.equal(again.code, 1);
  assert.deepEqual(codesOf(again), ['topic_exists']);
  assert.deepEqual(fingerprint(root), before);
});

test('QCLI-FALL-02 paths come only from checked IDs and topic names; symlinks are refused', (t) => {
  const root = setup(t, assert);
  const outside = tmpRoot(t, 'qcli-outside-');
  for (const topic of ['../x', 'A', 'a/b', 'a--b']) {
    const r = run(root, topic, 'next');
    assert.equal(r.code, 2, topic);
    assert.equal(r.json.error.kind, 'usage');
  }
  for (const id of ['Q-20261031-../x', 'q-20261031-x', 'Q-20261331-x', 'Q-20260230-x', 'Q-20261031-X', 'Q-20261031-a--b', 'Q-20261031-']) {
    const r = run(root, 't', 'add', qp(id));
    assert.equal(r.code, 1, id);
    assert.deepEqual(codesOf(r), ['id_invalid'], id);
  }
  assert.deepEqual(fs.readdirSync(path.join(root, 't', 'questions')), []);
  // questions/ as symlink pointing outside the root.
  const root2 = tmpRoot(t);
  must(assert, root2, 's', 'init', { title: 'S' });
  fs.rmdirSync(path.join(root2, 's', 'questions'));
  if (!trySymlink(outside, path.join(root2, 's', 'questions'))) return t.skip('Dateisystem erlaubt keine Symlinks');
  const r = run(root2, 's', 'add', qp(QA));
  assert.equal(r.code, 1);
  assert.deepEqual(codesOf(r), ['path_unsafe']);
  assert.deepEqual(fs.readdirSync(outside), []);
  return undefined;
});

test('QCLI-FALL-03 add writes the canonical records.md file and the index row; check finds no error', (t) => {
  const root = setup(t, assert);
  const r = must(assert, root, 't', 'add', qp(QA, { short: 'Kurz A', evidence_needed: 'keiner' }));
  assert.deepEqual(r.json.added, [QA]);
  assert.equal(read(root, qfile(QA)), [
    '---', `id: ${QA}`, 'status: open', 'needs_review: false', 'depends_on: []', '---',
    `# Synthetische Frage ${QA}?`, 'Version: 1', `Erstellt: ${DATE}`, 'Art: decision', 'Priorität: important',
    'Kontext / Quelle: plan.md @ c1', 'Anlass: Lücke im Plan', 'Auswirkung / blockierte Arbeit: Umfang der ersten Version',
    `Fragestellung: Synthetische Frage ${QA}?`, 'Optionen und Folgen: a) eins. b) zwei.', 'Empfehlung + sachlicher Grund: a, weil kleiner.',
    'Benötigter Sachbeleg: keiner', '', '## Antworten', 'Noch keine. Empfehlung ist keine Antwort.', '', '## Verlauf', `- ${DATE}: Erfasst.`, '',
  ].join('\n'));
  assert.ok(read(root, 't/index.md').includes(`| [${QA}](questions/${QA}.md) | Kurz A |\n\nStatus und`));
  const c = qcli(['check', '--root', root]);
  assert.equal(c.code, 0, c.stdout);
  assert.equal(c.json.summary.errors, 0);
  assert.equal(c.json.summary.warnings, 0);
});

test('QCLI-FALL-04 add refuses an ID that exists in the topic, in another topic or twice in the batch', (t) => {
  const root = setup(t, assert, [qp(QA)]);
  must(assert, root, 'other', 'init', { title: 'Anderes Thema' });
  must(assert, root, 'other', 'add', qp(QB));
  const before = fingerprint(root);
  for (const [topic, payload] of [['t', qp(QA)], ['t', qp(QB)], ['t', { questions: [qp(QC), qp(QC)] }]]) {
    const r = run(root, topic, 'add', payload);
    assert.equal(r.code, 1, JSON.stringify(payload).slice(0, 60));
    assert.deepEqual(codesOf(r), ['id_collision']);
  }
  assert.deepEqual(fingerprint(root), before);
});

test('QCLI-FALL-05 a batch is checked completely before writing; dependencies inside the batch are allowed', (t) => {
  const root = setup(t, assert);
  const before = fingerprint(root);
  const bad = run(root, 't', 'add', { questions: [qp(QA), qp(QB, { depends_on: ['Q-20261031-unbekannt'] }), qp(QC)] });
  assert.equal(bad.code, 1);
  assert.deepEqual(codesOf(bad), ['dependency_unknown']);
  assert.deepEqual(fingerprint(root), before);
  const self = run(root, 't', 'add', qp(QA, { depends_on: [QA] }));
  assert.deepEqual(codesOf(self), ['dependency_cycle']);
  const ok = must(assert, root, 't', 'add', { questions: [qp(QB, { depends_on: [QA] }), qp(QA)] });
  assert.deepEqual(ok.json.added, [QB, QA]);
  assert.equal(fmOf(root, QB).depends_on, `["${QA}"]`);
  // Index rows are added sorted by ID.
  const idx = read(root, 't/index.md');
  assert.ok(idx.indexOf(`[${QA}]`) < idx.indexOf(`[${QB}]`));
});

test('QCLI-FALL-06 payloads are strict; invalid JSON and two input sources are usage errors', (t) => {
  const root = setup(t, assert);
  const unknownKey = run(root, 't', 'add', { ...qp(QA), status: 'answered' });
  assert.deepEqual(codesOf(unknownKey), ['payload_invalid']);
  const { recommendation: _r, ...missing } = qp(QA); // eslint-disable-line no-unused-vars
  assert.deepEqual(codesOf(run(root, 't', 'add', missing)), ['payload_invalid']);
  assert.deepEqual(codesOf(run(root, 't', 'add', qp(QA, { title: 'Zeile 1\nZeile 2' }))), ['field_invalid']);
  assert.deepEqual(codesOf(run(root, 't', 'add', qp(QA, { kind: 'wish' }))), ['payload_invalid']);
  const invalid = qcli(['add', '--root', root, '--topic', 't', '--json', '{nope']);
  assert.equal(invalid.code, 2);
  assert.equal(invalid.json.error.kind, 'usage');
  const file = path.join(root, 'p.json');
  fs.writeFileSync(file, JSON.stringify(qp(QA)));
  const two = qcli(['add', '--root', root, '--topic', 't', '--json', '{}', '--file', file]);
  assert.equal(two.code, 2);
  const none = qcli(['add', '--root', root, '--topic', 't']);
  assert.equal(none.code, 2);
  // stdin (pipe or file, as from a shell redirect or heredoc) and --file both work as sources.
  fs.writeFileSync(file, JSON.stringify(qp(QA)));
  const viaStdin = qcli(['add', '--root', root, '--topic', 't', '--now', NOW], { stdinFile: file });
  assert.equal(viaStdin.code, 0, viaStdin.stdout);
  fs.writeFileSync(file, JSON.stringify(qp(QB)));
  assert.equal(qcli(['add', '--root', root, '--topic', 't', '--now', NOW, '--file', file]).code, 0);
});

test('QCLI-FALL-07 ask in chat with confirmed delivery: asked, history, Chat-Runden line, session waiting_user', (t) => {
  const root = setup(t, assert, [qp(QA), qp(QB)]);
  const r = askChat(assert, root, 't', R1, [QA, QB]);
  assert.deepEqual(r.json.questions.map((q) => q.status_after), ['asked', 'asked']);
  assert.equal(r.json.session, 'waiting_user');
  assert.equal(fmOf(root, QA).status, 'asked');
  assert.ok(read(root, qfile(QA)).endsWith(`- ${DATE}: In ${R1} gestellt (Version 1), Zustellung bestätigt.\n`));
  const idx = read(root, 't/index.md');
  assert.ok(idx.includes('Session: waiting_user\n'));
  assert.ok(idx.endsWith(`Chat-Runden: ${R1} – ${QA} v1, ${QB} v1 – im Chat gestellt – Zustellung bestätigt\n`));
});

test('QCLI-FALL-08 ask without a return channel: delivery unknown keeps questions open, session waiting_user', (t) => {
  const root = setup(t, assert, [qp(QA)]);
  const r = must(assert, root, 't', 'ask', { round_id: R1, channel: 'chat', delivery: 'unbekannt', questions: [{ id: QA, version: 1 }], asked: 'Frage im Lauf ausgegeben' });
  assert.equal(r.json.questions[0].status_after, 'open');
  assert.equal(fmOf(root, QA).status, 'open');
  assert.ok(read(root, qfile(QA)).includes('Zustellung unbekannt; Status unverändert.'));
  const idx = read(root, 't/index.md');
  assert.ok(idx.includes('Session: waiting_user'));
  assert.ok(idx.includes(`Chat-Runden: ${R1} – ${QA} v1 – Frage im Lauf ausgegeben – Zustellung unbekannt`));
  // An answer that arrives later is still mapped to the round.
  answer(assert, root, 't', QA, R1, 'eins');
  assert.equal(fmOf(root, QA).status, 'answered');
});

test('QCLI-FALL-09 ask via tool writes a round file; a failed tool call leaves questions unchanged', (t) => {
  const root = setup(t, assert, [qp(QA), qp(QB)]);
  must(assert, root, 't', 'ask', { round_id: 'R-20261031-tool1', channel: 'tool', tool: 'AskUserQuestion', delivery: 'bestaetigt', context_version: 'main @ abc1234', questions: [{ id: QA, version: 1, field: 'Header A' }, { id: QB, version: 1 }] });
  assert.equal(read(root, 't/rounds/R-20261031-tool1.md'), [
    '# R-20261031-tool1', 'Status: sent', 'Kontextversion: main @ abc1234', 'Tool/Chat: AskUserQuestion', 'Mapping:',
    `- Header A → ${QA} v1`, `- Feld 2 → ${QB} v1`, 'Gestellt: Fragestellungen der Frage-Dateien',
    `Zustellung / Zeitpunkt: bestätigt, ${DATE}`, 'Antwortquelle: ausstehend', 'Ergebnis: ausstehend', 'Fehler / Wiederaufnahme: –', '',
  ].join('\n'));
  // Answering one of two mapped questions makes the round partial, both answered.
  answer(assert, root, 't', QA, 'R-20261031-tool1', 'eins');
  let round = read(root, 't/rounds/R-20261031-tool1.md');
  assert.ok(round.includes('Status: partial\n') && round.includes('Ergebnis: A-20261031-a\n'));
  answer(assert, root, 't', QB, 'R-20261031-tool1', 'zwei');
  round = read(root, 't/rounds/R-20261031-tool1.md');
  assert.ok(round.includes('Status: answered\n') && round.includes('Ergebnis: A-20261031-a, A-20261031-b\n'));
  // Failed tool call.
  const root2 = setup(t, assert, [qp(QC)]);
  const r = must(assert, root2, 't', 'ask', { round_id: 'R-20261031-tool2', channel: 'tool', tool: 'AskUserQuestion', delivery: 'fehlgeschlagen', questions: [{ id: QC, version: 1 }] });
  assert.equal(r.json.session, 'active');
  assert.equal(fmOf(root2, QC).status, 'open');
  assert.ok(read(root2, 't/rounds/R-20261031-tool2.md').startsWith('# R-20261031-tool2\nStatus: failed\n'));
  assert.ok(read(root2, 't/index.md').includes('Session: active'));
});

test('QCLI-FALL-10 ask refuses wrong version, unmet prerequisite, settled answer, taken round ID and paused session', (t) => {
  const root = setup(t, assert, [qp(QA), qp(QB, { depends_on: [QA] }), qp(QC)]);
  askChat(assert, root, 't', R1, [QC]);
  answer(assert, root, 't', QC, R1, 'eins');
  const cases = [
    [{ id: QA, version: 2 }, 'version_mismatch', 'R-20261031-x1'],
    [{ id: QB, version: 1 }, 'dependency_unmet', 'R-20261031-x2'],
    [{ id: QC, version: 1 }, 'invalid_transition', 'R-20261031-x3'],
    [{ id: QA, version: 1 }, 'round_exists', R1],
  ];
  for (const [q, code, rid] of cases) {
    const before = fingerprint(root);
    const r = run(root, 't', 'ask', { round_id: rid, channel: 'chat', delivery: 'bestaetigt', questions: [q] });
    assert.equal(r.code, 1, code);
    assert.deepEqual(codesOf(r), [code]);
    assert.deepEqual(fingerprint(root), before, code);
  }
  must(assert, root, 't', 'pause');
  const before = fingerprint(root);
  const p = run(root, 't', 'ask', { round_id: 'R-20261031-x4', channel: 'chat', delivery: 'bestaetigt', questions: [{ id: QA, version: 1 }] });
  assert.deepEqual(codesOf(p), ['session_paused']);
  assert.deepEqual(fingerprint(root), before);
});

test('QCLI-FALL-11 first answer: answered, entry with source and wording, placeholder removed, chat line references it', (t) => {
  const root = setup(t, assert, [qp(QA)]);
  askChat(assert, root, 't', R1, [QA]);
  const r = answer(assert, root, 't', QA, R1, 'Lokal plus Cloud-Sync.', { source: { by: 'Owner', channel: 'Chat', ref: 'msg-7', time: '2026-10-31 10:05 UTC' }, consequences: 'Konflikte jetzt fragbar' });
  assert.equal(r.json.result, 'answered');
  assert.equal(r.json.answer_id, 'A-20261031-a');
  const text = read(root, qfile(QA));
  assert.ok(!text.includes('Noch keine. Empfehlung ist keine Antwort.'));
  assert.ok(text.includes([
    '## Antworten', 'Antwort-ID: A-20261031-a', 'Zeit / beantwortet von / Quelle: 2026-10-31 10:05 UTC, Owner, Chat (msg-7)',
    `Bezug: Version 1, Runde ${R1}`, 'Antwort: „Lokal plus Cloud-Sync.“ (wörtlich)', 'Ersetzt Antwort: keine', 'Konflikt mit: keiner',
    'Folgen / Rückfragen: Konflikte jetzt fragbar', '', '## Verlauf',
  ].join('\n')));
  assert.equal(fmOf(root, QA).status, 'answered');
  assert.ok(read(root, 't/index.md').includes(`Zustellung bestätigt – Antworten: A-20261031-a`));
  // Paraphrased answers are marked as such.
  const root2 = setup(t, assert, [qp(QB)]);
  askChat(assert, root2, 't', R1, [QB]);
  answer(assert, root2, 't', QB, R1, 'sinngemäß: eher zwei', { verbatim: false });
  assert.ok(read(root2, qfile(QB)).includes('Antwort: sinngemäß: eher zwei (sinngemäß)'));
});

test('QCLI-FALL-12 answers only for mapped questions: question not in the round or unknown round is answer_unmapped', (t) => {
  const root = setup(t, assert, [qp(QA), qp(QB)]);
  askChat(assert, root, 't', R1, [QA]);
  const before = fingerprint(root);
  assert.deepEqual(codesOf(run(root, 't', 'answer', { question_id: QB, version: 1, round_id: R1, text: 'zwei', source: OWNER })), ['answer_unmapped']);
  assert.deepEqual(codesOf(run(root, 't', 'answer', { question_id: QA, version: 1, round_id: 'R-20261031-gibtsnicht', text: 'eins', source: OWNER })), ['answer_unmapped']);
  assert.deepEqual(fingerprint(root), before);
  assert.equal(fmOf(root, QB).status, 'open');
});

test('QCLI-FALL-13 an answer needs a human source; recommendation, default or deadline never become an answer', (t) => {
  const root = setup(t, assert, [qp(QA)]);
  askChat(assert, root, 't', R1, [QA]);
  const before = fingerprint(root);
  const base = { question_id: QA, version: 1, round_id: R1, text: 'eins' };
  assert.deepEqual(codesOf(run(root, 't', 'answer', base)), ['answer_source_missing']);
  assert.deepEqual(codesOf(run(root, 't', 'answer', { ...base, source: { by: '  ', channel: 'Chat' } })), ['answer_source_missing']);
  for (const by of ['Claude', 'Frist', 'Empfehlung', 'Default nach Timeout', 'KI-Assistent']) {
    assert.deepEqual(codesOf(run(root, 't', 'answer', { ...base, source: { by, channel: 'Chat' } })), ['answer_not_human'], by);
  }
  assert.deepEqual(codesOf(run(root, 't', 'answer', { ...base, text: 'a, weil kleiner.', source: OWNER })), ['recommendation_as_answer']);
  assert.deepEqual(codesOf(run(root, 't', 'answer', { ...base, text: '„A, weil kleiner“', source: OWNER })), ['recommendation_as_answer']);
  assert.deepEqual(fingerprint(root), before);
  assert.equal(fmOf(root, QA).status, 'asked');
  // A person's name containing such letters is fine (whole-word match).
  answer(assert, root, 't', QA, R1, 'eins', { source: { by: 'Kai Standardt', channel: 'Chat' } });
});

test('QCLI-FALL-14 a second answer on the same version is a conflict note with needs_review; the first stays effective', (t) => {
  const root = setup(t, assert, [qp(QA)]);
  askChat(assert, root, 't', R1, [QA]);
  answer(assert, root, 't', QA, R1, 'Nein, nur mit Konto.');
  const first = read(root, qfile(QA));
  const firstBlock = first.slice(first.indexOf('Antwort-ID:'), first.indexOf('\n\n## Verlauf'));
  const r = answer(assert, root, 't', QA, R1, 'Doch per Link.', { source: { by: 'Mitgründerin', channel: 'Chat' } });
  assert.equal(r.json.result, 'conflict_recorded');
  assert.equal(r.json.conflict_with, 'A-20261031-a');
  const text = read(root, qfile(QA));
  assert.ok(text.includes(firstBlock), 'first answer unchanged');
  assert.ok(text.includes('Antwort-ID: A-20261031-a-2\n'));
  assert.ok(/Konflikt mit:\s*A-20261031-a\n/.test(text));
  assert.deepEqual([fmOf(root, QA).status, fmOf(root, QA).needs_review], ['answered', 'true']);
  const s = must(assert, root, 't', 'status');
  const q = s.json.questions.find((x) => x.id === QA);
  assert.equal(q.effective_answer.id, 'A-20261031-a');
  assert.equal(q.open_conflict, true);
});

test('QCLI-FALL-15 secret-like values are refused without echoing them; redacted answers pass; paths and short SHAs do not trigger', (t) => {
  const root = setup(t, assert, [qp(QA)]);
  askChat(assert, root, 't', R1, [QA]);
  const secrets = [
    'sk-live-51QpTafelSyncX9d7Kq2Lm8Vb4Zr6Wt3Yh',
    `ghp_${'a1B2c3D4e5F6g7H8i9J0'}k1L2m3N4o5P6`,
    `AKIA${'IOSFODNN7EXAMPLE'}`,
    'dc406edd3855b378c1bb8604ca00397e01ea2513',
    'Xk9fQz2LmP8vT3rW7yB4nH6jK1sD5gF0aZcE8uI2oRtY',
  ];
  const before = fingerprint(root);
  for (const s of secrets) {
    const r = run(root, 't', 'answer', { question_id: QA, version: 1, round_id: R1, text: `Schlüssel ist ${s} bitte eintragen`, source: OWNER });
    assert.equal(r.code, 1, s);
    assert.deepEqual(codesOf(r), ['secret_detected'], s);
    assert.ok(!r.stdout.includes(s) && !r.stderr.includes(s), 'value not echoed');
    assert.match(r.json.messages[0].message, /redigieren/);
  }
  assert.deepEqual(fingerprint(root), before);
  const ok = 'Lokal plus Cloud-Sync; Zugangsschlüssel [redigiert, privat abgelegt]; siehe research/skills-meta-prompting/eval-runs/E1V-E2-M4-ergebnis-2026-10-30.md und Commit 38333a4, '
    + 'https://github.com/netzkontrast/meta-prompting/blob/dc406edd3855b378c1bb8604ca00397e01ea2513/README.md#L9';
  answer(assert, root, 't', QA, R1, ok);
  assert.equal(fmOf(root, QA).status, 'answered');
  // Secrets are refused in other payloads too (here: add).
  assert.deepEqual(codesOf(run(root, 't', 'add', qp(QB, { context: `Token ${secrets[0]}` }))), ['secret_detected']);
});

test('QCLI-FALL-16 correct appends a replacing answer, keeps the old one, flags transitive dependents only', (t) => {
  // A ← B ← C, D independent.
  const root = setup(t, assert, [qp(QA), qp(QB, { depends_on: [QA] }), qp(QC, { depends_on: [QB] }), qp(QD)]);
  askChat(assert, root, 't', R1, [QA, QD]);
  answer(assert, root, 't', QA, R1, 'Nur lokal.');
  answer(assert, root, 't', QD, R1, 'Nein.');
  askChat(assert, root, 't', 'R-20261031-chat2', [QB]);
  answer(assert, root, 't', QB, 'R-20261031-chat2', 'Letzte gewinnt.');
  askChat(assert, root, 't', 'R-20261031-chat3', [QC]);
  answer(assert, root, 't', QC, 'R-20261031-chat3', 'Egal.');
  const oldA = read(root, qfile(QA));
  const oldBlock = oldA.slice(oldA.indexOf('Antwort-ID:'), oldA.indexOf('\n\n## Verlauf'));
  const dBefore = read(root, qfile(QD));
  const r = must(assert, root, 't', 'correct', { question_id: QA, replaces: 'A-20261031-a', text: 'Doch mit Cloud-Sync.', source: OWNER });
  assert.equal(r.json.result, 'corrected');
  assert.deepEqual(r.json.needs_review_set, [QB, QC]);
  const a = read(root, qfile(QA));
  assert.ok(a.includes(oldBlock), 'old answer byte-identical');
  assert.ok(a.includes('Bezug: Version 1, Korrektur ohne Runde\nAntwort: „Doch mit Cloud-Sync.“ (wörtlich)\nErsetzt Antwort: A-20261031-a\n'));
  assert.equal(a.split('Antwort-ID:').length - 1, 2);
  assert.deepEqual([fmOf(root, QA).status, fmOf(root, QA).needs_review], ['answered', 'false']);
  assert.equal(fmOf(root, QB).needs_review, 'true');
  assert.equal(fmOf(root, QC).needs_review, 'true');
  assert.equal(read(root, qfile(QD)), dBefore);
  const st = must(assert, root, 't', 'status').json.questions.find((x) => x.id === QA);
  assert.equal(st.effective_answer.id, 'A-20261031-a-2');
});

test('QCLI-FALL-17 correct refuses unknown replaced answers and questions without an answer', (t) => {
  const root = setup(t, assert, [qp(QA), qp(QB)]);
  askChat(assert, root, 't', R1, [QA]);
  answer(assert, root, 't', QA, R1, 'eins');
  const before = fingerprint(root);
  assert.deepEqual(codesOf(run(root, 't', 'correct', { question_id: QA, replaces: 'A-20261031-x', text: 'zwei', source: OWNER })), ['answer_ref_unknown']);
  assert.deepEqual(codesOf(run(root, 't', 'correct', { question_id: QB, replaces: 'A-20261031-a', text: 'zwei', source: OWNER })), ['invalid_transition']);
  assert.deepEqual(fingerprint(root), before);
});

test('QCLI-FALL-18 defer records reason and resume condition and never an answer', (t) => {
  const root = setup(t, assert, [qp(QA), qp(QB)]);
  askChat(assert, root, 't', R1, [QA, QB]);
  const r = must(assert, root, 't', 'defer', { id: QA, reason: 'Frist 2026-10-30 ohne Antwort abgelaufen', resume_when: 'Owner meldet sich' });
  assert.equal(r.json.status_after, 'deferred');
  const text = read(root, qfile(QA));
  assert.ok(text.includes(`- ${DATE}: Vertagt – Grund: Frist 2026-10-30 ohne Antwort abgelaufen; Wiederaufnahme: Owner meldet sich\n`));
  assert.ok(!text.includes('Antwort-ID:'));
  assert.equal(fmOf(root, QA).status, 'deferred');
  assert.deepEqual(codesOf(run(root, 't', 'defer', { id: QB, reason: 'x' })), ['payload_invalid']);
  answer(assert, root, 't', QB, R1, 'zwei');
  assert.deepEqual(codesOf(run(root, 't', 'defer', { id: QB, reason: 'x', resume_when: 'y' })), ['invalid_transition']);
  // next lists the deferred question with its resume condition; asking again resumes it.
  const n = must(assert, root, 't', 'next');
  assert.deepEqual(n.json.deferred.map((q) => [q.id, q.resume_when]), [[QA, 'Owner meldet sich']]);
  askChat(assert, root, 't', 'R-20261031-chat2', [QA]);
  assert.equal(fmOf(root, QA).status, 'asked');
  assert.ok(read(root, qfile(QA)).includes('Wiederaufnahme. In R-20261031-chat2 gestellt'));
});

test('QCLI-FALL-19 supersede marks the question with a reference and flags dependents; invalid targets are refused', (t) => {
  const root = setup(t, assert, [qp(QA), qp(QB, { depends_on: [QA] }), qp(QC)]);
  const before = fingerprint(root);
  for (const by of ['Q-20261031-zz', QA, 'kaputt']) {
    assert.deepEqual(codesOf(run(root, 't', 'supersede', { id: QA, by, reason: 'genauer gefasst' })), ['supersede_target_invalid'], by);
  }
  assert.deepEqual(fingerprint(root), before);
  const r = must(assert, root, 't', 'supersede', { id: QA, by: QC, reason: 'genauer gefasst' });
  assert.deepEqual(r.json.needs_review_set, [QB]);
  assert.equal(fmOf(root, QA).status, 'superseded');
  assert.ok(read(root, qfile(QA)).includes(`Ersetzt durch ${QC} – genauer gefasst`));
  assert.equal(fmOf(root, QB).needs_review, 'true');
  assert.deepEqual(codesOf(run(root, 't', 'supersede', { id: QA, by: QC, reason: 'nochmal' })), ['invalid_transition']);
});

test('QCLI-FALL-20 revise creates a new version; answers stay bound to their version', (t) => {
  const root = setup(t, assert, [qp(QA), qp(QB)]);
  askChat(assert, root, 't', R1, [QA, QB]);
  answer(assert, root, 't', QA, R1, 'eins');
  const r = must(assert, root, 't', 'revise', { id: QA, reason: 'Option c ergänzt', fields: { options: 'a) eins. b) zwei. c) drei.' } });
  assert.deepEqual([r.json.version, r.json.status_after, r.json.needs_review], [2, 'answered', true]);
  const text = read(root, qfile(QA));
  assert.ok(text.includes('Version: 2\n') && text.includes('Optionen und Folgen: a) eins. b) zwei. c) drei.\n'));
  assert.ok(text.includes(`Bezug: Version 1, Runde ${R1}`));
  // asked → open on revise of an unanswered question.
  must(assert, root, 't', 'revise', { id: QB, reason: 'präzisiert', fields: { title: 'Präzisierte Frage B?' } });
  assert.deepEqual([fmOf(root, QB).status, fmOf(root, QB).needs_review], ['open', 'false']);
  assert.ok(read(root, qfile(QB)).includes('# Präzisierte Frage B?\n'));
  // Answer on version 1 is refused; version 2 is asked and answered.
  assert.deepEqual(codesOf(run(root, 't', 'answer', { question_id: QA, version: 1, round_id: R1, text: 'zwei', source: OWNER })), ['version_mismatch']);
  must(assert, root, 't', 'ask', { round_id: 'R-20261031-chat2', channel: 'chat', delivery: 'bestaetigt', questions: [{ id: QA, version: 2 }] });
  const a2 = must(assert, root, 't', 'answer', { question_id: QA, version: 2, round_id: 'R-20261031-chat2', text: 'drei', source: OWNER });
  assert.equal(a2.json.result, 'answered');
  assert.deepEqual([fmOf(root, QA).status, fmOf(root, QA).needs_review], ['answered', 'false']);
});

test('QCLI-FALL-21 review clears needs_review with a note; refused without need or with an open conflict', (t) => {
  const root = setup(t, assert, [qp(QA), qp(QB, { depends_on: [QA] }), qp(QC)]);
  askChat(assert, root, 't', R1, [QA, QC]);
  answer(assert, root, 't', QA, R1, 'eins');
  must(assert, root, 't', 'correct', { question_id: QA, replaces: 'A-20261031-a', text: 'zwei', source: OWNER });
  assert.equal(fmOf(root, QB).needs_review, 'true');
  const r = must(assert, root, 't', 'review', { id: QB, note: 'Frage gilt unverändert', source: { by: 'Claude Code', channel: 'Session' } });
  assert.equal(r.json.needs_review, false);
  assert.ok(read(root, qfile(QB)).includes('Prüfung abgeschlossen – Frage gilt unverändert (Quelle:'));
  assert.deepEqual(codesOf(run(root, 't', 'review', { id: QB, note: 'nochmal', source: OWNER })), ['review_not_needed']);
  answer(assert, root, 't', QC, R1, 'eins');
  answer(assert, root, 't', QC, R1, 'anders', { source: { by: 'Mitgründerin', channel: 'Chat' } });
  assert.deepEqual(codesOf(run(root, 't', 'review', { id: QC, note: 'passt', source: OWNER })), ['conflict_unresolved']);
  must(assert, root, 't', 'correct', { question_id: QC, replaces: 'A-20261031-c', text: 'eins bleibt', source: OWNER });
  assert.equal(fmOf(root, QC).needs_review, 'false');
  // Confirming an answered question needs a human source.
  must(assert, root, 't', 'revise', { id: QA, reason: 'Kontext ergänzt', fields: { context: 'plan.md @ c2' } });
  assert.deepEqual(codesOf(run(root, 't', 'review', { id: QA, note: 'Antwort gilt weiter', source: { by: 'Claude', channel: 'Session' } })), ['answer_not_human']);
  must(assert, root, 't', 'review', { id: QA, note: 'Antwort gilt weiter', source: OWNER });
  assert.equal(fmOf(root, QA).needs_review, 'false');
});

test('QCLI-FALL-22 pause keeps questions unchanged; resume returns to active; resume without pause is refused', (t) => {
  const root = setup(t, assert, [qp(QA)]);
  askChat(assert, root, 't', R1, [QA]);
  const q = read(root, qfile(QA));
  const p = must(assert, root, 't', 'pause');
  assert.deepEqual([p.json.session_before, p.json.session_after], ['waiting_user', 'paused']);
  assert.ok(read(root, 't/index.md').includes('Session: paused\n'));
  assert.equal(read(root, qfile(QA)), q);
  assert.deepEqual(codesOf(run(root, 't', 'pause')), ['invalid_transition']);
  must(assert, root, 't', 'resume');
  assert.ok(read(root, 't/index.md').includes('Session: active\n'));
  assert.deepEqual(codesOf(run(root, 't', 'resume')), ['invalid_transition']);
});

test('QCLI-FALL-23 status reads; --set awaiting_confirmation needs a summary; complete needs everything settled', (t) => {
  const root = setup(t, assert, [qp(QA), qp(QB)]);
  askChat(assert, root, 't', R1, [QA, QB]);
  answer(assert, root, 't', QA, R1, 'eins');
  const before = fingerprint(root);
  const s = must(assert, root, 't', 'status');
  assert.deepEqual(s.json.counts, { open: 0, asked: 1, answered: 1, deferred: 0, superseded: 0, needs_review: 0, invalid: 0 });
  assert.deepEqual(fingerprint(root), before);
  assert.deepEqual(codesOf(run(root, 't', 'status', undefined, ['--set', 'awaiting_confirmation'])), ['summary_missing']);
  const w = must(assert, root, 't', 'status', undefined, 0, ['--set', 'awaiting_confirmation', '--summary', 'A geklärt, B offen']);
  assert.equal(w.json.session_after, 'awaiting_confirmation');
  const idx = read(root, 't/index.md');
  assert.ok(idx.includes('Session: awaiting_confirmation\n') && idx.includes('Zusammenfassung: A geklärt, B offen\n'));
  const blocked = run(root, 't', 'status', undefined, ['--set', 'complete', '--confirmation', 'Owner im Chat, 2026-10-31']);
  assert.deepEqual(codesOf(blocked), ['complete_blocked']);
  assert.match(blocked.json.messages[0].message, new RegExp(QB));
  must(assert, root, 't', 'defer', { id: QB, reason: 'später', resume_when: 'nach Version 1' });
  must(assert, root, 't', 'status', undefined, 0, ['--set', 'complete', '--confirmation', 'Owner im Chat, 2026-10-31']);
  assert.ok(read(root, 't/index.md').includes('Session: complete\n'));
  assert.equal(run(root, 't', 'status', undefined, ['--set', 'fertig']).code, 2);
});

test('QCLI-FALL-24 next separates askable, review, blocked, waiting and deferred; askable sorted by priority', (t) => {
  const Q = (s) => `Q-20261031-${s}`;
  const root = setup(t, assert, [
    qp(Q('later'), { priority: 'later' }),
    qp(Q('block'), { priority: 'blocking' }),
    qp(Q('basis'), { priority: 'important' }),
    qp(Q('folge'), { depends_on: [Q('basis')] }),
    qp(Q('wartet')),
    qp(Q('vertagt')),
    qp(Q('alt')),
    qp(Q('neu')),
  ]);
  askChat(assert, root, 't', R1, [Q('basis'), Q('wartet'), Q('vertagt')]);
  answer(assert, root, 't', Q('basis'), R1, 'eins');
  answer(assert, root, 't', Q('basis'), R1, 'zwei', { source: { by: 'Mitgründerin', channel: 'Chat' } });
  must(assert, root, 't', 'defer', { id: Q('vertagt'), reason: 'später', resume_when: 'nach dem Review' });
  must(assert, root, 't', 'supersede', { id: Q('alt'), by: Q('neu'), reason: 'ersetzt' });
  const n = must(assert, root, 't', 'next').json;
  assert.deepEqual(n.askable.map((q) => q.id), [Q('block'), Q('neu'), Q('later')]);
  assert.deepEqual(n.needs_review.map((q) => [q.id, q.open_conflict]), [[Q('basis'), true]]);
  assert.deepEqual(n.blocked.map((q) => [q.id, q.unmet]), [[Q('folge'), [{ id: Q('basis'), reason: 'needs_review' }]]]);
  assert.deepEqual(n.waiting.map((q) => q.id), [Q('wartet')]);
  assert.deepEqual(n.deferred.map((q) => q.id), [Q('vertagt')]);
});
