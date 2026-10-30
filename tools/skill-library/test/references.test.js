// Reference rules SLV0-VAL-06/-07/-12 (SLV0-FALL-08…10, -19).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makePackage, defaultFiles, skillMd, runCli, codes, WORK_MD } from './helpers.js';
import { validatePackage, headingSlug } from '../lib/package.js';

function pkgWithBody(body, extra = {}) {
  return makePackage('demo', { ...defaultFiles('demo'), 'SKILL.md': skillMd('demo', { body }), ...extra });
}

test('SLV0-FALL-08 link to references/fehlt.md: reference_missing with line', () => {
  const dir = pkgWithBody('\n# T\n\n[A](references/work.md)\n\nSiehe [fehlt](references/fehlt.md).\n');
  const res = validatePackage(dir);
  assert.deepEqual(codes(res.messages), ['reference_missing']);
  assert.equal(res.messages[0].line, 10);
  assert.equal(res.content_hash, null);
});

test('SLV0-FALL-08 code reference `references/…` must resolve too', () => {
  const res = validatePackage(pkgWithBody('\n[A](references/work.md) und `references/nicht-da.md`\n'));
  assert.deepEqual(codes(res.messages), ['reference_missing']);
  const ok = validatePackage(pkgWithBody('\nNur `references/work.md` lesen.\n'));
  assert.deepEqual(ok.messages, []);
});

test('SLV0-FALL-09 ../anderer/SKILL.md, /etc/hosts, references\\a.md', () => {
  const body = '\n[A](references/work.md)\n[B](../anderer/SKILL.md)\n[C](/etc/hosts)\n[D](references\\a.md)\n';
  const res = validatePackage(pkgWithBody(body));
  assert.deepEqual(codes(res.messages).sort(), ['absolute_path', 'path_not_portable', 'reference_escapes_package']);
  const byCode = Object.fromEntries(res.messages.map((m) => [m.code, m.line]));
  assert.deepEqual(byCode, { reference_escapes_package: 7, absolute_path: 8, path_not_portable: 9 });
  assert.equal(res.content_hash, null);
});

test('SLV0-FALL-09 link in references/*.md resolves relative to that file', () => {
  const extra = {
    'references/work.md': `${WORK_MD}\nWeiter: [Zwei](zwei.md), zurück: [S](../SKILL.md), raus: [X](../../x.md)\n`,
    'references/zwei.md': '# Zwei\n',
  };
  const res = validatePackage(pkgWithBody('\n[A](references/work.md)\n', extra));
  assert.deepEqual(codes(res.messages), ['reference_escapes_package']);
  assert.equal(res.messages[0].path, 'demo/references/work.md');
});

test('SLV0-FALL-10 anchors: existing "Ohne Rückkanal" ok, missing anchor warns, URL not followed, exit 0', () => {
  const body = '\n[A](references/work.md#ohne-rückkanal)\n[B](references/work.md#gibt-es-nicht)\n[C](https://example.invalid)\n[D](references/work.md#ohne-r%C3%BCckkanal)\n';
  const dir = pkgWithBody(body);
  const r = runCli(['validate', '--scope', 'package', dir]);
  assert.equal(r.code, 0);
  assert.deepEqual(codes(r.json.messages), ['anchor_unresolved']);
  assert.equal(r.json.messages[0].severity, 'warning');
  assert.equal(r.json.messages[0].line, 7);
  assert.match(r.json.packages[0].content_hash, /^[0-9a-f]{64}$/);
});

test('SLV0-VAL-07 slug rule', () => {
  assert.equal(headingSlug('Ohne Rückkanal'), 'ohne-rückkanal');
  assert.equal(headingSlug('Versionen, Doppelantworten, Fristen'), 'versionen-doppelantworten-fristen');
  assert.equal(headingSlug('`code` & Co_1'), 'code--co1');
});

test('SLV0-VAL-07 same-file anchor and links inside fenced code are ignored correctly', () => {
  const body = '\n# Titel\n\n[A](references/work.md) [oben](#titel) [weg](#fehlt)\n\n```\n[x](references/nicht-da.md)\n```\n';
  const res = validatePackage(pkgWithBody(body));
  assert.deepEqual(codes(res.messages), ['anchor_unresolved']);
});

test('SLV0-FALL-19 references/alt.md without incoming link: reference_unused (warning)', () => {
  const r = runCli(['validate', '--scope', 'package', pkgWithBody('\n[A](references/work.md)\n', { 'references/alt.md': '# Alt\n' })]);
  assert.equal(r.code, 0);
  assert.deepEqual(codes(r.json.messages), ['reference_unused']);
  assert.equal(r.json.messages[0].path, 'demo/references/alt.md');
  assert.equal(r.json.messages[0].severity, 'warning');
});
