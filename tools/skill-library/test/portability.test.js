// Portability and encoding rules SLV0-VAL-08/-09/-10/-14 (SLV0-FALL-11, -13, -14, -15, -17).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makePackage, defaultFiles, runCli, codes, trySymlink, NEEDS_SYMLINKS, OPENAI_YAML } from './helpers.js';
import { validatePackage, FILE_MAX_BYTES } from '../lib/package.js';

test('SLV0-FALL-11 symlink references/a.md → /etc/passwd: symlink_in_package, no hash', NEEDS_SYMLINKS, (t) => {
  const dir = makePackage('demo');
  if (!trySymlink('/etc/passwd', path.join(dir, 'references', 'a.md'))) { t.skip('Symlink nicht erlaubt'); return; }
  const r = runCli(['validate', '--scope', 'package', dir]);
  assert.equal(r.code, 1);
  assert.deepEqual(codes(r.json.messages), ['symlink_in_package']);
  assert.equal(r.json.messages[0].path, 'demo/references/a.md');
  assert.equal(r.json.packages[0].content_hash, null);
});

test('SLV0-FALL-11 directory symlink to itself and ELOOP link: terminates, symlink_in_package', NEEDS_SYMLINKS, (t) => {
  const dir = makePackage('demo');
  if (!trySymlink('.', path.join(dir, 'references', 'self'))) { t.skip('Symlink nicht erlaubt'); return; }
  trySymlink('loop', path.join(dir, 'references', 'loop'));
  const r = runCli(['validate', '--scope', 'package', dir]);
  assert.equal(r.code, 1);
  assert.deepEqual(codes(r.json.messages), ['symlink_in_package', 'symlink_in_package']);
  assert.equal(r.json.packages[0].content_hash, null);
  const h = runCli(['hash', '--scope', 'package', dir]);
  assert.equal(h.code, 1);
  assert.equal(h.json.packages[0].content_hash, null);
});

test('SLV0-FALL-11 package folder itself a symlink: symlink_in_package', NEEDS_SYMLINKS, (t) => {
  const real = makePackage('demo');
  const link = path.join(path.dirname(real), 'linked');
  if (!trySymlink(real, link)) { t.skip('Symlink nicht erlaubt'); return; }
  const res = validatePackage(link);
  assert.deepEqual(codes(res.messages), ['symlink_in_package']);
  assert.equal(res.content_hash, null);
});

test('SLV0-FALL-13 CRLF, BOM, invalid UTF-8 sequence', () => {
  const crlf = validatePackage(makePackage('demo', { ...defaultFiles('demo'), 'references/work.md': '# Arbeit\r\n\r\nText\r\n' }));
  assert.deepEqual(codes(crlf.messages), ['line_endings_crlf']);
  assert.equal(crlf.messages[0].line, 1);
  const bom = validatePackage(makePackage('demo', { ...defaultFiles('demo'), 'references/work.md': '﻿# Arbeit\n' }));
  assert.deepEqual(codes(bom.messages), ['bom_present']);
  const bad = Buffer.concat([Buffer.from('# Arbeit\nZeile zwei \xff\n', 'latin1')]);
  const enc = validatePackage(makePackage('demo', { ...defaultFiles('demo'), 'references/work.md': bad }));
  assert.deepEqual(codes(enc.messages), ['encoding_invalid']);
  assert.equal(enc.messages[0].line, 2);
  for (const r of [crlf, bom, enc]) assert.equal(r.content_hash, null);
});

test('SLV0-FALL-13 overlong, surrogate and truncated UTF-8 are invalid; agents/openai.yaml is checked', () => {
  for (const bytes of [[0xc0, 0x80], [0xed, 0xa0, 0x80], [0xe2, 0x82], [0xf4, 0x90, 0x80, 0x80]]) {
    const res = validatePackage(makePackage('demo', { ...defaultFiles('demo'), 'agents/openai.yaml': Buffer.from([0x61, ...bytes, 0x0a]) }));
    assert.deepEqual(codes(res.messages), ['encoding_invalid'], JSON.stringify(bytes));
  }
  const crlfYaml = validatePackage(makePackage('demo', { ...defaultFiles('demo'), 'agents/openai.yaml': OPENAI_YAML.replace(/\n/g, '\r\n') }));
  assert.deepEqual(codes(crlfYaml.messages), ['line_endings_crlf']);
});

test('SLV0-FALL-14 scripts/run.sh, assets/x.png, .DS_Store, executable SKILL.md', () => {
  const dir = makePackage('demo', {
    ...defaultFiles('demo'),
    'scripts/run.sh': '#!/bin/sh\necho x\n',
    'assets/x.png': Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    '.DS_Store': 'x',
  });
  fs.chmodSync(path.join(dir, 'SKILL.md'), 0o755);
  const r = runCli(['validate', '--scope', 'package', dir]);
  assert.equal(r.code, 1);
  assert.deepEqual(codes(r.json.messages).sort(), ['entry_unsupported', 'entry_unsupported', 'executable_content', 'hidden_file']);
  assert.equal(r.json.packages[0].content_hash, null);
});

test('SLV0-VAL-08 only agents/openai.yaml is allowed under agents/', () => {
  const res = validatePackage(makePackage('demo', { ...defaultFiles('demo'), 'agents/other.yaml': 'a: b\n' }));
  assert.deepEqual(codes(res.messages), ['entry_unsupported']);
});

test('SLV0-FALL-15 references/A.md and references/a.md: case_collision', (t) => {
  const files = { ...defaultFiles('demo'), 'references/A.md': '# A\n', 'references/a.md': '# a\n' };
  files['SKILL.md'] = files['SKILL.md'].replace('\n# Titel', '\n# Titel\n\n[x](references/A.md) [y](references/a.md)');
  const dir = makePackage('demo', files);
  const names = fs.readdirSync(path.join(dir, 'references'));
  if (!names.includes('A.md') || !names.includes('a.md')) {
    t.skip('Dateisystem unterscheidet Groß-/Kleinschreibung nicht; Kollision nicht konstruierbar');
    return;
  }
  const res = validatePackage(dir);
  assert.deepEqual(codes(res.messages), ['case_collision']);
  assert.equal(res.content_hash, null);
});

test('SLV0-FALL-15 file name ü.md: path_not_portable', () => {
  const files2 = { ...defaultFiles('demo'), 'references/ü.md': '# Ü\n' };
  files2['SKILL.md'] = files2['SKILL.md'].replace('\n# Titel', '\n# Titel\n\n[ü](references/ü.md)');
  const res2 = validatePackage(makePackage('demo', files2));
  assert.deepEqual(codes(res2.messages), ['path_not_portable']);
  assert.equal(res2.content_hash, null);
});

test('SLV0-FALL-17 file with 1 MiB + 1 byte: file_too_large, no hash', () => {
  const big = Buffer.alloc(FILE_MAX_BYTES + 1, 0x61);
  const files = { ...defaultFiles('demo'), 'references/gross.md': big };
  files['SKILL.md'] = files['SKILL.md'].replace('\n# Titel', '\n# Titel\n\n[g](references/gross.md)');
  const r = runCli(['validate', '--scope', 'package', makePackage('demo', files)]);
  assert.equal(r.code, 1);
  assert.ok(codes(r.json.messages).includes('file_too_large'));
  assert.equal(r.json.packages[0].content_hash, null);
  // Exactly 1 MiB is not "too large" (only budget warnings).
  const files2 = { ...files, 'references/gross.md': Buffer.alloc(FILE_MAX_BYTES, 0x61) };
  const r2 = runCli(['validate', '--scope', 'package', makePackage('demo', files2)]);
  assert.equal(r2.code, 0);
  assert.ok(!codes(r2.json.messages).includes('file_too_large'));
});
