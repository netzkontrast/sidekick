// Check format, null-run discrimination and B1 pre-run (SLV0-EVAL-22…25, SLV0-FALL-52…54, -57).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tmp, writeJson, writeTree, runEvalCli, codesOf, materializeBundle } from './eval-helpers.js';
import { readTree } from '../lib/eval/tree.js';
import { frontmatter } from '../lib/eval/checks.js';

const FIXTURE = {
  'docs/q/a.md': '---\nid: Q-1\nstatus: asked\nneeds_review: false\n---\n# A\nText\n',
  'docs/q/b.md': '---\nstatus: open\n---\nAntwort-ID: A-1\n',
  'src/app.js': 'x\n',
};

/** Write a case folder {fall.json, fixture/}; returns its path. */
function caseDir(root, name, caseObj, fixture = FIXTURE) {
  const dir = path.join(root, name);
  writeTree(path.join(dir, 'fixture'), fixture);
  writeJson(dir, 'fall.json', caseObj);
  return dir;
}

function snapshotOf(dir) {
  return [...readTree(dir).entries()].map(([p, e]) => [p, e.kind === 'file' ? e.buf.toString('base64') : e.target]);
}

test('SLV0-EVAL-22 frontmatter is read like the research checker', () => {
  assert.deepEqual(frontmatter('---\nstatus: answered\nurl: https://x.y/z\nleer\n---\nText'), { status: 'answered', url: 'https://x.y/z' });
  assert.deepEqual(frontmatter('Text\n---\nstatus: x\n---\n'), {});
  assert.deepEqual(frontmatter('---\r\nstatus: x\r\n---\r\n'), {});
});

test('SLV0-FALL-52 every rule passes and fails as specified; `eval check` emits assertions with discrimination and role; malformed checks exit 2', (t) => {
  const root = tmp(t);
  const checks = [
    { id: 'K-KERN', file: 'docs/q/a.md', frontmatter: { status: 'answered' } },
    { file: 'docs/q/a.md', frontmatter: { status: 'open' } },
    { file: 'docs/q/a.md', frontmatter_in: { status: ['answered', 'deferred'] } },
    { file: 'docs/q/a.md', frontmatter_in: { status: ['deferred'] } },
    { file: 'docs/q/a.md', contains: 'Antwort-ID: A-2' },
    { file: 'docs/q/a.md', contains: 'fehlt im Text' },
    { file: 'docs/q/b.md', not_contains: 'Antwort-ID' },
    { file: 'docs/q/b.md', not_contains: 'xyz' },
    { file: 'docs/q/a.md', regex: 'Session:\\s*paused' },
    { file: 'docs/q/a.md', regex: 'Session:\\s*active' },
    { file: 'docs/q/a.md', count_at_least: ['Antwort-ID:', 2] },
    { file: 'docs/q/a.md', count_at_least: ['Antwort-ID:', 3] },
    { id: 'K-GEGEN', absent_anywhere: 'SECRET-123' },
    { absent_anywhere: 'Antwort-ID: A-2' },
    { only_changed_under: 'docs/' },
    { no_new_files_under: 'src/' },
    { no_new_files_under: 'docs/q/' },
    { new_file_under: 'docs/q/', contains_any: ['Q-1'] },
    { new_file_under: 'docs/q/', contains_any: ['nope'] },
    { file: 'docs/fehlt.md', contains: 'x' },
  ];
  const dir = caseDir(root, 'C-1', { id: 'C-1', split: 'dev', prompt: 'p', checks, kern_kriterium: 'K-KERN', gegen_kriterium: 'K-GEGEN' });
  const ws = writeTree(path.join(root, 'ws'), {
    ...FIXTURE,
    'docs/q/a.md': '---\nid: Q-1\nstatus: answered\nneeds_review: false\n---\n# A\nAntwort-ID: A-2\nAntwort-ID: A-3\nSession: paused\n',
    'docs/q/new.md': 'Folgefrage zu Q-1\n',
    'src/app.js': 'y\n',
    '.claude/notiz.txt': 'SECRET-123\n',
  });
  const before = snapshotOf(dir);
  const r = runEvalCli(['check', '--case', dir, '--workspace', ws]);
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.deepEqual(r.json.pruefungen.map((p) => p.ergebnis === 'bestanden'), [
    true, false, true, false, true, false, false, true, true, false, true, false, true, false, false, true, false, true, false, false,
  ]);
  assert.equal(r.json.pruefungen[19].detail, 'Datei fehlt');
  assert.equal(r.json.pruefungen[14].detail, 'außerhalb geändert: .claude/notiz.txt, src/app.js');
  assert.equal(r.json.pruefungen[1].id, 'C-1-P02');
  assert.equal(r.json.ausgangsstand, 'fixture');
  const a = r.json.assertions;
  assert.deepEqual(a[0], { id: 'K-KERN', art: 'deterministisch', bewerter: 'sl-eval-check@1', ergebnis: 'bestanden', r_regel: null, trennschaerfe: 'trennend', rolle: 'kern' });
  assert.deepEqual([a[12].rolle, a[12].trennschaerfe], ['gegen', 'erhaltend']);
  assert.ok(a.slice(1, 12).every((x) => x.rolle === null));
  // With the workspace as its own baseline nothing changed.
  const same = runEvalCli(['check', '--case', dir, '--workspace', ws, '--baseline', ws]);
  assert.deepEqual([same.json.pruefungen[14].ergebnis, same.json.pruefungen[16].ergebnis, same.json.ausgangsstand], ['bestanden', 'bestanden', 'angegeben']);
  assert.deepEqual(snapshotOf(dir), before);

  const bad = (name, check) => caseDir(root, name, { id: name, prompt: 'p', checks: [check] });
  for (const [name, check, re] of [
    ['B-zwei', { file: 'docs/q/a.md', contains: 'x', regex: 'y' }, /genau eine Regel/],
    ['B-unbekannt', { file: 'docs/q/a.md', matches: 'x' }, /eval-case/],
    ['B-muster', { file: 'docs/q/a.md', regex: '(' }, /ungültiges Muster/],
    ['B-pfad', { file: '../x', contains: 'x' }, /unsicherer Pfad/],
  ]) {
    const rb = runEvalCli(['check', '--case', bad(name, check), '--workspace', ws]);
    assert.equal(rb.code, 2, name);
    assert.match(rb.json.error.message, re, name);
  }
});

test('SLV0-FALL-53 null run marks checks discriminating or preserving; a case without discriminating check gets a warning; the fixture stays unchanged', (t) => {
  const root = tmp(t);
  const cases = path.join(root, 'faelle');
  caseDir(cases, 'C-A', { id: 'C-A', prompt: 'p', checks: [
    { file: 'docs/q/b.md', contains: 'Antwort-ID: A-1' },
    { file: 'docs/q/a.md', frontmatter: { status: 'answered' } },
    { only_changed_under: 'docs/' },
  ] });
  caseDir(cases, 'C-B', { id: 'C-B', prompt: 'p', checks: [{ only_changed_under: 'docs/' }, { file: 'docs/q/a.md', not_contains: 'Antwort-ID' }] });
  caseDir(cases, 'C-C', { id: 'C-C', prompt: 'p' });
  const before = snapshotOf(cases);
  const r = runEvalCli(['nullrun', '--cases', cases]);
  assert.equal(r.code, 0, r.stdout + r.stderr);
  const a = r.json.faelle.find((f) => f.case_id === 'C-A');
  assert.deepEqual(a.pruefungen.map((p) => [p.nulllauf, p.trennschaerfe]), [['besteht', 'erhaltend'], ['faellt', 'trennend'], ['besteht', 'erhaltend']]);
  assert.deepEqual(r.json.zaehlung, { faelle: 3, pruefungen: 5, trennend: 1, erhaltend: 4, faelle_ohne_trennende_pruefung: ['C-B'], faelle_ohne_pruefung: ['C-C'] });
  assert.deepEqual(r.json.messages.map((m) => [m.path, m.code, m.severity]), [['C-B', 'no_discriminating_check', 'warning']]);
  assert.deepEqual(snapshotOf(cases), before);
  // A single case folder works as well; a folder without cases is a usage error.
  assert.equal(runEvalCli(['nullrun', '--cases', path.join(cases, 'C-A')]).json.faelle.length, 1);
  assert.equal(runEvalCli(['nullrun', '--cases', root]).code, 2);
});

/** Python reference (check_case.py with an empty change set on the unchanged fixtures): passes per check. */
const DEV_REFERENCE = {
  'D1-B02-teilantwort': [false, false, true, true, true],
  'D2-B04-korrektur': [true, false, false, true, true],
  'D3-B06a-pause': [false, true, true, true],
  'D4-B08-secret': [true, true, false, true],
  'D5-B10a-abschluss': [true, false, true],
  'D6-B10b-neue-luecke': [false, false, true],
  'D7-B14-doppelantwort': [true, false, false, true],
  'D8-B15-frist': [true, true, true],
};

test('SLV0-FALL-54 equality: the eight grilling dev cases give 20 preserving and 11 discriminating checks; only D8 has none', (t) => {
  const { root, herkunft } = materializeBundle(t, 'grilling-dev-faelle');
  const dev = path.join(root, 'research', 'skills-meta-prompting', 'grilling-runde', 'dev');
  const r = runEvalCli(['nullrun', '--cases', dev]);
  assert.equal(r.code, 0, r.stdout + r.stderr);
  const z = r.json.zaehlung;
  assert.deepEqual([z.faelle, z.pruefungen, z.erhaltend, z.trennend], [8, 31, 20, 11]);
  assert.deepEqual(z.faelle_ohne_trennende_pruefung, ['D8-B15-frist']);
  assert.deepEqual(codesOf(r.json), ['no_discriminating_check']);
  for (const f of r.json.faelle) assert.deepEqual(f.pruefungen.map((p) => p.nulllauf === 'besteht'), DEV_REFERENCE[f.case_id], f.case_id);
  t.diagnostic(`Bundle ${herkunft.branch}@${herkunft.commit.slice(0, 12)}: ${r.json.faelle.map((f) => `${f.case_id} ${f.trennend}/${f.pruefungen.length}`).join(', ')}`);
});

test('SLV0-FALL-57 B1 pre-run: all core verdicts met → nicht_trennend; one missed → trennend; none missed but one unclear → unklar; duplicate case → exit 2', (t) => {
  const dir = tmp(t);
  const run = (faelle, name) => runEvalCli(['nullrun', '--b1-kern', writeJson(dir, `${name}.json`, { schema_version: 1, kandidat: 'K-TEST', faelle })]);
  const all = run([{ case_id: 'S1', kern: 'erfuellt', quelle: 'bewertung.json' }, { case_id: 'S2', kern: 'erfuellt' }], 'alle');
  assert.equal(all.code, 1, all.stdout);
  assert.equal(all.json.ergebnis, 'nicht_trennend');
  assert.deepEqual(codesOf(all.json), ['family_not_discriminating']);
  assert.deepEqual(all.json.nicht_trennende_faelle, ['S1', 'S2']);
  const one = run([{ case_id: 'S1', kern: 'erfuellt' }, { case_id: 'S2', kern: 'nicht_erfuellt' }, { case_id: 'S3', kern: 'unklar' }], 'einer');
  assert.equal(one.code, 0, one.stdout);
  assert.deepEqual([one.json.ergebnis, one.json.trennende_faelle, one.json.messages], ['trennend', ['S2'], []]);
  const unclear = run([{ case_id: 'S1', kern: 'erfuellt' }, { case_id: 'S2', kern: 'unklar' }], 'unklar');
  assert.equal(unclear.code, 1);
  assert.deepEqual([unclear.json.ergebnis, codesOf(unclear.json)], ['unklar', ['core_verdict_unclear']]);
  assert.equal(run([{ case_id: 'S1', kern: 'erfuellt' }, { case_id: 'S1', kern: 'nicht_erfuellt' }], 'doppelt').code, 2);
  assert.equal(run([{ case_id: 'S1', kern: 'ja' }], 'schema').code, 2);
  assert.deepEqual(fs.readdirSync(dir).sort(), ['alle.json', 'doppelt.json', 'einer.json', 'schema.json', 'unklar.json']);
});
