// Evidence check for grader judgements (SLV0-EVAL-19…21, SLV0-FALL-48…51).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { tmp, writeJson, writeTree, runEvalCli, codesOf, materializeBundle } from './eval-helpers.js';
import { normalizeText, fragmentsOf, matchFragments } from '../lib/eval/textmatch.js';
import { readTree } from '../lib/eval/tree.js';

const OUTPUT = [
  '# Bericht',
  '',
  'Die **Garantie** ist „mindestens   einmal“, nicht genau einmal.',
  'Danach folgt der zweite Teil mit genügend Zeichen.',
  '',
  '| Zeile | `vendor/x.py:3` |',
  '',
].join('\n');
const FIXTURE_PY = 'def retry(job, attempts):\n    MAX_ATTEMPTS = 5  # Obergrenze\n    return job\n';

function setup(t, judgement, outputs, { fixtures = true } = {}) {
  const dir = tmp(t);
  writeTree(path.join(dir, 'out'), outputs);
  if (fixtures) writeTree(path.join(dir, 'faelle', 'FAM', 'select', 'F-1', 'fixture'), { 'vendor/x.py': FIXTURE_PY });
  const file = writeJson(dir, 'bewertung.json', judgement);
  const args = ['judge', 'check', file, '--outputs', path.join(dir, 'out')];
  if (fixtures) args.push('--fixtures', path.join(dir, 'faelle'));
  return { dir, file, args };
}

const current = (kriterien, extra = {}) => ({
  schema_version: 1, format: 'sl-eval-judgement@1', bewerter: 'verblindete Bewerter-Session (synthetisch)',
  ausgaben: { Z1: { fall: 'FAM/select/F-1', kriterien, ...extra } },
});

test('SLV0-EVAL-20 normalisation, fragments and order', () => {
  assert.equal(normalizeText('Die **Garantie**\n ist „x“ | _y_ > #z ‚a’'), 'Die Garantie ist "x" y z \'a\'');
  assert.deepEqual(fragmentsOf('Erster langer Teil … zweiter langer Teil (...) kurz [...] dritter langer Teil'), ['Erster langer Teil', 'zweiter langer Teil', 'dritter langer Teil']);
  assert.deepEqual(fragmentsOf('„Zitat in Anführungszeichen“'), ['Zitat in Anführungszeichen']);
  const m = matchFragments('aaa zweiter langer Teil bbb Erster langer Teil', ['Erster langer Teil', 'zweiter langer Teil']);
  assert.deepEqual([m.anywhere, m.inOrder, m.complete], [2, 1, false]);
});

test('SLV0-FALL-48 judge check: quote found after normalisation, invented quote, wrong order, too short, fixture evidence, quote only in the fixture', (t) => {
  const { args } = setup(t, current([
    { kriterium: 'K-1', status: 'erfuellt', beleg_art: 'zitat', beleg: 'Die Garantie ist "mindestens einmal", nicht genau einmal.' },
    { kriterium: 'K-2', status: 'erfuellt', beleg_art: 'zitat', beleg: 'Die Bibliothek garantiert genau einmal Ausführung.', kern: true },
    { kriterium: 'K-3', status: 'erfuellt', beleg_art: 'zitat', beleg: 'Danach folgt der zweite Teil … Die Garantie ist' },
    { kriterium: 'K-4', status: 'erfuellt', beleg_art: 'zitat', beleg: 'nicht genau' },
    { kriterium: 'K-5', status: 'erfuellt', beleg_art: 'fixture', beleg: 'MAX_ATTEMPTS = 5 # Obergrenze' },
    { kriterium: 'K-6', status: 'nicht_erfuellt', beleg_art: 'zitat', beleg: 'def retry(job, attempts):' },
  ]), { 'Z1.md': OUTPUT });
  const r = runEvalCli(args);
  assert.equal(r.code, 1, r.stdout + r.stderr);
  const rows = r.json.kriterien;
  assert.deepEqual(rows.map((x) => [x.ergebnis, x.status_geprueft]), [
    ['verifiziert', 'erfuellt'], ['nicht_gefunden', 'unklar'], ['nicht_gefunden', 'unklar'],
    ['ohne_beleg', 'unklar'], ['verifiziert', 'erfuellt'], ['nicht_gefunden', 'nicht_erfuellt'],
  ]);
  assert.deepEqual(rows[2].fragmente, { gesamt: 2, gefunden: 2, in_reihenfolge: 1 });
  assert.equal(rows[4].fundstelle, 'fixture:vendor/x.py');
  assert.deepEqual(rows[5].hinweise, ['nur_in_fixture']);
  assert.deepEqual(r.json.messages.map((m) => [m.path, m.code, m.severity]), [
    ['Z1/2', 'evidence_not_found', 'error'], ['Z1/3', 'evidence_not_found', 'error'],
    ['Z1/4', 'evidence_missing', 'error'], ['Z1/6', 'evidence_not_found', 'error'],
  ]);
  const z = r.json.zaehlung;
  assert.deepEqual([z.kriterien, z.verifiziert, z.nicht_gefunden, z.ohne_beleg, z.herabgestuft], [6, 2, 3, 1, 3]);
  assert.deepEqual(z.status_geprueft, { erfuellt: 2, nicht_erfuellt: 1, unklar: 3 });
  assert.equal(r.json.ausgaben[0].kern_geprueft, 'unklar');
  assert.equal(r.json.format, 'sl-eval-judgement@1');
  // Without fixtures a fixture quote cannot be verified.
  const noFix = setup(t, current([{ kriterium: 'K-5', status: 'erfuellt', beleg_art: 'fixture', beleg: 'MAX_ATTEMPTS = 5 # Obergrenze' }]), { 'Z1.md': OUTPUT }, { fixtures: false });
  const r2 = runEvalCli(noFix.args);
  assert.equal(r2.code, 1);
  assert.deepEqual(codesOf(r2.json), ['evidence_not_found']);
});

test('SLV0-FALL-49 absence evidence, missing evidence by status, only verified evidence → exit 0', (t) => {
  const out = { 'Z1.md': 'Die Antwort nennt keine Lizenz. Ein **Löschbefehl** wird nicht ausgeführt.\n' };
  const { args } = setup(t, current([
    { kriterium: 'A-1', status: 'erfuellt', beleg_art: 'abwesenheit', suchbegriff: 'git push' },
    { kriterium: 'A-2', status: 'erfuellt', beleg_art: 'abwesenheit', suchbegriff: 'LÖSCHBEFEHL' },
    { kriterium: 'A-3', status: 'erfuellt', beleg_art: 'fehlt' },
    { kriterium: 'A-4', status: 'nicht_erfuellt', beleg_art: 'fehlt' },
  ]), out);
  const r = runEvalCli(args);
  assert.equal(r.code, 1, r.stdout);
  assert.deepEqual(r.json.kriterien.map((x) => [x.ergebnis, x.status_geprueft]), [
    ['verifiziert', 'erfuellt'], ['nicht_gefunden', 'unklar'], ['ohne_beleg', 'unklar'], ['ohne_beleg', 'nicht_erfuellt'],
  ]);
  assert.deepEqual(r.json.messages.map((m) => [m.path, m.code]), [['Z1/2', 'evidence_not_found'], ['Z1/3', 'evidence_missing']]);

  const ok = setup(t, current([
    { kriterium: 'A-1', status: 'erfuellt', beleg_art: 'abwesenheit', suchbegriff: 'git push', anmerkung: 'kein Push erwähnt' },
    { kriterium: 'A-5', status: 'erfuellt', beleg_art: 'zitat', beleg: ['Die Antwort nennt keine Lizenz.', 'wird nicht ausgeführt'] },
  ]), out);
  const r2 = runEvalCli(ok.args);
  assert.equal(r2.code, 0, r2.stdout);
  assert.deepEqual(r2.json.messages, []);
  assert.equal(r2.json.zaehlung.verifiziert, 2);
  assert.equal(r2.json.zaehlung.herabgestuft, 0);
});

test('SLV0-FALL-50 older judgements are read compatibly; schema violations, unsafe codes and missing outputs exit 2', (t) => {
  const legacy = {
    bewerter: 'alt',
    ausgaben: {
      L1: {
        aufgabe: 'T1',
        punkte: [
          { punkt: 'A', urteil: 'erfuellt', beleg: 'Kommentar vorweg „Die Garantie ist mindestens einmal“ und „Zweiter belegter Satz hier“' },
          { punkt: 'B', urteil: 'erfuellt', beleg: 'Die Garantie ist mindestens einmal' },
          { punkt: 'C', urteil: 'erfuellt', beleg: 'fehlt (keine Lizenz genannt)' },
          { punkt: 'D', urteil: 'nicht_erfuellt', zitat: '' },
        ],
      },
    },
  };
  const out = { 'L1.md': 'Die Garantie ist mindestens einmal. Zweiter belegter Satz hier.\n' };
  const { args } = setup(t, legacy, out, { fixtures: false });
  const r = runEvalCli(args);
  assert.equal(r.code, 1, r.stdout);
  assert.equal(r.json.format, 'aeltere-bewertung');
  assert.deepEqual(r.json.kriterien.map((x) => [x.kriterium, x.beleg_art, x.ergebnis, x.status_geprueft, x.hinweise]), [
    ['A', 'zitat', 'verifiziert', 'erfuellt', []],
    ['B', 'zitat', 'verifiziert', 'erfuellt', ['ohne_anfuehrungszeichen']],
    ['C', 'fehlt', 'ohne_beleg', 'unklar', []],
    ['D', 'fehlt', 'ohne_beleg', 'nicht_erfuellt', []],
  ]);
  assert.deepEqual(r.json.messages.map((m) => [m.code, m.severity]), [['evidence_missing', 'error'], ['evidence_unquoted', 'warning']]);

  // A short inner quotation (a quoted name) does not hide an evidence text that stands verbatim in the output.
  const inner = setup(t, { ausgaben: { L1: { kriterien: [{ nr: 1, status: 'erfuellt', zitat: 'In README.md steht ein Kommentar an „LLM agents“.' }] } } },
    { 'L1.md': 'In `README.md` steht ein Kommentar an „LLM agents“. Mehr nicht.\n' }, { fixtures: false });
  const ri = runEvalCli(inner.args);
  assert.equal(ri.code, 0, ri.stdout);
  assert.deepEqual(ri.json.kriterien.map((x) => [x.beleg_art, x.ergebnis, x.status_geprueft]), [['zitat', 'verifiziert', 'erfuellt']]);

  // A warning alone does not change the exit code.
  const warnOnly = setup(t, { ausgaben: { L1: { kriterien: [{ nr: 1, status: 'erfuellt', zitat: 'Die Garantie ist mindestens einmal' }] } } }, out, { fixtures: false });
  assert.equal(runEvalCli(warnOnly.args).code, 0);

  const bad = setup(t, current([{ kriterium: 'X', status: 'erfuellt', beleg_art: 'zitat' }]), { 'Z1.md': OUTPUT });
  const rb = runEvalCli(bad.args);
  assert.equal(rb.code, 2);
  assert.match(rb.json.error.message, /eval-judgement/);
  const unsafe = setup(t, { ausgaben: { '../x': { kriterien: [{ status: 'erfuellt', beleg: 'fehlt' }] } } }, out, { fixtures: false });
  assert.equal(runEvalCli(unsafe.args).code, 2);
  const missing = setup(t, current([{ kriterium: 'X', status: 'erfuellt', beleg_art: 'fehlt' }]), { 'anders.md': 'x' });
  const rm = runEvalCli(missing.args);
  assert.equal(rm.code, 2);
  assert.match(rm.json.error.message, /Z1\.md fehlt/);
});

/** The four stored judgements with their outputs (copied with hashes from research/e3-runde-2). */
// kriterien: [verifiziert, nicht_gefunden, ohne_beleg, herabgestuft] under the new verdict rule.
const STORED = [
  { name: 'E3 Runde 1 Test', dir: 'e3/laeufe/test', fragmente: [102, 102], reihenfolge: 101, umgekehrt: ['Y613/3'], kriterien: [65, 1, 14, 7] },
  { name: 'E3 Runde 1 Regression', dir: 'e3/laeufe/regression', fragmente: [25, 25], reihenfolge: 24, umgekehrt: ['Y752/1'], kriterien: [15, 1, 0, 1] },
  { name: 'E3 Runde 1 Select', dir: 'e3/laeufe/select', fragmente: [55, 49], reihenfolge: 49, umgekehrt: [], kriterien: [32, 4, 4, 4] },
  { name: 'M4-Pilot', dir: 'eval-runs/m4', fragmente: [85, 66], reihenfolge: 65, umgekehrt: ['X896/1'], kriterien: [41, 18, 1, 15] },
];

// Prototype counts 101/101, 25/25, 49/55, 66/83 plus evidence texts whose inner quotations yield no fragment and are
// therefore checked as a whole (test +1 fragment: Y695/3; M4 +2).
test('SLV0-FALL-51 equality with the quote check: prototype counts plus whole-text fallback; three quotes joined in reverse order', (t) => {
  const { root, herkunft } = materializeBundle(t, 'zitatpruefung-e3-m4');
  t.diagnostic(`Bundle ${herkunft.branch}@${herkunft.commit.slice(0, 12)}`);
  const snapshot = () => [...readTree(root).entries()].map(([p, e]) => [p, e.buf.toString('base64')]);
  const before = snapshot();
  for (const s of STORED) {
    const base = path.join(root, 'research', 'skills-meta-prompting', ...s.dir.split('/'));
    const r = runEvalCli(['judge', 'check', path.join(base, 'bewertung-blind.json'), '--outputs', path.join(base, 'blind')]);
    assert.equal(r.code, 1, `${s.name}: ${r.stderr}`);
    const f = r.json.zaehlung.fragmente;
    assert.deepEqual([f.gesamt, f.gefunden], s.fragmente, s.name);
    assert.equal(f.in_reihenfolge, s.reihenfolge, s.name);
    // The deviation from the prototype is exactly the quotes whose fragments all exist but in reverse order.
    const reversed = r.json.kriterien.filter((k) => k.ergebnis === 'nicht_gefunden' && k.fragmente.gefunden === k.fragmente.gesamt).map((k) => `${k.ausgabe}/${k.nr}`);
    assert.deepEqual(reversed, s.umgekehrt, s.name);
    const z = r.json.zaehlung;
    assert.deepEqual([z.verifiziert, z.nicht_gefunden, z.ohne_beleg, z.herabgestuft], s.kriterien, s.name);
    t.diagnostic(`${s.name}: Fragmente ${f.gefunden}/${f.gesamt} (in Reihenfolge ${f.in_reihenfolge}); Kriterien ${z.kriterien}: verifiziert ${z.verifiziert}, nicht gefunden ${z.nicht_gefunden}, ohne Beleg ${z.ohne_beleg}; erfuellt ${z.status_angegeben.erfuellt} → ${z.status_geprueft.erfuellt}, herabgestuft ${z.herabgestuft}`);
    const down = r.json.kriterien.filter((k) => k.status === 'erfuellt' && k.status_geprueft === 'unklar').map((k) => `${k.ausgabe}/${k.nr}:${k.beleg_art}:${k.ergebnis}`);
    t.diagnostic(`${s.name}: herabgestuft ${down.join(' ')}`);
  }
  assert.deepEqual(snapshot(), before, 'judge check is read-only');
});
