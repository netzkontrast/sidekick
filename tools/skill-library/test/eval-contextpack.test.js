// Fail-closed context pack (SLV0-EVAL-31…34, SLV0-FALL-66…72). Every test builds a synthetic file
// tree in a temporary directory (removed afterwards); the tool only reads it, except the bundle
// written to an explicit new path.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { tmp, writeJson, runEvalCli, codesOf } from './eval-helpers.js';
import { schemaErrors } from '../lib/eval/common.js';
import { parsePattern, matchSegments } from '../lib/eval/contextpack.js';

const sha = (data) => createHash('sha256').update(data).digest('hex');

const FILES = {
  'docs/spec.md': '# Spec\n\nRegeln.\n',
  'docs/notes.md': '# Notizen\n',
  'src/a.js': 'export const a = 1;\n',
  'src/lib/b.js': 'export const b = 2;\n',
  'research/kandidaten/K-1/SKILL.md': '---\nname: k\n---\nGEHEIM-KANDIDAT\n',
  '.env': 'TOKEN=geheim\n',
  '.git/config': '[core]\n',
};

function writeFiles(root, files, order = Object.keys(files)) {
  for (const rel of order) {
    const abs = path.join(root, ...rel.split('/'));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, files[rel]);
  }
}

/** Fresh synthetic tree: {base, root, allow(name, muster, extra), pack(allowlist, extra, opts)}. */
function setup(t, { files = FILES, order } = {}) {
  const base = tmp(t, 'slv0-ctx-');
  const root = path.join(base, 'root');
  fs.mkdirSync(root);
  writeFiles(root, files, order);
  const lists = path.join(base, 'lists');
  fs.mkdirSync(lists);
  const allow = (name, muster, extra = {}) => writeJson(lists, name, {
    schema_version: 1, format: 'sl-context-allowlist@1', ziel: 'Synthetischer Test', rolle: 'implementierung',
    eingaben: muster.map((m) => (typeof m === 'string' ? { muster: m } : m)), ...extra,
  });
  const pack = (allowlist, extra = [], opts = {}) => runEvalCli(['context-pack', '--allowlist', allowlist, '--root', root, ...extra], opts);
  return { base, root, lists, allow, pack };
}

/** Paths and bytes of a tree (symlinks by target), to show nothing was changed. */
function treeState(root) {
  const out = [];
  const walk = (rel) => {
    for (const name of fs.readdirSync(path.join(root, rel)).sort()) {
      const r = rel ? `${rel}/${name}` : name;
      const st = fs.lstatSync(path.join(root, r));
      if (st.isSymbolicLink()) out.push(`${r} -> ${fs.readlinkSync(path.join(root, r))}`);
      else if (st.isDirectory()) walk(r);
      else out.push(`${r} ${sha(fs.readFileSync(path.join(root, r)))}`);
    }
  };
  walk('');
  return out;
}

function assertRefused(res, expected) {
  assert.equal(res.code, 1, res.stdout + res.stderr);
  assert.equal(res.json.refused, true);
  assert.equal(res.json.dateien, undefined);
  assert.equal(res.json.kontextpaket_sha256, undefined);
  assert.deepEqual(codesOf(res.json).sort(), [...expected].sort());
}

test('SLV0-FALL-66 deterministic pack hash, codepoint order, overlap, independent hash, estimator', (t) => {
  const muster = ['docs/spec.md', 'src/**/*.js', { muster: 'docs/*.md', wofuer: 'Hintergrund' }];
  const one = setup(t);
  const two = setup(t, { order: Object.keys(FILES).reverse() });
  const r1 = one.pack(one.allow('a.json', muster));
  const r2 = two.pack(two.allow('a.json', muster), [], { cwd: two.base });
  assert.equal(r1.code, 0, r1.stdout + r1.stderr);
  assert.equal(r2.code, 0, r2.stdout + r2.stderr);
  assert.equal(r1.stdout, r2.stdout, 'byte-identical records');
  const rec = r1.json;
  assert.deepEqual(schemaErrors('eval-context-pack', rec), []);
  assert.deepEqual(rec.dateien.map((d) => d.pfad), ['docs/notes.md', 'docs/spec.md', 'src/a.js', 'src/lib/b.js']);
  assert.deepEqual(rec.dateien.find((d) => d.pfad === 'docs/spec.md').muster, [0, 2]);
  assert.deepEqual(rec.muster.map((m) => [m.art, m.dateien, m.wofuer]), [['pfad', 1, null], ['glob', 2, null], ['glob', 2, 'Hintergrund']]);
  for (const d of rec.dateien) {
    assert.equal(d.sha256, sha(FILES[d.pfad]));
    assert.equal(d.bytes, Buffer.byteLength(FILES[d.pfad]));
    assert.equal(d.tokens.quelle, 'unbekannt');
    assert.equal(d.tokens.wert, null);
  }
  // Independent computation of SLV0-PKG-22 over {path: hash}: keys in code point order, no spaces.
  const canonical = `{${rec.dateien.map((d) => `"${d.pfad}":"${sha(FILES[d.pfad])}"`).join(',')}}`;
  assert.equal(rec.kontextpaket_sha256, sha(canonical));
  assert.equal(rec.allowlist.sha256, sha(fs.readFileSync(path.join(one.lists, 'a.json'))));
  assert.deepEqual(rec.sperrliste.filter((s) => s.quelle === 'standard').map((s) => s.muster), ['**/.git', '**/.env*', '**/kandidaten']);
  assert.equal(rec.bundle, null);
  assert.ok(!r1.stdout.includes(one.root), 'no absolute path in the record');

  const est = one.pack(path.join(one.lists, 'a.json'), ['--estimator', 'utf8-bytes-div-4@1']);
  assert.equal(est.code, 0);
  assert.equal(est.json.kontextpaket_sha256, rec.kontextpaket_sha256, 'estimator does not change the pack hash');
  assert.equal(est.json.dateien[0].tokens.quelle, 'geschaetzt');
  assert.equal(est.json.dateien[0].tokens.methode, 'utf8-bytes-div-4@1');
  assert.equal(est.json.summe.tokens.wert, est.json.dateien.reduce((a, d) => a + d.tokens.wert, 0));

  fs.appendFileSync(path.join(one.root, 'src', 'a.js'), ' ');
  const r3 = one.pack(path.join(one.lists, 'a.json'));
  assert.equal(r3.code, 0);
  assert.notEqual(r3.json.kontextpaket_sha256, rec.kontextpaket_sha256);
});

test('SLV0-FALL-67 typo and syntax errors abort instead of selecting everything', (t) => {
  const s = setup(t);
  const cases = [
    ['src/**/*.sj', ['pattern_unmatched']],
    ['docs/spek.md', ['file_missing']],
    ['Docs/spec.md', ['file_missing']],
    ['src/***', ['pattern_invalid']],
    ['**', ['pattern_invalid']],
    ['docs/', ['pattern_invalid']],
    ['docs/[ab].md', ['pattern_invalid']],
    ['!docs/spec.md', ['pattern_invalid']],
  ];
  for (const [i, [bad, codes]] of cases.entries()) {
    const res = s.pack(s.allow(`t${i}.json`, ['docs/spec.md', bad]));
    assertRefused(res, codes);
  }
  const empty = s.pack(s.allow('leer.json', ['docs/spec.md', '']));
  assert.equal(empty.code, 2, 'empty pattern violates the schema');
  // All problems are reported together.
  const all = s.pack(s.allow('alle.json', ['docs/spek.md', 'src/**/*.sj']));
  assertRefused(all, ['file_missing', 'pattern_unmatched']);
});

test('SLV0-FALL-68 forbidden prefixes abort; defaults cannot be removed', (t) => {
  const s = setup(t, { files: { ...FILES, 'research/Kandidaten/x.md': 'X\n', 'research/ok.md': 'ok\n' } });
  const glob = s.pack(s.allow('g.json', ['research/**/*.md']));
  assertRefused(glob, ['path_forbidden', 'path_forbidden']);
  assert.deepEqual(glob.json.messages.map((m) => m.path), ['research/Kandidaten', 'research/kandidaten']);
  assert.match(glob.json.messages[1].message, /\*\*\/kandidaten; 1 Treffer/);
  assertRefused(s.pack(s.allow('e.json', ['docs/spec.md', '.env'])), ['path_forbidden']);
  const git = s.pack(s.allow('git.json', ['.git/config']));
  assertRefused(git, ['path_forbidden']);
  assert.equal(git.json.messages[0].path, '.git');
  assertRefused(s.pack(s.allow('sp.json', ['src/**/*.js'], { sperre: ['src/lib'] })), ['path_forbidden']);
  assertRefused(s.pack(s.allow('d.json', ['docs/*.md']), ['--deny', 'docs/notes.md']), ['path_forbidden']);
  assertRefused(s.pack(s.allow('neg.json', ['research/ok.md'], { sperre: ['!**/kandidaten'] })), ['pattern_invalid']);
  // Without the forbidden hits the same tree packs fine, and the deny sources are recorded.
  const ok = s.pack(s.allow('ok.json', ['research/ok.md'], { sperre: ['src/lib'] }), ['--deny', 'docs/notes.md']);
  assert.equal(ok.code, 0, ok.stdout);
  assert.deepEqual(ok.json.sperrliste.map((x) => x.quelle), ['standard', 'standard', 'standard', 'allowlist', 'aufruf']);
});

test('SLV0-FALL-69 missing file and non-file abort the whole pack', (t) => {
  const s = setup(t);
  assertRefused(s.pack(s.allow('dir.json', ['src'])), ['not_regular_file']);
  assertRefused(s.pack(s.allow('miss.json', ['docs/spec.md', 'docs/fehlt.md'])), ['file_missing']);
  assertRefused(s.pack(s.allow('deep.json', ['docs/spec.md/x.md'])), ['file_missing']);
});

test('SLV0-FALL-70 symlinks, root escapes and nested repositories abort', (t) => {
  const s = setup(t, { files: { ...FILES, 'vendor/x/y.js': 'y\n', 'vendor/x/.git/HEAD': 'ref\n' } });
  const outside = path.join(s.base, 'aussen');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'z.js'), 'z\n');
  fs.symlinkSync('spec.md', path.join(s.root, 'docs', 'link.md'));
  fs.symlinkSync(outside, path.join(s.root, 'src', 'out'));
  fs.symlinkSync('src', path.join(s.root, 'alias'));
  assertRefused(s.pack(s.allow('l.json', ['docs/link.md'])), ['symlink_in_pack']);
  const walk = s.pack(s.allow('w.json', ['src/**/*.js']));
  assertRefused(walk, ['symlink_in_pack']);
  assert.equal(walk.json.messages[0].path, 'src/out');
  assertRefused(s.pack(s.allow('a.json', ['alias/*.js'])), ['symlink_in_pack']);
  assertRefused(s.pack(s.allow('esc.json', ['../aussen/z.js', '/etc/hosts', 'src/../docs/spec.md'])), ['path_escapes_root', 'path_escapes_root', 'path_escapes_root']);
  assertRefused(s.pack(s.allow('n.json', ['vendor/**/*.js'])), ['nested_repository']);
  fs.writeFileSync(path.join(s.root, 'docs', 'bin.md'), Buffer.from([0x23, 0x00, 0x0a]));
  assertRefused(s.pack(s.allow('b.json', ['docs/bin.md'])), ['file_not_text']);
});

/** Split a bundle into its file sections: [{index, pfad, sha256, content}]. */
function parseBundle(text) {
  const lines = text.split('\n');
  const sections = [];
  for (let i = 0; i < lines.length; i += 1) {
    const h = /^## (\d+)\. (`+) ?(.*?) ?\2$/.exec(lines[i]);
    if (!h) continue;
    const meta = /^- sha256: `([0-9a-f]{64})`/.exec(lines[i + 2]);
    const fence = lines[i + 4];
    assert.match(fence, /^`{3,}$/);
    let j = i + 5;
    const body = [];
    while (lines[j] !== fence) { body.push(lines[j]); j += 1; }
    sections.push({ index: Number(h[1]), pfad: h[3], sha256: meta[1], content: `${body.join('\n')}\n` });
    i = j;
  }
  return sections;
}

test('SLV0-FALL-71 Markdown bundle matches the record; never overwritten; no file on error', (t) => {
  const files = { ...FILES, 'docs/code.md': 'Vorher\n```js\nx\n```\nNachher\n', 'docs/ohne.md': 'kein Umbruch am Ende' };
  const s = setup(t, { files });
  const out = path.join(s.base, 'paket.md');
  const al = s.allow('r.json', ['docs/*.md', 'src/a.js']);
  const res = s.pack(al, ['--output', out, '--estimator', 'utf8-bytes-div-4@1']);
  assert.equal(res.code, 0, res.stdout + res.stderr);
  const rec = res.json;
  assert.deepEqual(schemaErrors('eval-context-pack', rec), []);
  const bundle = fs.readFileSync(out);
  assert.deepEqual(rec.bundle, { format: 'sl-context-bundle@1', sha256: sha(bundle), bytes: bundle.length });
  const text = bundle.toString('utf8');
  assert.ok(text.startsWith('# Kontextpaket\n'));
  assert.ok(text.includes(`- Kontextpaket-Hash (sha256, sl-hash-v0): \`${rec.kontextpaket_sha256}\``));
  assert.ok(text.includes('Schätzung utf8-bytes-div-4@1'));
  const sections = parseBundle(text);
  assert.deepEqual(sections.map((x) => x.pfad), rec.dateien.map((d) => d.pfad));
  assert.deepEqual(sections.map((x) => x.index), rec.dateien.map((_, i) => i + 1));
  for (const [i, sec] of sections.entries()) {
    const d = rec.dateien[i];
    assert.equal(sec.sha256, d.sha256);
    const raw = files[d.pfad];
    const extracted = raw.endsWith('\n') ? sec.content : sec.content.slice(0, -1);
    assert.equal(sha(extracted), d.sha256, `content of ${d.pfad}`);
  }
  assert.ok(text.includes('````\nVorher\n```js'), 'fence longer than the backtick run inside');

  const again = s.pack(al, ['--output', out]);
  assertRefused(again, ['output_exists']);
  assert.ok(fs.readFileSync(out).equals(bundle), 'existing bundle unchanged');

  const out2 = path.join(s.base, 'fehler.md');
  assertRefused(s.pack(s.allow('f.json', ['docs/fehlt.md']), ['--output', out2]), ['file_missing']);
  assert.equal(fs.existsSync(out2), false);
});

test('SLV0-FALL-72 usage errors exit 2; a run without --output changes nothing', (t) => {
  const s = setup(t);
  const good = s.allow('g.json', ['docs/spec.md']);
  assert.equal(s.pack(path.join(s.lists, 'fehlt.json')).code, 2);
  fs.writeFileSync(path.join(s.lists, 'kaputt.json'), '{kein json');
  assert.equal(s.pack(path.join(s.lists, 'kaputt.json')).code, 2);
  assert.equal(s.pack(s.allow('leer.json', [])).code, 2);
  assert.equal(s.pack(good, ['--estimator', 'gpt-genau@9']).code, 2);
  assert.equal(runEvalCli(['context-pack', '--allowlist', good, '--root', path.join(s.root, 'docs', 'spec.md')]).code, 2);
  assert.equal(s.pack(good, ['--output', path.join(s.base, 'nicht-da', 'p.md')]).code, 2);
  const before = treeState(s.base);
  const res = s.pack(good);
  assert.equal(res.code, 0);
  assert.deepEqual(treeState(s.base), before);
});

test('SLV0-EVAL-31 pattern syntax and segment matching', () => {
  const m = (p, rel, mode = 'full') => matchSegments(parsePattern(p).segs, rel.split('/'), mode);
  assert.equal(m('docs/**', 'docs/a.md'), true);
  assert.equal(m('docs/**', 'docs/x/y/a.md'), true);
  assert.equal(m('docs/**', 'docs'), false);
  assert.equal(m('a/**/b.md', 'a/b.md'), true);
  assert.equal(m('a/**/b.md', 'a/x/y/b.md'), true);
  assert.equal(m('*.md', '.hidden.md'), true);
  assert.equal(m('src/*.js', 'src/lib/b.js'), false);
  assert.equal(m('src/?.js', 'src/a.js'), true);
  assert.equal(m('src/*/b.js', 'src', 'prefix'), true);
  assert.equal(m('src/*/b.js', 'docs', 'prefix'), false);
  assert.equal(parsePattern('*/*').code, 'pattern_invalid');
  assert.equal(parsePattern('a//b').code, 'pattern_invalid');
  assert.equal(parsePattern('./a').code, 'pattern_invalid');
  assert.equal(parsePattern('a\\b').code, 'pattern_invalid');
  assert.equal(parsePattern('a/\nb').code, 'pattern_invalid');
  assert.equal(parsePattern('C:/x').code, 'path_escapes_root');
  assert.equal(parsePattern('**', { allowWildcardOnly: true }).code, undefined);
  assert.equal(parsePattern('docs/spec.md').glob, false);
});
