// Expected findings with 1:1 assignment and over-reporting (SLV0-EVAL-26/-27, SLV0-FALL-58/-59).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { tmp, writeJson, writeTree, runEvalCli } from './eval-helpers.js';
import { readTree } from '../lib/eval/tree.js';
import { splitUnits } from '../lib/eval/findings.js';

function caseWith(root, caseObj, fixture, outputs) {
  const dir = path.join(root, caseObj.id);
  writeTree(path.join(dir, 'fixture'), fixture);
  writeJson(dir, 'fall.json', caseObj);
  writeTree(path.join(root, 'out'), outputs);
  return dir;
}

const snapshotOf = (dir) => [...readTree(dir).entries()].map(([p, e]) => [p, e.kind === 'file' ? e.buf.toString('base64') : e.target]);

test('SLV0-EVAL-26 units: paragraphs, list items, table rows and headings', () => {
  const units = splitUnits('# Titel\nText eins\nweiter\n\n- Punkt a\n  Fortsetzung\n- Punkt b\n| x | y |\n|---|---|\n1. Erstens\n**fett** bleibt Absatz\n');
  assert.deepEqual(units.map((u) => [u.nr, u.zeile, u.text.split('\n').length]), [[1, 1, 1], [2, 2, 2], [3, 5, 2], [4, 7, 1], [5, 8, 1], [6, 9, 1], [7, 10, 2]]);
});

test('SLV0-FALL-58 findings: critical first, one unit per finding and one finding per unit, all token groups, alternatives, location file, word boundaries, prefix', (t) => {
  const root = tmp(t);
  const dir = caseWith(root, {
    id: 'F-58', prompt: 'p', erwartete_befunde: [
      { id: 'B-NORM', token_gruppen: [['precision']] },
      { id: 'B-KRIT', token_gruppen: [['präzision', 'precision'], ['9']], fundstelle_datei: 'vendor/geo/geohash.js', gewicht: 'kritisch' },
      { id: 'B-ZWEI', token_gruppen: [['docs/'], ['löschen', 'delete']] },
      { id: 'B-FEHLT', token_gruppen: [['lizenz'], ['mit']], gewicht: 'kritisch' },
      { id: 'B-JAHR', token_gruppen: [['17']] },
      { id: 'B-ORT', token_gruppen: [['standard']], fundstelle_datei: 'README.md' },
      { id: 'B-PRAEFIX', token_gruppen: [['verdoppel*']] },
      { id: 'B-OHNE-STERN', token_gruppen: [['verdoppel']] },
    ],
  }, { 'vendor/geo/geohash.js': 'a\nb\nconst precision = 9;\n', 'README.md': '# geo\n' }, {
    'A1.md': [
      '# Befunde',
      '',
      '- Die Standardpräzision ist 9 Zeichen; `precision` lässt sich setzen (`vendor/geo/geohash.js:3`).',
      '- Die Issue-Vorlage fordert, `docs/` zu löschen.',
      '',
      'Ein zweiter Absatz fordert ebenfalls, docs/ zu löschen.',
      '',
      'Die Lizenz steht nur im README. Seit 2017 unverändert.',
      'Die Wartezeit verdoppelt sich. Standard ist 5.',
      '',
    ].join('\n'),
  });
  const before = snapshotOf(root);
  const r = runEvalCli(['findings', '--case', dir, path.join(root, 'out', 'A1.md')]);
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.deepEqual([r.json.erwartete_befunde, r.json.kritisch], [8, 2]);
  const a = r.json.ausgaben[0];
  assert.equal(a.ausgabe, 'A1.md');
  assert.deepEqual(a.getroffen, [
    { id: 'B-KRIT', gewicht: 'kritisch', einheit: 2, zeile: 3 },
    { id: 'B-ZWEI', gewicht: 'normal', einheit: 3, zeile: 4 },
    { id: 'B-PRAEFIX', gewicht: 'normal', einheit: 5, zeile: 8 },
  ]);
  assert.deepEqual(a.verfehlt, ['B-NORM', 'B-FEHLT', 'B-JAHR', 'B-ORT', 'B-OHNE-STERN']);
  assert.deepEqual(a.kritisch_verfehlt, ['B-FEHLT']);
  assert.deepEqual(a.zaehlung, { getroffen: 3, verfehlt: 5, kritisch_verfehlt: 1, ueberberichtungen: 0 });
  assert.deepEqual(snapshotOf(root), before);
  // A second unit for the normal finding lets both be assigned (maximum matching).
  writeTree(path.join(root, 'out'), { 'A2.md': '- precision 9 in vendor/geo/geohash.js\n- precision noch einmal\n' });
  const r2 = runEvalCli(['findings', '--case', dir, path.join(root, 'out', 'A2.md')]);
  assert.deepEqual(r2.json.ausgaben[0].getroffen.map((g) => [g.id, g.einheit]), [['B-NORM', 2], ['B-KRIT', 1]]);
  assert.equal(runEvalCli(['findings', '--case', dir, path.join(root, 'out', 'fehlt.md')]).code, 2);
  assert.equal(runEvalCli(['findings', '--case', dir]).code, 2);
});

test('SLV0-FALL-59 over-reporting: missing path, line beyond the end, range, file name only, known and unknown commits; nothing written', (t) => {
  const root = tmp(t);
  const dir = caseWith(root, { id: 'F-59', prompt: 'p' }, {
    'vendor/a.py': 'l1\nl2\nl3\nl4\nl5\n',
    'vendor/README.md': 'Release-Commit 3f9c2ab1d4e5f60718293a4b5c6d7e8f90a1b2c3 (v1.0)\n',
  }, {
    'U1.md': [
      'Fundstellen: `vendor/a.py:3` und vendor/fehlt.py:1.',
      'Hinter dem Ende: a.py:99 sowie [Bereich](vendor/a.py#L2-L40).',
      'Nur Dateiname a.py:2 ist in Ordnung, ./vendor/a.py:5 auch.',
      'Commit 3f9c2ab ist bekannt, Commit `1234abc5` nicht.',
      'Hexwort deadbeefcafe ohne Ziffer; URL https://example.com:8443/x.py:3 und http://host.example:80.',
    ].join('\n'),
  });
  const before = snapshotOf(root);
  const r = runEvalCli(['findings', '--case', dir, path.join(root, 'out', 'U1.md')]);
  assert.equal(r.code, 0, r.stdout + r.stderr);
  const a = r.json.ausgaben[0];
  assert.deepEqual(a.ueberberichtungen.map((u) => [u.grund, u.verweis, u.zeile, u.code, u.rule]), [
    ['pfad_fehlt', 'vendor/fehlt.py:1', 1, 'ueberberichtung', 'SLV0-EVAL-27'],
    ['zeile_ausserhalb', 'a.py:99', 2, 'ueberberichtung', 'SLV0-EVAL-27'],
    ['zeile_ausserhalb', 'vendor/a.py#L2-L40', 2, 'ueberberichtung', 'SLV0-EVAL-27'],
    ['commit_unbekannt', '1234abc5', 4, 'ueberberichtung', 'SLV0-EVAL-27'],
  ]);
  assert.deepEqual([a.zaehlung.getroffen, a.zaehlung.verfehlt, a.zaehlung.ueberberichtungen], [0, 0, 4]);
  assert.deepEqual(r.json.messages, []);
  assert.deepEqual(snapshotOf(root), before);
});
