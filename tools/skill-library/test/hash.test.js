// Hash profile sl-hash-v0 and determinism (SLV0-PKG-20…23, SLV0-INV-03; FALL-20, -21, -22).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeRepo, defaultFiles, writeFiles, tempDir, runCli, NEEDS_SYMLINKS, makePackage } from './helpers.js';
import { canonicalJson, compareCodepoints } from '../lib/core.js';

test('SLV0-FALL-20 byte-identical output: other creation order, mtime and working directory', NEEDS_SYMLINKS, () => {
  const pk = {
    alpha: { ...defaultFiles('alpha'), 'references/zwei.md': '# Zwei\n' },
    beta: defaultFiles('beta'),
  };
  pk.alpha['SKILL.md'] = pk.alpha['SKILL.md'].replace('\n# Titel', '\n# Titel\n\n[z](references/zwei.md)\n[weg](references/work.md#fehlt)');
  const repo1 = makeRepo(pk);
  // Second repo: packages and files created in reverse order, different mtimes.
  const repo2 = tempDir('slv0-repo-');
  fs.mkdirSync(path.join(repo2, '.claude', 'skills'), { recursive: true });
  for (const name of Object.keys(pk).reverse()) {
    const dir = path.join(repo2, '.agents', 'skills', name);
    fs.mkdirSync(dir, { recursive: true });
    writeFiles(dir, pk[name], Object.keys(pk[name]).reverse());
    for (const rel of Object.keys(pk[name])) {
      fs.utimesSync(path.join(dir, ...rel.split('/')), new Date('2001-02-03T04:05:06Z'), new Date('2001-02-03T04:05:06Z'));
    }
  }
  for (const name of Object.keys(pk).reverse()) fs.symlinkSync(`../../.agents/skills/${name}`, path.join(repo2, '.claude', 'skills', name));

  const a = runCli(['validate', '--scope', 'project', '--root', repo1], { cwd: repo1 });
  const b = runCli(['validate', '--scope', 'project', '--root', repo2], { cwd: tempDir('slv0-cwd-') });
  const c = runCli(['validate', '--scope', 'project', '--root', repo1], { cwd: repo1 });
  assert.equal(a.code, 0);
  assert.equal(a.stdout, b.stdout);
  assert.equal(a.stdout, c.stdout);
  assert.equal(a.json.messages.length, 1); // the anchor warning, to compare a non-empty message list
  const ha = runCli(['hash', '--root', repo1], { cwd: tempDir('slv0-cwd-') });
  const hb = runCli(['hash', '--root', repo2], { cwd: repo2 });
  assert.equal(ha.stdout, hb.stdout);
  // Package scope uses the folder name, never the absolute path.
  const pa = runCli(['validate', '--scope', 'package', path.join(repo1, '.agents', 'skills', 'alpha')]);
  assert.ok(!pa.stdout.includes(repo1));
});

test('SLV0-FALL-21 one byte changed in agents/openai.yaml of one of two packages', NEEDS_SYMLINKS, () => {
  const repo = makeRepo({ eins: defaultFiles('eins'), zwei: defaultFiles('zwei') });
  const before = runCli(['hash', '--root', repo]);
  const yaml = path.join(repo, '.agents', 'skills', 'eins', 'agents', 'openai.yaml');
  const buf = fs.readFileSync(yaml);
  buf[buf.length - 2] = buf[buf.length - 2] === 0x41 ? 0x42 : 0x41;
  fs.writeFileSync(yaml, buf);
  const after = runCli(['hash', '--root', repo]);
  assert.equal(before.code, 0);
  assert.equal(after.code, 0);
  const h = (r, n) => r.json.packages.find((p) => p.name === n).content_hash;
  assert.notEqual(h(before, 'eins'), h(after, 'eins'));
  assert.equal(h(before, 'zwei'), h(after, 'zwei'));
  assert.notEqual(before.json.package_set_hash, after.json.package_set_hash);
});

test('SLV0-FALL-22 package with only SKILL.md: hash equals independently computed value', () => {
  // Expected values computed independently with Python hashlib/json (sort_keys, separators (",",":"),
  // ensure_ascii=False) for exactly this content; see README "Golden-Werte".
  const content = '---\nname: solo\ndescription: Synthetisches Paket nur mit SKILL.md. Nutze bei Test. Nicht für Produktion.\n---\n\n# Solo\n\nKörper.\n';
  const dir = makePackage('solo', { 'SKILL.md': content });
  const r = runCli(['hash', '--scope', 'package', dir]);
  assert.equal(r.code, 0, r.stdout);
  assert.equal(r.json.packages[0].content_hash, '08f5d33fac9a7a0c1abcd084cfea303106cf2e069164a35940f77691914aff4d');
});

test('SLV0-PKG-20 invalid package receives no hash; hash command exits 1 and refuses', () => {
  const files = { ...defaultFiles('demo'), 'scripts/x.sh': 'echo\n' };
  const r = runCli(['hash', '--scope', 'package', makePackage('demo', files)]);
  assert.equal(r.code, 1);
  assert.equal(r.json.packages[0].content_hash, null);
  assert.ok(r.json.refused);
});

test('SLV0-PKG-22 canonical JSON: code point order, no whitespace, non-ASCII unescaped', () => {
  assert.equal(canonicalJson({ b: 1, a: 'ä', '\u{1F600}': 'x', '￿': 'y' }), '{"a":"ä","b":1,"￿":"y","\u{1F600}":"x"}');
  assert.equal(compareCodepoints('￿', '\u{1F600}'), -1); // UTF-16 order would say +1
  assert.equal(canonicalJson({ z: [1, { y: null, x: true }] }), '{"z":[1,{"x":true,"y":null}]}');
});
