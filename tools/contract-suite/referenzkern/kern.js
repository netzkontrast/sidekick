#!/usr/bin/env node
// Reference core for the contract suite (docs/spec/kern-port-v0.md, plan item M1.4).
// DISPOSABLE: this is not product code and not a decision for Tor A. It exists so the suite has
// something to run against. One process, in memory; the journal is the only durable state and
// every derived state is a fold over it (V0-INV-02). Requests and responses are JSON lines on
// stdin/stdout (KP-GRZ-01).
import readline from 'node:readline';
import crypto from 'node:crypto';

const START = Date.parse('2026-11-01T00:00:00Z');
const RUN_STATES = ['starting', 'running', 'paused', 'cancel_requested', 'cancel_confirmed', 'exited_ok', 'exited_error', 'lost'];
const NOT_BUILT = new Set(['task.revise', 'task.submit_partial', 'task.record_handover', 'run.report_usage', 'run.report_attempt',
  'review.submit_reconstruction', 'review.submit_comparison', 'review.rate_finding']);
const READS = new Set(['journal.read', 'state.get', 'context.get']);

/** Which actor kinds may send which command (KP-INV-04). */
const AUTH = {
  'device.pair_request': ['geraet'], 'device.pair_confirm': ['owner'], 'device.revoke': ['owner'], 'device.report_capability': ['geraet'],
  'task.draft': ['owner'], 'task.open': ['owner'], 'task.accept': ['owner'], 'task.cancel': ['owner'], 'task.submit': ['run'],
  'claim.request': ['geraet'], 'claim.reassign': ['owner'], 'claim.release': ['run'],
  'run.report': ['run'], 'run.reconcile': ['geraet'],
  'input.ask': ['run'], 'input.answer': ['owner'], 'input.withdraw': ['run'],
  'effect.propose': ['run', 'kern'], 'effect.approve': ['owner'], 'effect.reject': ['owner'], 'effect.report': ['effekt_adapter'], 'effect.reconcile': ['effekt_adapter'],
  'memory.propose': ['kern', 'run'], 'memory.decide': ['owner'],
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
const isoNow = () => new Date(clock).toISOString();

function emptyState() {
  return { auftraege: new Map(), claims: new Map(), geraete: new Map(), rueckfragen: new Map(), effekte: new Map(), erinnerungen: new Map(), zaehler: { run: 0, frage: 0, effekt: 0, erinnerung: 0 } };
}

/** Apply one journal event to derived state (the only place state changes). */
function apply(s, ev) {
  const d = ev.daten;
  const auf = s.auftraege.get(ev.strom);
  switch (ev.typ) {
    case 'device.pairing_pending': s.geraete.set(ev.strom, { id: ev.strom, pairing: 'pairing_pending', verbindung: 'online', capabilities: [] }); break;
    case 'device.paired': s.geraete.get(ev.strom).pairing = 'paired'; break;
    case 'device.revoked': s.geraete.get(ev.strom).pairing = 'revoked'; break;
    case 'device.capability_reported': s.geraete.get(ev.strom).capabilities = d.capabilities; break;
    case 'device.offline': s.geraete.get(ev.strom).verbindung = 'offline'; break;
    case 'device.online': s.geraete.get(ev.strom).verbindung = 'online'; break;
    case 'task.drafted': s.auftraege.set(ev.strom, { id: ev.strom, version: d.version, zustand: 'draft', auftrag: d.auftrag }); break;
    case 'task.opened': auf.zustand = 'open'; break;
    case 'claim.granted':
      s.zaehler.run += 1;
      s.claims.set(ev.strom, { auftrag_id: ev.strom, epoch: ev.epoch, run_id: d.run_id, geraet_id: d.geraet_id, zustand: 'active' });
      auf.zustand = 'in_progress';
      break;
    case 'claim.fenced': s.claims.get(ev.strom).zustand = 'fenced'; break;
    case 'claim.released': s.claims.get(ev.strom).zustand = 'released'; break;
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
    case 'task.accepted': auf.zustand = 'accepted'; break;
    case 'task.cancelled': auf.zustand = 'cancelled'; break;
    case 'effect.proposed':
      s.zaehler.effekt += 1;
      s.effekte.set(d.effekt_id, { id: d.effekt_id, auftrag_id: ev.strom, typ: d.typ, ziel: d.ziel, parameter_hash: d.parameter_hash, auftrag_version: ev.auftrag_version, epoch: ev.epoch, zustand: 'proposed' });
      break;
    case 'effect.approval_pending': s.effekte.get(d.effekt_id).zustand = 'approval_pending'; auf.zustand = 'waiting_approval'; break;
    case 'effect.approved': s.effekte.get(d.effekt_id).zustand = 'approved'; break;
    case 'effect.intent': s.effekte.get(d.effekt_id).zustand = 'intent_recorded'; auf.zustand = 'applying'; break;
    case 'effect.rejected': s.effekte.get(d.effekt_id).zustand = 'rejected'; auf.zustand = 'accepted'; break;
    case 'effect.done': s.effekte.get(d.effekt_id).zustand = 'done'; break;
    case 'effect.failed': s.effekte.get(d.effekt_id).zustand = 'failed'; auf.zustand = 'accepted'; break;
    case 'effect.outcome_unknown': s.effekte.get(d.effekt_id).zustand = 'outcome_unknown'; auf.zustand = 'outcome_unknown'; break;
    case 'effect.reconciled': {
      const e = s.effekte.get(d.effekt_id);
      e.zustand = 'reconciled'; e.ergebnis = d.ergebnis;
      if (d.ergebnis !== 'done') auf.zustand = 'accepted';
      break;
    }
    case 'task.completed': auf.zustand = 'completed'; break;
    case 'memory.proposed': s.zaehler.erinnerung += 1; s.erinnerungen.set(ev.strom, { id: ev.strom, text: d.text, quellen: d.quellen, zustand: 'candidate' }); break;
    case 'memory.confirmed': s.erinnerungen.get(ev.strom).zustand = 'confirmed'; break;
    case 'memory.rejected': s.erinnerungen.get(ev.strom).zustand = 'rejected'; break;
    case 'memory.superseded': s.erinnerungen.get(ev.strom).zustand = 'superseded'; break;
    case 'memory.withdrawn': s.erinnerungen.get(ev.strom).zustand = 'withdrawn'; break;
    default: break; // run.*, input.answer_conflict, claim.rejected_* change no derived state
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
        idempotenz_key: `${key ?? 'k-intern'}-${out.length + 1}`.padEnd(8, '0'),
        ursache: extra.ursache ?? null, daten,
      };
      if (extra.version !== undefined) ev.auftrag_version = extra.version;
      if (extra.epoch !== undefined) ev.epoch = extra.epoch;
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
function checkRun(s, w, akteur, args) {
  const a = needAuftrag(s, args.auftrag_id);
  const c = s.claims.get(a.id);
  if (!c) refuse('claim_inaktiv', 'kein Claim');
  if (!Number.isInteger(args.epoch)) refuse('anfrage_ungueltig', 'epoch fehlt');
  if (args.epoch < c.epoch) {
    const ev = w.write('claim.rejected_stale_epoch', a.id, { run_id: akteur.id, gemeldete_epoch: args.epoch, aktuelle_epoch: c.epoch }, { epoch: args.epoch });
    refuse('epoch_veraltet', `Claim steht auf Epoch ${c.epoch}`, [ev]);
  }
  if (c.run_id !== akteur.id) refuse('nicht_berechtigt', 'Run hält diesen Claim nicht');
  if (c.zustand !== 'active') {
    const ev = w.write('claim.rejected_inactive', a.id, { run_id: akteur.id, claim_zustand: c.zustand }, { epoch: args.epoch });
    refuse('claim_inaktiv', `Claim ist ${c.zustand}`, [ev]);
  }
  return { a, c };
}

function ownerDevice(s, akteur) {
  if (akteur.geraet_id) needPairedDevice(s, akteur.geraet_id);
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
    if (s.auftraege.has(auf.id)) refuse('zustand_unpassend', `Auftrag ${auf.id} existiert bereits`);
    w.write('task.drafted', auf.id, { version: auf.version, auftrag: auf }, { version: auf.version });
    return { auftrag_id: auf.id, zustand: 'draft' };
  },
  'task.open'(s, w, ak, a) {
    ownerDevice(s, ak);
    const auf = needAuftrag(s, a.auftrag_id);
    if (auf.zustand !== 'draft') refuse('zustand_unpassend', `Auftrag ist ${auf.zustand}`);
    if (a.version !== auf.version) refuse('zustand_unpassend', 'Version passt nicht');
    w.write('task.opened', auf.id, {}, { version: auf.version });
    return { zustand: 'open' };
  },
  'claim.request'(s, w, ak, a) {
    const g = needPairedDevice(s, ak.id);
    const auf = needAuftrag(s, a.auftrag_id);
    if (auf.zustand !== 'open') refuse('zustand_unpassend', `Auftrag ist ${auf.zustand}`);
    if (auf.auftrag.datenklasse === 'local-only' && !g.capabilities.some((c) => c.local_only === true)) {
      refuse('zustand_unpassend', 'local-only: Gerät meldet keine passende Capability; Auftrag bleibt open (V0-FALL-10)');
    }
    const prev = s.claims.get(auf.id);
    const epoch = (prev?.epoch ?? 0) + 1;
    const runId = `r-${s.zaehler.run + 1}`;
    w.write('claim.granted', auf.id, { run_id: runId, geraet_id: ak.id, schritt: a.schritt ?? 'arbeit' }, { version: auf.version, epoch });
    return { epoch, run_id: runId };
  },
  'claim.reassign'(s, w, ak, a) {
    const auf = needAuftrag(s, a.auftrag_id);
    const c = s.claims.get(auf.id);
    if (!c || c.zustand !== 'active') refuse('zustand_unpassend', 'kein aktiver Claim');
    needPairedDevice(s, a.geraet_id);
    w.write('claim.fenced', auf.id, { run_id: c.run_id }, { epoch: c.epoch, version: auf.version });
    const runId = `r-${s.zaehler.run + 1}`;
    w.write('claim.granted', auf.id, { run_id: runId, geraet_id: a.geraet_id, schritt: 'arbeit' }, { version: auf.version, epoch: c.epoch + 1 });
    return { epoch: c.epoch + 1, run_id: runId };
  },
  'claim.release'(s, w, ak, a) {
    const { c } = checkRun(s, w, ak, a);
    w.write('claim.released', a.auftrag_id, { run_id: c.run_id }, { epoch: c.epoch });
    return {};
  },
  'run.report'(s, w, ak, a) {
    const { c } = checkRun(s, w, ak, a);
    if (!RUN_STATES.includes(a.zustand)) refuse('anfrage_ungueltig', `Run-Zustand ${a.zustand} unbekannt`);
    w.write(`run.${a.zustand}`, a.auftrag_id, { run_id: c.run_id }, { epoch: c.epoch });
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
    w.write('input.requested', auf.id, { rueckfrage_id: id, frage: a.frage ?? '', optionen: a.optionen ?? [], standard: a.standard ?? null }, { epoch: c.epoch, version: auf.version });
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
    w.write('task.submitted', auf.id, { artefakt_hash: a.artefakt_hash, belege: a.belege ?? [] }, { epoch: c.epoch, version: auf.version });
    w.write('claim.released', auf.id, { run_id: c.run_id }, { epoch: c.epoch });
    return { zustand: 'submitted' };
  },
  'task.accept'(s, w, ak, a) {
    ownerDevice(s, ak);
    const auf = needAuftrag(s, a.auftrag_id);
    if (!['submitted', 'partially_submitted'].includes(auf.zustand)) refuse('zustand_unpassend', `Auftrag ist ${auf.zustand}`);
    w.write('task.accepted', auf.id, {}, { version: auf.version });
    // The core proposes the takeover effect from the first artifact.store grant (V0-ABL-01 step 10).
    const grant = (auf.auftrag.befugnis?.grants ?? []).find((g) => g.effekt_typ === 'artifact.store');
    if (!grant) return { zustand: 'accepted' };
    const id = `e-${s.zaehler.effekt + 1}`;
    const parameter = { artefakt_hash: auf.artefakt_hash, ziel: grant.ziel };
    const c = s.claims.get(auf.id);
    w.write('effect.proposed', auf.id, { effekt_id: id, typ: 'artifact.store', ziel: grant.ziel, parameter_hash: sha256(canonical(parameter)) }, { kern: true, version: auf.version, epoch: c?.epoch });
    w.write('effect.approval_pending', auf.id, { effekt_id: id }, { kern: true });
    return { zustand: 'waiting_approval', effekt_id: id, parameter_hash: sha256(canonical(parameter)) };
  },
  'task.cancel'(s, w, ak, a) {
    const auf = needAuftrag(s, a.auftrag_id);
    if (['completed', 'cancelled', 'failed'].includes(auf.zustand)) refuse('zustand_unpassend', `Auftrag ist ${auf.zustand}`);
    w.write('task.cancelled', auf.id, {}, { version: auf.version });
    return {};
  },
  'effect.propose'() { refuse('nicht_abbildbar', 'Vorschläge durch Runs sind im Referenzkern noch nicht gebaut; die Übernahme schlägt der Kern selbst vor'); },
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
      w.write('task.completed', e.auftrag_id, {}, { kern: true });
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
    if (a.ergebnis === 'done') w.write('task.completed', e.auftrag_id, {}, { kern: true });
    return {};
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
    const map = { auftrag: s.auftraege, claim: s.claims, geraet: s.geraete, rueckfrage: s.rueckfragen, effekt: s.effekte, erinnerung: s.erinnerungen }[a.entitaet];
    if (!map) refuse('anfrage_ungueltig', 'entitaet unbekannt');
    const v = map.get(a.id);
    if (!v) refuse('unbekannt', `${a.entitaet} ${a.id} unbekannt`);
    return JSON.parse(JSON.stringify(v));
  },
  'context.get'(a) {
    const s = state();
    const auf = needAuftrag(s, a.auftrag_id);
    const antworten = [...s.rueckfragen.values()].filter((q) => q.auftrag_id === auf.id && q.zustand === 'answered').map((q) => ({ rueckfrage_id: q.id, option: q.antwort }));
    const erinnerungen = [...s.erinnerungen.values()].filter((m) => m.zustand === 'confirmed').map((m) => ({ id: m.id, text: m.text, quellen: m.quellen }));
    return { auftrag_id: auf.id, auftrag_version: auf.version, antworten, erinnerungen };
  },
};

const TESTS = {
  'test.reset'() { resetAll(); return {}; },
  'test.clock_set'(a) {
    const t = Date.parse(a.zeit);
    if (Number.isNaN(t)) refuse('anfrage_ungueltig', 'zeit ungültig');
    clock = t;
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
    if (command.startsWith('test.')) {
      if (!TESTS[command]) refuse('command_unbekannt', command);
      if (akteur.art !== 'suite') refuse('nicht_berechtigt', 'Steuerbefehle nur für die Suite');
      return respond(id, { ok: true, ergebnis: TESTS[command](args) });
    }
    if (NOT_BUILT.has(command)) refuse('nicht_abbildbar', `${command} ist im Referenzkern noch nicht gebaut`);
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
    const w = makeWriter(akteur, key);
    let response;
    try {
      const ergebnis = H[command](state(), w, akteur, args);
      durable.journal.push(...w.out);
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
