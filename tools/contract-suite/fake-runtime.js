#!/usr/bin/env node
// Deterministic fake coding runtime for the contract suite (plan item M1.2, runtime-adapter-v0.md).
// Its behaviour comes from the prompt on stdin, which must be a JSON plan:
//   { "zeilen": [<objects or raw strings to print as JSON lines>],
//     "diag": true,            print {type:"diag", argv, env, cwd, prompt} first
//     "kind": true,            spawn a long-lived child process (same process group)
//     "haengen": true,         never exit by itself
//     "exit": 0 }              exit code (default 0)
// It echoes a session id it was started with (--session-id / --resume) as {type:"system", session_id}.
import { spawn } from 'node:child_process';

const argv = process.argv.slice(2);
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { input += c; });
process.stdin.on('end', () => {
  let plan;
  try { plan = JSON.parse(input || '{}'); } catch { plan = { zeilen: [{ type: 'result', result: input }] }; }
  const out = (o) => process.stdout.write(`${typeof o === 'string' ? o : JSON.stringify(o)}\n`);
  const sessionFlag = argv.findIndex((a) => a === '--session-id' || a === '--resume');
  if (sessionFlag >= 0) out({ type: 'system', session_id: argv[sessionFlag + 1], fortsetzen: argv[sessionFlag] === '--resume' });
  if (plan.diag) out({ type: 'result', result: JSON.stringify({ argv, env: process.env, cwd: process.cwd(), prompt: input }) });
  if (plan.kind) {
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
    out({ type: 'kind', pid: child.pid });
  }
  for (const z of plan.zeilen ?? []) out(z);
  if (plan.haengen) { setInterval(() => {}, 1000); return; }
  process.exitCode = plan.exit ?? 0;
  if (plan.kind) process.exit(process.exitCode);
});
