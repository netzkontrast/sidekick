// `questions …` subcommands (docs/spec/questions-cli-v0.md §4). JSON on stdout; exit 0 ok, 1 refusal with code,
// 2 usage error. No network, no model, no process start (QCLI-INV-12). Writes only below --root, atomically.
import fs from 'node:fs';
import path from 'node:path';
import { TOOL_NAME, TOOL_VERSION, sortMessages } from '../core.js';
import { topicProblem, parseNow, isoDate, date8 } from './ids.js';
import { Refusal, UsageError, commitChanges } from './store.js';
import {
  cmdInit, cmdAdd, cmdAsk, cmdAnswer, cmdCorrect, cmdDefer, cmdSupersede, cmdRevise, cmdReview, cmdPause, cmdResume,
  cmdStatus, cmdNext, cmdRender, SESSION_SET_STATES,
} from './commands.js';
import { checkStore } from './check.js';

export const QUESTIONS_USAGE = `  questions init|add|ask|answer|correct|defer|supersede|revise|review --root WURZEL --topic THEMA
                  [--now ISO-8601] (--json JSON | --file DATEI | JSON auf stdin)
  questions pause|resume|next|render --root WURZEL --topic THEMA [--now ISO-8601]
  questions status --root WURZEL --topic THEMA [--set ZUSTAND [--summary TEXT] [--confirmation TEXT]] [--now ISO-8601]
  questions check --root WURZEL [--topic THEMA]                                Spec: docs/spec/questions-cli-v0.md`;

const PAYLOAD = ['--json', '--file'];
const BASE = ['--root', '--topic', '--now'];
const COMMANDS = {
  init: { fn: cmdInit, opts: [...BASE, ...PAYLOAD], payload: true },
  add: { fn: cmdAdd, opts: [...BASE, ...PAYLOAD], payload: true },
  ask: { fn: cmdAsk, opts: [...BASE, ...PAYLOAD], payload: true },
  answer: { fn: cmdAnswer, opts: [...BASE, ...PAYLOAD], payload: true },
  correct: { fn: cmdCorrect, opts: [...BASE, ...PAYLOAD], payload: true },
  defer: { fn: cmdDefer, opts: [...BASE, ...PAYLOAD], payload: true },
  supersede: { fn: cmdSupersede, opts: [...BASE, ...PAYLOAD], payload: true },
  revise: { fn: cmdRevise, opts: [...BASE, ...PAYLOAD], payload: true },
  review: { fn: cmdReview, opts: [...BASE, ...PAYLOAD], payload: true },
  pause: { fn: cmdPause, opts: BASE },
  resume: { fn: cmdResume, opts: BASE },
  status: { fn: cmdStatus, opts: [...BASE, '--set', '--summary', '--confirmation'] },
  next: { fn: cmdNext, opts: BASE },
  render: { fn: cmdRender, opts: BASE },
  check: { fn: null, opts: ['--root', '--topic'], topicOptional: true },
};
const VALUE_OPTS = new Set([...BASE, ...PAYLOAD, '--set', '--summary', '--confirmation']);

function parse(argv) {
  const [command, ...rest] = argv;
  const opts = {};
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    if (!VALUE_OPTS.has(a)) throw new UsageError(a.startsWith('--') ? `unbekannte Option ${a}` : `unerwartetes Argument ${a}`);
    if (i + 1 >= rest.length) throw new UsageError(`Option ${a} braucht einen Wert`);
    if (opts[a] !== undefined) throw new UsageError(`Option ${a} mehrfach angegeben`);
    opts[a] = rest[i + 1];
    i += 1;
  }
  return { command, opts };
}

/** Payload from exactly one source: --json, --file, or stdin when it is a pipe or file (never a terminal). */
function readPayload(opts, stdinFd) {
  if (opts['--json'] !== undefined && opts['--file'] !== undefined) throw new UsageError('nur eine Eingabequelle: --json oder --file');
  let raw;
  if (opts['--json'] !== undefined) raw = opts['--json'];
  else if (opts['--file'] !== undefined) {
    try {
      raw = fs.readFileSync(opts['--file'], 'utf8');
    } catch (err) {
      throw new UsageError(`--file nicht lesbar: ${err.code ?? err.message}`);
    }
  } else {
    let st = null;
    try { st = fs.fstatSync(stdinFd); } catch { st = null; }
    if (st && (st.isFIFO() || st.isFile())) raw = fs.readFileSync(stdinFd, 'utf8');
    if (raw === undefined || raw.trim() === '') throw new UsageError('Nutzdaten fehlen: --json, --file oder JSON auf stdin');
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new UsageError(`Nutzdaten sind kein gültiges JSON: ${err.message}`);
  }
}

function header(command, extra = {}) {
  return { tool: TOOL_NAME, tool_version: TOOL_VERSION, command: `questions ${command ?? ''}`.trim(), ...extra };
}

/** Run `questions <command> …`; returns {out, code, stderr?}. `stdinFd` is injectable for tests. */
export function runQuestions(argv, { stdinFd = 0 } = {}) {
  let command = argv[0];
  let base = {};
  try {
    const { opts, command: c } = parse(argv);
    command = c;
    if (!command || command === '--help') return { out: header('help', { ok: Boolean(command), usage: QUESTIONS_USAGE }), code: command ? 0 : 2 };
    const spec = COMMANDS[command];
    if (!spec) throw new UsageError(`unbekannter Befehl questions ${command}`);
    for (const k of Object.keys(opts)) if (!spec.opts.includes(k)) throw new UsageError(`Option ${k} gilt nicht für questions ${command}`);
    const rootArg = opts['--root'];
    if (rootArg === undefined) throw new UsageError('--root fehlt');
    const root = path.resolve(rootArg);
    let st = null;
    try { st = fs.statSync(root); } catch { st = null; }
    if (!st || !st.isDirectory()) throw new UsageError(`--root ist kein Verzeichnis: ${rootArg}`);
    const topic = opts['--topic'];
    if (topic === undefined && !spec.topicOptional) throw new UsageError('--topic fehlt');
    if (topic !== undefined && topicProblem(topic)) throw new UsageError(`--topic ungültig: ${topicProblem(topic)}`);
    const now = parseNow(opts['--now']);
    if (now === null) throw new UsageError('--now ist kein gültiger ISO-8601-Zeitpunkt');
    base = { root: rootArg, ...(topic !== undefined ? { topic } : {}) };

    if (command === 'check') {
      const res = checkStore(root, topic);
      return { out: header(command, { ...base, ok: res.summary.errors === 0, ...res }), code: res.summary.errors > 0 ? 1 : 0 };
    }
    if (command === 'status') {
      if (opts['--set'] === undefined && (opts['--summary'] !== undefined || opts['--confirmation'] !== undefined)) {
        throw new UsageError('--summary und --confirmation nur zusammen mit --set');
      }
      if (opts['--set'] !== undefined && !SESSION_SET_STATES.includes(opts['--set'])) {
        throw new UsageError(`--set erlaubt: ${SESSION_SET_STATES.join(', ')}`);
      }
      for (const k of ['--summary', '--confirmation']) {
        if (opts[k] !== undefined && (opts[k].trim() === '' || /[\u0000-\u001f\u007f]/u.test(opts[k]))) { // eslint-disable-line no-control-regex
          throw new UsageError(`${k} muss einzeiliger, nicht leerer Text sein`);
        }
      }
    }
    const payload = spec.payload ? readPayload(opts, stdinFd) : undefined;
    const ctx = { root, rootArg, topic, now, date: isoDate(now), d8: date8(now) };
    const { result, ws, dirs } = spec.fn(ctx, payload, { set: opts['--set'], summary: opts['--summary'], confirmation: opts['--confirmation'] });
    let changed = [];
    if (ws) {
      const changes = ws.changes();
      if (changes.length > 0) changed = commitChanges(changes, { dirs });
    }
    return { out: header(command, { ...base, ok: true, ...result, ...(ws ? { changed } : {}) }), code: 0 };
  } catch (err) {
    if (err instanceof Refusal) {
      return { out: header(command, { ...base, ok: false, refused: true, messages: sortMessages(err.messages.map((m) => ({ ...m, path: m.path ?? '' }))) }), code: 1 };
    }
    const usage = err instanceof UsageError;
    return {
      out: header(command, { ok: false, error: { kind: usage ? 'usage' : 'internal', message: err.message } }),
      code: 2,
      stderr: usage ? `${err.message}\n\n${QUESTIONS_USAGE}\n` : `${err.stack}\n`,
    };
  }
}
