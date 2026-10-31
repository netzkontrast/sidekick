// Format rules SLV0-VAL-01…05 (SLV0-FALL-02…07) and the frontmatter subset parser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makePackage, defaultFiles, skillMd, runCli, codes } from './helpers.js';
import { validatePackage } from '../lib/package.js';
import { parseFrontmatter, parseScalar } from '../lib/frontmatter.js';

function withSkillMd(folder, content) {
  return makePackage(folder, { ...defaultFiles(folder), 'SKILL.md': content });
}

test('SLV0-FALL-02 name "grill" in folder "grilling": name_folder_mismatch, exit 1, no hash', () => {
  const dir = withSkillMd('grilling', skillMd('grill'));
  const r = runCli(['validate', '--scope', 'package', dir]);
  assert.equal(r.code, 1);
  assert.deepEqual(codes(r.json.messages), ['name_folder_mismatch']);
  assert.equal(r.json.messages[0].line, 2);
  assert.equal(r.json.packages[0].content_hash, null);
});

test('SLV0-FALL-03 invalid names: uppercase, "--", leading "-", 65 characters', () => {
  const long = 'a'.repeat(65);
  for (const name of ['Grilling', 'a--b', '-ab', long]) {
    const dir = withSkillMd(name.replace(/^-/, 'x'), skillMd(name));
    const res = validatePackage(dir);
    assert.ok(codes(res.messages).includes('name_invalid'), `${name}: ${JSON.stringify(res.messages)}`);
    assert.equal(res.content_hash, null);
  }
  // Boundary: 64 characters is valid.
  const ok = 'b'.repeat(64);
  assert.equal(validatePackage(withSkillMd(ok, skillMd(ok))).valid, true);
});

test('SLV0-FALL-03 missing name field: name_invalid', () => {
  const res = validatePackage(withSkillMd('demo', '---\ndescription: Nur Beschreibung. Nutze bei X. Nicht bei Y.\n---\n\n[A](references/work.md)\n'));
  assert.deepEqual(codes(res.messages), ['name_invalid']);
});

test('SLV0-FALL-04 description empty; 1024 codepoints valid; 1025 codepoints with umlauts too long', () => {
  const empty = validatePackage(withSkillMd('demo', skillMd('demo', { description: '' })));
  assert.deepEqual(codes(empty.messages), ['description_missing']);
  const quotedBlank = validatePackage(withSkillMd('demo', skillMd('demo', { description: '"   "' })));
  assert.deepEqual(codes(quotedBlank.messages), ['description_missing']);
  const exact = 'ä'.repeat(1024);
  const okRes = validatePackage(withSkillMd('demo', skillMd('demo', { description: exact })));
  assert.deepEqual(okRes.messages, []);
  assert.equal(okRes.valid, true);
  const tooLong = validatePackage(withSkillMd('demo', skillMd('demo', { description: 'ü'.repeat(1025) })));
  assert.deepEqual(codes(tooLong.messages), ['description_too_long']);
  // Leading/trailing blanks do not count (quoted to keep them in the scalar).
  const padded = validatePackage(withSkillMd('demo', skillMd('demo', { description: `"  ${'ö'.repeat(1024)}  "` })));
  assert.equal(padded.valid, true);
});

test('SLV0-FALL-04 missing description field: description_missing', () => {
  const res = validatePackage(withSkillMd('demo', '---\nname: demo\n---\n\n[A](references/work.md)\n'));
  assert.deepEqual(codes(res.messages), ['description_missing']);
});

test('SLV0-FALL-05 frontmatter missing; only opening "---"', () => {
  const none = validatePackage(withSkillMd('demo', '# Kein Frontmatter\n\n[A](references/work.md)\n'));
  assert.deepEqual(codes(none.messages), ['frontmatter_missing']);
  const open = validatePackage(withSkillMd('demo', '---\nname: demo\ndescription: x\n\n[A](references/work.md)\n'));
  assert.deepEqual(codes(open.messages), ['frontmatter_missing']);
  assert.equal(open.content_hash, null);
});

test('SLV0-FALL-05 SKILL.md absent: frontmatter_missing', () => {
  const files = defaultFiles('demo');
  delete files['SKILL.md'];
  const res = validatePackage(makePackage('demo', files));
  assert.ok(codes(res.messages).includes('frontmatter_missing'));
  assert.equal(res.valid, false);
});

test('SLV0-FALL-06 block scalar, anchor, flow list: frontmatter_unsupported, no partial parse', () => {
  const variants = [
    '---\nname: demo\ndescription: |\n  Mehrzeilig\n---\n',
    '---\nname: &a demo\ndescription: x\n---\n',
    '---\nname: demo\ndescription: [a, b]\n---\n',
  ];
  for (const v of variants) {
    const res = validatePackage(withSkillMd('demo', `${v}\n[A](references/work.md)\n`));
    assert.deepEqual(codes(res.messages), ['frontmatter_unsupported'], v);
    assert.equal(res.content_hash, null);
    // No partial parse: no name/description/field errors reported alongside.
    assert.equal(res.frontmatter.status, 'unsupported');
    assert.equal(res.frontmatter.fields, undefined);
  }
});

test('SLV0-FALL-07 additional field "version: 2": field_unknown', () => {
  const res = validatePackage(withSkillMd('demo', skillMd('demo', { extraFront: 'version: 2\n' })));
  assert.deepEqual(codes(res.messages), ['field_unknown']);
  assert.equal(res.messages[0].line, 4);
});

test('SLV0-VAL-03 all optional fields of SLV0-PKG-02 are accepted, incl. metadata map', () => {
  const extra = 'license: MIT\ncompatibility: "Node 22"\nallowed-tools: Read Grep\nmetadata:\n  author: test\n  version: \'1.0\'\n';
  const res = validatePackage(withSkillMd('demo', skillMd('demo', { extraFront: extra })));
  assert.deepEqual(res.messages, []);
  assert.equal(res.frontmatter.metadata.get('version').value, '1.0');
});

test('SLV0-VAL-05 compatibility longer than 500 characters: field_too_long', () => {
  const res = validatePackage(withSkillMd('demo', skillMd('demo', { extraFront: `compatibility: ${'c'.repeat(501)}\n` })));
  assert.deepEqual(codes(res.messages), ['field_too_long']);
  const ok = validatePackage(withSkillMd('demo', skillMd('demo', { extraFront: `compatibility: ${'c'.repeat(500)}\n` })));
  assert.equal(ok.valid, true);
});

test('SLV0-VAL-02 parser rejects duplicates, tags, comments, nesting and bad metadata', () => {
  const bad = [
    '---\nname: a\nname: b\n---\n',
    '---\nname: !!str a\n---\n',
    '---\nname: a # c\n---\n',
    '---\nname: a: b\n---\n',
    '---\nmetadata: x\n---\n',
    '---\nmetadata:\n    deep: x\n---\n',
    '---\nmetadata:\n  a: 1\n  a: 2\n---\n',
    '---\nname: a\n  fortsetzung\n---\n',
    '---\n- a\n---\n',
    '---\nname: "offen\n---\n',
    "---\nname: 'a' b\n---\n",
    '---\nname: *alias\n---\n',
    '---\ndescription: >\n  gefaltet\n---\n',
    '---\nname: {a: b}\n---\n',
  ];
  for (const t of bad) assert.equal(parseFrontmatter(t).status, 'unsupported', JSON.stringify(t));
});

test('SLV0-VAL-02 scalar forms: plain, double-quoted with escapes, single-quoted', () => {
  assert.deepEqual(parseScalar("Nutze bei 'x' und „y“"), { ok: true, value: "Nutze bei 'x' und „y“" });
  assert.deepEqual(parseScalar('"a \\"b\\" \\u00e4"'), { ok: true, value: 'a "b" ä' });
  assert.deepEqual(parseScalar("'it''s'"), { ok: true, value: "it's" });
  assert.equal(parseScalar('"a\\qb"').ok, false);
  const fm = parseFrontmatter('---\nname: demo\n\ndescription: x\n---\nRumpf\n');
  assert.equal(fm.status, 'ok');
  assert.equal(fm.closingLine, 5);
});
