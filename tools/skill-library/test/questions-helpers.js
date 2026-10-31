// Helpers for questions CLI tests (docs/spec/questions-cli-v0.md §7). Temporary roots are removed by each test.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CLI, REPO_ROOT } from './helpers.js';

export const NOW = '2026-10-31T10:00:00Z';
export const DATE = '2026-10-31';
export const FIXTURES = JSON.parse(fs.readFileSync(fileURLToPath(new URL('./fixtures/questions-grilling-dev.json', import.meta.url)), 'utf8'));
export { REPO_ROOT };

/** Temporary store root, removed after the test. */
export function tmpRoot(t, prefix = 'qcli-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** Run `cli.js questions <args>`; returns {code, json, stdout, stderr}. */
export function qcli(args, { input, stdinFile, cwd = REPO_ROOT } = {}) {
  let res;
  if (stdinFile !== undefined) {
    // A regular file as stdin, like a shell redirect or heredoc.
    const fd = fs.openSync(stdinFile, 'r');
    try {
      res = spawnSync(process.execPath, [CLI, 'questions', ...args], { cwd, encoding: 'utf8', stdio: [fd, 'pipe', 'pipe'] });
    } finally {
      fs.closeSync(fd);
    }
  } else {
    res = spawnSync(process.execPath, [CLI, 'questions', ...args], { cwd, encoding: 'utf8', input: input ?? '' });
  }
  let json = null;
  try { json = JSON.parse(res.stdout); } catch { /* keep null */ }
  return { code: res.status, json, stdout: res.stdout, stderr: res.stderr };
}

/** Run a command with --root/--topic/--now and an optional JSON payload via --json. */
export function run(root, topic, cmd, payload, extra = []) {
  const args = [cmd, '--root', root, '--topic', topic, '--now', NOW, ...extra];
  if (payload !== undefined) args.push('--json', JSON.stringify(payload));
  return qcli(args);
}

/** Like run, but fails the test with the CLI output when the exit code differs. */
export function must(assert, root, topic, cmd, payload, code = 0, extra = []) {
  const r = run(root, topic, cmd, payload, extra);
  assert.equal(r.code, code, `${cmd}: ${r.stdout}${r.stderr}`);
  return r;
}

export function codesOf(r) {
  return (r.json?.messages ?? []).map((m) => m.code);
}

export function read(root, rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

export function write(root, rel, text) {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text);
}

/** Frontmatter as flat key → string map (same reading as check_case.py). */
export function frontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  const out = {};
  if (m) {
    for (const line of m[1].split('\n')) {
      const i = line.indexOf(':');
      if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return out;
}

/** Every file below `dir` with content hash, size and mtime (for read-only and rollback checks). */
export function fingerprint(dir, { mtime = true } = {}) {
  const out = {};
  const rec = (rel) => {
    for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      const abs = path.join(dir, r);
      if (e.isDirectory()) {
        out[`${r}/`] = 'dir';
        rec(r);
      } else {
        const st = fs.lstatSync(abs);
        out[r] = `${createHash('sha256').update(fs.readFileSync(abs)).digest('hex')}${mtime ? `@${st.mtimeMs}` : ''}`;
      }
    }
  };
  rec('');
  return out;
}

/** Synthetic question payload for `add`. */
export function qp(id, extra = {}) {
  return {
    id,
    title: `Synthetische Frage ${id}?`,
    kind: 'decision',
    priority: 'important',
    context: 'plan.md @ c1',
    occasion: 'Lücke im Plan',
    impact: 'Umfang der ersten Version',
    options: 'a) eins. b) zwei.',
    recommendation: 'a, weil kleiner.',
    ...extra,
  };
}

export const OWNER = { by: 'Owner', channel: 'Chat' };

/** New store with one topic `t` and the given questions (payloads). */
export function setup(t, assert, questions = [], topic = 't') {
  const root = tmpRoot(t);
  must(assert, root, topic, 'init', { title: 'Testthema', goal: 'Synthetisch testen', editor: 'Test' });
  if (questions.length > 0) must(assert, root, topic, 'add', { questions });
  return root;
}

/** Ask questions in a confirmed chat round. */
export function askChat(assert, root, topic, roundId, ids, version = 1) {
  return must(assert, root, topic, 'ask', { round_id: roundId, channel: 'chat', delivery: 'bestaetigt', questions: ids.map((id) => ({ id, version })) });
}

export function answer(assert, root, topic, id, roundId, text, extra = {}, code = 0) {
  return must(assert, root, topic, 'answer', { question_id: id, version: 1, round_id: roundId, text, source: OWNER, ...extra }, code);
}

/** Write a dev fixture case into a fresh directory; returns the workspace root. */
export function fixtureWorkspace(t, caseId) {
  const ws = tmpRoot(t, `qcli-${caseId}-`);
  for (const [rel, text] of Object.entries(FIXTURES.cases[caseId].files)) write(ws, rel, text);
  return ws;
}

/**
 * The file checks of check_case.py, re-implemented for tests. `before` is a fingerprint taken before the run;
 * changed and new files are derived from it instead of `git status`. Returns [{rule, ok, detail}].
 */
export function caseChecks(fall, ws, before) {
  const after = fingerprint(ws, { mtime: false });
  const changed = Object.keys(after).filter((k) => !k.endsWith('/') && before[k] !== after[k]);
  const created = changed.filter((k) => !(k in before));
  const removed = Object.keys(before).filter((k) => !k.endsWith('/') && !(k in after));
  const readMaybe = (rel) => (fs.existsSync(path.join(ws, rel)) ? read(ws, rel) : null);
  const all = Object.keys(after).filter((k) => !k.endsWith('/'));
  return fall.checks.map((rule) => {
    let ok;
    let detail;
    if ('only_changed_under' in rule) {
      const bad = [...changed, ...removed].filter((p) => !p.startsWith(rule.only_changed_under));
      ok = bad.length === 0;
      detail = bad;
    } else if ('no_new_files_under' in rule) {
      const n = created.filter((p) => p.startsWith(rule.no_new_files_under));
      ok = n.length === 0;
      detail = n;
    } else if ('new_file_under' in rule) {
      const n = created.filter((p) => p.startsWith(rule.new_file_under));
      const hit = n.filter((p) => (rule.contains_any ?? ['']).some((x) => read(ws, p).includes(x)));
      ok = hit.length > 0;
      detail = hit;
    } else if ('absent_anywhere' in rule) {
      const hits = all.filter((p) => read(ws, p).includes(rule.absent_anywhere));
      ok = hits.length === 0;
      detail = hits;
    } else {
      const text = readMaybe(rule.file);
      if (text === null) return { rule, ok: false, detail: 'Datei fehlt' };
      const fm = frontmatter(text);
      if ('frontmatter' in rule) ok = Object.entries(rule.frontmatter).every(([k, v]) => fm[k] === v);
      else if ('frontmatter_in' in rule) ok = Object.entries(rule.frontmatter_in).every(([k, v]) => v.includes(fm[k]));
      else if ('contains' in rule) ok = text.includes(rule.contains);
      else if ('not_contains' in rule) ok = !text.includes(rule.not_contains);
      else if ('regex' in rule) ok = new RegExp(rule.regex).test(text);
      else if ('count_at_least' in rule) ok = text.split(rule.count_at_least[0]).length - 1 >= rule.count_at_least[1];
      else ok = false;
      detail = fm;
    }
    return { rule, ok, detail };
  });
}
