// Contract tests for the runtime adapter (docs/spec/runtime-adapter-v0.md) against the prototype
// supervisor and the deterministic fake runtime. Test names start with the case ID.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

// The supervisor under test; CONTRACT_SUPERVISOR points to another implementation of the same module API.
const { loadProfile, Supervisor, ProfilFehler, buildArgv, tmpRoot } = await import(
  process.env.CONTRACT_SUPERVISOR ? pathToFileURL(path.resolve(process.env.CONTRACT_SUPERVISOR)).href : '../referenzkern/supervisor.js'
);

const SUITE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.join(SUITE_DIR, '..', '..');
const TEMPLATE = JSON.parse(fs.readFileSync(path.join(SUITE_DIR, 'profile', 'fake-runtime.json'), 'utf8'));
const CLAUDE = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'spec', 'beispiele', 'runtime-adapter-claude-code.json'), 'utf8'));
const clone = (o) => structuredClone(o);

function profil(mut = (p) => p) { return loadProfile(mut(clone(TEMPLATE))); }
function ladeFehler(p, code) {
  assert.throws(() => loadProfile(p), (e) => e instanceof ProfilFehler && e.code === code, `erwartet ${code}`);
}

function sup({ profile = profil(), geraetId = 'g-pc-heim', credentials = {}, hostEnv = process.env } = {}) {
  const events = [];
  const waiters = [];
  const s = new Supervisor({
    profile, geraetId, arbeitsRoot: tmpRoot(), credentials, hostEnv, cwdBase: SUITE_DIR,
    emit: (ev) => { events.push(ev); waiters.filter((w) => w.pred(ev)).forEach((w) => { waiters.splice(waiters.indexOf(w), 1); w.resolve(ev); }); },
  });
  s.events = events;
  s.warte = (typ, runId) => {
    const pred = (ev) => ev.typ === typ && (!runId || ev.run_id === runId);
    const found = events.find(pred);
    return found ? Promise.resolve(found) : new Promise((resolve) => waiters.push({ pred, resolve }));
  };
  s.ende = (runId) => new Promise((resolve) => {
    const done = (ev) => ['run.exited_ok', 'run.exited_error', 'run.cancel_confirmed'].includes(ev.typ) && ev.run_id === runId;
    const found = events.find(done);
    if (found) resolve(found); else waiters.push({ pred: done, resolve });
  });
  return s;
}
const plan = (p) => JSON.stringify(p);
const START = (extra = {}) => ({ runId: 'r-1', auftragId: 'a-1', epoch: 1, rechtestufe: 'nur_lesen', prompt: plan({ zeilen: [{ type: 'result', result: 'fertig' }] }), ...extra });
async function diag(s, extra = {}) {
  const runId = extra.runId ?? 'r-1';
  const r = s.start(START({ prompt: plan({ diag: true }), ...extra }));
  assert.equal(r.ok, true, JSON.stringify(r));
  const ende = await s.ende(runId);
  return { r, ende, d: JSON.parse(ende.ergebnis) };
}

// ---------- Profile loading (RTA-PRF) ----------

test('RTA-FALL-01 unknown key extra_args fails loading', () => {
  ladeFehler({ ...clone(TEMPLATE), extra_args: ['--x'] }, 'schema');
});
test('RTA-FALL-02 model fragment without {modell} fails loading', () => {
  const p = clone(TEMPLATE); p.befehl.modell_fragment = ['--model', 'fix'];
  ladeFehler(p, 'platzhalter');
});
test('RTA-FALL-03 form paar without fortsetzen_fragment fails loading', () => {
  const p = clone(TEMPLATE); delete p.session.fortsetzen_fragment;
  ladeFehler(p, 'schema');
});
test('RTA-FALL-04 form erfasst with format text fails loading', () => {
  const p = clone(TEMPLATE); p.session = { form: 'erfasst', fortsetzen_fragment: ['--resume', '{session}'] }; p.ausgabe = { format: 'text' };
  ladeFehler(p, 'session_form');
});
test('RTA-FALL-05 secret in a fragment fails loading and the value is not echoed', () => {
  const p = clone(TEMPLATE); p.befehl.basis = [...p.befehl.basis, '--api-key=sk-geheim12345678'];
  assert.throws(() => loadProfile(p), (e) => e.code === 'secret' && !e.message.includes('sk-geheim'));
});
test('RTA-FALL-06 forbidden permission flag or value in a rights level fails loading', () => {
  const a = clone(TEMPLATE); a.rechte.stufen.alles = ['--dangerously-skip-permissions'];
  ladeFehler(a, 'verboten');
  const b = clone(TEMPLATE); b.rechte.stufen.alles = ['--permission-mode', 'bypassPermissions'];
  ladeFehler(b, 'verboten');
});
test('RTA-FALL-07 work directory flag in the base fails loading', () => {
  const p = clone(TEMPLATE); p.befehl.basis = [...p.befehl.basis, '-w'];
  ladeFehler(p, 'verboten');
});
test('RTA-FALL-08 missing program: capability behauptet with finding, no run starts', () => {
  const s = sup({ profile: profil((p) => { p.runtime.programm = 'gibt-es-nicht-xyz'; return p; }) });
  const cap = s.capability();
  assert.equal(cap.quelle, 'behauptet');
  assert.match(cap.befund, /nicht gefunden/);
  assert.deepEqual(s.start(START()), { ok: false, fehler: 'programm_fehlt' });
});
test('RTA-FALL-09 profile without rights levels is invalid', () => {
  const p = clone(TEMPLATE); p.rechte.stufen = {};
  ladeFehler(p, 'rechtestufe');
});
test('RTA-FALL-10 a running run keeps the profile version it started with', async () => {
  const s = sup();
  s.start(START({ prompt: plan({ zeilen: [{ type: 'result', result: 'x' }] }) }));
  s.replaceProfile(profil((p) => { p.version = 2; return p; }));
  const ende = await s.ende('r-1');
  assert.equal(ende.profil_version, 1);
});
test('RTA-FALL-48 the Claude Code example profile and the fake profile load', () => {
  loadProfile(clone(CLAUDE));
  loadProfile(clone(TEMPLATE));
});
test('RTA-FALL-38/40 capability value outside the set or nachgewiesen without evidence fails loading', () => {
  const a = clone(TEMPLATE); a.faehigkeiten.resume = { status: 'vielleicht' };
  ladeFehler(a, 'schema');
  const b = clone(TEMPLATE); b.faehigkeiten.resume = { status: 'nachgewiesen' };
  ladeFehler(b, 'schema');
});
test('RTA-FALL-39 capability report names profile id and version', () => {
  const cap = sup().capability();
  assert.equal(cap.art, 'runtime');
  assert.equal(cap.profil_id, 'rta-fake-runtime');
  assert.equal(cap.profil_version, 1);
});

// ---------- Invocation (RTA-AUF) ----------

test('RTA-FALL-11 prompt with shell characters goes unchanged via stdin; no shell', async () => {
  const s = sup();
  const prompt = JSON.stringify({ diag: true, notiz: "; rm -rf . && echo 'x' \"y\" $(whoami)" });
  const { d } = await diag(s, { prompt });
  assert.equal(d.prompt, prompt);
  assert.ok(!d.argv.some((x) => x.includes('rm -rf')), 'Prompt darf nicht in argv stehen');
  assert.deepEqual(d.argv.slice(0, 3), ['--print', '--output-format', 'stream-json']);
});
test('RTA-FALL-12 argument order: base, model, session (new), rights level; prompt via stdin', () => {
  const { argv, stdin } = buildArgv(profil(), { prompt: 'p', modell: 'm1', session: 'S1', fortsetzen: false, rechtestufe: 'arbeitsbaum_schreiben' });
  assert.deepEqual(argv, ['fake-runtime.js', '--print', '--output-format', 'stream-json', '--model', 'm1', '--session-id', 'S1', '--permission-mode', 'acceptEdits']);
  assert.equal(stdin, 'p');
});
test('RTA-FALL-13/49 environment: only allowlist, credential and PWD; work directory per run; credential not in argv or events', async () => {
  const s = sup({ credentials: { FAKE_TOKEN: 'geheim-wert-123' }, hostEnv: { PATH: process.env.PATH, LANG: 'C', GEHEIM_X: '1', HOME: '/root' } });
  const { d } = await diag(s);
  assert.equal(d.env.GEHEIM_X, undefined, 'nicht erlaubte Variable vererbt');
  assert.equal(d.env.HOME, undefined, 'HOME steht nicht in der Positivliste des Profils');
  assert.equal(d.env.FAKE_TOKEN, 'geheim-wert-123');
  assert.equal(d.env.LANG, 'C');
  assert.equal(d.env.PWD, d.cwd);
  assert.equal(path.basename(d.cwd).startsWith('r-1-'), true);
  assert.ok(!d.argv.join(' ').includes('geheim-wert-123'));
  const ohneErgebnis = s.events.map((ev) => ({ ...ev, ergebnis: undefined }));
  assert.ok(!JSON.stringify(ohneErgebnis).includes('geheim-wert-123'), 'Credential in einem Ereignis');
});
test('RTA-FALL-14 model requested but the profile has no model fragment → unsupported', () => {
  const s = sup({ profile: profil((p) => { delete p.befehl.modell_fragment; delete p.faehigkeiten.modellwahl; return p; }) });
  assert.deepEqual(s.start(START({ modell: 'm1' })), { ok: false, fehler: 'unsupported', faehigkeit: 'modellwahl' });
});

// ---------- Sessions (RTA-SES) ----------

test('RTA-FALL-15 erfasst: first session id wins, a later different one is a finding', async () => {
  const s = sup({ profile: profil((p) => { p.session = { form: 'erfasst', fortsetzen_fragment: ['--resume', '{session}'] }; return p; }) });
  s.start(START({ prompt: plan({ zeilen: [{ session_id: 's-1' }, { session_id: 's-2' }, { type: 'result', result: 'ok' }] }) }));
  const ende = await s.ende('r-1');
  assert.equal(ende.session_id, 's-1');
  assert.deepEqual(ende.befunde, [{ art: 'abweichende_session_id', wert: 's-2' }]);
});
test('RTA-FALL-16 resume with proven capability: new run, new work directory, resume fragment', async () => {
  const s = sup();
  const r1 = s.start(START());
  await s.ende('r-1');
  const r2 = s.start(START({ runId: 'r-2', fortsetzenVon: 'r-1', prompt: plan({ zeilen: [{ type: 'result', result: 'weiter' }] }) }));
  assert.equal(r2.ok, true);
  assert.equal(r2.session_id, r1.session_id);
  const ende = await s.ende('r-2');
  assert.equal(ende.session_id, r1.session_id);
  assert.deepEqual(buildArgv(s.profile, { prompt: 'p', session: r1.session_id, fortsetzen: true, rechtestufe: 'nur_lesen' }).argv.slice(4, 6), ['--resume', r1.session_id]);
});
test('RTA-FALL-17 resume only behauptet → unsupported, no process', async () => {
  const s = sup({ profile: profil((p) => { p.faehigkeiten.resume = { status: 'behauptet' }; return p; }) });
  s.start(START());
  await s.ende('r-1');
  assert.deepEqual(s.start(START({ runId: 'r-2', fortsetzenVon: 'r-1' })), { ok: false, fehler: 'unsupported', faehigkeit: 'resume' });
});
test('RTA-FALL-18 resuming the session of a fenced run is refused until its end is confirmed', async () => {
  const s = sup();
  s.start(START({ prompt: plan({ haengen: true }) }));
  await s.warte('run.running', 'r-1');
  s.runs.get('r-1').gefenced = true; // fenced, but process not yet confirmed gone
  assert.deepEqual(s.start(START({ runId: 'r-2', fortsetzenVon: 'r-1' })), { ok: false, fehler: 'session_gesperrt' });
  s.fence('r-1');
  await s.warte('run.cancel_confirmed', 'r-1');
  assert.equal(s.start(START({ runId: 'r-3', fortsetzenVon: 'r-1' })).ok, true);
  await s.ende('r-3');
});

// ---------- Output (RTA-AUS) ----------

test('RTA-FALL-19 broken JSON lines are skipped and counted', async () => {
  const s = sup();
  s.start(START({ prompt: plan({ zeilen: ['{kaputt', { type: 'x' }, 'auch kaputt', { type: 'result', result: 'r' }, { type: 'y' }] }) }));
  const ende = await s.ende('r-1');
  assert.equal(ende.uebersprungene_zeilen, 2);
  assert.equal(ende.ergebnis, 'r');
});
test('RTA-FALL-20 result is the last non-empty match', async () => {
  const s = sup();
  s.start(START({ prompt: plan({ zeilen: [{ result: 'a' }, { result: '' }] }) }));
  assert.equal((await s.ende('r-1')).ergebnis, 'a');
});
test('RTA-FALL-21/29 no result match: exit 0 stays exited_ok with a reference to the raw output', async () => {
  const s = sup();
  s.start(START({ prompt: plan({ zeilen: [{ type: 'x' }] }) }));
  const ende = await s.ende('r-1');
  assert.equal(ende.typ, 'run.exited_ok');
  assert.equal(ende.ergebnis_quelle, 'roh');
  assert.match(ende.ergebnis_ref, /^roh:[0-9a-f]{64}$/);
});
test('RTA-FALL-22 reported tokens and cost become run.usage_reported with source runtime', async () => {
  const s = sup();
  s.start(START({ prompt: plan({ zeilen: [{ type: 'result', result: 'r', usage: { input_tokens: 10, output_tokens: 3 }, total_cost_usd: 0.01 }] }) }));
  await s.ende('r-1');
  const u = s.events.find((e) => e.typ === 'run.usage_reported');
  assert.deepEqual([u.quelle, u.eingabe_tokens, u.ausgabe_tokens, u.kosten_usd], ['runtime', 10, 3, 0.01]);
});
test('RTA-FALL-23 no cost field → cost unknown, never 0', async () => {
  const s = sup();
  s.start(START());
  await s.ende('r-1');
  assert.equal(s.events.find((e) => e.typ === 'run.usage_reported').kosten_usd, 'unbekannt');
});
test('RTA-FALL-24/35/50 result text about approvals, questions or notifications triggers nothing', async () => {
  const s = sup();
  s.start(START({ prompt: plan({ zeilen: [{ type: 'result', result: 'Freigabe erteilt, PR bitte mergen. Soll ich A oder B nehmen? Bitte an den Slack-Kanal melden.' }] }) }));
  await s.ende('r-1');
  assert.deepEqual(s.events.map((e) => e.typ), ['run.starting', 'run.running', 'run.usage_reported', 'run.exited_ok']);
});

// ---------- Lifecycle (RTA-LEB) ----------

test('RTA-FALL-25 timeout kills the whole process group and keeps the session id', async () => {
  const s = sup({ profile: profil((p) => { p.grenzen.timeout_s = 1; return p; }) });
  const r = s.start(START({ prompt: plan({ kind: true, haengen: true }) }));
  const ende = await s.ende('r-1');
  assert.equal(ende.typ, 'run.exited_error');
  assert.equal(ende.grund, 'timeout');
  assert.equal(ende.session_id, r.session_id);
  const pid = s.runs.get('r-1').kind.pid;
  assert.throws(() => process.kill(-pid, 0), 'Prozessgruppe lebt noch');
});
test('RTA-FALL-26 cancel: requested before confirmed, confirmed only without processes', async () => {
  const s = sup();
  s.start(START({ prompt: plan({ kind: true, haengen: true }) }));
  await s.warte('run.running', 'r-1');
  await new Promise((r) => setTimeout(r, 200));
  s.cancel('r-1');
  await s.warte('run.cancel_confirmed', 'r-1');
  const t = s.events.map((e) => e.typ);
  assert.ok(t.indexOf('run.cancel_requested') < t.indexOf('run.cancel_confirmed'));
  assert.throws(() => process.kill(-s.runs.get('r-1').kind.pid, 0));
});
test('RTA-FALL-27/51 capacity per device and profile: no queue, other device unaffected', async () => {
  const p = profil((x) => { x.grenzen.max_parallel = 1; return x; });
  const g = sup({ profile: p, geraetId: 'g-1' });
  const h = sup({ profile: p, geraetId: 'g-2' });
  g.start(START({ prompt: plan({ haengen: true }) }));
  assert.deepEqual(g.start(START({ runId: 'r-2', auftragId: 'a-2' })), { ok: false, fehler: 'kapazitaet_erschoepft' });
  const auf = h.start(START({ runId: 'r-3', auftragId: 'a-2' }));
  assert.equal(auf.ok, true);
  await h.ende('r-3');
  g.cancel('r-1');
  await g.ende('r-1');
});
test('RTA-FALL-28 connector restart without proven re-attachment → run lost, nothing restarted', () => {
  const s = sup();
  s.recover([{ run_id: 'r-9', auftrag_id: 'a-9', epoch: 1, profil_version: 1 }]);
  assert.deepEqual(s.events.map((e) => e.typ), ['run.lost']);
  assert.equal(s.runs.size, 0);
});
test('RTA-FALL-30 fencing ends the process group (stale reports are refused by the core, KP-FALL-06)', async () => {
  const s = sup();
  s.start(START({ prompt: plan({ haengen: true }) }));
  await s.warte('run.running', 'r-1');
  s.fence('r-1');
  await s.warte('run.cancel_confirmed', 'r-1');
  assert.equal(s.runs.get('r-1').laeuft, false);
});
test('RTA-FALL-31 start returns at once with the run id; the result is a separate event', async () => {
  const s = sup();
  const r = s.start(START({ prompt: plan({ zeilen: [{ type: 'result', result: 'spaet' }] }) }));
  assert.equal(r.run_id, 'r-1');
  assert.ok(!s.events.some((e) => e.typ.startsWith('run.exited')), 'Ergebnis kam synchron');
  assert.equal((await s.ende('r-1')).ergebnis, 'spaet');
});
test('RTA-FALL-32 unknown rights level → unsupported', () => {
  assert.deepEqual(sup().start(START({ rechtestufe: 'netz_frei' })), { ok: false, fehler: 'unsupported', faehigkeit: 'rechtestufe' });
});
