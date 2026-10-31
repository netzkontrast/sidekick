// `eval` subcommands (docs/spec/skill-library-v0.md §7). No command starts a client or model and
// none uses the network (SLV0-INV-04). Writing commands (prepare, ledger init|reserve|result,
// split access|select) write only to paths given explicitly and never overwrite.
// Artifact commands (freeze, split manifest, normalize, raw, report) print the artifact itself on
// stdout; all other commands print a JSON envelope. Exit: 0 ok, 1 refused (§8 code), 2 usage error.
import fs from 'node:fs';
import path from 'node:path';
import { TOOL_NAME, TOOL_VERSION, compareCodepoints } from '../core.js';
import { EvalRefusal, UsageError, readJsonFile } from './common.js';
import { freezeFromRepo, freezeFromSource, verifySnapshot, packageHashes } from './snapshot.js';
import { parseCandidates, bindCandidate } from './candidate.js';
import { prepare, parseCases } from './prepare.js';
import { initLedger, reserveStart, recordResult, readLedger, summarize } from './ledger.js';
import { buildManifest, checkManifest, verifyCaseHashes, accessSplit, selectCandidate, manifestSha256 } from './split.js';
import { normalizeTrace } from './normalize.js';
import { buildRawRecord } from './raw.js';
import { buildReport, checkReport } from './report.js';
import { checkRubrics } from './rubric.js';
import { validateProject } from '../project.js';

export const EVAL_USAGE = `  eval freeze --source-commit SHA [--root DIR] [--verify-git]   Snapshot der Pakete (stdout)
  eval freeze --source QUELLE.json                     Snapshot aus {source_commit, files} (stdout)
  eval verify --snapshot SNAPSHOT.json
  eval bind --snapshot SNAPSHOT.json --candidates KANDIDATEN.json [--id K-…]
  eval prepare --snapshot S --cases FAELLE.json --project-config DATEI --output NEUES-VERZ [--candidates K]
               [--manifest MANIFEST.json]
  eval ledger init --ledger DATEI --limit N [--manifest MANIFEST.json]
  eval ledger reserve --ledger DATEI --trial-id ID
  eval ledger result --ledger DATEI --attempt-id N --outcome completed|failed_start|aborted|client_error
                     [--trace-sha256 H] [--raw-id ID]...
  eval ledger status --ledger DATEI
  eval split manifest --cases FAELLE.json --manifest-id ID                     (stdout)
  eval split check --manifest MANIFEST.json [--cases FAELLE.json]
  eval split access --ledger DATEI --manifest M --role author|evaluator --split dev|select|test|regression
                    [--candidate-sha256 H]
  eval split select --ledger DATEI --manifest M --role evaluator --candidate-sha256 H
  eval normalize --trace SPUR.jsonl|SPUR.normalized.json                       (stdout)
  eval raw --meta META.json --normalized NORMALISIERT.json [--rubric RUBRIK.json] [--ledger DATEI]   (stdout)
  eval report ROHDATEN.json|VERZEICHNIS... [--rubric-version SKILL@N]...       (stdout)
  eval report --check BERICHT.json ROHDATEN.json|VERZEICHNIS...
  eval rubric check [RUBRIK.json|VERZEICHNIS...] [--root DIR] [--snapshot SNAPSHOT.json]`;

const VALUE_OPTS = new Set([
  '--root', '--source-commit', '--source', '--snapshot', '--candidates', '--id', '--cases', '--project-config',
  '--output', '--ledger', '--limit', '--manifest', '--trial-id', '--attempt-id', '--outcome', '--trace-sha256',
  '--role', '--split', '--candidate-sha256', '--manifest-id', '--trace', '--meta', '--normalized', '--check',
  '--rubric',
]);
const MULTI_OPTS = new Set(['--raw-id', '--rubric-version']);
const FLAG_OPTS = new Set(['--verify-git']);

function parse(argv) {
  const opts = {};
  const multi = {};
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (FLAG_OPTS.has(a)) {
      if (opts[a] !== undefined) throw new UsageError(`Option ${a} mehrfach angegeben`);
      opts[a] = true;
    } else if (VALUE_OPTS.has(a) || MULTI_OPTS.has(a)) {
      if (i + 1 >= argv.length) throw new UsageError(`Option ${a} braucht einen Wert`);
      if (MULTI_OPTS.has(a)) (multi[a] ??= []).push(argv[i + 1]);
      else if (opts[a] !== undefined) throw new UsageError(`Option ${a} mehrfach angegeben`);
      else opts[a] = argv[i + 1];
      i += 1;
    } else if (a.startsWith('--')) {
      throw new UsageError(`unbekannte Option ${a}`);
    } else {
      positional.push(a);
    }
  }
  return { opts, multi, positional };
}

/** Allow only the listed options; require the listed required ones. */
function expect({ opts, multi, positional }, allowed, required = [], { positionals = false } = {}) {
  for (const k of [...Object.keys(opts), ...Object.keys(multi)]) {
    if (!allowed.includes(k)) throw new UsageError(`Option ${k} gilt hier nicht`);
  }
  for (const k of required) if (opts[k] === undefined) throw new UsageError(`Option ${k} fehlt`);
  if (!positionals && positional.length > 0) throw new UsageError(`unerwartetes Argument ${positional[0]}`);
}

function header(command, extra = {}) {
  return { tool: TOOL_NAME, tool_version: TOOL_VERSION, command: `eval ${command}`, ...extra };
}

function intOpt(v, name) {
  if (!/^[0-9]+$/.test(v ?? '')) throw new UsageError(`${name} erwartet eine positive Ganzzahl`);
  return Number(v);
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') throw new UsageError(`${file}: Datei nicht gefunden`);
    throw err;
  }
}

function rawFiles(positional) {
  const files = [];
  for (const p of positional) {
    let st;
    try { st = fs.statSync(p); } catch { throw new UsageError(`${p}: nicht gefunden`); }
    if (st.isDirectory()) {
      for (const name of fs.readdirSync(p).sort(compareCodepoints)) if (name.endsWith('.json')) files.push(path.join(p, name));
    } else {
      files.push(p);
    }
  }
  return files;
}

const SUB = {
  freeze(a) {
    if (a.opts['--source'] !== undefined) {
      expect(a, ['--source'], ['--source']);
      return { artifact: freezeFromSource(readJsonFile(a.opts['--source'])) };
    }
    expect(a, ['--root', '--source-commit', '--verify-git'], ['--source-commit']);
    return {
      artifact: freezeFromRepo(path.resolve(a.opts['--root'] ?? process.cwd()), a.opts['--source-commit'], { verifyGit: a.opts['--verify-git'] === true }),
    };
  },

  verify(a) {
    expect(a, ['--snapshot'], ['--snapshot']);
    const summary = verifySnapshot(readJsonFile(a.opts['--snapshot']), a.opts['--snapshot']);
    return { out: { ok: true, ...summary, messages: [] } };
  },

  bind(a) {
    expect(a, ['--snapshot', '--candidates', '--id'], ['--snapshot', '--candidates']);
    const snap = readJsonFile(a.opts['--snapshot']);
    verifySnapshot(snap, a.opts['--snapshot']);
    let list = parseCandidates(readJsonFile(a.opts['--candidates']));
    if (a.opts['--id'] !== undefined) {
      list = list.filter((c) => c.id === a.opts['--id']);
      if (list.length === 0) throw new UsageError(`Kandidat ${a.opts['--id']} nicht gefunden`);
    }
    const results = [];
    const messages = [];
    for (const c of list) {
      try {
        results.push({ accepted: true, ...bindCandidate(snap, c, { verified: true }).record });
      } catch (err) {
        if (!(err instanceof EvalRefusal)) throw err;
        results.push({ accepted: false, candidate_id: c.id, codes: err.messages.map((m) => m.code) });
        messages.push(...err.messages);
      }
    }
    return { out: { baseline_sha256: snap.package_set_sha256, candidates: results, messages }, code: messages.length > 0 ? 1 : 0 };
  },

  prepare(a) {
    expect(a, ['--snapshot', '--cases', '--candidates', '--project-config', '--output', '--manifest'], ['--snapshot', '--cases', '--project-config', '--output']);
    const manifest = prepare({
      splitManifest: a.opts['--manifest'] !== undefined ? readJsonFile(a.opts['--manifest']) : null,
      snapshot: readJsonFile(a.opts['--snapshot']),
      cases: parseCases(readJsonFile(a.opts['--cases'])),
      candidates: a.opts['--candidates'] !== undefined ? parseCandidates(readJsonFile(a.opts['--candidates'])) : [],
      projectConfig: readText(a.opts['--project-config']),
      output: a.opts['--output'],
    });
    return {
      out: {
        output: a.opts['--output'], manifest: 'trials.json', model_starts: 0, prepared_trials: manifest.trials.length,
        split_manifest_sha256: manifest.split_manifest_sha256,
        trials: manifest.trials.map((t) => ({ trial_id: t.trial_id, variant: t.variant, skills: t.skills.length })),
      },
    };
  },

  ledger(a) {
    const action = a.positional.shift();
    if (action === 'init') {
      expect(a, ['--ledger', '--limit', '--manifest'], ['--ledger', '--limit']);
      const manifestSha = a.opts['--manifest'] !== undefined
        ? (() => { const m = readJsonFile(a.opts['--manifest']); checkManifest(m, a.opts['--manifest']); return manifestSha256(m); })()
        : null;
      return { out: { entry: initLedger(a.opts['--ledger'], { limit: intOpt(a.opts['--limit'], '--limit'), manifestSha256: manifestSha }) }, sub: 'ledger init' };
    }
    if (action === 'reserve') {
      expect(a, ['--ledger', '--trial-id'], ['--ledger', '--trial-id']);
      return { out: reserveStart(a.opts['--ledger'], a.opts['--trial-id']), sub: 'ledger reserve' };
    }
    if (action === 'result') {
      expect(a, ['--ledger', '--attempt-id', '--outcome', '--trace-sha256', '--raw-id'], ['--ledger', '--attempt-id', '--outcome']);
      return {
        out: recordResult(a.opts['--ledger'], {
          attemptId: intOpt(a.opts['--attempt-id'], '--attempt-id'), outcome: a.opts['--outcome'],
          traceSha256: a.opts['--trace-sha256'] ?? null, rawIds: a.multi['--raw-id'] ?? [],
        }),
        sub: 'ledger result',
      };
    }
    if (action === 'status') {
      expect(a, ['--ledger'], ['--ledger']);
      return { out: { summary: summarize(readLedger(a.opts['--ledger'])) }, sub: 'ledger status' };
    }
    throw new UsageError('eval ledger braucht init|reserve|result|status');
  },

  split(a) {
    const action = a.positional.shift();
    if (action === 'manifest') {
      expect(a, ['--cases', '--manifest-id'], ['--cases', '--manifest-id']);
      return { artifact: buildManifest(parseCases(readJsonFile(a.opts['--cases'])), a.opts['--manifest-id']), sub: 'split manifest' };
    }
    if (action === 'check') {
      expect(a, ['--manifest', '--cases'], ['--manifest']);
      const m = readJsonFile(a.opts['--manifest']);
      const summary = checkManifest(m, a.opts['--manifest']);
      const problems = a.opts['--cases'] !== undefined ? verifyCaseHashes(m, parseCases(readJsonFile(a.opts['--cases']))) : null;
      return { out: { ...summary, case_hash_problems: problems, messages: [] }, code: problems && problems.length > 0 ? 1 : 0, sub: 'split check' };
    }
    if (action === 'access') {
      expect(a, ['--ledger', '--manifest', '--role', '--split', '--candidate-sha256'], ['--ledger', '--manifest', '--role', '--split']);
      const entry = accessSplit(a.opts['--ledger'], readJsonFile(a.opts['--manifest']), {
        role: a.opts['--role'], split: a.opts['--split'], candidateSha256: a.opts['--candidate-sha256'] ?? null,
      });
      return { out: { entry }, sub: 'split access' };
    }
    if (action === 'select') {
      expect(a, ['--ledger', '--manifest', '--role', '--candidate-sha256'], ['--ledger', '--manifest', '--role', '--candidate-sha256']);
      const entry = selectCandidate(a.opts['--ledger'], readJsonFile(a.opts['--manifest']), { role: a.opts['--role'], candidateSha256: a.opts['--candidate-sha256'] });
      return { out: { entry }, sub: 'split select' };
    }
    throw new UsageError('eval split braucht manifest|check|access|select');
  },

  normalize(a) {
    expect(a, ['--trace'], ['--trace']);
    let buf;
    try { buf = fs.readFileSync(a.opts['--trace']); } catch (err) {
      if (err.code === 'ENOENT') throw new UsageError(`${a.opts['--trace']}: Datei nicht gefunden`);
      throw err;
    }
    return { artifact: normalizeTrace(buf, path.basename(a.opts['--trace'])) };
  },

  raw(a) {
    expect(a, ['--meta', '--normalized', '--rubric', '--ledger'], ['--meta', '--normalized']);
    return {
      artifact: buildRawRecord(readJsonFile(a.opts['--meta']), readJsonFile(a.opts['--normalized']), {
        rubric: a.opts['--rubric'] !== undefined ? readJsonFile(a.opts['--rubric']) : null,
        ledger: a.opts['--ledger'] !== undefined ? readLedger(a.opts['--ledger']) : null,
        ledgerLabel: a.opts['--ledger'] !== undefined ? path.basename(a.opts['--ledger']) : 'ledger',
      }),
    };
  },

  report(a) {
    expect(a, ['--check', '--rubric-version'], [], { positionals: true });
    if (a.opts['--check'] !== undefined && a.multi['--rubric-version']) throw new UsageError('--rubric-version gilt nicht mit --check');
    const records = rawFiles(a.positional).map((f) => readJsonFile(f));
    if (a.opts['--check'] !== undefined) {
      const report = readJsonFile(a.opts['--check']);
      const res = checkReport(report, records.map((r) => r?.run_id).filter((x) => typeof x === 'string'));
      const bad = res.schema_errors.length > 0 || res.messages.length > 0;
      return { out: { valid: !bad, schema_errors: res.schema_errors, messages: res.messages }, code: bad ? 1 : 0, sub: 'report --check' };
    }
    return { artifact: buildReport(records, { rubricVersions: a.multi['--rubric-version'] ?? [] }) };
  },

  rubric(a) {
    const action = a.positional.shift();
    if (action !== 'check') throw new UsageError('eval rubric braucht check');
    expect(a, ['--root', '--snapshot'], [], { positionals: true });
    const root = path.resolve(a.opts['--root'] ?? process.cwd());
    let hashes;
    let quelle;
    if (a.opts['--snapshot'] !== undefined) {
      const snap = readJsonFile(a.opts['--snapshot']);
      verifySnapshot(snap, a.opts['--snapshot']);
      const contents = Object.fromEntries(Object.entries(snap.files).map(([p, r]) => [p, r.content]));
      hashes = new Map(packageHashes(contents).map((p) => [p.name, p.sha256]));
      quelle = 'snapshot';
    } else {
      const res = validateProject(root, { adapters: false });
      hashes = new Map(res.packages.filter((p) => p.valid).map((p) => [p.name, p.content_hash]));
      quelle = 'arbeitsbaum';
    }
    const inputs = a.positional.length > 0 ? a.positional : [path.join(root, ...RUBRIC_DIR.split('/'))];
    const files = rawFiles(inputs);
    if (files.length === 0) throw new UsageError('keine Rubrikdatei gefunden');
    const items = files.map((f) => ({ label: displayPath(root, f), fileName: path.basename(f), rubric: readJsonFile(f, displayPath(root, f)) }));
    const res = checkRubrics(items, hashes);
    return {
      out: { checked_level: 'Rubrik (SLV0-EVAL-13/-14)', hash_quelle: quelle, rubriken: res.rubriken, messages: res.messages },
      code: res.messages.length > 0 ? 1 : 0,
      sub: 'rubric check',
    };
  },
};

export const RUBRIC_DIR = 'docs/research/rubriken';

/** Repo-relative path with '/' when inside root, else the base name (no absolute paths, INV-03). */
function displayPath(root, file) {
  const rel = path.relative(root, path.resolve(file));
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) return path.basename(file);
  return rel.split(path.sep).join('/');
}

/** Run an eval subcommand. EvalRefusal → exit 1 envelope; UsageError propagates (exit 2). */
export function runEval(argv) {
  const [sub, ...rest] = argv;
  if (!sub || !Object.hasOwn(SUB, sub)) throw new UsageError(`eval braucht einen Unterbefehl: ${Object.keys(SUB).join('|')}`);
  const args = parse(rest);
  try {
    const res = SUB[sub](args);
    if (res.artifact !== undefined) return { out: res.artifact, code: 0 };
    return { out: header(res.sub ?? sub, res.out), code: res.code ?? 0 };
  } catch (err) {
    if (!(err instanceof EvalRefusal)) throw err;
    const action = (sub === 'ledger' || sub === 'split' || sub === 'rubric') && rest[0] && !rest[0].startsWith('--') ? `${sub} ${rest[0]}` : sub;
    return { out: header(action, { refused: true, ...err.extra, messages: err.messages }), code: 1 };
  }
}
