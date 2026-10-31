#!/usr/bin/env node
// Reference core for the contract suite (docs/spec/kern-port-v0.md, plan items M1.4 and M1.6).
// DISPOSABLE: this is not product code and not a decision for Tor A. It exists so the suite has
// something to run against. One process, in memory; the journal is the only durable state and
// every derived state is a fold over it (V0-INV-02, V0-INV-12). Requests and responses are JSON
// lines on stdin/stdout (KP-GRZ-01).
import readline from 'node:readline';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSchema } from '../../skill-library/lib/schema.js';

const SCHEMAS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', 'spec', 'schemas');
const readSchema = (f) => JSON.parse(fs.readFileSync(path.join(SCHEMAS, f), 'utf8'));
const UEBERGABE_SCHEMA = readSchema('uebergabe.schema.json');
const BEFUND_SCHEMA = readSchema('rueckwaerts-befund.schema.json');

const MIN = 60_000;
const START = Date.parse('2026-11-01T00:00:00Z');
const RUN_STATES = ['starting', 'running', 'paused', 'cancel_requested', 'cancel_confirmed', 'exited_ok', 'exited_error', 'lost'];
/** Run reports that remain valid on a claim the core ended itself (V0-BUD-08, V0-FALL-08). */
const END_REPORTS = ['cancel_requested', 'cancel_confirmed', 'exited_ok', 'exited_error', 'lost'];
const READS = new Set(['journal.read', 'state.get', 'context.get']);
const REVISABLE = ['ziel', 'ausgangsstand', 'abnahmekriterien', 'budget', 'rueckwaertsabnahme'];
/** Commands switched off for a run of the suite (KP-FALL-08: "nicht abbildbar" instead of failed). */
const OHNE = new Set((process.env.REFERENZKERN_OHNE ?? '').split(',').filter(Boolean));

/** Which actor kinds may send which command (KP-INV-04). */
const AUTH = {
  'device.pair_request': ['geraet'], 'device.pair_confirm': ['owner'], 'device.revoke': ['owner'], 'device.report_capability': ['geraet'],
  'task.draft': ['owner'], 'task.open': ['owner'], 'task.revise': ['owner'], 'task.accept': ['owner'], 'task.cancel': ['owner'],
  'task.submit': ['run'], 'task.submit_partial': ['run'], 'task.record_handover': ['run'],
  'claim.request': ['geraet'], 'claim.reassign': ['owner'], 'claim.release': ['run'],
  'run.report': ['run'], 'run.report_usage': ['run'], 'run.report_attempt': ['run'], 'run.reconcile': ['geraet'],
  'input.ask': ['run'], 'input.answer': ['owner'], 'input.withdraw': ['run'],
  'effect.propose': ['run', 'kern'], 'effect.approve': ['owner'], 'effect.reject': ['owner'], 'effect.report': ['effekt_adapter'],
  'effect.reconcile': ['effekt_adapter'], 'effect.reconcile_failed': ['effekt_adapter'],
  'memory.propose': ['kern', 'run'], 'memory.decide': ['owner'],
  'review.submit_reconstruction': ['run'], 'review.submit_comparison': ['run'], 'review.rate_finding': ['owner'],
  'journal.read': ['owner', 'geraet', 'run', 'kern', 'effekt_adapter', 'suite'], 'state.get': ['owner', 'geraet', 'run', 'kern', 'effekt_adapter', 'suite'],
  'context.get': ['geraet', 'run', 'kern', 'suite'],
};

let durable;
let cache;
let clock;

function resetAll() {
  durable = { journal: [], idem: new Map() };
  cache = null;
  clock = START;
}
resetAll();

// ---------- helpers ----------

class Refusal extends Error {
  constructor(code, meldung, events = []) { super(meldung); this.code = code; this.events = events; }
}
const refuse = (code, meldung, events) => { throw new Refusal(code, meldung, events); };

function canonical(v) {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
  return JSON.stringify(v);
}
const sha256 = (s) => `sha256:${crypto.createHash('sha256').update(s).digest('hex')}`;
const iso = (t) => new Date(t).toISOString();
const isoNow = () => iso(clock);
const claimKey = (auftragId, schritt) => (schritt === 'pruefung' ? `${auftragId}#pruefung` : auftragId);
const lokalesModell = (g) => g.capabilities.some((c) => c.art === 'local_model' && c.local_only === true);

function emptyState() {
  return {
    auftraege: new Map(), claims: new Map(), geraete: new Map(), rueckfragen: new Map(), effekte: new Map(), erinnerungen: new Map(), pruefungen: new Map(),
    zaehler: { run: 0, frage: 0, effekt: 0, erinnerung: 0, pruefung: 0 },
  };
}

function newAuftrag(id, body, t) {
  return {
    id, version: body.version, zustand: 'draft', auftrag: body, versionen: { [body.version]: body }, artefakt_hash: null,
    // Budget clock (V0-BUD-01/-12): consumption is accumulated while folding, from event times only.
    uhr: { t, dauer_ms: 0, reparatur_ms: 0 }, kosten_eur: null, reparatur_kosten_eur: null, runs: 0, fehlversuche: 0,
    reparatur_offen: [], vorwarnungen: [], reparaturgrenzen: [], uebergabe_angefordert: [],
    uebergabe: null, offene_kriterien: [], vor_unklar: null, konflikt: null, pruefung_id: null,
  };
}

/** Advance the budget clock of a task to time t (only in_progress counts; V0-BUD-01, -12, -14). */
function tick(auf, t) {
  const dt = Math.max(0, t - auf.uhr.t);
  if (auf.zustand === 'in_progress') {
    auf.uhr.dauer_ms += dt;
    if (auf.reparatur_offen.length > 0) auf.uhr.reparatur_ms += dt;
  }
  auf.uhr.t = Math.max(auf.uhr.t, t);
}

/** Apply one journal event to derived state (the only place state changes). */
function apply(s, ev) {
  const d = ev.daten;
  const t = Date.parse(ev.zeit);
  const auf = s.auftraege.get(ev.strom);
  if (auf) tick(auf, t);
  const claimOf = () => s.claims.get(claimKey(ev.strom, d.schritt));
  switch (ev.typ) {
    case 'device.pairing_pending': s.geraete.set(ev.strom, { id: ev.strom, pairing: 'pairing_pending', verbindung: 'online', capabilities: [] }); break;
    case 'device.paired': s.geraete.get(ev.strom).pairing = 'paired'; break;
    case 'device.revoked': s.geraete.get(ev.strom).pairing = 'revoked'; break;
    case 'device.capability_reported': s.geraete.get(ev.strom).capabilities = d.capabilities; break;
    case 'device.offline': s.geraete.get(ev.strom).verbindung = 'offline'; break;
    case 'device.online': s.geraete.get(ev.strom).verbindung = 'online'; break;
    case 'task.drafted': s.auftraege.set(ev.strom, newAuftrag(ev.strom, d.auftrag, t)); break;
    case 'draft.conflict': auf.konflikt = { geraet_id: d.geraet_id, entwurf_hash: d.entwurf_hash, entwurf: d.entwurf, hub_version: d.hub_version, hub_hash: d.hub_hash }; break;
    case 'draft.resolved': auf.konflikt = null; break;
    case 'task.revised':
      auf.versionen[d.version] = d.auftrag; auf.auftrag = d.auftrag; auf.version = d.version;
      if (d.konflikt_geloest) auf.konflikt = null;
      if (auf.zustand === 'partially_submitted') auf.zustand = 'open'; // V0-BUD-10
      break;
    case 'task.opened': auf.zustand = 'open'; break;
    case 'claim.granted':
      s.zaehler.run += 1;
      if (d.schritt === 'pruefung') {
        s.claims.set(claimKey(ev.strom, 'pruefung'), { auftrag_id: ev.strom, schritt: 'pruefung', pruefung_id: d.pruefung_id, epoch: ev.epoch, run_id: d.run_id, geraet_id: d.geraet_id, auftrag_version: ev.auftrag_version, zustand: 'active' });
        const p = s.pruefungen.get(d.pruefung_id);
        p.zustand = 'reconstructing'; p.start = t; p.eingabemanifest = d.eingabemanifest;
      } else {
        s.claims.set(ev.strom, { auftrag_id: ev.strom, schritt: 'arbeit', epoch: ev.epoch, run_id: d.run_id, geraet_id: d.geraet_id, auftrag_version: ev.auftrag_version, zustand: 'active' });
        auf.runs += 1;
        auf.zustand = 'in_progress';
      }
      break;
    case 'claim.fenced': case 'claim.released': case 'claim.expired': {
      claimOf().zustand = ev.typ.slice('claim.'.length);
      if (d.schritt !== 'pruefung') auf.reparatur_offen = []; // a repair phase ends with the claim (V0-BUD-12)
      break;
    }
    case 'input.requested':
      s.zaehler.frage += 1;
      s.rueckfragen.set(d.rueckfrage_id, { id: d.rueckfrage_id, auftrag_id: ev.strom, frage_version: 1, zustand: 'open', antwort: null, run_id: ev.akteur.id });
      auf.zustand = 'waiting_input';
      break;
    case 'input.answered': {
      const q = s.rueckfragen.get(d.rueckfrage_id);
      q.zustand = 'answered'; q.antwort = d.option;
      if (auf.zustand === 'waiting_input') auf.zustand = 'in_progress';
      break;
    }
    case 'input.withdrawn': s.rueckfragen.get(d.rueckfrage_id).zustand = 'withdrawn'; if (auf.zustand === 'waiting_input') auf.zustand = 'in_progress'; break;
    case 'task.submitted': auf.zustand = 'submitted'; auf.artefakt_hash = d.artefakt_hash; break;
    case 'task.partially_submitted':
      auf.zustand = 'partially_submitted'; auf.artefakt_hash = d.artefakt_hash;
      auf.uebergabe = { ereignis: ev.id, ...d.uebergabe }; auf.offene_kriterien = d.offene_kriterien;
      break;
    case 'task.handover_recorded': if (d.uebergabe.quelle === 'run') auf.uebergabe = { ereignis: ev.id, ...d.uebergabe }; break;
    case 'task.budget_warning': auf.vorwarnungen.push(`v${ev.auftrag_version}:${d.dimension}`); break;
    case 'task.repair_limit_reached': auf.reparaturgrenzen.push(`v${ev.auftrag_version}:${d.dimension}`); break;
    case 'task.handover_requested': auf.uebergabe_angefordert.push(`v${ev.auftrag_version}`); break;
    case 'task.failed': auf.zustand = 'failed'; break;
    case 'task.accepted': auf.zustand = 'accepted'; break;
    case 'task.cancelled': auf.zustand = 'cancelled'; break;
    case 'task.completed': auf.zustand = 'completed'; break;
    case 'run.usage_reported':
      if (d.quelle === 'gemeldet' && typeof d.kosten_eur === 'number') { // only confirmed reports count (V0-BUD-01, -03)
        auf.kosten_eur = (auf.kosten_eur ?? 0) + d.kosten_eur;
        auf.reparatur_kosten_eur = (auf.reparatur_kosten_eur ?? 0) + (auf.reparatur_offen.length > 0 ? d.kosten_eur : 0);
      }
      break;
    case 'run.attempt_failed':
      auf.fehlversuche += 1;
      if (!auf.reparatur_offen.includes(d.bezug)) auf.reparatur_offen.push(d.bezug);
      break;
    case 'run.attempt_succeeded': case 'run.strategy_changed': auf.reparatur_offen = auf.reparatur_offen.filter((b) => b !== d.bezug); break;
    case 'effect.proposed':
      s.zaehler.effekt += 1;
      s.effekte.set(d.effekt_id, { id: d.effekt_id, auftrag_id: ev.strom, quelle: d.quelle ?? 'kern', run_id: d.run_id ?? null, typ: d.typ, ziel: d.ziel, parameter_hash: d.parameter_hash, auftrag_version: ev.auftrag_version, epoch: ev.epoch, zustand: 'proposed' });
      break;
    case 'effect.approval_pending': { const e = s.effekte.get(d.effekt_id); e.zustand = 'approval_pending'; if (e.quelle === 'kern') auf.zustand = 'waiting_approval'; break; }
    case 'effect.approved': s.effekte.get(d.effekt_id).zustand = 'approved'; break;
    case 'effect.invalidated': s.effekte.get(d.effekt_id).zustand = 'invalidated'; break;
    case 'effect.intent': { const e = s.effekte.get(d.effekt_id); e.zustand = 'intent_recorded'; if (e.quelle === 'kern') auf.zustand = 'applying'; break; }
    case 'effect.rejected': { const e = s.effekte.get(d.effekt_id); e.zustand = 'rejected'; if (e.quelle === 'kern') auf.zustand = 'accepted'; break; }
    case 'effect.done': s.effekte.get(d.effekt_id).zustand = 'done'; break;
    case 'effect.failed': { const e = s.effekte.get(d.effekt_id); e.zustand = 'failed'; if (e.quelle === 'kern') auf.zustand = 'accepted'; break; }
    case 'effect.outcome_unknown':
      s.effekte.get(d.effekt_id).zustand = 'outcome_unknown';
      auf.vor_unklar = auf.zustand; auf.zustand = 'outcome_unknown';
      break;
    case 'effect.reconcile_failed': s.effekte.get(d.effekt_id).abgleich_gescheitert = d.grund; break;
    case 'effect.reconciled': {
      const e = s.effekte.get(d.effekt_id);
      e.zustand = 'reconciled'; e.ergebnis = d.ergebnis;
      if (e.quelle === 'run') auf.zustand = auf.vor_unklar; // a run effect never moves the task on its own
      else if (d.ergebnis !== 'done') auf.zustand = 'accepted';
      break;
    }
    case 'task.backward_review_requested':
      s.zaehler.pruefung += 1;
      s.pruefungen.set(d.pruefung_id, {
        id: d.pruefung_id, auftrag_id: ev.strom, zustand: 'requested', artefakt_hash: d.artefakt_hash, auftrag_version: ev.auftrag_version,
        einreichung: d.einreichung, budget: d.budget, hinweis: d.hinweis, eingabemanifest: [], rekonstruktion_hash: null, befunde: [], anzahl: null, grund: null, start: null,
      });
      auf.pruefung_id = d.pruefung_id;
      break;
    case 'task.backward_reconstruction_recorded': {
      const p = s.pruefungen.get(d.pruefung_id);
      p.zustand = 'reconstructed'; p.rekonstruktion_hash = d.rekonstruktion_hash; p.eingabemanifest = [...p.eingabemanifest, ...d.eingabemanifest_ergaenzt];
      break;
    }
    case 'task.backward_finding': s.pruefungen.get(d.befund.pruefung_id).befunde.push({ id: d.befund_id, klasse: d.befund.klasse, bewertung: null }); break;
    case 'task.backward_review_completed': { const p = s.pruefungen.get(d.pruefung_id); p.zustand = 'completed'; p.anzahl = d.anzahl; break; }
    case 'task.backward_review_not_performed': { const p = s.pruefungen.get(d.pruefung_id); p.zustand = 'not_performed'; p.grund = d.grund; break; }
    case 'task.backward_review_waived': { const p = s.pruefungen.get(d.pruefung_id); p.zustand = 'not_performed'; p.grund = 'verzicht'; break; }
    case 'task.backward_finding_rated': s.pruefungen.get(d.pruefung_id).befunde.find((b) => b.id === d.befund_id).bewertung = d.bewertung; break;
    case 'memory.proposed': s.zaehler.erinnerung += 1; s.erinnerungen.set(ev.strom, { id: ev.strom, text: d.text, quellen: d.quellen, zustand: 'candidate' }); break;
    case 'memory.confirmed': s.erinnerungen.get(ev.strom).zustand = 'confirmed'; break;
    case 'memory.rejected': s.erinnerungen.get(ev.strom).zustand = 'rejected'; break;
    case 'memory.superseded': s.erinnerungen.get(ev.strom).zustand = 'superseded'; break;
    case 'memory.withdrawn': s.erinnerungen.get(ev.strom).zustand = 'withdrawn'; break;
    default: break; // other run.*, input.answer_conflict, claim.rejected_* change no derived state
  }
}

function state() {
  if (cache === null) {
    cache = emptyState();
    for (const ev of durable.journal) apply(cache, ev);
  }
  return cache;
}

/** Build events against a working copy; append them only when the whole command succeeds. */
function makeWriter(akteur, key) {
  const out = [];
  const actor = akteur.art === 'suite' ? { art: 'kern', id: 'kern' } : { art: akteur.art, id: akteur.id, ...(akteur.geraet_id ? { geraet_id: akteur.geraet_id } : {}) };
  const seqInStrom = (strom) => durable.journal.filter((e) => e.strom === strom).length + out.filter((e) => e.strom === strom).length + 1;
  return {
    out,
    write(typ, strom, daten = {}, extra = {}) {
      const pos = durable.journal.length + out.length + 1;
      const ev = {
        schema_version: '0.1', id: `ev-${pos}`, strom, seq: seqInStrom(strom), typ, zeit: isoNow(),
        akteur: extra.kern ? { art: 'kern', id: 'kern' } : actor,
        idempotenz_key: extra.key ?? `${key ?? 'k-intern'}-${out.length + 1}`.padEnd(8, '0'),
        ursache: extra.ursache ?? null, daten,
      };
      if (extra.version !== undefined) ev.auftrag_version = extra.version;
      if (extra.epoch !== undefined) ev.epoch = extra.epoch;
      if (extra.quellsequenz !== undefined) ev.quellsequenz = extra.quellsequenz;
      out.push(ev);
      apply(state(), ev);
      return ev;
    },
  };
}

function needAuftrag(s, id) {
  const a = s.auftraege.get(id);
  if (!a) refuse('unbekannt', `Auftrag ${id} unbekannt`);
  return a;
}

function needPairedDevice(s, id) {
  const g = s.geraete.get(id);
  if (!g || g.pairing !== 'paired') refuse('nicht_berechtigt', `Gerät ${id} ist nicht gepairt oder widerrufen`);
  return g;
}

/** Epoch check for run messages (V0-INV-05, KP-INV-03): rejections are journaled. */
function checkRun(s, w, akteur, args, schritt = 'arbeit') {
  const a = needAuftrag(s, args.auftrag_id);
  const c = s.claims.get(claimKey(a.id, schritt));
  if (!c) refuse('claim_inaktiv', 'kein Claim');
  if (!Number.isInteger(args.epoch)) refuse('anfrage_ungueltig', 'epoch fehlt');
  const sch = schritt === 'pruefung' ? { schritt } : {};
  if (args.epoch < c.epoch) {
    const ev = w.write('claim.rejected_stale_epoch', a.id, { run_id: akteur.id, gemeldete_epoch: args.epoch, aktuelle_epoch: c.epoch, ...sch }, { epoch: args.epoch });
    refuse('epoch_veraltet', `Claim steht auf Epoch ${c.epoch}`, [ev]);
  }
  if (c.run_id !== akteur.id) refuse('nicht_berechtigt', 'Run hält diesen Claim nicht');
  if (c.zustand !== 'active') {
    const ev = w.write('claim.rejected_inactive', a.id, { run_id: akteur.id, claim_zustand: c.zustand, ...sch }, { epoch: args.epoch });
    refuse('claim_inaktiv', `Claim ist ${c.zustand}`, [ev]);
  }
  return { a, c };
}

/**
 * A claim the core ended itself (budget end, cancel) still takes its run's end and usage reports,
 * so that cancel_requested and cancel_confirmed stay visible (V0-BUD-08, V0-FALL-08).
 */
function beendeterClaim(s, akteur, args) {
  const c = s.claims.get(args.auftrag_id);
  return c && c.zustand === 'expired' && c.run_id === akteur.id && args.epoch === c.epoch ? c : null;
}

function ownerDevice(s, akteur) {
  if (akteur.geraet_id) needPairedDevice(s, akteur.geraet_id);
}

const unklareEffekte = (s, auftragId) => [...s.effekte.values()].filter((e) => e.auftrag_id === auftragId && ['intent_recorded', 'outcome_unknown'].includes(e.zustand)).map((e) => e.id);
const offeneRueckfragen = (s, auftragId) => [...s.rueckfragen.values()].filter((q) => q.auftrag_id === auftragId && q.zustand === 'open');
const antworten = (s, auftragId) => [...s.rueckfragen.values()].filter((q) => q.auftrag_id === auftragId && q.zustand === 'answered').map((q) => ({ rueckfrage_id: q.id, option: q.antwort }));

/** Consumption at core time `now`, without changing state (V0-BUD-01/-02). */
function verbrauch(auf, now) {
  const dt = Math.max(0, now - auf.uhr.t);
  const laeuft = auf.zustand === 'in_progress';
  const repariert = laeuft && auf.reparatur_offen.length > 0;
  return {
    dauer_ms: auf.uhr.dauer_ms + (laeuft ? dt : 0), reparatur_ms: auf.uhr.reparatur_ms + (repariert ? dt : 0), laeuft, repariert,
    kosten_eur: auf.kosten_eur, reparatur_kosten_eur: auf.reparatur_kosten_eur, runs: auf.runs, fehlversuche: auf.fehlversuche,
  };
}

/** Limits of the version the active claim is bound to, else of the latest version (V0-BUD-16). */
function massgeblich(s, auf) {
  const c = s.claims.get(auf.id);
  const version = c && c.zustand === 'active' ? c.auftrag_version : auf.version;
  return { version, budget: auf.versionen[version].budget ?? {} };
}

function budgetstand(auf, now) {
  const u = verbrauch(auf, now);
  return { dauer_min: u.dauer_ms / MIN, kosten_eur: u.kosten_eur, runs: u.runs };
}

function budgetView(s, auf, now) {
  const u = verbrauch(auf, now);
  const { version, budget } = massgeblich(s, auf);
  return {
    auftrag_id: auf.id, massgebliche_version: version, limits: budget,
    dauer_min: u.dauer_ms / MIN, kosten_eur: u.kosten_eur, kosten: u.kosten_eur === null ? 'unbekannt' : 'gemeldet', runs: u.runs,
    fehlversuche: u.fehlversuche, reparatur_dauer_min: u.reparatur_ms / MIN, reparatur_kosten_eur: u.reparatur_kosten_eur,
    reparatur_offen: [...auf.reparatur_offen], vorwarnungen: [...auf.vorwarnungen], reparaturgrenzen: [...auf.reparaturgrenzen],
  };
}

/** Run effects of a claim that lost its epoch are no longer approvable (V0-INV-04, -05). */
function invalidateRunEffects(s, w, auftragId, epoch) {
  for (const e of s.effekte.values()) {
    if (e.auftrag_id === auftragId && e.quelle === 'run' && e.epoch === epoch && ['proposed', 'approval_pending', 'approved'].includes(e.zustand)) {
      w.write('effect.invalidated', auftragId, { effekt_id: e.id, grund: 'epoch' }, { kern: true });
    }
  }
}

/** Core handover: only what is in the journal; quality is not assessed (V0-BUD-08). */
function kernUebergabe(s, auf, version, epoch, now, pos) {
  const body = auf.versionen[version];
  return {
    schema_version: '0.2', auftrag_id: auf.id, auftrag_version: version, epoch, quelle: 'kern', zeit: iso(now),
    ausgangsstand: [], ergebnisse: auf.uebergabe ? auf.uebergabe.ergebnisse : [],
    kriterienstand: Object.fromEntries((body.abnahmekriterien ?? []).map((k) => [k.id, 'unklar'])),
    offen: { rueckfragen: offeneRueckfragen(s, auf.id).map((q) => q.id), annahmen: [], blockaden: [] },
    unklare_wirkungen: unklareEffekte(s, auf.id), budgetstand: budgetstand(auf, now),
    naechster_schritt: 'Owner entscheidet über Fortsetzung', inhalt_ref: `kern:uebergabe:${auf.id}:${pos}`,
  };
}

/** Handover from a run: the core sets bindings, time and budget itself (V0-BUD-07, §7.1). */
function runUebergabe(s, auf, c, u) {
  if (!u || typeof u !== 'object' || Array.isArray(u)) refuse('pflichtteil_fehlt', 'Übergabepaket fehlt');
  const unklar = [...new Set([...(Array.isArray(u.unklare_wirkungen) ? u.unklare_wirkungen : []), ...unklareEffekte(s, auf.id)])];
  const obj = { ...u, schema_version: '0.2', auftrag_id: auf.id, auftrag_version: c.auftrag_version, epoch: c.epoch, quelle: 'run', zeit: isoNow(), unklare_wirkungen: unklar, budgetstand: budgetstand(auf, clock) };
  const fehler = validateSchema(UEBERGABE_SCHEMA, obj);
  if (fehler.length > 0) refuse('anfrage_ungueltig', `Übergabepaket: ${fehler[0].pointer} ${fehler[0].message}`);
  return obj;
}

/** Budget end (V0-BUD-08): core handover, task.failed, claim expired, request to cancel. */
function budgetende(s, w, auf, version, dim, erreichtBei, aktiv) {
  const epoch = aktiv?.epoch ?? s.claims.get(auf.id)?.epoch ?? 1;
  const ue = kernUebergabe(s, auf, version, epoch, clock, durable.journal.length + w.out.length + 1);
  const h = w.write('task.handover_recorded', auf.id, { uebergabe: ue, fehlversuche: auf.fehlversuche, antworten: antworten(s, auf.id) }, { kern: true, version, epoch });
  w.write('task.failed', auf.id, {
    grund: 'budget_exhausted', dimension: dim, erreicht_bei: iso(erreichtBei), uebergabe_run: auf.uebergabe?.ereignis ?? null, uebergabe_kern: h.id,
    aufforderung: aktiv ? { an: aktiv.run_id, art: 'abbrechen' } : null,
  }, { kern: true, version, epoch });
  if (aktiv) {
    invalidateRunEffects(s, w, auf.id, aktiv.epoch);
    w.write('claim.expired', auf.id, { run_id: aktiv.run_id, schritt: 'arbeit', grund: 'budget_exhausted' }, { kern: true, epoch: aktiv.epoch });
  }
}

/** Evaluate the work-step budget of one task at core time (V0-BUD-04, -08, -13, -14, -15). */
function budgetPruefen(s, w, auf, now) {
  const u = verbrauch(auf, now);
  const { version: v, budget: b } = massgeblich(s, auf);
  const c = s.claims.get(auf.id);
  const aktiv = c && c.zustand === 'active' ? c : null;
  const dims = [
    { dim: 'dauer', wert: u.dauer_ms, limit: typeof b.max_dauer_min === 'number' ? b.max_dauer_min * MIN : null, waechst: u.laeuft, einheit: MIN },
    { dim: 'kosten', wert: u.kosten_eur, limit: typeof b.max_kosten_eur === 'number' ? b.max_kosten_eur : null, waechst: false, einheit: 1 },
    { dim: 'runs', wert: u.runs, limit: typeof b.max_runs === 'number' ? b.max_runs : null, waechst: false, einheit: 1 },
  ].filter((d) => d.wert !== null && d.limit !== null); // an unmeasured dimension never warns or ends (V0-BUD-03)
  const zeitpunkt = (d, schwelle) => (d.waechst ? now - (d.wert - schwelle) : now);
  const anteil = b.vorwarnung_anteil;
  for (const d of dims) {
    if (typeof anteil !== 'number' || d.wert < anteil * d.limit || auf.vorwarnungen.includes(`v${v}:${d.dim}`)) continue;
    w.write('task.budget_warning', auf.id, {
      dimension: d.dim, verbrauch: d.wert / d.einheit, limit: d.limit / d.einheit, erreicht_bei: iso(zeitpunkt(d, anteil * d.limit)),
      aufforderung: aktiv ? { an: aktiv.run_id, optionen: ['einreichen', 'teilweise_einreichen', 'uebergabe_festhalten'] } : null,
    }, { kern: true, version: v, epoch: aktiv?.epoch, key: `k-vorwarnung-${auf.id}-v${v}-${d.dim}` });
  }
  const rf = b.reparatur_anteil_max;
  if (typeof rf === 'number') {
    const rep = [
      { dim: 'dauer', wert: u.reparatur_ms, limit: typeof b.max_dauer_min === 'number' ? b.max_dauer_min * MIN : null, waechst: u.repariert, einheit: MIN },
      { dim: 'kosten', wert: u.reparatur_kosten_eur, limit: typeof b.max_kosten_eur === 'number' ? b.max_kosten_eur : null, waechst: false, einheit: 1 },
    ].filter((d) => d.wert !== null && d.limit !== null);
    for (const d of rep) {
      if (d.wert < rf * d.limit || auf.reparaturgrenzen.includes(`v${v}:${d.dim}`)) continue;
      w.write('task.repair_limit_reached', auf.id, {
        dimension: d.dim, reparaturverbrauch: d.wert / d.einheit, limit: d.limit / d.einheit, erreicht_bei: iso(zeitpunkt(d, rf * d.limit)),
        aufforderung: aktiv ? { an: aktiv.run_id, optionen: ['strategiewechsel', 'uebergabe_festhalten', 'teilweise_einreichen'] } : null,
      }, { kern: true, version: v, epoch: aktiv?.epoch, key: `k-reparatur-${auf.id}-v${v}-${d.dim}` });
    }
  }
  for (const d of dims) {
    const erschoepft = d.dim === 'runs' ? d.wert >= d.limit && !aktiv : d.wert >= d.limit;
    if (erschoepft) { budgetende(s, w, auf, v, d.dim, zeitpunkt(d, d.limit), aktiv); return; }
  }
}

/** Review budget knows only the hard end (V0-RWA-07). */
function pruefbudget(s, w, p, now) {
  if (!['reconstructing', 'reconstructed'].includes(p.zustand) || typeof p.budget?.max_dauer_min !== 'number') return;
  if (now - p.start < p.budget.max_dauer_min * MIN) return;
  w.write('task.backward_review_not_performed', p.auftrag_id, { pruefung_id: p.id, grund: 'budget' }, { kern: true, version: p.auftrag_version });
  const c = s.claims.get(claimKey(p.auftrag_id, 'pruefung'));
  if (c?.zustand === 'active') w.write('claim.expired', p.auftrag_id, { run_id: c.run_id, schritt: 'pruefung', grund: 'pruefbudget' }, { kern: true, epoch: c.epoch });
}

/** Runs before and after every write command and after every clock change (V0-BUD-02, -09). */
function evaluate() {
  const s = state();
  const w = makeWriter({ art: 'suite', id: 'suite' }, `k-auswertung-${durable.journal.length}`);
  for (const auf of s.auftraege.values()) {
    if (['in_progress', 'waiting_input'].includes(auf.zustand)) budgetPruefen(s, w, auf, clock); // not in outcome_unknown (V0-BUD-14)
  }
  for (const p of s.pruefungen.values()) pruefbudget(s, w, p, clock);
  durable.journal.push(...w.out);
}

/** After a confirmed (partial) submission: one review if the bound version asks for it (V0-RWA-06, -07). */
function reviewRequest(s, w, auf, c, einreichung, artefaktHash) {
  const body = auf.versionen[c.auftrag_version];
  const rw = body.rueckwaertsabnahme;
  if (!rw?.verlangt) return;
  const passend = body.datenklasse !== 'local-only'
    || [...s.geraete.values()].some((g) => g.pairing === 'paired' && g.verbindung === 'online' && lokalesModell(g));
  w.write('task.backward_review_requested', auf.id, {
    pruefung_id: `rw-${s.zaehler.pruefung + 1}`, artefakt_hash: artefaktHash, einreichung: einreichung.id, budget: rw.budget ?? null,
    hinweis: passend ? null : 'Kein Gerät mit passender local_model-Capability online; die Prüfung wartet, ein Ausweg in die Cloud ist ausgeschlossen.',
  }, { kern: true, version: c.auftrag_version, key: `k-pruefung-${einreichung.id}` });
}

function vergleichsgrundlage(s, auf, p) {
  const body = auf.versionen[p.auftrag_version];
  return { ziel: body.ziel, ausgangsstand: body.ausgangsstand, abnahmekriterien: body.abnahmekriterien, antworten: antworten(s, auf.id) };
}

// ---------- commands ----------

const H = {
  'device.pair_request'(s, w, ak) {
    const g = s.geraete.get(ak.id);
    if (g && g.pairing !== 'revoked') refuse('zustand_unpassend', `Gerät ${ak.id} ist ${g.pairing}`);
    w.write('device.pairing_pending', ak.id);
    return { geraet_id: ak.id };
  },
  'device.pair_confirm'(s, w, ak, a) {
    const g = s.geraete.get(a.geraet_id);
    if (!g || g.pairing !== 'pairing_pending') refuse('zustand_unpassend', 'kein offenes Pairing');
    w.write('device.paired', a.geraet_id);
    return { geraet_id: a.geraet_id };
  },
  'device.revoke'(s, w, ak, a) {
    needPairedDevice(s, a.geraet_id);
    w.write('device.revoked', a.geraet_id);
    return {};
  },
  'device.report_capability'(s, w, ak, a) {
    needPairedDevice(s, ak.id);
    w.write('device.capability_reported', ak.id, { capabilities: a.capabilities ?? [] });
    return {};
  },
  'task.draft'(s, w, ak, a) {
    ownerDevice(s, ak);
    const auf = a.auftrag;
    if (!auf || typeof auf.id !== 'string' || !Number.isInteger(auf.version)) refuse('anfrage_ungueltig', 'auftrag mit id und version erwartet');
    const ex = s.auftraege.get(auf.id);
    if (ex) {
      // Same content as a known version: nothing new. Different content: both versions stay visible (V0-ENT-04).
      const fp = canonical(auf);
      if (Object.values(ex.versionen).some((b) => canonical(b) === fp)) return { auftrag_id: auf.id, zustand: ex.zustand };
      if (!['draft', 'open'].includes(ex.zustand)) refuse('zustand_unpassend', `Auftrag ${auf.id} ist ${ex.zustand}`);
      const hub = { quelle: 'hub', version: ex.version, hash: sha256(canonical(ex.auftrag)) };
      const entwurf = { quelle: 'entwurf', geraet_id: ak.geraet_id ?? null, hash: sha256(fp) };
      w.write('draft.conflict', auf.id, { geraet_id: entwurf.geraet_id, entwurf_hash: entwurf.hash, entwurf: auf, hub_version: hub.version, hub_hash: hub.hash }, { version: ex.version });
      return { auftrag_id: auf.id, konflikt: true, fassungen: [hub, entwurf] };
    }
    w.write('task.drafted', auf.id, { version: auf.version, auftrag: auf }, { version: auf.version });
    return { auftrag_id: auf.id, zustand: 'draft' };
  },
  'task.open'(s, w, ak, a) {
    ownerDevice(s, ak);
    const auf = needAuftrag(s, a.auftrag_id);
    if (auf.zustand !== 'draft') refuse('zustand_unpassend', `Auftrag ist ${auf.zustand}`);
    if (auf.konflikt) refuse('zustand_unpassend', 'offener Entwurfskonflikt; der Owner wählt zuerst eine Fassung');
    if (a.version !== auf.version) refuse('zustand_unpassend', 'Version passt nicht');
    w.write('task.opened', auf.id, {}, { version: auf.version });
    return { zustand: 'open' };
  },
  'task.revise'(s, w, ak, a) {
    ownerDevice(s, ak);
    const auf = needAuftrag(s, a.auftrag_id);
    if (!['draft', 'open', 'in_progress', 'waiting_input', 'partially_submitted'].includes(auf.zustand)) refuse('zustand_unpassend', `Auftrag ist ${auf.zustand}`);
    let aenderungen = a.aenderungen;
    if (a.konflikt !== undefined) {
      if (!auf.konflikt) refuse('zustand_unpassend', 'kein offener Entwurfskonflikt');
      if (a.konflikt === 'hub') {
        w.write('draft.resolved', auf.id, { gewaehlt: 'hub', entwurf_hash: auf.konflikt.entwurf_hash }, { version: auf.version });
        return { version: auf.version, zustand: auf.zustand };
      }
      if (a.konflikt !== 'entwurf') refuse('anfrage_ungueltig', 'konflikt: hub oder entwurf');
      aenderungen = Object.fromEntries(REVISABLE.filter((k) => auf.konflikt.entwurf[k] !== undefined).map((k) => [k, auf.konflikt.entwurf[k]]));
    }
    if (!aenderungen || typeof aenderungen !== 'object' || Object.keys(aenderungen).length === 0) refuse('anfrage_ungueltig', 'aenderungen fehlen');
    const fremd = Object.keys(aenderungen).filter((k) => !REVISABLE.includes(k));
    if (fremd.length > 0) refuse('anfrage_ungueltig', `nicht änderbar: ${fremd.join(', ')}`);
    const neu = { ...auf.auftrag, ...aenderungen, version: auf.version + 1 };
    if (aenderungen.budget) neu.budget = { ...auf.auftrag.budget, ...aenderungen.budget };
    w.write('task.revised', auf.id, { version: neu.version, geaendert: Object.keys(aenderungen).sort(), auftrag: neu, konflikt_geloest: a.konflikt === 'entwurf' }, { version: neu.version });
    return { version: neu.version, zustand: s.auftraege.get(auf.id).zustand };
  },
  'claim.request'(s, w, ak, a) {
    const g = needPairedDevice(s, ak.id);
    const auf = needAuftrag(s, a.auftrag_id);
    if (a.schritt === 'pruefung') {
      const p = auf.pruefung_id ? s.pruefungen.get(auf.pruefung_id) : null;
      if (!p || p.zustand !== 'requested') refuse('zustand_unpassend', 'keine angelegte Prüfung');
      if (auf.versionen[p.auftrag_version].datenklasse === 'local-only' && !lokalesModell(g)) {
        refuse('zustand_unpassend', 'local-only: Gerät ohne passende local_model-Capability; Prüfung bleibt requested (V0-RWA-07)');
      }
      const prev = s.claims.get(claimKey(auf.id, 'pruefung'));
      const epoch = (prev?.epoch ?? 0) + 1;
      const runId = `r-${s.zaehler.run + 1}`;
      w.write('claim.granted', auf.id, { run_id: runId, geraet_id: ak.id, schritt: 'pruefung', pruefung_id: p.id, eingabemanifest: [p.artefakt_hash] }, { version: p.auftrag_version, epoch });
      return { epoch, run_id: runId, pruefung_id: p.id };
    }
    if (auf.zustand !== 'open') refuse('zustand_unpassend', `Auftrag ist ${auf.zustand}`);
    if (auf.auftrag.datenklasse === 'local-only' && !g.capabilities.some((c) => c.local_only === true)) {
      refuse('zustand_unpassend', 'local-only: Gerät meldet keine passende Capability; Auftrag bleibt open (V0-FALL-10)');
    }
    const prev = s.claims.get(auf.id);
    const epoch = (prev?.epoch ?? 0) + 1;
    const runId = `r-${s.zaehler.run + 1}`;
    w.write('claim.granted', auf.id, { run_id: runId, geraet_id: ak.id, schritt: 'arbeit' }, { version: auf.version, epoch });
    return { epoch, run_id: runId };
  },
  'claim.reassign'(s, w, ak, a) {
    const auf = needAuftrag(s, a.auftrag_id);
    const c = s.claims.get(auf.id);
    if (!c || c.zustand !== 'active') refuse('zustand_unpassend', 'kein aktiver Claim');
    needPairedDevice(s, a.geraet_id);
    w.write('claim.fenced', auf.id, { run_id: c.run_id, schritt: 'arbeit' }, { epoch: c.epoch, version: c.auftrag_version });
    invalidateRunEffects(s, w, auf.id, c.epoch);
    for (const q of offeneRueckfragen(s, auf.id)) w.write('input.withdrawn', auf.id, { rueckfrage_id: q.id, grund: 'fencing' }, { kern: true, epoch: c.epoch }); // V0-RFG-04
    const runId = `r-${s.zaehler.run + 1}`;
    // The new claim stays on the version of the old one; budget, warnings and handover carry over (V0-BUD-15).
    w.write('claim.granted', auf.id, { run_id: runId, geraet_id: a.geraet_id, schritt: 'arbeit' }, { version: c.auftrag_version, epoch: c.epoch + 1 });
    return { epoch: c.epoch + 1, run_id: runId };
  },
  'claim.release'(s, w, ak, a) {
    const { c } = checkRun(s, w, ak, a);
    w.write('claim.released', a.auftrag_id, { run_id: c.run_id, schritt: 'arbeit' }, { epoch: c.epoch });
    return {};
  },
  'run.report'(s, w, ak, a) {
    if (!RUN_STATES.includes(a.zustand)) refuse('anfrage_ungueltig', `Run-Zustand ${a.zustand} unbekannt`);
    const extra = Number.isInteger(a.quellsequenz) ? { quellsequenz: a.quellsequenz } : {};
    const c = END_REPORTS.includes(a.zustand) ? beendeterClaim(s, ak, a) ?? checkRun(s, w, ak, a).c : checkRun(s, w, ak, a).c;
    w.write(`run.${a.zustand}`, a.auftrag_id, { run_id: c.run_id, ...(a.grund ? { grund: a.grund } : {}) }, { epoch: c.epoch, ...extra });
    return {};
  },
  'run.report_usage'(s, w, ak, a) {
    const c = beendeterClaim(s, ak, a) ?? checkRun(s, w, ak, a).c; // usage after the end still costs (V0-BUD-01)
    if (!['gemeldet', 'geschaetzt', 'unbekannt'].includes(a.quelle)) refuse('anfrage_ungueltig', 'quelle: gemeldet, geschaetzt oder unbekannt');
    if (a.kosten_eur !== undefined && a.kosten_eur !== null && (typeof a.kosten_eur !== 'number' || a.kosten_eur < 0)) refuse('anfrage_ungueltig', 'kosten_eur');
    w.write('run.usage_reported', a.auftrag_id, { run_id: c.run_id, quelle: a.quelle, kosten_eur: a.kosten_eur ?? null }, { epoch: c.epoch });
    return {};
  },
  'run.report_attempt'(s, w, ak, a) {
    const { a: auf, c } = checkRun(s, w, ak, a);
    const typ = { failed: 'run.attempt_failed', succeeded: 'run.attempt_succeeded', strategy_changed: 'run.strategy_changed' }[a.ergebnis];
    if (!typ) refuse('anfrage_ungueltig', 'ergebnis: failed, succeeded oder strategy_changed');
    if (typeof a.bezug !== 'string' || a.bezug === '') refuse('pflichtteil_fehlt', 'bezug fehlt');
    if (a.ergebnis === 'strategy_changed' && (typeof a.begruendung !== 'string' || a.begruendung === '')) refuse('pflichtteil_fehlt', 'Strategiewechsel ohne Begründung');
    w.write(typ, auf.id, { run_id: c.run_id, bezug: a.bezug, ...(a.begruendung ? { begruendung: a.begruendung } : {}) }, { epoch: c.epoch });
    const v = c.auftrag_version;
    if (a.ergebnis === 'failed' && auf.reparaturgrenzen.some((x) => x.startsWith(`v${v}:`)) && !auf.uebergabe_angefordert.includes(`v${v}`)) {
      w.write('task.handover_requested', auf.id, { aufforderung: { an: c.run_id, optionen: ['uebergabe_festhalten', 'teilweise_einreichen'] } }, { kern: true, version: v, epoch: c.epoch });
    }
    return {};
  },
  'run.reconcile'(s, w, ak, a) {
    needPairedDevice(s, ak.id);
    const c = s.claims.get(a.auftrag_id);
    if (!c || c.run_id !== a.run_id) refuse('unbekannt', 'Run unbekannt');
    w.write('run.reconciled', a.auftrag_id, { run_id: a.run_id, beobachtet: a.zustand }, { epoch: c.epoch });
    return {};
  },
  'input.ask'(s, w, ak, a) {
    const { a: auf, c } = checkRun(s, w, ak, a);
    const id = `q-${s.zaehler.frage + 1}`;
    w.write('input.requested', auf.id, { rueckfrage_id: id, frage: a.frage ?? '', optionen: a.optionen ?? [], standard: a.standard ?? null }, { epoch: c.epoch, version: c.auftrag_version });
    return { rueckfrage_id: id };
  },
  'input.answer'(s, w, ak, a) {
    ownerDevice(s, ak);
    const q = s.rueckfragen.get(a.rueckfrage_id);
    if (!q) refuse('unbekannt', 'Rückfrage unbekannt');
    if (a.frage_version !== q.frage_version) refuse('zustand_unpassend', 'Frageversion veraltet');
    if (q.zustand === 'answered') {
      w.write('input.answer_conflict', q.auftrag_id, { rueckfrage_id: q.id, option: a.option, gilt: q.antwort });
      return { konflikt: true, gilt: q.antwort };
    }
    if (q.zustand !== 'open') refuse('zustand_unpassend', `Rückfrage ist ${q.zustand}`);
    w.write('input.answered', q.auftrag_id, { rueckfrage_id: q.id, frage_version: q.frage_version, option: a.option });
    return { konflikt: false };
  },
  'input.withdraw'(s, w, ak, a) {
    const { a: auf, c } = checkRun(s, w, ak, a);
    const q = s.rueckfragen.get(a.rueckfrage_id);
    if (!q || q.zustand !== 'open') refuse('zustand_unpassend', 'keine offene Rückfrage');
    w.write('input.withdrawn', auf.id, { rueckfrage_id: q.id }, { epoch: c.epoch });
    return {};
  },
  'task.submit'(s, w, ak, a) {
    const { a: auf, c } = checkRun(s, w, ak, a);
    if (!['in_progress', 'waiting_input'].includes(auf.zustand)) refuse('zustand_unpassend', `Auftrag ist ${auf.zustand}`);
    if (typeof a.artefakt_hash !== 'string') refuse('pflichtteil_fehlt', 'artefakt_hash fehlt');
    const ev = w.write('task.submitted', auf.id, { artefakt_hash: a.artefakt_hash, belege: a.belege ?? [] }, { epoch: c.epoch, version: c.auftrag_version });
    w.write('claim.released', auf.id, { run_id: c.run_id, schritt: 'arbeit' }, { epoch: c.epoch });
    reviewRequest(s, w, auf, c, ev, a.artefakt_hash);
    return { zustand: 'submitted', ...(auf.pruefung_id ? { pruefung_id: auf.pruefung_id } : {}) };
  },
  'task.submit_partial'(s, w, ak, a) {
    const { a: auf, c } = checkRun(s, w, ak, a);
    if (!['in_progress', 'waiting_input'].includes(auf.zustand)) refuse('zustand_unpassend', `Auftrag ist ${auf.zustand}`);
    if (typeof a.artefakt_hash !== 'string') refuse('pflichtteil_fehlt', 'artefakt_hash fehlt');
    const ue = runUebergabe(s, auf, c, a.uebergabe);
    for (const q of offeneRueckfragen(s, auf.id)) w.write('input.withdrawn', auf.id, { rueckfrage_id: q.id, grund: 'teil_einreichung' }, { kern: true, epoch: c.epoch });
    const offen = Object.entries(ue.kriterienstand).filter(([, v]) => v !== 'erfuellt_laut_bearbeiter').map(([k]) => k).sort();
    const ev = w.write('task.partially_submitted', auf.id, { artefakt_hash: a.artefakt_hash, belege: a.belege ?? [], uebergabe: ue, offene_kriterien: offen }, { epoch: c.epoch, version: c.auftrag_version });
    w.write('claim.released', auf.id, { run_id: c.run_id, schritt: 'arbeit' }, { epoch: c.epoch });
    reviewRequest(s, w, auf, c, ev, a.artefakt_hash);
    return { zustand: 'partially_submitted', offene_kriterien: offen };
  },
  'task.record_handover'(s, w, ak, a) {
    const { a: auf, c } = checkRun(s, w, ak, a);
    const ue = runUebergabe(s, auf, c, a.uebergabe);
    const ev = w.write('task.handover_recorded', auf.id, { uebergabe: ue }, { epoch: c.epoch, version: c.auftrag_version });
    return { uebergabe_id: ev.id, unklare_wirkungen: ue.unklare_wirkungen };
  },
  'task.accept'(s, w, ak, a) {
    ownerDevice(s, ak);
    const auf = needAuftrag(s, a.auftrag_id);
    if (!['submitted', 'partially_submitted'].includes(auf.zustand)) refuse('zustand_unpassend', `Auftrag ist ${auf.zustand}`);
    const p = auf.pruefung_id ? s.pruefungen.get(auf.pruefung_id) : null;
    if (p && !['completed', 'not_performed'].includes(p.zustand)) {
      if (a.verzicht_rueckwaertsabnahme !== true) refuse('zustand_unpassend', `Prüfung ${p.id} ist ${p.zustand}; Abnahme nur mit ausdrücklichem Verzicht (V0-RWA-13)`);
      w.write('task.backward_review_waived', auf.id, { pruefung_id: p.id }, { version: p.auftrag_version });
      const pc = s.claims.get(claimKey(auf.id, 'pruefung'));
      if (pc?.zustand === 'active') w.write('claim.expired', auf.id, { run_id: pc.run_id, schritt: 'pruefung', grund: 'verzicht' }, { kern: true, epoch: pc.epoch });
    }
    w.write('task.accepted', auf.id, { offene_kriterien: auf.zustand === 'partially_submitted' ? auf.offene_kriterien : [] }, { version: auf.version });
    // The core proposes the takeover effect from the first artifact.store grant (V0-ABL-01 step 10).
    const grant = (auf.auftrag.befugnis?.grants ?? []).find((g) => g.effekt_typ === 'artifact.store');
    if (!grant) return { zustand: 'accepted' };
    const id = `e-${s.zaehler.effekt + 1}`;
    const parameter = { artefakt_hash: auf.artefakt_hash, ziel: grant.ziel };
    const c = s.claims.get(auf.id);
    w.write('effect.proposed', auf.id, { effekt_id: id, typ: 'artifact.store', ziel: grant.ziel, parameter_hash: sha256(canonical(parameter)), quelle: 'kern' }, { kern: true, version: auf.version, epoch: c?.epoch });
    w.write('effect.approval_pending', auf.id, { effekt_id: id }, { kern: true });
    return { zustand: 'waiting_approval', effekt_id: id, parameter_hash: sha256(canonical(parameter)) };
  },
  'task.cancel'(s, w, ak, a) {
    const auf = needAuftrag(s, a.auftrag_id);
    if (['completed', 'cancelled', 'failed', 'accepted'].includes(auf.zustand)) refuse('zustand_unpassend', `Auftrag ist ${auf.zustand}`);
    const c = s.claims.get(auf.id);
    const aktiv = c && c.zustand === 'active' ? c : null;
    w.write('task.cancelled', auf.id, { aufforderung: aktiv ? { an: aktiv.run_id, art: 'abbrechen' } : null }, { version: auf.version });
    if (aktiv) {
      invalidateRunEffects(s, w, auf.id, aktiv.epoch);
      w.write('claim.expired', auf.id, { run_id: aktiv.run_id, schritt: 'arbeit', grund: 'abbruch' }, { kern: true, epoch: aktiv.epoch });
    }
    return { abbruch_an: aktiv?.run_id ?? null };
  },
  'effect.propose'(s, w, ak, a) {
    if (ak.art === 'kern') refuse('nicht_abbildbar', 'den Übernahme-Effekt schlägt der Referenzkern bei task.accept selbst vor');
    const { a: auf, c } = checkRun(s, w, ak, a);
    if (typeof a.typ !== 'string' || typeof a.ziel !== 'string' || !a.parameter || typeof a.parameter !== 'object') refuse('anfrage_ungueltig', 'typ, ziel und parameter erwartet');
    const grant = (auf.versionen[c.auftrag_version].befugnis?.grants ?? []).find((g) => g.effekt_typ === a.typ && a.ziel.startsWith(g.ziel));
    if (!grant) refuse('nicht_berechtigt', 'kein passender Grant in der Befugnis (V0-INV-01)');
    const id = `e-${s.zaehler.effekt + 1}`;
    const ph = sha256(canonical(a.parameter));
    w.write('effect.proposed', auf.id, { effekt_id: id, typ: a.typ, ziel: a.ziel, parameter_hash: ph, quelle: 'run', run_id: c.run_id, grant_id: grant.id }, { version: c.auftrag_version, epoch: c.epoch });
    w.write('effect.approval_pending', auf.id, { effekt_id: id }, { kern: true });
    return { effekt_id: id, parameter_hash: ph, zustand: 'approval_pending' };
  },
  'effect.approve'(s, w, ak, a) {
    ownerDevice(s, ak);
    const e = s.effekte.get(a.effekt_id);
    if (!e) refuse('unbekannt', 'Effekt unbekannt');
    if (e.zustand !== 'approval_pending') refuse('zustand_unpassend', `Effekt ist ${e.zustand}`);
    const b = a.gebunden_an ?? {};
    if (b.parameter_hash !== e.parameter_hash || b.ziel !== e.ziel || b.auftrag_version !== e.auftrag_version || (e.epoch !== undefined && b.epoch !== e.epoch)) {
      refuse('bindung_abweichend', 'Freigabe passt nicht zu Parameter-Hash, Ziel, Auftragsversion oder Epoch');
    }
    w.write('effect.approved', e.auftrag_id, { effekt_id: e.id, gebunden_an: b });
    w.write('effect.intent', e.auftrag_id, { effekt_id: e.id }, { kern: true });
    return { zustand: 'intent_recorded' };
  },
  'effect.reject'(s, w, ak, a) {
    const e = s.effekte.get(a.effekt_id);
    if (!e || e.zustand !== 'approval_pending') refuse('zustand_unpassend', 'kein offener Effekt');
    w.write('effect.rejected', e.auftrag_id, { effekt_id: e.id, grund: a.grund ?? null });
    return {};
  },
  'effect.report'(s, w, ak, a) {
    const e = s.effekte.get(a.effekt_id);
    if (!e || e.zustand !== 'intent_recorded') refuse('zustand_unpassend', 'kein angekündigter Effekt');
    if (a.ergebnis === 'done') {
      w.write('effect.done', e.auftrag_id, { effekt_id: e.id, beleg: a.beleg ?? null });
      if (e.quelle === 'kern') w.write('task.completed', e.auftrag_id, {}, { kern: true });
    } else if (a.ergebnis === 'failed') {
      w.write('effect.failed', e.auftrag_id, { effekt_id: e.id, beleg: a.beleg ?? null });
    } else refuse('anfrage_ungueltig', 'ergebnis done oder failed');
    return {};
  },
  'effect.reconcile'(s, w, ak, a) {
    const e = s.effekte.get(a.effekt_id);
    if (!e || e.zustand !== 'outcome_unknown') refuse('zustand_unpassend', 'Effekt ist nicht unklar');
    if (!['done', 'failed'].includes(a.ergebnis)) refuse('anfrage_ungueltig', 'ergebnis done oder failed');
    w.write('effect.reconciled', e.auftrag_id, { effekt_id: e.id, ergebnis: a.ergebnis, beleg: a.beleg ?? null });
    if (a.ergebnis === 'done' && e.quelle === 'kern') w.write('task.completed', e.auftrag_id, {}, { kern: true });
    return {};
  },
  'effect.reconcile_failed'(s, w, ak, a) {
    const e = s.effekte.get(a.effekt_id);
    if (!e || e.zustand !== 'outcome_unknown') refuse('zustand_unpassend', 'Effekt ist nicht unklar');
    if (!['frist', 'fehler'].includes(a.grund)) refuse('anfrage_ungueltig', 'grund: frist oder fehler');
    w.write('effect.reconcile_failed', e.auftrag_id, { effekt_id: e.id, grund: a.grund, abrufe: a.abrufe ?? null });
    return { zustand: 'outcome_unknown' };
  },
  'memory.propose'(s, w, ak, a) {
    if (!Array.isArray(a.quellen) || a.quellen.length === 0) refuse('pflichtteil_fehlt', 'Erinnerung ohne Quelle ist unzulässig (V0-INV-10)');
    const id = `m-${s.zaehler.erinnerung + 1}`;
    w.write('memory.proposed', id, { text: a.text ?? '', quellen: a.quellen });
    return { erinnerung_id: id };
  },
  'memory.decide'(s, w, ak, a) {
    const m = s.erinnerungen.get(a.erinnerung_id);
    if (!m) refuse('unbekannt', 'Erinnerung unbekannt');
    const typ = { confirm: 'memory.confirmed', reject: 'memory.rejected', supersede: 'memory.superseded', withdraw: 'memory.withdrawn' }[a.entscheidung];
    if (!typ) refuse('anfrage_ungueltig', 'entscheidung unbekannt');
    w.write(typ, m.id, {});
    return {};
  },
  'review.submit_reconstruction'(s, w, ak, a) {
    const { a: auf, c } = checkRun(s, w, ak, a, 'pruefung');
    const p = s.pruefungen.get(c.pruefung_id);
    if (!Array.isArray(a.bedingungen) || a.bedingungen.length === 0 || a.bedingungen.some((b) => typeof b?.text !== 'string' || b.text === '')) {
      refuse('pflichtteil_fehlt', 'Rekonstruktion braucht Bedingungen mit Text');
    }
    const hash = sha256(canonical(a.bedingungen));
    if (p.rekonstruktion_hash !== null) {
      // The first reconstruction stays authoritative; an identical repeat yields the same result (V0-RWA-09).
      if (hash === p.rekonstruktion_hash) return { pruefung_id: p.id, rekonstruktion_hash: hash, zustand: 'reconstructed' };
      refuse('zustand_unpassend', 'abweichende zweite Rekonstruktion derselben Prüfung');
    }
    const grundlage = vergleichsgrundlage(s, auf, p);
    w.write('task.backward_reconstruction_recorded', auf.id, { pruefung_id: p.id, rekonstruktion_hash: hash, bedingungen: a.bedingungen.length, eingabemanifest_ergaenzt: [sha256(canonical(grundlage))] }, { version: p.auftrag_version, epoch: c.epoch });
    return { pruefung_id: p.id, rekonstruktion_hash: hash, zustand: 'reconstructed' };
  },
  'review.submit_comparison'(s, w, ak, a) {
    const { a: auf, c } = checkRun(s, w, ak, a, 'pruefung');
    const p = s.pruefungen.get(c.pruefung_id);
    if (p.zustand !== 'reconstructed') refuse('zustand_unpassend', 'Abgleich erst nach der festgeschriebenen Rekonstruktion (V0-RWA-10)');
    if (!Array.isArray(a.befunde)) refuse('pflichtteil_fehlt', 'befunde fehlen (leere Liste ist gültig)');
    const anzahl = { uebersehen: 0, angenommen: 0, anders_verstanden: 0 };
    const befunde = a.befunde.map((b) => {
      const befund = {
        schema_version: '0.2', pruefung_id: p.id, artefakt_hash: p.artefakt_hash, auftrag_version: p.auftrag_version, epoch: c.epoch,
        klasse: b?.klasse, bezug_auftrag: b?.bezug_auftrag ?? null, bezug_rekonstruktion: b?.bezug_rekonstruktion ?? null, fundstelle: b?.fundstelle ?? null, inhalt_ref: b?.inhalt_ref,
      };
      const fehler = validateSchema(BEFUND_SCHEMA, befund);
      if (fehler.length > 0) refuse('anfrage_ungueltig', `Befund: ${fehler[0].pointer} ${fehler[0].message}`);
      anzahl[befund.klasse] += 1;
      return befund;
    });
    befunde.forEach((befund, i) => w.write('task.backward_finding', auf.id, { befund_id: `${p.id}-b${i + 1}`, befund }, { version: p.auftrag_version, epoch: c.epoch }));
    w.write('task.backward_review_completed', auf.id, { pruefung_id: p.id, anzahl }, { version: p.auftrag_version, epoch: c.epoch });
    w.write('claim.released', auf.id, { run_id: c.run_id, schritt: 'pruefung' }, { epoch: c.epoch });
    return { pruefung_id: p.id, anzahl };
  },
  'review.rate_finding'(s, w, ak, a) {
    ownerDevice(s, ak);
    const p = s.pruefungen.get(a.pruefung_id);
    if (!p) refuse('unbekannt', 'Prüfung unbekannt');
    if (!p.befunde.some((b) => b.id === a.befund_id)) refuse('unbekannt', 'Befund unbekannt');
    if (!['zutreffend', 'unzutreffend'].includes(a.bewertung)) refuse('anfrage_ungueltig', 'bewertung: zutreffend oder unzutreffend');
    w.write('task.backward_finding_rated', p.auftrag_id, { pruefung_id: p.id, befund_id: a.befund_id, bewertung: a.bewertung });
    return {};
  },
};

const READERS = {
  'journal.read'(a) {
    const from = Number.isInteger(a.cursor) ? a.cursor : 0;
    const limit = Number.isInteger(a.limit) ? a.limit : 10000;
    const ereignisse = durable.journal.slice(from, from + limit);
    return { ereignisse, cursor: from + ereignisse.length };
  },
  'state.get'(a) {
    const s = state();
    if (a.entitaet === 'budget') return budgetView(s, needAuftrag(s, a.id), clock);
    const map = { auftrag: s.auftraege, claim: s.claims, geraet: s.geraete, rueckfrage: s.rueckfragen, effekt: s.effekte, erinnerung: s.erinnerungen, pruefung: s.pruefungen }[a.entitaet];
    if (!map) refuse('anfrage_ungueltig', 'entitaet unbekannt');
    const v = map.get(a.id);
    if (!v) refuse('unbekannt', `${a.entitaet} ${a.id} unbekannt`);
    return JSON.parse(JSON.stringify(v));
  },
  'context.get'(a) {
    const s = state();
    const auf = needAuftrag(s, a.auftrag_id);
    if (a.schritt === 'pruefung') {
      // Phase 1 sees only the artifact; phase 2 adds the basis for comparison (V0-RWA-08, -10, V0-INV-14).
      const p = auf.pruefung_id ? s.pruefungen.get(auf.pruefung_id) : null;
      if (!p) refuse('unbekannt', 'keine Prüfung');
      const phase1 = { pruefung_id: p.id, phase: 1, artefakt_hash: p.artefakt_hash, eingabemanifest: [...p.eingabemanifest] };
      if (p.rekonstruktion_hash === null) return phase1;
      return { ...phase1, phase: 2, vergleichsgrundlage: vergleichsgrundlage(s, auf, p) };
    }
    const erinnerungen = [...s.erinnerungen.values()].filter((m) => m.zustand === 'confirmed').map((m) => ({ id: m.id, text: m.text, quellen: m.quellen }));
    const { version } = massgeblich(s, auf);
    return {
      auftrag_id: auf.id, auftrag_version: version, antworten: antworten(s, auf.id), erinnerungen,
      uebergabe: auf.uebergabe, budgetstand: budgetstand(auf, clock), vorwarnungen: [...auf.vorwarnungen],
    };
  },
};

const TESTS = {
  'test.reset'() { resetAll(); return {}; },
  'test.clock_set'(a) {
    const t = Date.parse(a.zeit);
    if (Number.isNaN(t)) refuse('anfrage_ungueltig', 'zeit ungültig');
    if (t < clock) refuse('anfrage_ungueltig', 'Kernzeit läuft nicht rückwärts');
    clock = t;
    evaluate();
    return {};
  },
  'test.restart_core'() { cache = null; return {}; },
  'test.link'(a) {
    const s = state();
    needPairedDevice(s, a.geraet_id);
    const w = makeWriter({ art: 'suite', id: 'suite' }, `k-link-${durable.journal.length}`);
    w.write(a.verbindung === 'down' ? 'device.offline' : 'device.online', a.geraet_id, {}, { kern: true });
    durable.journal.push(...w.out);
    return {};
  },
  'test.effect_mode'(a) {
    const s = state();
    const e = s.effekte.get(a.effekt_id);
    if (a.modus !== 'antwort_verloren') refuse('anfrage_ungueltig', 'modus antwort_verloren erwartet');
    if (!e || e.zustand !== 'intent_recorded') refuse('zustand_unpassend', 'kein angekündigter Effekt');
    const w = makeWriter({ art: 'suite', id: 'suite' }, `k-effekt-${durable.journal.length}`);
    w.write('effect.outcome_unknown', e.auftrag_id, { effekt_id: e.id }, { kern: true });
    durable.journal.push(...w.out);
    return {};
  },
};

// ---------- dispatch ----------

function respond(id, body) {
  return { schema_version: '0.1', art: 'antwort', id, journal_seq: durable.journal.length, ...body };
}

function handle(line) {
  let req;
  try { req = JSON.parse(line); } catch { return respond('unbekannt', { ok: false, fehler: { code: 'anfrage_ungueltig', meldung: 'kein JSON' } }); }
  const id = typeof req?.id === 'string' ? req.id : 'unbekannt';
  if (!req || req.art !== 'anfrage' || typeof req.command !== 'string' || !req.akteur || typeof req.akteur.art !== 'string' || typeof req.args !== 'object' || req.args === null) {
    return respond(id, { ok: false, fehler: { code: 'anfrage_ungueltig', meldung: 'Anfrageschema verletzt' } });
  }
  const { command, akteur, args } = req;
  try {
    if (OHNE.has(command)) refuse('nicht_abbildbar', `${command} ist in diesem Prüfling abgeschaltet`);
    if (command.startsWith('test.')) {
      if (!TESTS[command]) refuse('command_unbekannt', command);
      if (akteur.art !== 'suite') refuse('nicht_berechtigt', 'Steuerbefehle nur für die Suite');
      return respond(id, { ok: true, ergebnis: TESTS[command](args) });
    }
    if (!AUTH[command]) refuse('command_unbekannt', command);
    if (!AUTH[command].includes(akteur.art)) refuse('nicht_berechtigt', `${akteur.art} darf ${command} nicht senden`);
    if (READS.has(command)) return respond(id, { ok: true, ergebnis: READERS[command](args) });
    const key = req.idempotenz_key;
    if (typeof key !== 'string' || key.length < 8) refuse('anfrage_ungueltig', 'idempotenz_key fehlt');
    const fingerprint = canonical({ command, akteur, args });
    const seen = durable.idem.get(key);
    if (seen) {
      if (seen.fingerprint !== fingerprint) refuse('key_konflikt', 'gleicher Key, andere Anfrage');
      return { ...seen.response, id };
    }
    evaluate(); // budget end by core time comes before the message (V0-BUD-09)
    const w = makeWriter(akteur, key);
    let response;
    try {
      const ergebnis = H[command](state(), w, akteur, args);
      durable.journal.push(...w.out);
      evaluate();
      response = respond(id, { ok: true, ergebnis });
    } catch (err) {
      if (!(err instanceof Refusal)) throw err;
      // Only the rejection event itself is kept (KP-INV-03); everything else of this command is discarded.
      cache = null;
      for (const ev of err.events) {
        durable.journal.push({ ...ev, id: `ev-${durable.journal.length + 1}`, seq: durable.journal.filter((e) => e.strom === ev.strom).length + 1 });
      }
      cache = null;
      response = respond(id, { ok: false, fehler: { code: err.code, meldung: err.message } });
    }
    durable.idem.set(key, { fingerprint, response });
    return response;
  } catch (err) {
    if (err instanceof Refusal) { cache = null; return respond(id, { ok: false, fehler: { code: err.code, meldung: err.message } }); }
    return respond(id, { ok: false, fehler: { code: 'anfrage_ungueltig', meldung: `interner Fehler: ${err.message}` } });
  }
}

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  if (line.trim() === '') return;
  process.stdout.write(`${JSON.stringify(handle(line))}\n`);
});
