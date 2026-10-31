// Citation coverage at a commit (SLV0-EVAL-28…30, SLV0-FALL-60…65). Every test builds a synthetic
// Git repository in a temporary directory (removed afterwards); the tool only reads it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmp, writeTree, runEvalCli, codesOf } from './eval-helpers.js';
import { scopeMatcher } from '../lib/eval/citecheck.js';

const GIT_OK = spawnSync('git', ['--version'], { encoding: 'utf8' }).status === 0;
const NEEDS_GIT = { skip: GIT_OK ? false : 'git nicht verfügbar' };
const GIT_ENV = {
  ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.invalid', GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.invalid',
  GIT_AUTHOR_DATE: '2026-10-31T12:00:00Z', GIT_COMMITTER_DATE: '2026-10-31T12:00:00Z',
};
const UNKNOWN = '0123456789abcdef0123456789abcdef01234567';
const BASE = 'https://github.com/o/r/blob';

function git(repo, args) {
  const r = spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8', env: GIT_ENV });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}

function commitAll(repo, msg) {
  git(repo, ['add', '-A']);
  git(repo, ['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', msg]);
  return git(repo, ['rev-parse', 'HEAD']);
}

/** C1: src/a.js (5 lines), src/b.js (3), docs/guide.md (2), README.md (1); C2 adds src/neu.js and changes README.md. */
function citeRepo(t) {
  const root = tmp(t, 'slv0-cite-');
  const repo = path.join(root, 'repo');
  writeTree(repo, {
    'src/a.js': 'a1\na2\na3\na4\na5\n',
    'src/b.js': 'b1\nb2\nb3',
    'docs/guide.md': '# Guide\nText\n',
    'README.md': 'Demo\n',
  });
  git(repo, ['init', '-q']);
  const c1 = commitAll(repo, 'c1');
  writeTree(repo, { 'src/neu.js': 'n1\n', 'README.md': 'Demo\nzwei\n' });
  const c2 = commitAll(repo, 'c2');
  const reports = path.join(root, 'reports');
  fs.mkdirSync(reports);
  const report = (name, lines) => writeTree(reports, { [name]: `${lines.join('\n')}\n` }) && path.join(reports, name);
  return { root, repo, c1, c2, report };
}

const cite = (repo, commit, report, extra = []) => runEvalCli(['cite-check', '--repo', repo, '--commit', commit, report, ...extra]);

/** Git state that must not change: HEAD, refs, index bytes, porcelain status. */
function gitState(repo) {
  return {
    head: git(repo, ['rev-parse', 'HEAD']),
    refs: git(repo, ['for-each-ref']),
    index: fs.readFileSync(path.join(repo, '.git', 'index')).toString('hex'),
    status: git(repo, ['--no-optional-locks', 'status', '--porcelain', '--ignored']),
  };
}

test('SLV0-EVAL-28 scopes: prefix with and without trailing slash, globs with *, ** and ?', () => {
  const m = (s, p) => scopeMatcher(s)(p);
  assert.ok(m('src', 'src/a.js') && m('src/', 'src/x/y.js') && m('src/a.js', 'src/a.js'));
  assert.ok(!m('src', 'srcx/a.js') && !m('src/a.js', 'src/a.jsx'));
  assert.ok(m('**/*.md', 'README.md') && m('**/*.md', 'docs/x/guide.md') && !m('**/*.md', 'src/a.js'));
  assert.ok(m('src/*.js', 'src/a.js') && !m('src/*.js', 'src/x/a.js') && m('src/**', 'src/x/a.js'));
  assert.ok(m('src/?.js', 'src/a.js') && !m('src/?.js', 'src/ab.js'));
  assert.ok(m('docs/*/', 'docs/x/a.md') && !m('docs/*/', 'docs/a.md'));
  for (const bad of ['../x', '/etc', 'a\\b', 'a//b', './a', '']) assert.throws(() => scopeMatcher(bad), /--scope/);
});

test('SLV0-FALL-60 cite-check: permalinks and references cover every file; ranges merged; whole-file permalink; abbreviated commit', NEEDS_GIT, (t) => {
  const { repo, c1, report } = citeRepo(t);
  const file = report('voll.md', [
    '# Bericht',
    `- Einstieg [a.js](${BASE}/${c1}/src/a.js#L2-L4) und [Kopf](${BASE}/${c1}/src/a.js#L1).`,
    '- Hilfsfunktion in `src/b.js:1-3`.',
    '- Anleitung: guide.md:2',
    `- README: ${BASE}/${c1.slice(0, 10)}/README.md.`,
  ]);
  const r = cite(repo, c1.slice(0, 12), file);
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.equal(r.json.command, 'eval cite-check');
  assert.equal(r.json.commit, c1);
  assert.equal(r.json.bericht, 'voll.md');
  assert.deepEqual(r.json.messages, []);
  assert.equal(r.json.abdeckung, '4 von 4 Dateien belegt; nicht belegt: keine');
  assert.deepEqual(r.json.belegt, [
    { pfad: 'README.md', zeilen: 1, bereiche: [[1, 1]], zeilen_belegt: 1, zitate: 1 },
    { pfad: 'docs/guide.md', zeilen: 2, bereiche: [[2, 2]], zeilen_belegt: 1, zitate: 1 },
    { pfad: 'src/a.js', zeilen: 5, bereiche: [[1, 4]], zeilen_belegt: 4, zitate: 2 },
    { pfad: 'src/b.js', zeilen: 3, bereiche: [[1, 3]], zeilen_belegt: 3, zitate: 1 },
  ]);
  assert.deepEqual(r.json.nicht_belegt, []);
  assert.deepEqual(r.json.zaehlung, {
    register: 4, belegt: 4, nicht_belegt: 0, zitate: 5, gueltig: 5, ungueltig: 0, ausserhalb_bereich: 0, fremd: 0, commit_woerter: 0, commit_woerter_unbekannt: 0,
  });
  const readme = r.json.zitate.find((z) => z.pfad === 'README.md');
  assert.deepEqual([readme.art, readme.zeile, readme.von, readme.bis, readme.verweis], ['permalink', 5, null, null, `${BASE}/${c1.slice(0, 10)}/README.md`]);
  assert.deepEqual(r.json.zitate.find((z) => z.pfad === 'docs/guide.md').art, 'fundstelle');
  // SLV0-INV-03: same input, same bytes.
  assert.equal(cite(repo, c1.slice(0, 12), file).stdout, r.stdout);
});

test('SLV0-FALL-61 cite-check: unknown commit, another commit and a branch ref are reported; unknown --commit refuses', NEEDS_GIT, (t) => {
  const { repo, c1, c2, report } = citeRepo(t);
  const file = report('sha.md', [
    `[x](${BASE}/${UNKNOWN}/src/a.js#L1)`,
    `[y](${BASE}/${c2}/src/a.js#L1)`,
    `[z](${BASE}/main/src/a.js#L1)`,
    'Gültig: src/b.js:2',
  ]);
  const r = cite(repo, c1, file);
  assert.equal(r.code, 1, r.stdout + r.stderr);
  assert.deepEqual(codesOf(r.json), ['commit_unknown', 'sha_mismatch', 'ref_not_pinned']);
  assert.deepEqual(r.json.messages.map((m) => [m.line, m.rule, m.severity]), [[1, 'SLV0-EVAL-29', 'error'], [2, 'SLV0-EVAL-29', 'error'], [3, 'SLV0-EVAL-29', 'error']]);
  assert.deepEqual(r.json.belegt.map((b) => b.pfad), ['src/b.js']);
  assert.ok(r.json.nicht_belegt.includes('src/a.js'));
  assert.equal(r.json.zaehlung.ungueltig, 3);

  const refused = cite(repo, '0123456', file);
  assert.equal(refused.code, 1, refused.stdout);
  assert.equal(refused.json.refused, true);
  assert.deepEqual(codesOf(refused.json), ['commit_unknown']);
  assert.equal(refused.json.zaehlung, undefined);
});

test('SLV0-FALL-62 cite-check: ranges past the end of file, line 0 and reversed ranges are reported and cover nothing', NEEDS_GIT, (t) => {
  const { repo, c1, report } = citeRepo(t);
  const file = report('bereich.md', [
    'src/b.js:4',
    `${BASE}/${c1}/src/a.js#L4-L6`,
    'src/a.js:0',
    'src/a.js:3-2',
    'src/a.js:5',
  ]);
  const r = cite(repo, c1, file);
  assert.equal(r.code, 1, r.stdout + r.stderr);
  assert.deepEqual(codesOf(r.json), ['range_out_of_bounds', 'range_out_of_bounds', 'range_out_of_bounds', 'range_out_of_bounds']);
  assert.deepEqual(r.json.messages.map((m) => m.line), [1, 2, 3, 4]);
  assert.deepEqual(r.json.belegt, [{ pfad: 'src/a.js', zeilen: 5, bereiche: [[5, 5]], zeilen_belegt: 1, zitate: 1 }]);
  assert.ok(r.json.nicht_belegt.includes('src/b.js'));
});

test('SLV0-FALL-63 cite-check: files missing at the commit and ambiguous path ends are reported', NEEDS_GIT, (t) => {
  const { repo, c1, report } = citeRepo(t);
  const file = report('pfad.md', ['Neu: src/neu.js:1', `Fehlt: ${BASE}/${c1}/src/fehlt.js#L1`]);
  const r = cite(repo, c1, file);
  assert.equal(r.code, 1, r.stdout + r.stderr);
  assert.deepEqual(codesOf(r.json), ['path_missing', 'path_missing']);
  assert.equal(r.json.zaehlung.belegt, 0);

  writeTree(repo, { 'lib/a.js': 'x\n' });
  const c3 = commitAll(repo, 'c3');
  const amb = report('mehrdeutig.md', ['a.js:1', 'src/a.js:1']);
  const r3 = cite(repo, c3, amb);
  assert.equal(r3.code, 1, r3.stdout);
  assert.deepEqual(codesOf(r3.json), ['path_ambiguous']);
  assert.equal(r3.json.messages[0].line, 1);
  assert.deepEqual(r3.json.belegt.map((b) => b.pfad), ['src/a.js']);
  // Exists at C3 (src/neu.js) but not at C1: the commit decides.
  assert.equal(cite(repo, c3, path.join(path.dirname(amb), 'pfad.md')).json.zitate[0].ergebnis, 'gueltig');
});

test('SLV0-FALL-64 cite-check: uncovered files are listed; scopes restrict the register; out-of-scope and foreign citations cover nothing', NEEDS_GIT, (t) => {
  const { repo, c1, report } = citeRepo(t);
  const file = report('teil.md', ['Belegt: src/a.js:1-5 und README.md:1', `Fremd: ${BASE.replace('/o/r/', '/other/repo/')}/${UNKNOWN}/x.js#L9`]);

  const all = cite(repo, c1, file, ['--github', 'O/R']);
  assert.equal(all.code, 0, all.stdout + all.stderr);
  assert.equal(all.json.abdeckung, '2 von 4 Dateien belegt; nicht belegt: docs/guide.md, src/b.js');
  assert.deepEqual(all.json.nicht_belegt, ['docs/guide.md', 'src/b.js']);
  assert.deepEqual([all.json.zaehlung.fremd, all.json.zaehlung.gueltig], [1, 2]);
  assert.equal(all.json.zitate.find((z) => z.art === 'permalink').ergebnis, 'fremd');

  const src = cite(repo, c1, file, ['--scope', 'src/', '--github', 'o/r']);
  assert.equal(src.code, 0, src.stdout);
  assert.deepEqual(src.json.bereich, ['src/']);
  assert.equal(src.json.abdeckung, '1 von 2 Dateien belegt; nicht belegt: src/b.js');
  assert.equal(src.json.zaehlung.ausserhalb_bereich, 1);
  assert.equal(src.json.zitate.find((z) => z.pfad === 'README.md').ergebnis, 'ausserhalb_bereich');

  const md = cite(repo, c1, file, ['--scope', '**/*.md', '--github', 'o/r']);
  assert.equal(md.json.abdeckung, '1 von 2 Dateien belegt; nicht belegt: docs/guide.md');
  assert.deepEqual(md.json.belegt.map((b) => b.pfad), ['README.md']);

  // Fail closed: a scope without a match or an unsafe scope is a usage error.
  assert.equal(cite(repo, c1, file, ['--scope', 'fehlt/']).code, 2);
  assert.equal(cite(repo, c1, file, ['--scope', '../x']).code, 2);
  // Without --github, the foreign permalink is checked against this repository.
  const unscoped = cite(repo, c1, file);
  assert.equal(unscoped.code, 1);
  assert.deepEqual(codesOf(unscoped.json), ['commit_unknown']);
});

test('SLV0-FALL-65 cite-check: commit words are looked up in Git; usage errors; repository and report stay unchanged', NEEDS_GIT, (t) => {
  const { root, repo, c1, c2, report } = citeRepo(t);
  const file = report('commits.md', [
    `Stand ${c2.slice(0, 12)}; Hash ab12cd34ef ist kein Commit.`,
    `Permalink-SHA zählt nicht als Wort: ${BASE}/${c1}/src/a.js#L1`,
    'Ohne Ziffer: deadbeef.',
  ]);
  const before = { git: gitState(repo), report: fs.readFileSync(file, 'utf8') };
  const r = cite(repo, c1, file);
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.deepEqual(r.json.commit_woerter, [
    { wort: c2.slice(0, 12), zeile: 1, commit: c2 },
    { wort: 'ab12cd34ef', zeile: 1, commit: null },
  ]);
  assert.deepEqual(r.json.messages.map((m) => [m.code, m.severity, m.line]), [['commit_unverified', 'warning', 1]]);

  const noGit = path.join(root, 'kein-git');
  fs.mkdirSync(noGit);
  assert.equal(cite(noGit, c1, file).code, 2);
  assert.equal(cite(repo, 'HEAD', file).code, 2);
  assert.equal(cite(repo, c1, path.join(root, 'fehlt.md')).code, 2);
  assert.equal(runEvalCli(['cite-check', '--repo', repo, '--commit', c1, file, file]).code, 2);
  assert.equal(runEvalCli(['cite-check', '--commit', c1, file]).code, 2);
  assert.equal(cite(path.join(root, 'nicht-da'), c1, file).code, 2);
  assert.deepEqual({ git: gitState(repo), report: fs.readFileSync(file, 'utf8') }, before);
});
