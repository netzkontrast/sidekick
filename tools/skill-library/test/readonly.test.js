// Read-only behaviour SLV0-INV-01/-08 (SLV0-FALL-25).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { makeRepo, defaultFiles, runCli, tempDir, NEEDS_SYMLINKS, REPO_ROOT } from './helpers.js';

/** Fingerprint of a tree: every entry with type, mode, size, mtime, link target and content hash. */
function fingerprint(root) {
  const out = [];
  const rec = (rel) => {
    const abs = path.join(root, rel);
    for (const name of fs.readdirSync(abs).sort()) {
      const r = path.join(rel, name);
      const st = fs.lstatSync(path.join(root, r));
      const row = { r, mode: st.mode, size: st.size, mtime: st.mtimeMs };
      if (st.isSymbolicLink()) row.link = fs.readlinkSync(path.join(root, r));
      else if (st.isFile()) row.sha = createHash('sha256').update(fs.readFileSync(path.join(root, r))).digest('hex');
      out.push(row);
      if (st.isDirectory()) rec(r);
    }
  };
  rec('');
  return out;
}

test('SLV0-FALL-25 every command leaves the test repo, adapters and record status unchanged', NEEDS_SYMLINKS, () => {
  const repo = makeRepo({ 'demo-skill': defaultFiles('demo-skill'), other: defaultFiles('other') });
  const recDir = path.join(repo, 'registry');
  fs.mkdirSync(recDir);
  const rec = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'docs', 'spec', 'beispiele', 'skill-paket-demo.json'), 'utf8'));
  const recFile = path.join(recDir, 'demo-skill.json');
  fs.writeFileSync(recFile, JSON.stringify(rec));
  const trace = path.join(recDir, 'trace.json');
  fs.writeFileSync(trace, JSON.stringify({ trace_sha256: 'a'.repeat(64), usage: { input_tokens: 1 } }));
  const list = path.join(recDir, 'list.json');
  fs.writeFileSync(list, '["x"]');

  const before = fingerprint(repo);
  const setBefore = runCli(['hash', '--root', repo]).json.package_set_hash;
  const pkgDir = path.join(repo, '.agents', 'skills', 'other');
  const commands = [
    ['validate', '--scope', 'project', '--root', repo, '--project-list', list],
    ['validate', '--scope', 'package', pkgDir],
    ['hash', '--root', repo],
    ['hash', '--scope', 'package', pkgDir],
    ['tokens', '--root', repo, '--estimator', 'utf8-bytes-div-4@1', '--token-budget', '1'],
    ['tokens', '--scope', 'package', pkgDir],
    ['tokens', '--trace', trace],
    ['registry-check', recFile, '--root', repo],
    ['registry-check', recFile, '--schema-only'],
  ];
  for (const args of commands) {
    const r = runCli(args, { cwd: repo });
    assert.ok([0, 1].includes(r.code), `${args.join(' ')}: ${r.stdout}${r.stderr}`);
  }
  assert.deepEqual(fingerprint(repo), before);
  assert.equal(runCli(['hash', '--root', repo]).json.package_set_hash, setBefore);
  assert.equal(JSON.parse(fs.readFileSync(recFile, 'utf8')).status, 'candidate');
  // No stray files next to the repo either.
  assert.deepEqual(fs.readdirSync(recDir).sort(), ['demo-skill.json', 'list.json', 'trace.json']);
});

test('SLV0-VAL-17 usage errors exit 2 with JSON on stdout', () => {
  const cases = [
    ['bogus'],
    ['validate', '--scope', 'everything'],
    ['validate', '--scope', 'package'],
    ['validate', '--unknown'],
    ['tokens', '--estimator', 'magic@1'],
    ['registry-check'],
    ['validate', '--root', tempDir('slv0-empty-')],
    [],
  ];
  for (const args of cases) {
    const r = runCli(args);
    assert.equal(r.code, 2, args.join(' '));
    assert.ok(r.json, `stdout is JSON for ${args.join(' ')}`);
  }
});
