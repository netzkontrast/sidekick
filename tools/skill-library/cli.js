#!/usr/bin/env node
// CLI for the skill library (docs/spec/skill-library-v0.md, Stufe 0–2).
// Subcommands: validate, hash, tokens, registry-check (read-only) and `eval …` (harness, lib/eval/).
// JSON on stdout. Exit codes (SLV0-VAL-17): 0 no error, 1 at least one error or refusal,
// 2 usage error or internal exception. No network, no model, no client start (SLV0-INV-04);
// nothing under .agents/skills/ is written (SLV0-INV-08). Only `eval prepare`, `eval ledger
// init|reserve|result`, `eval split access|select` and `eval context-pack --output` write, only to
// explicit paths, never overwriting.
// `questions …` (lib/questions/, docs/spec/questions-cli-v0.md) writes only below its --root, atomically.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  TOOL_NAME, TOOL_VERSION, HASH_PROFILE, HASH_ALGORITHM, CHECKED_LEVEL,
  countBySeverity, sortMessages, sha256Hex, hashOfFileMap,
} from './lib/core.js';
import { validatePackage } from './lib/package.js';
import { validateProject, UsageError } from './lib/project.js';
import { checkRegistry, loadSchema, DEFAULT_SCHEMA_PATH } from './lib/registry.js';
import { countPackage, runUsageFromTrace, ESTIMATORS } from './lib/tokens.js';
import { runEval, EVAL_USAGE } from './lib/eval/cli.js';
import { runQuestions, QUESTIONS_USAGE } from './lib/questions/cli.js';

const USAGE = `Aufruf: node tools/skill-library/cli.js <befehl> [optionen]

  validate [--scope project] [--root DIR] [--project-list DATEI]
  validate --scope package PAKETORDNER... [--project-list DATEI]
  hash [--scope project] [--root DIR]
  hash --scope package PAKETORDNER...
  hash --snapshot SNAPSHOT.json
  tokens [--scope project] [--root DIR] [--estimator utf8-bytes-div-4@1] [--token-budget N]
  tokens --scope package PAKETORDNER... [--estimator ...] [--token-budget N]
  tokens --trace NORMALISIERTE-SPUR.json
  registry-check DATENSATZ.json... [--root DIR] [--schema-only] [--schema DATEI]
${EVAL_USAGE}
${QUESTIONS_USAGE}

Ausgabe: JSON auf stdout. Exit 0 ohne Fehler, 1 mit Fehler, 2 bei Bedienfehler.`;

const VALUE_OPTS = new Set(['--scope', '--root', '--project-list', '--estimator', '--token-budget', '--trace', '--snapshot', '--schema']);
const FLAG_OPTS = new Set(['--schema-only', '--help']);

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const opts = {};
  const positional = [];
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    if (VALUE_OPTS.has(a)) {
      if (i + 1 >= rest.length) throw new UsageError(`Option ${a} braucht einen Wert`);
      if (opts[a] !== undefined) throw new UsageError(`Option ${a} mehrfach angegeben`);
      opts[a] = rest[i + 1];
      i += 1;
    } else if (FLAG_OPTS.has(a)) {
      opts[a] = true;
    } else if (a.startsWith('--')) {
      throw new UsageError(`unbekannte Option ${a}`);
    } else {
      positional.push(a);
    }
  }
  return { command, opts, positional };
}

function header(command, extra = {}) {
  return { tool: TOOL_NAME, tool_version: TOOL_VERSION, command, ...extra };
}

function readProjectList(file) {
  if (file === undefined) return null;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(data) || !data.every((s) => typeof s === 'string')) {
    throw new UsageError('--project-list erwartet eine JSON-Liste von Zeichenketten');
  }
  return data;
}

function scopeOf(opts) {
  const scope = opts['--scope'] ?? 'project';
  if (scope !== 'project' && scope !== 'package') throw new UsageError('--scope muss package oder project sein');
  return scope;
}

function rootOf(opts) {
  return path.resolve(opts['--root'] ?? process.cwd());
}

function loadPackages(scope, opts, positional, projectStrings) {
  if (scope === 'project') {
    if (positional.length > 0) throw new UsageError('Bereich project nimmt keine Paketordner; --root verwenden');
    return { ...validateProject(rootOf(opts), { projectStrings, adapters: true }), scope };
  }
  if (opts['--root'] !== undefined) throw new UsageError('--root gilt nur für Bereich project');
  if (positional.length === 0) throw new UsageError('Bereich package braucht mindestens einen Paketordner');
  const packages = [];
  const messages = [];
  for (const dir of positional) {
    const abs = path.resolve(dir);
    if (!fs.existsSync(abs) && !isSymlink(abs)) throw new UsageError(`Paketordner nicht gefunden: ${dir}`);
    const res = validatePackage(abs, { projectStrings });
    packages.push(res);
    messages.push(...res.messages);
  }
  return { packages, messages: sortMessages(messages), package_set_hash: null, scope };
}

function isSymlink(p) {
  try { return fs.lstatSync(p).isSymbolicLink(); } catch { return false; }
}

function packageSummary(p) {
  return { name: p.name, path: p.path, valid: p.valid, content_hash: p.content_hash };
}

function cmdValidate({ opts, positional }) {
  const scope = scopeOf(opts);
  const projectStrings = readProjectList(opts['--project-list']);
  const res = loadPackages(scope, opts, positional, projectStrings);
  const counts = countBySeverity(res.messages);
  const out = header('validate', {
    scope,
    checked_level: CHECKED_LEVEL,
    hash: { algorithm: HASH_ALGORITHM, profile: HASH_PROFILE },
    project_list_checked: projectStrings !== null && projectStrings.length > 0,
    summary: { errors: counts.errors, warnings: counts.warnings, packages: res.packages.length, valid_packages: res.packages.filter((p) => p.valid).length },
    packages: res.packages.map(packageSummary),
    ...(scope === 'project' ? { package_set_hash: res.package_set_hash } : {}),
    messages: res.messages,
  });
  return { out, code: counts.errors > 0 ? 1 : 0 };
}

function cmdHash({ opts, positional }) {
  if (opts['--snapshot'] !== undefined) {
    if (positional.length > 0 || opts['--scope'] !== undefined || opts['--root'] !== undefined) throw new UsageError('--snapshot steht allein');
    const snap = JSON.parse(fs.readFileSync(opts['--snapshot'], 'utf8'));
    return hashSnapshot(snap);
  }
  const scope = scopeOf(opts);
  const res = loadPackages(scope, opts, positional, null);
  const errors = res.messages.filter((m) => m.severity === 'error');
  const out = header('hash', {
    scope,
    hash: { algorithm: HASH_ALGORITHM, profile: HASH_PROFILE },
    packages: res.packages.map(packageSummary),
    ...(scope === 'project' ? { package_set_hash: res.package_set_hash } : {}),
    refused: errors.length > 0
      ? 'Mindestens ein Paket ist ungültig; ungültige Pakete erhalten keinen Hash (SLV0-PKG-20). Details: validate.'
      : null,
    messages: errors,
  });
  return { out, code: errors.length > 0 ? 1 : 0 };
}

/** Package-set hash of a frozen snapshot (SLV0-PKG-23, SLV0-FALL-23). */
export function hashSnapshot(snap) {
  const messages = [];
  if (!snap || typeof snap !== 'object' || !snap.files || typeof snap.files !== 'object') {
    throw new UsageError('Snapshot ohne files-Objekt');
  }
  const map = {};
  for (const [p, rec] of Object.entries(snap.files)) {
    if (!p.startsWith('.agents/skills/') || p.includes('\\') || p.split('/').includes('..')) {
      throw new UsageError(`Snapshot-Pfad nicht unter .agents/skills/: ${p} (SLV0-EVAL-01)`);
    }
    if (!rec || typeof rec.content !== 'string' || typeof rec.sha256 !== 'string') {
      throw new UsageError(`Snapshot-Eintrag ohne content/sha256: ${p}`);
    }
    const h = sha256Hex(Buffer.from(rec.content, 'utf8'));
    if (h !== rec.sha256) {
      messages.push({ path: p, line: null, code: 'snapshot_hash_mismatch', severity: 'error', rule: 'SLV0-EVAL-02', message: 'Dateihash passt nicht zum Inhalt' });
    }
    map[p] = h;
  }
  const computed = hashOfFileMap(map);
  const recorded = snap.package_set_sha256 ?? null;
  if (recorded !== null && recorded !== computed) {
    messages.push({ path: '', line: null, code: 'snapshot_hash_mismatch', severity: 'error', rule: 'SLV0-EVAL-02', message: 'Paketsatz-Hash ungleich gespeichertem Wert' });
  }
  const out = header('hash', {
    scope: 'snapshot',
    hash: { algorithm: HASH_ALGORITHM, profile: HASH_PROFILE },
    source_commit: snap.source_commit ?? null,
    files: Object.keys(map).length,
    package_set_hash: messages.length === 0 ? computed : null,
    recorded_package_set_hash: recorded,
    messages: sortMessages(messages),
  });
  return { out, code: messages.length > 0 ? 1 : 0 };
}

function cmdTokens({ opts, positional }) {
  const estimator = opts['--estimator'] ?? null;
  if (estimator !== null && !Object.hasOwn(ESTIMATORS, estimator)) throw new UsageError(`unbekannter Schätzer ${estimator}; verfügbar: ${Object.keys(ESTIMATORS).join(', ')}`);
  let tokenBudget = null;
  if (opts['--token-budget'] !== undefined) {
    if (!/^[0-9]+$/.test(opts['--token-budget'])) throw new UsageError('--token-budget erwartet eine nichtnegative Ganzzahl');
    tokenBudget = Number(opts['--token-budget']);
  }
  if (opts['--trace'] !== undefined) {
    if (positional.length > 0 || opts['--scope'] !== undefined || estimator !== null || tokenBudget !== null) throw new UsageError('--trace steht allein');
    const trace = JSON.parse(fs.readFileSync(opts['--trace'], 'utf8'));
    return { out: header('tokens', { scope: 'trace', ...runUsageFromTrace(trace) }), code: 0 };
  }
  const scope = scopeOf(opts);
  const res = loadPackages(scope, opts, positional, null);
  const errors = res.messages.filter((m) => m.severity === 'error');
  const counted = res.packages.filter((p) => p.valid).map((p) => countPackage(p, { estimator, tokenBudget }));
  const warnings = counted.flatMap((c) => c.warnings);
  const out = header('tokens', {
    scope,
    estimator,
    hinweis: 'Bytes, Zeilen und Wörter sind exakt und keine Tokens. Ohne Schätzer sind alle Tokenwerte unbekannt (SLV0-TOK-04).',
    packages: counted.map(({ warnings: _w, ...rest }) => rest), // eslint-disable-line no-unused-vars
    not_counted: res.packages.filter((p) => !p.valid).map((p) => p.path),
    messages: sortMessages([...errors, ...warnings]),
  });
  return { out, code: errors.length > 0 ? 1 : 0 };
}

function cmdRegistry({ opts, positional }) {
  if (positional.length === 0) throw new UsageError('registry-check braucht mindestens eine Datensatzdatei');
  if (opts['--scope'] !== undefined) throw new UsageError('registry-check kennt kein --scope');
  const schemaPath = opts['--schema'] ?? DEFAULT_SCHEMA_PATH;
  const schema = loadSchema(schemaPath);
  const inputs = positional.map((file) => ({ display: file, text: fs.readFileSync(file, 'utf8') }));
  const schemaOnly = Boolean(opts['--schema-only']);
  const res = checkRegistry(inputs, { schema, repoRoot: schemaOnly ? null : rootOf(opts), schemaOnly });
  const counts = countBySeverity(res.messages);
  const out = header('registry-check', {
    hash: { algorithm: HASH_ALGORITHM, profile: HASH_PROFILE },
    hash_compared: !schemaOnly,
    summary: { errors: counts.errors, warnings: counts.warnings, records: res.records.length },
    records: res.records,
    messages: res.messages,
  });
  return { out, code: counts.errors > 0 ? 1 : 0 };
}

const COMMANDS = { validate: cmdValidate, hash: cmdHash, tokens: cmdTokens, 'registry-check': cmdRegistry };

export function run(argv) {
  try {
    if (argv[0] === 'eval') return runEval(argv.slice(1));
    if (argv[0] === 'questions') return runQuestions(argv.slice(1));
    const parsed = parseArgs(argv);
    if (!parsed.command || parsed.command === '--help' || parsed.opts['--help']) {
      return { out: header('help', { usage: USAGE }), code: parsed.command ? 0 : 2 };
    }
    const fn = COMMANDS[parsed.command];
    if (!fn) throw new UsageError(`unbekannter Befehl ${parsed.command}`);
    return fn(parsed);
  } catch (err) {
    const usage = err instanceof UsageError || err.code === 'ENOENT' || err instanceof SyntaxError;
    return {
      out: header(argv[0] ?? null, { error: { kind: usage ? 'usage' : 'internal', message: err.message } }),
      code: 2,
      stderr: usage ? `${err.message}\n\n${USAGE}\n` : `${err.stack}\n`,
    };
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { out, code, stderr } = run(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  if (stderr) process.stderr.write(stderr);
  process.exitCode = code;
}
