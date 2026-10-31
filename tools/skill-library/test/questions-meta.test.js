// Module boundaries, usage errors and the permission rule: QCLI-FALL-42…44 (docs/spec/questions-cli-v0.md §6.2, §7, §8).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { qcli, tmpRoot, REPO_ROOT, NOW } from './questions-helpers.js';

test('QCLI-FALL-42 lib/questions imports only node:fs, node:path, node:crypto and own modules; no network, no process', () => {
  const dir = fileURLToPath(new URL('../lib/questions/', import.meta.url));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
  assert.ok(files.length >= 8, files.join(','));
  for (const f of files) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    assert.ok(!/\bimport\s*\(/.test(src), `${f} uses a dynamic import`);
    for (const m of src.matchAll(/\bfrom\s+'([^']+)'/g)) {
      const from = m[1];
      assert.ok(['node:fs', 'node:path', 'node:crypto'].includes(from) || from.startsWith('./') || from.startsWith('../'), `${f} imports ${from}`);
      if (from.startsWith('../')) assert.equal(from, '../core.js', `${f} imports ${from}`);
    }
    assert.ok(!/node:net|node:http|node:https|node:dgram|node:child_process|\bfetch\(|\bspawn|\bexecFile|\bexecSync|\bfork\(/.test(src), `${f} uses a network or process API`);
    assert.ok(!/\beval\(|new Function\(/.test(src), `${f} evaluates code`);
  }
});

test('QCLI-FALL-43 usage errors exit 2 with JSON on stdout', (t) => {
  const root = tmpRoot(t);
  const file = path.join(root, 'not-a-dir');
  fs.writeFileSync(file, '');
  const cases = [
    ['bogus', '--root', root, '--topic', 't'],
    ['next', '--topic', 't'],
    ['next', '--root', path.join(root, 'fehlt'), '--topic', 't'],
    ['next', '--root', file, '--topic', 't'],
    ['next', '--root', root],
    ['next', '--root', root, '--topic', 't', '--unknown', 'x'],
    ['next', '--root', root, '--topic', 't', '--now', 'gestern'],
    ['next', '--root', root, '--topic', 't', '--now', NOW, '--now', NOW],
    ['next', '--root', root, '--topic', 't', 'extra'],
    ['check', '--root', root, '--json', '{}'],
    ['status', '--root', root, '--topic', 't', '--summary', 'ohne set'],
    ['next', '--root', root, '--topic', 't', '--root'],
    [],
  ];
  for (const args of cases) {
    const r = qcli(args);
    assert.equal(r.code, 2, args.join(' '));
    assert.ok(r.json && r.json.ok === false, `stdout is JSON for ${args.join(' ')}`);
  }
  // The main CLI help names the questions commands.
  const help = qcli(['--help']);
  assert.equal(help.code, 0);
  assert.match(help.json.usage, /questions check --root/);
});

test('QCLI-FALL-44 .claude/settings.json allows exactly `Bash(node tools/skill-library/cli.js questions:*)` and nothing else', () => {
  const settings = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.claude', 'settings.json'), 'utf8'));
  assert.deepEqual(Object.keys(settings), ['permissions']);
  assert.deepEqual(settings.permissions, { allow: ['Bash(node tools/skill-library/cli.js questions:*)'] });
});
