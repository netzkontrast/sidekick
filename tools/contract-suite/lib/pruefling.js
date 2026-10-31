// Client for the kern-port test boundary (docs/spec/kern-port-v0.md §3): starts the Prüfling as its
// own process and exchanges one JSON line per request and response. The Prüfling command comes
// from CONTRACT_KERN (space-separated); default is the disposable reference core.
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_KERN = ['node', path.join(HERE, '..', 'referenzkern', 'kern.js')];

export function startPruefling(command = process.env.CONTRACT_KERN ? process.env.CONTRACT_KERN.split(' ') : DEFAULT_KERN) {
  const child = spawn(command[0], command.slice(1), { stdio: ['pipe', 'pipe', 'inherit'] });
  const rl = readline.createInterface({ input: child.stdout });
  const waiting = [];
  rl.on('line', (line) => { const w = waiting.shift(); if (w) w(line); });
  let n = 0;
  let keyN = 0;
  const raw = (line) => new Promise((resolve) => { waiting.push((l) => resolve(JSON.parse(l))); child.stdin.write(`${line}\n`); });
  const api = {
    raw,
    /** Send one request; `key` null for reads, undefined → a fresh key. */
    send(command, akteur, args = {}, key) {
      n += 1;
      const req = { schema_version: '0.1', art: 'anfrage', id: `req-${n}`, command, akteur, args };
      const isRead = ['journal.read', 'state.get', 'context.get'].includes(command) || command.startsWith('test.');
      if (!isRead) req.idempotenz_key = key ?? `k-auto-${String(++keyN).padStart(4, '0')}`;
      return raw(JSON.stringify(req));
    },
    async journal() { return (await api.send('journal.read', SUITE, {})).ergebnis.ereignisse; },
    async state(entitaet, id) { return (await api.send('state.get', SUITE, { entitaet, id })).ergebnis; },
    close() { child.stdin.end(); return new Promise((r) => child.on('close', r)); },
  };
  return api;
}

export const SUITE = { art: 'suite', id: 'suite' };
export const OWNER = (geraet = 'g-browser-a') => (geraet ? { art: 'owner', id: 'owner', geraet_id: geraet } : { art: 'owner', id: 'owner' });
export const GERAET = (id) => ({ art: 'geraet', id });
export const RUN = (id) => ({ art: 'run', id });
export const ADAPTER = { art: 'effekt_adapter', id: 'fake-effekt' };
