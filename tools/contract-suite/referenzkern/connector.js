// Connector prototype for the contract suite (plan item M1.6): couples the prototype supervisor
// to the kern-port. DISPOSABLE like the reference core; the real connector follows in M3.1.
// What it shows: an outbox with local sequence numbers and stable idempotency keys that survives
// a connector restart (V0-FALL-03, -04); effects are never buffered (V0-FALL-03); after a restart
// nothing is started blindly (RTA-LEB-06); cancel requests from the journal reach the process
// group (V0-FALL-08); a missing program turns the capability into "behauptet" (V0-FALL-17);
// a follow-up run resumes the session only where the profile proves it (RTA-SES-03, RTA-RFG-02).
import fs from 'node:fs';

const ENDE = ['exited_ok', 'exited_error', 'cancel_confirmed', 'lost'];

export class Connector {
  /**
   * @param {object} o
   * @param {{send: Function}} o.kern kern-port client (lib/pruefling.js)
   * @param {(emit: Function) => object} o.supervisorFactory builds the supervisor with the connector's emit
   * @param {string} o.geraetId paired device this connector speaks for
   * @param {string} o.zustandsDatei outbox, known runs and journal cursor (survive a restart)
   * @param {string} [o.rechtestufe] rights level of every run; never taken from task text or answers (RTA-INV-03)
   */
  constructor({ kern, supervisorFactory, geraetId, zustandsDatei, rechtestufe = 'nur_lesen' }) {
    this.kern = kern;
    this.geraetId = geraetId;
    this.datei = zustandsDatei;
    this.rechtestufe = rechtestufe;
    this.z = fs.existsSync(zustandsDatei) ? JSON.parse(fs.readFileSync(zustandsDatei, 'utf8')) : { seq: 0, outbox: [], runs: {}, cursor: 0 };
    this.online = true;
    this.pruefenNoetig = false;
    this.abgebrochen = new Set();
    this.kette = Promise.resolve();
    this.sup = supervisorFactory((ev) => this.#vonRuntime(ev));
  }

  get geraet() { return { art: 'geraet', id: this.geraetId }; }

  #speichern() { fs.writeFileSync(this.datei, JSON.stringify(this.z)); }

  #einreihen(command, akteur, args) {
    this.z.seq += 1;
    this.z.outbox.push({ command, akteur, args: { ...args, quellsequenz: this.z.seq }, key: `k-${this.geraetId}-${String(this.z.seq).padStart(6, '0')}` });
    this.#speichern();
  }

  /** Runtime events become kern messages in the outbox; they are sent when the link is up. */
  #vonRuntime(ev) {
    const r = this.z.runs[ev.run_id];
    if (!r) return;
    const run = { art: 'run', id: ev.run_id };
    const basis = { auftrag_id: ev.auftrag_id, epoch: ev.epoch };
    if (ev.typ === 'run.usage_reported') {
      // USD from the runtime is not converted to EUR here (open, V0 §8); it is shown, not counted.
      this.#einreihen('run.report_usage', run, { ...basis, quelle: typeof ev.kosten_usd === 'number' ? 'geschaetzt' : 'unbekannt' });
    } else {
      const zustand = ev.typ.slice('run.'.length);
      this.#einreihen('run.report', run, { ...basis, zustand, ...(ev.grund ? { grund: ev.grund } : {}) });
      if (ENDE.includes(zustand)) { r.beendet = true; this.#speichern(); }
    }
    this.flush();
  }

  /** Send the outbox in order; a definitive answer (ok or refusal) removes the message. */
  flush() {
    this.kette = this.kette.then(async () => {
      while (this.online && this.z.outbox.length > 0) {
        const m = this.z.outbox[0];
        await this.kern.send(m.command, m.akteur, m.args, m.key);
        this.z.outbox.shift();
        this.#speichern();
      }
    });
    return this.kette;
  }

  /** Test hook for V0-FALL-04: the first message reaches the kern, then the connector dies before removing it. */
  async sendeOhneQuittung() {
    await this.kette;
    const m = this.z.outbox[0];
    return this.kern.send(m.command, m.akteur, m.args, m.key);
  }

  /** Life sign of a running run (queued like every report). */
  lebenszeichen(runId) {
    const r = this.z.runs[runId];
    this.#einreihen('run.report', { art: 'run', id: runId }, { auftrag_id: r.auftrag_id, epoch: r.epoch, zustand: 'running' });
    return this.flush();
  }

  setOnline(online) {
    if (online && !this.online) this.pruefenNoetig = true; // new effects only after a fresh check (V0-FALL-03)
    this.online = online;
    return online ? this.flush() : this.kette;
  }

  /** Report the supervisor capability (RTA-CAP-03). */
  async meldeCapability() {
    this.#einreihen('device.report_capability', this.geraet, { capabilities: [this.sup.capability()] });
    return this.flush();
  }

  /** Request a claim for the work step and start a run. */
  async uebernehme(auftragId, { plan = {} } = {}) {
    const res = await this.kern.send('claim.request', this.geraet, { auftrag_id: auftragId, schritt: 'arbeit' }, `k-${this.geraetId}-claim-${auftragId}-${this.z.seq}`);
    if (!res.ok) return { ok: false, fehler: res.fehler.code };
    return this.starte({ auftragId, runId: res.ergebnis.run_id, epoch: res.ergebnis.epoch, plan });
  }

  /**
   * Start a run for a granted claim. With a predecessor, the session is resumed only when the
   * profile proves resume (RTA-SES-03); otherwise a new run gets the handover in its context (RTA-RFG-02).
   */
  async starte({ auftragId, runId, epoch, plan = {}, vorgaenger = null }) {
    if (this.z.runs[runId]) return { ok: false, fehler: 'bereits_bekannt' }; // never a blind double start
    const run = { art: 'run', id: runId };
    const kontext = (await this.kern.send('context.get', run, { auftrag_id: auftragId })).ergebnis;
    const resume = vorgaenger && this.sup.profile.faehigkeiten.resume.status === 'nachgewiesen' && this.sup.runs.has(vorgaenger);
    this.z.runs[runId] = { run_id: runId, auftrag_id: auftragId, epoch, profil_version: this.sup.profile.version, beendet: false };
    this.#speichern();
    const r = this.sup.start({
      runId, auftragId, epoch, rechtestufe: this.rechtestufe, fortsetzenVon: resume ? vorgaenger : null,
      prompt: JSON.stringify({ ...plan, kontext }),
    });
    if (!r.ok) {
      this.#einreihen('run.report', run, { auftrag_id: auftragId, epoch, zustand: 'exited_error', grund: r.fehler });
      if (r.fehler === 'programm_fehlt') this.#einreihen('device.report_capability', this.geraet, { capabilities: [this.sup.capability()] }); // V0-FALL-17
      this.z.runs[runId].beendet = true;
      this.#speichern();
      await this.flush();
    }
    return { ...r, fortgesetzt: Boolean(resume) };
  }

  /** Read the journal from the stored cursor and act on what concerns this device's runs. */
  async synchronisiere() {
    await this.flush();
    const res = await this.kern.send('journal.read', this.geraet, { cursor: this.z.cursor });
    for (const ev of res.ergebnis.ereignisse) {
      const an = ev.daten?.aufforderung?.art === 'abbrechen' ? ev.daten.aufforderung.an : null;
      const ende = ['claim.fenced', 'claim.expired'].includes(ev.typ) ? ev.daten.run_id : null;
      for (const runId of [an, ende]) {
        if (!runId || !this.z.runs[runId] || this.abgebrochen.has(runId)) continue;
        this.abgebrochen.add(runId);
        this.sup.fence(runId);
      }
    }
    this.z.cursor = res.ergebnis.cursor;
    this.pruefenNoetig = false;
    this.#speichern();
    return res.ergebnis.ereignisse;
  }

  /** Effects are never buffered: offline they are refused, after reconnect only after a fresh check. */
  async schlageVor(runId, effekt) {
    if (!this.online) return { ok: false, fehler: 'offline_nicht_gepuffert' };
    if (this.pruefenNoetig) return { ok: false, fehler: 'erst_synchronisieren' };
    const r = this.z.runs[runId];
    const res = await this.kern.send('effect.propose', { art: 'run', id: runId }, { auftrag_id: r.auftrag_id, epoch: r.epoch, ...effekt }, `k-${this.geraetId}-effekt-${runId}-${this.z.seq}`);
    return res.ok ? { ok: true, ...res.ergebnis } : { ok: false, fehler: res.fehler.code };
  }

  /** After a connector restart: deliver the outbox, then report unknown runs as lost; start nothing (RTA-LEB-06). */
  async wiederaufnehmen() {
    await this.flush();
    const offen = Object.values(this.z.runs).filter((r) => !r.beendet);
    this.sup.recover(offen);
    await this.flush();
    for (const r of offen) {
      if (this.sup.profile.faehigkeiten.wiederanbindung.status === 'nachgewiesen') continue;
      await this.kern.send('run.reconcile', this.geraet, { auftrag_id: r.auftrag_id, run_id: r.run_id, zustand: 'lost' }, `k-${this.geraetId}-abgleich-${r.run_id}`);
    }
    return offen.map((r) => r.run_id);
  }
}
