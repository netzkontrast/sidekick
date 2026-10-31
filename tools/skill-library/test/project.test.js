// Project scope: adapters (SLV0-VAL-15, FALL-12), project neutrality (SLV0-VAL-11, FALL-18),
// size budgets (SLV0-VAL-13, FALL-16).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeRepo, makePackage, defaultFiles, runCli, codes, NEEDS_SYMLINKS, tempDir, writeFiles } from './helpers.js';

const ADAPTER_CODES = ['adapter_missing', 'adapter_link_invalid', 'adapter_orphaned'];

test('SLV0-FALL-12 adapters: missing, absolute, copy, wrong target, orphaned; none in package scope', NEEDS_SYMLINKS, () => {
  const repo = makeRepo({ a: defaultFiles('a'), b: defaultFiles('b'), c: defaultFiles('c'), d: defaultFiles('d'), y: defaultFiles('y') }, { adapters: false });
  const ad = path.join(repo, '.claude', 'skills');
  // a: missing
  // b: absolute link
  fs.symlinkSync(path.join(repo, '.agents', 'skills', 'b'), path.join(ad, 'b'));
  // c: copy
  writeFiles(path.join(ad, 'c'), defaultFiles('c'));
  // d: points to .agents/skills/y
  fs.symlinkSync('../../.agents/skills/y', path.join(ad, 'd'));
  // y: correct
  fs.symlinkSync('../../.agents/skills/y', path.join(ad, 'y'));
  // z: adapter without package
  fs.symlinkSync('../../.agents/skills/z', path.join(ad, 'z'));

  const r = runCli(['validate', '--scope', 'project', '--root', repo]);
  assert.equal(r.code, 1);
  const got = r.json.messages.map((m) => `${m.code} ${m.path}`);
  assert.deepEqual(got, [
    'adapter_missing .claude/skills/a',
    'adapter_link_invalid .claude/skills/b',
    'adapter_link_invalid .claude/skills/c',
    'adapter_link_invalid .claude/skills/d',
    'adapter_orphaned .claude/skills/z',
  ]);
  // Packages themselves stay valid; the package-set hash is still formed.
  assert.equal(r.json.summary.valid_packages, 5);
  assert.match(r.json.package_set_hash, /^[0-9a-f]{64}$/);

  for (const name of ['a', 'b', 'c', 'd', 'y']) {
    const p = runCli(['validate', '--scope', 'package', path.join(repo, '.agents', 'skills', name)]);
    assert.equal(p.code, 0);
    assert.ok(!codes(p.json.messages).some((c) => ADAPTER_CODES.includes(c)));
  }
});

test('SLV0-FALL-12 adapter escaping the repo and missing .claude/skills folder', NEEDS_SYMLINKS, () => {
  const repo = makeRepo({ a: defaultFiles('a') }, { adapters: false });
  fs.symlinkSync('../../../elsewhere/a', path.join(repo, '.claude', 'skills', 'a'));
  const r = runCli(['validate', '--scope', 'project', '--root', repo]);
  assert.deepEqual(codes(r.json.messages), ['adapter_link_invalid']);
  fs.rmSync(path.join(repo, '.claude'), { recursive: true });
  const r2 = runCli(['validate', '--scope', 'project', '--root', repo]);
  assert.deepEqual(codes(r2.json.messages), ['adapter_missing']);
  assert.equal(r2.code, 1);
});

test('SLV0-VAL-15 stray file in .agents/skills is not a package', NEEDS_SYMLINKS, () => {
  const repo = makeRepo({ a: defaultFiles('a') });
  fs.writeFileSync(path.join(repo, '.agents', 'skills', 'README.md'), '# x\n');
  const r = runCli(['validate', '--scope', 'project', '--root', repo]);
  assert.deepEqual(codes(r.json.messages), ['entry_unsupported']);
  assert.equal(r.json.package_set_hash, null);
});

test('SLV0-FALL-18 project list ["docs/fragen/"]: warning at line 7; without list no message', () => {
  const files = defaultFiles('demo');
  // SKILL.md lines: 1 ---, 2 name, 3 description, 4 ---, 5 empty, 6 # Titel, 7 binding line
  files['SKILL.md'] = files['SKILL.md'].replace('\n# Titel\n', '\n# Titel\nFragen liegen unter docs/fragen/.\n');
  const dir = makePackage('demo', files);
  const listDir = tempDir('slv0-list-');
  const list = path.join(listDir, 'list.json');
  fs.writeFileSync(list, JSON.stringify(['docs/fragen/']));
  const r = runCli(['validate', '--scope', 'package', dir, '--project-list', list]);
  assert.equal(r.code, 0);
  assert.deepEqual(r.json.messages.map((m) => [m.code, m.line, m.severity]), [['project_binding_suspected', 7, 'warning']]);
  assert.equal(r.json.project_list_checked, true);
  const r2 = runCli(['validate', '--scope', 'package', dir]);
  assert.deepEqual(r2.json.messages, []);
  assert.equal(r2.json.project_list_checked, false);
});

test('SLV0-FALL-16 SKILL.md with 600 lines; package with 70 000 bytes: budget_exceeded warnings, exit 0, hash', () => {
  const files = defaultFiles('demo');
  files['SKILL.md'] += 'x\n'.repeat(600);
  const r = runCli(['validate', '--scope', 'package', makePackage('demo', files)]);
  assert.equal(r.code, 0);
  assert.deepEqual(codes(r.json.messages), ['budget_exceeded']);
  assert.match(r.json.messages[0].message, /Zeilen/);
  assert.match(r.json.packages[0].content_hash, /^[0-9a-f]{64}$/);

  const files2 = defaultFiles('demo');
  const parts = {};
  for (let i = 0; i < 5; i += 1) parts[`references/teil${i}.md`] = `${'y'.repeat(13999)}\n`;
  files2['SKILL.md'] = files2['SKILL.md'].replace('\n# Titel', `\n# Titel\n\n${Object.keys(parts).map((p) => `[t](${p})`).join(' ')}`);
  const r2 = runCli(['validate', '--scope', 'package', makePackage('demo', { ...files2, ...parts })]);
  assert.equal(r2.code, 0);
  assert.deepEqual(r2.json.messages.map((m) => [m.code, m.path]), [['budget_exceeded', 'demo']]);
  assert.match(r2.json.messages[0].message, /Paket \d+ Bytes > 65536/);
  assert.match(r2.json.packages[0].content_hash, /^[0-9a-f]{64}$/);
});

test('SLV0-VAL-13 SKILL.md over 8192 bytes and reference over 16384 bytes warn only', () => {
  const files = defaultFiles('demo');
  files['SKILL.md'] += `${'z'.repeat(9000)}\n`;
  files['references/work.md'] += `${'w'.repeat(17000)}\n`;
  const r = runCli(['validate', '--scope', 'package', makePackage('demo', files)]);
  assert.equal(r.code, 0);
  assert.deepEqual(codes(r.json.messages), ['budget_exceeded', 'budget_exceeded']);
});
