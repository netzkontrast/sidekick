// File access for the questions CLI: safe paths, loading a topic, atomic multi-file commit with rollback.
// docs/spec/questions-cli-v0.md QCLI-INV-08 (paths), -09 (atomic, rollback), -10 (no partial state), -13 (concurrency).
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { idProblem } from './ids.js';
import { parseQuestion } from './record.js';
import { parseIndex } from './topic-index.js';
import { parseRound } from './round.js';

export class UsageError extends Error {}

/** A refusal with one or more messages {code, severity, path, message, rule}. */
export class Refusal extends Error {
  constructor(messages) {
    super(messages.map((m) => `${m.code}: ${m.message}`).join('; '));
    this.messages = messages;
  }
}

export function msg(code, message, { path: p = null, rule = null, severity = 'error', line = null, field = null } = {}) {
  const m = { code, severity, path: p, message, rule };
  if (line !== null) m.line = line;
  if (field !== null) m.field = field;
  return m;
}

export function refuse(messages) {
  if (messages.length > 0) throw new Refusal(messages);
}

const TMP_MARK = '.tmp-';

export function isTempName(name) {
  return name.startsWith('.') && name.includes(TMP_MARK);
}

function lstatOrNull(p) {
  try {
    return fs.lstatSync(p);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

/** Refuse when any existing component between root (exclusive) and target is a symlink (QCLI-INV-08). */
export function assertNoSymlink(root, target, rel) {
  const parts = path.relative(root, target).split(path.sep);
  let cur = root;
  for (const part of parts) {
    cur = path.join(cur, part);
    const st = lstatOrNull(cur);
    if (st === null) return;
    if (st.isSymbolicLink()) throw new Refusal([msg('path_unsafe', `Pfad führt über einen Symlink: ${rel}`, { path: rel, rule: 'QCLI-INV-08' })]);
  }
}

export function topicPaths(root, topic) {
  const topicDir = path.join(root, topic);
  return {
    topicDir,
    index: path.join(topicDir, 'index.md'),
    questionsDir: path.join(topicDir, 'questions'),
    roundsDir: path.join(topicDir, 'rounds'),
    rel: (abs) => path.relative(root, abs).split(path.sep).join('/'),
    question: (id) => path.join(topicDir, 'questions', `${id}.md`),
    round: (id) => path.join(topicDir, 'rounds', `${id}.md`),
  };
}

export function readText(abs) {
  try {
    return fs.readFileSync(abs, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

function listMd(dir) {
  const st = lstatOrNull(dir);
  if (st === null || !st.isDirectory()) return { files: [], temps: [] };
  const files = [];
  const temps = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (isTempName(e.name)) temps.push(e.name);
    else if ((e.isFile() || e.isSymbolicLink()) && e.name.endsWith('.md')) files.push(e.name);
  }
  files.sort();
  temps.sort();
  return { files, temps };
}

/**
 * Load a topic: index, questions (by file name), rounds. Files whose name is not a valid ID are reported in
 * `badNames`; parse problems stay on each document.
 */
export function loadTopic(root, topic) {
  const p = topicPaths(root, topic);
  assertNoSymlink(root, p.questionsDir, `${topic}/questions`);
  assertNoSymlink(root, p.roundsDir, `${topic}/rounds`);
  assertNoSymlink(root, p.index, `${topic}/index.md`);
  const indexText = readText(p.index);
  const topicData = {
    topic,
    paths: p,
    index: indexText === null ? null : { abs: p.index, rel: p.rel(p.index), text: indexText, doc: parseIndex(indexText) },
    questions: new Map(),
    rounds: new Map(),
    badNames: [],
    temps: [],
  };
  const qs = listMd(p.questionsDir);
  for (const name of qs.files) {
    const id = name.slice(0, -3);
    const abs = path.join(p.questionsDir, name);
    if (lstatOrNull(abs).isSymbolicLink()) {
      topicData.badNames.push({ rel: p.rel(abs), reason: 'Symlink' });
      continue;
    }
    if (idProblem('Q', id) !== null) {
      topicData.badNames.push({ rel: p.rel(abs), reason: idProblem('Q', id) });
      continue;
    }
    const text = fs.readFileSync(abs, 'utf8');
    topicData.questions.set(id, { id, abs, rel: p.rel(abs), text, doc: parseQuestion(text) });
  }
  const rs = listMd(p.roundsDir);
  for (const name of rs.files) {
    const id = name.slice(0, -3);
    const abs = path.join(p.roundsDir, name);
    const text = fs.readFileSync(abs, 'utf8');
    topicData.rounds.set(id, { id, abs, rel: p.rel(abs), text, doc: parseRound(text), idOk: idProblem('R', id) === null });
  }
  topicData.temps = [
    ...qs.temps.map((n) => `${topic}/questions/${n}`),
    ...rs.temps.map((n) => `${topic}/rounds/${n}`),
    ...listMd(p.topicDir).temps.map((n) => `${topic}/${n}`),
  ];
  return topicData;
}

/** Topic directory names under the root (directories whose name is a valid topic name are not required). */
export function listTopics(root) {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort();
}

/** Every question ID under the root (all topics), for collision checks. */
export function questionIdsInRoot(root) {
  const ids = new Map();
  for (const t of listTopics(root)) {
    const dir = path.join(root, t, 'questions');
    for (const name of listMd(dir).files) ids.set(name.slice(0, -3), `${t}/questions/${name}`);
  }
  return ids;
}

function writeTemp(abs, content) {
  const tmp = path.join(path.dirname(abs), `.${path.basename(abs)}${TMP_MARK}${process.pid}-${randomBytes(4).toString('hex')}`);
  const fd = fs.openSync(tmp, 'wx');
  try {
    fs.writeSync(fd, content);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  return tmp;
}

/** Create `abs` from `tmp` without overwriting an existing file. */
function linkNew(tmp, abs) {
  try {
    fs.linkSync(tmp, abs);
    fs.unlinkSync(tmp);
  } catch (err) {
    if (err.code === 'EEXIST') throw err;
    if (fs.existsSync(abs)) throw Object.assign(new Error(`exists: ${abs}`), { code: 'EEXIST' });
    fs.renameSync(tmp, abs); // file systems without hard links
  }
}

/**
 * Commit changes atomically (QCLI-INV-09): [{abs, rel, before: string|null, after: string}] plus directories to
 * create. Each file is written to a temp file and renamed; new files never overwrite. On any failure all files
 * already committed are restored and created directories removed. `failAfter` (tests only) injects a failure
 * after that many committed files.
 */
export function commitChanges(changes, { dirs = [], failAfter } = {}) {
  for (const c of changes) {
    if (readText(c.abs) !== c.before) {
      throw new Refusal([msg('concurrent_modification', 'Datei wurde seit dem Lesen geändert; nichts geschrieben', { path: c.rel, rule: 'QCLI-INV-13' })]);
    }
  }
  const createdDirs = [];
  const staged = [];
  const committed = [];
  try {
    for (const d of dirs) {
      if (lstatOrNull(d) === null) {
        fs.mkdirSync(d);
        createdDirs.push(d);
      }
    }
    for (const c of changes) staged.push({ c, tmp: writeTemp(c.abs, c.after) });
    for (const s of staged) {
      if (failAfter !== undefined && committed.length === failAfter) throw new Error('injected failure (test)');
      if (s.c.before === null) {
        linkNew(s.tmp, s.c.abs);
      } else {
        if (readText(s.c.abs) !== s.c.before) {
          throw new Refusal([msg('concurrent_modification', 'Datei wurde seit dem Lesen geändert; nichts geschrieben', { path: s.c.rel, rule: 'QCLI-INV-13' })]);
        }
        fs.renameSync(s.tmp, s.c.abs);
      }
      committed.push(s);
    }
  } catch (err) {
    const rollbackErrors = [];
    for (const s of [...committed].reverse()) {
      try {
        if (s.c.before === null) fs.unlinkSync(s.c.abs);
        else fs.renameSync(writeTemp(s.c.abs, s.c.before), s.c.abs);
      } catch (e) {
        rollbackErrors.push(`${s.c.rel}: ${e.message}`);
      }
    }
    for (const s of staged) {
      try { fs.unlinkSync(s.tmp); } catch { /* already renamed or removed */ }
    }
    for (const d of [...createdDirs].reverse()) {
      try { fs.rmdirSync(d); } catch { /* not empty */ }
    }
    if (err instanceof Refusal && rollbackErrors.length === 0) throw err;
    throw new Refusal([msg('write_failed', `Schreiben fehlgeschlagen (${err.message}); ${rollbackErrors.length === 0
      ? `${committed.length} geschriebene Datei(en) zurückgenommen`
      : `Rücknahme unvollständig: ${rollbackErrors.join('; ')}`}`, { rule: 'QCLI-INV-09' })]);
  }
  return changes.map((c) => c.rel);
}
