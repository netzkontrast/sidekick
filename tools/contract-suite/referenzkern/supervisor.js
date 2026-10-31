// Prototype run supervisor for the contract suite (docs/spec/runtime-adapter-v0.md, plan item M1.4).
// DISPOSABLE: shows that the RTA cases are testable; the real supervisor is built in phase 1 (RS-4).
// Starts a runtime from a validated adapter profile without a shell, in its own process group,
// with an allowlisted environment, and reports observable run events through `emit`.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateSchema } from '../../skill-library/lib/schema.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA = JSON.parse(fs.readFileSync(path.join(HERE, '..', '..', '..', 'docs', 'spec', 'schemas', 'runtime-adapter-profil.schema.json'), 'utf8'));

/** Patterns that must never appear in a profile fragment (RTA-PRF-04). Deliberately small; list is an open point of the spec. */
export const SECRET_PATTERNS = [/\$\{\{\s*secrets\./i, /^sk-[A-Za-z0-9_-]{8,}/, /--api-key=/i, /\bghp_[A-Za-z0-9]{20,}/, /\b(password|passwort|token)=\S+/i];

export class ProfilFehler extends Error {
  constructor(code, pfad, meldung) { super(`${code} ${pfad}: ${meldung}`); this.code = code; this.pfad = pfad; }
}

function fragments(profile) {
  const out = [];
  const add = (pfad, f) => { if (Array.isArray(f)) out.push({ pfad, f }); };
  add('befehl.basis', profile.befehl?.basis);
  add('befehl.prompt.fragment', profile.befehl?.prompt?.fragment);
  add('befehl.modell_fragment', profile.befehl?.modell_fragment);
  for (const k of ['fragment', 'neu_fragment', 'fortsetzen_fragment']) add(`session.${k}`, profile.session?.[k]);
  for (const [name, f] of Object.entries(profile.rechte?.stufen ?? {})) add(`rechte.stufen.${name}`, f);
  return out;
}

/** Validate a profile at load time (RTA-PRF-01…05, -07, RTA-CAP-01/-04). Returns a frozen copy. */
export function loadProfile(profile) {
  const errs = validateSchema(SCHEMA, profile);
  if (errs.length > 0) throw new ProfilFehler('schema', errs[0].pointer || '/', errs[0].message);
  const need = (pfad, f, ph) => { if (f && !f.some((x) => x.includes(ph))) throw new ProfilFehler('platzhalter', pfad, `Platzhalter ${ph} fehlt`); };
  need('befehl.modell_fragment', profile.befehl.modell_fragment, '{modell}');
  need('befehl.prompt.fragment', profile.befehl.prompt.fragment, '{prompt}');
  for (const k of ['fragment', 'neu_fragment', 'fortsetzen_fragment']) need(`session.${k}`, profile.session[k], '{session}');
  if (profile.session.form === 'erfasst' && (profile.ausgabe.format === 'text' || !profile.ausgabe.session_pfad)) {
    throw new ProfilFehler('session_form', 'session.form', 'erfasst braucht session_pfad und ein Format außer text');
  }
  if (Object.keys(profile.rechte.stufen).length === 0) throw new ProfilFehler('rechtestufe', 'rechte.stufen', 'mindestens eine Rechtestufe nötig');
  const verboten = new Set([...profile.rechte.verbotene_flags, ...profile.arbeitsverzeichnis.verbotene_flags]);
  for (const { pfad, f } of fragments(profile)) {
    for (const x of f) {
      if (SECRET_PATTERNS.some((re) => re.test(x))) throw new ProfilFehler('secret', pfad, 'Baustein enthält ein Secret-artiges Element (Wert nicht ausgegeben)');
      if (verboten.has(x)) throw new ProfilFehler('verboten', pfad, `verbotenes Element ${x}`);
    }
  }
  return Object.freeze(structuredClone(profile));
}

function getPath(obj, p) {
  let cur = obj;
  for (const part of p.replace(/^\$\.?/, '').split('.').filter(Boolean)) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = cur[part];
  }
  return cur;
}

const sub = (f, map) => f.map((x) => x.replace(/\{(prompt|session|modell)\}/g, (_, k) => map[k]));

/** Argument list in the order of RTA-AUF-01; no shell, no free extra arguments (RTA-AUF-03). */
export function buildArgv(profile, { prompt, modell, session, fortsetzen, rechtestufe }) {
  const argv = [...profile.befehl.basis];
  if (modell) argv.push(...sub(profile.befehl.modell_fragment, { modell }));
  const s = profile.session;
  if (session) {
    if (s.form === 'idempotent') argv.push(...sub(s.fragment, { session }));
    else if (fortsetzen) argv.push(...sub(s.fortsetzen_fragment, { session }));
    else if (s.form === 'paar') argv.push(...sub(s.neu_fragment, { session }));
  }
  argv.push(...profile.rechte.stufen[rechtestufe]);
  let stdin = null;
  if (profile.befehl.prompt.art === 'stdin') stdin = prompt;
  else argv.push(...sub(profile.befehl.prompt.fragment, { prompt }));
  return { argv, stdin };
}

function groupAlive(pid) {
  try { process.kill(-pid, 0); return true; } catch { return false; }
}

export class Supervisor {
  /**
   * @param {object} o
   * @param {object} o.profile validated via loadProfile
   * @param {string} o.geraetId device this supervisor runs on (capacity scope, RTA-LEB-09)
   * @param {string} o.arbeitsRoot directory for per-run work directories
   * @param {object} [o.credentials] name → value from the device credential store (RTA-AUF-05)
   * @param {object} [o.hostEnv] connector environment; only allowlisted names pass (RTA-AUF-07)
   * @param {(ev: object) => void} o.emit observable run events
   * @param {string} [o.cwdBase] resolves relative program and first basis element (fake runtime)
   */
  constructor({ profile, geraetId, arbeitsRoot, credentials = {}, hostEnv = process.env, emit, cwdBase = null }) {
    this.profile = profile;
    this.geraetId = geraetId;
    this.arbeitsRoot = arbeitsRoot;
    this.credentials = credentials;
    this.hostEnv = hostEnv;
    this.emit = emit;
    this.cwdBase = cwdBase;
    this.runs = new Map();
  }

  programmVorhanden() {
    const p = this.profile.runtime.programm;
    if (path.isAbsolute(p)) return fs.existsSync(p);
    return (this.hostEnv.PATH ?? '').split(path.delimiter).some((d) => d && fs.existsSync(path.join(d, p)));
  }

  /** Capability report (RTA-CAP-03, RTA-PRF-06). */
  capability() {
    const ok = this.programmVorhanden();
    return {
      art: 'runtime', profil_id: this.profile.id, profil_version: this.profile.version, geraet_id: this.geraetId,
      quelle: ok ? 'nachgewiesen' : 'behauptet', befund: ok ? null : `Programm ${this.profile.runtime.programm} nicht gefunden`,
      faehigkeiten: Object.fromEntries(Object.entries(this.profile.faehigkeiten).map(([k, v]) => [k, v.status])),
    };
  }

  replaceProfile(profile) { this.profile = profile; }

  laufend() { return [...this.runs.values()].filter((r) => r.laeuft).length; }

  unsupported(faehigkeit) { return { ok: false, fehler: 'unsupported', faehigkeit }; }

  /** Start a run; returns at once (RTA-LEB-02). Results arrive via emit. */
  start({ runId, auftragId, epoch, prompt, modell = null, rechtestufe, fortsetzenVon = null }) {
    const profile = this.profile; // bound for this run (RTA-PRF-08)
    if (!this.programmVorhanden()) return { ok: false, fehler: 'programm_fehlt' };
    if (modell && !profile.befehl.modell_fragment) return this.unsupported('modellwahl');
    if (modell && profile.faehigkeiten.modellwahl && profile.faehigkeiten.modellwahl.status !== 'nachgewiesen') return this.unsupported('modellwahl');
    if (!Object.hasOwn(profile.rechte.stufen, rechtestufe)) return this.unsupported('rechtestufe');
    let session = null;
    let fortsetzen = false;
    if (fortsetzenVon) {
      if (profile.faehigkeiten.resume.status !== 'nachgewiesen') return this.unsupported('resume');
      const vor = this.runs.get(fortsetzenVon);
      if (!vor || !vor.sessionId) return { ok: false, fehler: 'session_unbekannt' };
      if (vor.gefenced && vor.laeuft) return { ok: false, fehler: 'session_gesperrt' }; // RTA-SES-05
      session = vor.sessionId;
      fortsetzen = true;
    } else if (profile.session.form === 'paar' || profile.session.form === 'idempotent') {
      session = crypto.randomUUID();
    }
    if (this.laufend() >= profile.grenzen.max_parallel) return { ok: false, fehler: 'kapazitaet_erschoepft' };

    const arbeitsverzeichnis = fs.mkdtempSync(path.join(this.arbeitsRoot, `${runId}-`));
    const { argv, stdin } = buildArgv(profile, { prompt, modell, session, fortsetzen, rechtestufe });
    let programm = profile.runtime.programm;
    if (this.cwdBase && !path.isAbsolute(argv[0]) && argv[0].endsWith('.js')) argv[0] = path.join(this.cwdBase, argv[0]);
    if (programm === 'node') programm = process.execPath;
    const env = {};
    for (const name of profile.umgebung.erlaubt) if (this.hostEnv[name] !== undefined) env[name] = this.hostEnv[name];
    Object.assign(env, this.credentials, { PWD: arbeitsverzeichnis });

    const run = { runId, auftragId, epoch, profilVersion: profile.version, laeuft: true, gefenced: false, sessionId: profile.session.form === 'erfasst' ? null : session, abbruch: false, timeout: false, kind: null };
    this.runs.set(runId, run);
    const base = { run_id: runId, auftrag_id: auftragId, epoch, profil_version: profile.version };
    this.emit({ typ: 'run.starting', ...base });

    const child = spawn(programm, argv, { cwd: arbeitsverzeichnis, env, detached: true, stdio: ['pipe', 'pipe', 'ignore'], shell: false });
    run.kind = child;
    this.emit({ typ: 'run.running', ...base, argv_laenge: argv.length });
    if (stdin !== null) child.stdin.end(stdin); else child.stdin.end();

    let rest = '';
    let ergebnis = null;
    let uebersprungen = 0;
    const befunde = [];
    const usage = { eingabe_tokens: null, ausgabe_tokens: null, kosten_usd: null };
    const zeile = (l) => {
      if (l.trim() === '') return;
      let o;
      try { o = JSON.parse(l); } catch { uebersprungen += 1; return; }
      if (profile.ausgabe.ergebnis_pfad) {
        const r = getPath(o, profile.ausgabe.ergebnis_pfad);
        if (typeof r === 'string' && r !== '') ergebnis = r; // last non-empty match (RTA-AUS-02)
      }
      if (profile.ausgabe.session_pfad) {
        const sid = getPath(o, profile.ausgabe.session_pfad);
        if (typeof sid === 'string') {
          if (run.sessionId === null) run.sessionId = sid;
          else if (sid !== run.sessionId) befunde.push({ art: 'abweichende_session_id', wert: sid }); // RTA-SES-02
        }
      }
      for (const [k, p] of Object.entries(profile.ausgabe.verbrauch ?? {})) {
        const v = getPath(o, p);
        if (typeof v === 'number') usage[k] = v;
      }
    };
    let roh = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (c) => {
      roh += c;
      rest += c;
      const teile = rest.split('\n');
      rest = teile.pop();
      teile.forEach(zeile);
    });
    const timer = setTimeout(() => { run.timeout = true; this.#killGroup(child); }, profile.grenzen.timeout_s * 1000);

    child.on('close', async (code) => {
      clearTimeout(timer);
      if (rest) zeile(rest);
      await this.#waitGroupGone(child.pid);
      run.laeuft = false;
      const ausgabe = { ...base, session_id: run.sessionId, uebersprungene_zeilen: uebersprungen, befunde };
      if (usage.eingabe_tokens !== null || usage.kosten_usd !== null) {
        this.emit({ typ: 'run.usage_reported', ...base, quelle: 'runtime', ...usage, kosten_usd: usage.kosten_usd ?? 'unbekannt' });
      } else {
        this.emit({ typ: 'run.usage_reported', ...base, quelle: 'unbekannt', eingabe_tokens: null, ausgabe_tokens: null, kosten_usd: 'unbekannt' });
      }
      if (run.abbruch) { this.emit({ typ: 'run.cancel_confirmed', ...ausgabe }); return; }
      const ergebnisFeld = ergebnis !== null ? { ergebnis, ergebnis_quelle: 'pfad' } : { ergebnis_ref: `roh:${crypto.createHash('sha256').update(roh).digest('hex')}`, ergebnis_quelle: 'roh' };
      if (run.timeout) this.emit({ typ: 'run.exited_error', grund: 'timeout', ...ausgabe, ...ergebnisFeld });
      else if (code === 0) this.emit({ typ: 'run.exited_ok', ...ausgabe, ...ergebnisFeld });
      else this.emit({ typ: 'run.exited_error', grund: `exit ${code}`, ...ausgabe, ...ergebnisFeld });
    });
    return { ok: true, run_id: runId, session_id: run.sessionId };
  }

  #killGroup(child) {
    try { process.kill(-child.pid, 'SIGKILL'); } catch { try { child.kill('SIGKILL'); } catch { /* gone */ } }
  }

  async #waitGroupGone(pid) {
    for (let i = 0; i < 100 && groupAlive(pid); i += 1) await new Promise((r) => setTimeout(r, 20));
  }

  /** Owner cancel: cancel_requested first, cancel_confirmed only when no process of the group runs (RTA-LEB-04). */
  cancel(runId) {
    const run = this.runs.get(runId);
    if (!run || !run.laeuft) return { ok: false, fehler: 'unbekannt' };
    run.abbruch = true;
    this.emit({ typ: 'run.cancel_requested', run_id: runId, auftrag_id: run.auftragId, epoch: run.epoch, profil_version: run.profilVersion });
    this.#killGroup(run.kind);
    return { ok: true };
  }

  /** Claim fenced or expired: end the process group like a cancel (RTA-LEB-08). */
  fence(runId) {
    const run = this.runs.get(runId);
    if (!run) return { ok: false };
    run.gefenced = true;
    return run.laeuft ? this.cancel(runId) : { ok: true };
  }

  /** After a connector restart: no blind restart; runs become lost unless re-attachment is proven (RTA-LEB-06). */
  recover(persistierteRuns) {
    for (const r of persistierteRuns) {
      if (this.profile.faehigkeiten.wiederanbindung.status === 'nachgewiesen') continue;
      this.emit({ typ: 'run.lost', run_id: r.run_id, auftrag_id: r.auftrag_id, epoch: r.epoch, profil_version: r.profil_version });
    }
  }
}

export const tmpRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), 'rta-'));
