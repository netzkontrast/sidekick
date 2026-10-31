// check, render, format preservation, atomic writes, determinism, round trip and the real store:
// QCLI-FALL-25…33 (docs/spec/questions-cli-v0.md §7).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  NOW, DATE, FIXTURES, REPO_ROOT, run, must, codesOf, read, write, fingerprint, qp, OWNER, setup, askChat, answer, tmpRoot,
  qcli, fixtureWorkspace,
} from './questions-helpers.js';
import { parseQuestion, joinLines, setFrontmatter } from '../lib/questions/record.js';
import { parseIndex } from '../lib/questions/topic-index.js';
import { parseRound } from '../lib/questions/round.js';
import { commitChanges, Refusal } from '../lib/questions/store.js';
import { cmdAnswer } from '../lib/questions/commands.js';

/** Hand-written question text in records.md form. */
function qtext(id, { status = 'open', review = false, deps = '[]', fmId = id, answers = 'Noch keine. Empfehlung ist keine Antwort.', history = '- 2026-10-29: erfasst', extraFront = '', extraBody = '', tail = '' } = {}) {
  return [
    '---', `id: ${fmId}`, `status: ${status}`, `needs_review: ${review}`, `depends_on: ${deps}`, ...(extraFront ? [extraFront] : []), '---',
    `# Frage ${id}?`, 'Version: 1', 'Erstellt: 2026-10-29', 'Art: decision', 'Priorität: important', 'Kontext / Quelle: plan.md',
    'Anlass: Lücke', 'Auswirkung / blockierte Arbeit: Umfang', `Fragestellung: Frage ${id}?`, 'Optionen und Folgen: a) ja. b) nein.',
    'Empfehlung + sachlicher Grund: a, weil einfach.', 'Benötigter Sachbeleg: keiner', ...(extraBody ? [extraBody] : []), '',
    '## Antworten', answers, '', '## Verlauf', history, ...(tail ? ['', tail] : []), '',
  ].join('\n');
}

function ablock(aid, { source = '2026-10-29, Owner, Chat (keine Message-ID)', ref = 'Version 1, Runde R-20261029-chat1', text = '„ja“ (wörtlich)', replaces = 'keine', conflict = 'keiner' } = {}) {
  return [`Antwort-ID: ${aid}`, `Zeit / beantwortet von / Quelle: ${source}`, `Bezug: ${ref}`, `Antwort: ${text}`, `Ersetzt Antwort: ${replaces}`, `Konflikt mit: ${conflict}`, 'Folgen / Rückfragen: keine'].join('\n');
}

function itext(ids, { session = 'waiting_user', extra = '' } = {}) {
  return [
    '# Thema', `Session: ${session}`, 'Ziel / Nicht-Ziele: testen', 'Kontext: plan.md', 'Bearbeiter: Test', '', '| ID / Datei | Kurzfrage |', '|---|---|',
    ...ids.map((id) => `| [${id}](questions/${id}.md) | Kurz ${id} |`), '', 'Status und Abhängigkeiten ausschließlich in den Frage-Dateien führen.',
    'Zusammenfassung: ausstehend', 'Bestätigung: ausstehend', `Chat-Runden: R-20261029-chat1 – ${ids.map((id) => `${id} v1`).join(', ')} – im Chat gestellt – Zustellung bestätigt`,
    ...(extra ? [extra] : []), '',
  ].join('\n');
}

const Q = (s) => `Q-20261029-${s}`;

test('QCLI-FALL-25 check reports each invariant violation with its code; only warnings keep exit 0; secrets are not echoed', (t) => {
  const root = tmpRoot(t);
  const secret = 'sk-live-51QpTafelSyncX9d7Kq2Lm8Vb4Zr6Wt3Yh';
  const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 's', 'm'].map(Q);
  write(root, 'x/index.md', itext([...ids, Q('zz')]));
  const files = {
    a: qtext(Q('a'), { status: 'answered' }),
    b: qtext(Q('b'), { status: 'answered', answers: ablock('A-20261029-b', { source: '' }) }),
    c: qtext(Q('c'), { status: 'answered', answers: `${ablock('A-20261029-c')}\n\n${ablock('A-20261029-c-2', { conflict: 'A-20261029-c' })}` }),
    d: qtext(Q('d'), { deps: `["${Q('e')}"]` }),
    e: qtext(Q('e'), { deps: `["${Q('d')}"]` }),
    f: qtext(Q('f'), { deps: `["${Q('fehlt')}"]` }),
    g: qtext(Q('g'), { fmId: Q('h') }),
    s: qtext(Q('s'), { extraBody: `Notiz: Schlüssel ${secret}` }),
    m: qtext(Q('m'), { status: 'asked', answers: ablock('A-20261029-m') }),
  };
  for (const [k, text] of Object.entries(files)) write(root, `x/questions/${Q(k)}.md`, text);
  const r = qcli(['check', '--root', root]);
  assert.equal(r.code, 1);
  assert.ok(!r.stdout.includes(secret));
  const got = r.json.messages.map((m) => `${m.code}@${m.path}`);
  for (const expected of [
    `answered_without_answer@x/questions/${Q('a')}.md`,
    `answer_source_missing@x/questions/${Q('b')}.md`,
    `conflict_without_review@x/questions/${Q('c')}.md`,
    'dependency_cycle@x/questions',
    `dependency_unknown@x/questions/${Q('f')}.md`,
    `id_mismatch@x/questions/${Q('g')}.md`,
    'index_row_orphan@x/index.md',
    `secret_detected@x/questions/${Q('s')}.md`,
    `status_answer_mismatch@x/questions/${Q('m')}.md`,
  ]) assert.ok(got.includes(expected), `${expected} in ${got.join(', ')}`);
  // Warnings only: exit 0.
  write(root, 'y/index.md', itext([Q('n')]));
  write(root, `y/questions/${Q('n')}.md`, qtext(Q('n')));
  write(root, `y/questions/${Q('o')}.md`, qtext(Q('o')));
  const w = qcli(['check', '--root', root, '--topic', 'y']);
  assert.equal(w.code, 0, w.stdout);
  assert.deepEqual(w.json.messages.map((m) => [m.code, m.severity]), [['index_stale', 'warning']]);
  // Unparseable structure.
  write(root, 'z/index.md', 'kein Index\n');
  write(root, `z/questions/${Q('p')}.md`, '# ohne Frontmatter\n');
  const z = qcli(['check', '--root', root, '--topic', 'z']);
  assert.equal(z.code, 1);
  assert.ok(codesOf(z).includes('question_invalid') && codesOf(z).includes('index_invalid'), codesOf(z).join(','));
});

test('QCLI-FALL-26 check, status and next only read', (t) => {
  const root = setup(t, assert, [qp('Q-20261031-a'), qp('Q-20261031-b', { depends_on: ['Q-20261031-a'] })]);
  askChat(assert, root, 't', 'R-20261031-chat1', ['Q-20261031-a']);
  const before = fingerprint(root);
  assert.equal(qcli(['check', '--root', root]).code, 0);
  assert.equal(qcli(['check', '--root', root, '--topic', 't']).code, 0);
  must(assert, root, 't', 'status');
  must(assert, root, 't', 'next');
  assert.deepEqual(fingerprint(root), before);
});

test('QCLI-FALL-27 render adds missing rows only, keeps existing rows byte-identical, is idempotent, refuses orphan rows', (t) => {
  const root = setup(t, assert, [qp('Q-20261031-a', { short: 'Eigene Kurzfrage A' }), qp('Q-20261031-b'), qp('Q-20261031-c')]);
  const idx = read(root, 't/index.md');
  const without = idx.replace(/\| \[Q-20261031-b\][^\n]*\n/, '');
  write(root, 't/index.md', without);
  assert.deepEqual(qcli(['check', '--root', root]).json.messages.map((m) => m.code), ['index_stale']);
  const r = must(assert, root, 't', 'render');
  assert.deepEqual(r.json.rows_added, ['Q-20261031-b']);
  const after = read(root, 't/index.md');
  assert.ok(after.includes('| [Q-20261031-a](questions/Q-20261031-a.md) | Eigene Kurzfrage A |\n| [Q-20261031-c](questions/Q-20261031-c.md) | Synthetische Frage Q-20261031-c? |\n| [Q-20261031-b](questions/Q-20261031-b.md) | Synthetische Frage Q-20261031-b? |\n'));
  const again = must(assert, root, 't', 'render');
  assert.deepEqual([again.json.rows_added, again.json.changed], [[], []]);
  // A table split by a blank line (hand-written) is extended after its last row.
  const split = after.replace('| [Q-20261031-c]', '\n| [Q-20261031-c]').replace(/\| \[Q-20261031-b\][^\n]*\n/, '');
  write(root, 't/index.md', split);
  must(assert, root, 't', 'render');
  assert.ok(read(root, 't/index.md').includes('| Eigene Kurzfrage A |\n\n| [Q-20261031-c](questions/Q-20261031-c.md) | Synthetische Frage Q-20261031-c? |\n| [Q-20261031-b]'));
  // Orphan row.
  write(root, 't/index.md', `${read(root, 't/index.md')}| [Q-20261031-zz](questions/Q-20261031-zz.md) | weg |\n`);
  const before = fingerprint(root);
  assert.deepEqual(codesOf(run(root, 't', 'render')), ['index_row_orphan']);
  assert.deepEqual(fingerprint(root), before);
});

test('QCLI-FALL-28 unknown frontmatter keys, fields, sections and comments survive edits byte-identically', (t) => {
  const root = tmpRoot(t);
  const comment = '<!-- Bei Antwort ergänzen:\nAntwort-ID: A-<eindeutig>\n-->';
  const original = qtext(Q('a'), {
    status: 'asked',
    extraFront: 'owner: test-team',
    extraBody: 'Optionen-Notiz: siehe Liste\n- erster Punkt\n- zweiter Punkt',
    answers: `Noch keine. Empfehlung ist keine Antwort.\n${comment}`,
    tail: '## Anhang\nFreier Text bleibt.',
  });
  write(root, 'x/index.md', itext([Q('a'), Q('b')]));
  write(root, `x/questions/${Q('a')}.md`, original);
  write(root, `x/questions/${Q('b')}.md`, qtext(Q('b'), { status: 'asked', extraBody: 'Zusatzfeld: bleibt' }));
  const b0 = read(root, `x/questions/${Q('b')}.md`);
  must(assert, root, 'x', 'answer', { question_id: Q('a'), version: 1, round_id: 'R-20261029-chat1', text: 'ja', source: OWNER });
  must(assert, root, 'x', 'defer', { id: Q('b'), reason: 'später', resume_when: 'nach a' });
  const expectedA = original
    .replace('status: asked', 'status: answered')
    .replace(`Noch keine. Empfehlung ist keine Antwort.\n${comment}\n`, `${comment}\n\n${ablock('A-20261031-a', { source: `${DATE}, Owner, Chat (keine Message-ID)` })}\n`)
    .replace('- 2026-10-29: erfasst\n', `- 2026-10-29: erfasst\n- ${DATE}: Antwort A-20261031-a aus R-20261029-chat1 erfasst (Version 1).\n`);
  assert.equal(read(root, `x/questions/${Q('a')}.md`), expectedA);
  const expectedB = b0.replace('status: asked', 'status: deferred')
    .replace('- 2026-10-29: erfasst\n', `- 2026-10-29: erfasst\n- ${DATE}: Vertagt – Grund: später; Wiederaufnahme: nach a\n`);
  assert.equal(read(root, `x/questions/${Q('b')}.md`), expectedB);
  // The comment's sample "Antwort-ID" is not read as an answer.
  assert.deepEqual(parseQuestion(expectedA).answers.map((a) => a.id), ['A-20261031-a']);
});

test('QCLI-FALL-29 a write error after the first of three renames rolls everything back, no temp files remain', (t) => {
  const dir = tmpRoot(t);
  const a = path.join(dir, 'a.md');
  const b = path.join(dir, 'b.md');
  const c = path.join(dir, 'c.md');
  fs.writeFileSync(a, 'alt a\n');
  fs.writeFileSync(b, 'alt b\n');
  const changes = [
    { abs: a, rel: 'a.md', before: 'alt a\n', after: 'neu a\n' },
    { abs: b, rel: 'b.md', before: 'alt b\n', after: 'neu b\n' },
    { abs: c, rel: 'c.md', before: null, after: 'neu c\n' },
  ];
  assert.throws(() => commitChanges(changes, { failAfter: 1 }), (err) => err instanceof Refusal && err.messages[0].code === 'write_failed' && /1 geschriebene Datei/.test(err.messages[0].message));
  assert.equal(fs.readFileSync(a, 'utf8'), 'alt a\n');
  assert.equal(fs.readFileSync(b, 'utf8'), 'alt b\n');
  assert.ok(!fs.existsSync(c));
  assert.deepEqual(fs.readdirSync(dir).sort(), ['a.md', 'b.md']);
  // Without failure all three are written; a new file never overwrites one that appeared meanwhile.
  assert.deepEqual(commitChanges(changes), ['a.md', 'b.md', 'c.md']);
  assert.equal(fs.readFileSync(c, 'utf8'), 'neu c\n');
  assert.throws(() => commitChanges([{ abs: c, rel: 'c.md', before: null, after: 'x' }]), (err) => err.messages[0].code === 'concurrent_modification');
});

test('QCLI-FALL-30 a file changed between reading and writing aborts with concurrent_modification', (t) => {
  const root = setup(t, assert, [qp('Q-20261031-a')]);
  askChat(assert, root, 't', 'R-20261031-chat1', ['Q-20261031-a']);
  const ctx = { root, rootArg: root, topic: 't', now: new Date(NOW), date: DATE, d8: '20261031' };
  const planned = cmdAnswer(ctx, { question_id: 'Q-20261031-a', version: 1, round_id: 'R-20261031-chat1', text: 'eins', source: OWNER });
  const rel = 't/questions/Q-20261031-a.md';
  const foreign = `${read(root, rel)}<!-- fremde Änderung -->\n`;
  write(root, rel, foreign);
  assert.throws(() => commitChanges(planned.ws.changes(), { dirs: planned.dirs }), (err) => err instanceof Refusal && err.messages[0].code === 'concurrent_modification');
  assert.equal(read(root, rel), foreign);
  assert.ok(!read(root, 't/index.md').includes('Antworten: A-'));
});

test('QCLI-FALL-31 the same flow with the same --now gives byte-identical files and outputs', (t) => {
  const flow = (root) => {
    const outs = [];
    const step = (cmd, payload, extra) => {
      const r = must(assert, root, 't', cmd, payload, 0, extra);
      const { root: _r, ...rest } = r.json; // eslint-disable-line no-unused-vars
      outs.push(rest);
    };
    step('init', { title: 'Det' });
    step('add', { questions: [qp('Q-20261031-b', { depends_on: ['Q-20261031-a'] }), qp('Q-20261031-a')] });
    step('ask', { round_id: 'R-20261031-chat1', channel: 'chat', delivery: 'bestaetigt', questions: [{ id: 'Q-20261031-a', version: 1 }] });
    step('answer', { question_id: 'Q-20261031-a', version: 1, round_id: 'R-20261031-chat1', text: 'eins', source: OWNER });
    step('correct', { question_id: 'Q-20261031-a', replaces: 'A-20261031-a', text: 'zwei', source: OWNER });
    step('next');
    step('status');
    return outs;
  };
  const r1 = tmpRoot(t);
  const r2 = tmpRoot(t);
  assert.deepEqual(flow(r1), flow(r2));
  assert.deepEqual(fingerprint(r1, { mtime: false }), fingerprint(r2, { mtime: false }));
});

test('QCLI-FALL-32 round trip on copies of the eight dev fixtures: parse/serialize identical, check clean, render no-op', (t) => {
  assert.equal(Object.keys(FIXTURES.cases).length, 8);
  // Hand-written list forms are read as well: flow list without quotes and block list.
  for (const deps of [`[${Q('a')}, ${Q('b')}]`, `\n  - ${Q('a')}\n  - "${Q('b')}"`]) {
    const text = qtext(Q('c'), { deps });
    const d = parseQuestion(text);
    assert.deepEqual([d.problems, d.frontmatter.depends_on], [[], [Q('a'), Q('b')]]);
    assert.equal(joinLines(d.lines, d.endsNl), text);
  }
  for (const caseId of Object.keys(FIXTURES.cases)) {
    const ws = fixtureWorkspace(t, caseId);
    const root = path.join(ws, 'docs', 'fragen');
    for (const [rel, text] of Object.entries(FIXTURES.cases[caseId].files)) {
      if (!rel.startsWith('docs/fragen/')) continue;
      if (rel.endsWith('/index.md')) {
        const d = parseIndex(text);
        assert.equal(joinLines(d.lines, d.endsNl), text, rel);
        assert.deepEqual(d.problems, [], rel);
      } else {
        const d = parseQuestion(text);
        assert.deepEqual(d.problems, [], `${caseId} ${rel}`);
        assert.equal(joinLines(d.lines, d.endsNl), text, rel);
        assert.equal(setFrontmatter(d, 'status', d.frontmatter.status), text, `${rel}: no-op edit keeps bytes`);
        assert.equal(d.answers.length, (text.match(/^Antwort-ID:/gm) ?? []).length);
      }
    }
    const before = fingerprint(ws);
    const c = qcli(['check', '--root', root]);
    assert.equal(c.code, 0, `${caseId}: ${c.stdout}`);
    assert.equal(c.json.summary.errors, 0, caseId);
    const r = must(assert, root, 'tafel', 'render');
    assert.deepEqual([r.json.rows_added, r.json.changed], [[], []], caseId);
    assert.deepEqual(fingerprint(ws), before, caseId);
    t.diagnostic(`${caseId}: check errors=${c.json.summary.errors} warnings=${c.json.summary.warnings} questions=${c.json.questions}`);
  }
});

test('QCLI-FALL-33 check on the real stores docs/fragen/skill-library, v0-ziel-und-vertraege and the whole root: 0 errors, read-only', (t) => {
  const root = path.join(REPO_ROOT, 'docs', 'fragen');
  const before = fingerprint(root);
  for (const args of [['--topic', 'skill-library'], ['--topic', 'v0-ziel-und-vertraege'], []]) {
    const c = qcli(['check', '--root', root, ...args]);
    assert.equal(c.code, 0, c.stdout);
    assert.equal(c.json.summary.errors, 0);
    t.diagnostic(`check ${args.join(' ') || '(ganze Wurzel)'}: topics=${c.json.topics.join(',')} questions=${c.json.questions} errors=${c.json.summary.errors} warnings=${c.json.summary.warnings}`);
  }
  // The repository's round files and indexes parse too.
  for (const topic of ['skill-library', 'v0-ziel-und-vertraege']) {
    const roundsDir = path.join(root, topic, 'rounds');
    for (const f of fs.readdirSync(roundsDir)) {
      const d = parseRound(fs.readFileSync(path.join(roundsDir, f), 'utf8'));
      assert.deepEqual(d.problems, [], f);
      assert.ok(d.mapping.length > 0, f);
    }
  }
  assert.deepEqual(fingerprint(root), before);
});
