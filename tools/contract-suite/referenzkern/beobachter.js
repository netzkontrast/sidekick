// Observer prototype for unclear effects (runtime-adapter-v0.md RTA-BEO-01…08). DISPOSABLE like the
// reference core. An observer belongs to the effect adapter: it repeats one status call with fixed
// parameters until an end condition holds, the deadline passes or too many calls fail in a row.
// Time is injected so the suite can run it on a virtual clock.

export class BeobachterFehler extends Error {
  constructor(code, meldung) { super(meldung); this.code = code; }
}

const PFAD = /^\$((?:\.[A-Za-z_][A-Za-z0-9_]*)+)$/;

/** Value at a "$.a.b" path, or undefined when any step is missing (RTA-BEO-04). */
export function wertAmPfad(obj, pfad) {
  const m = pfad.match(PFAD);
  if (!m) throw new BeobachterFehler('konfiguration', `Pfad ${pfad} ungültig`);
  let v = obj;
  for (const k of m[1].slice(1).split('.')) {
    if (v === null || typeof v !== 'object' || !Object.hasOwn(v, k)) return undefined;
    v = v[k];
  }
  return v;
}

/** Type-exact mapping: true matches only true, never 1 or "true" (RTA-BEO-05). */
export function ordneZu(zuordnung, wert) {
  const treffer = zuordnung.find((z) => typeof z.wert === typeof wert && z.wert === wert);
  return treffer ? treffer.ergebnis : null;
}

function pruefeKonfiguration(k) {
  const zahl = (x) => Number.isInteger(x) && x > 0;
  if (!k || !zahl(k.takt_ms) || !zahl(k.frist_ms) || !zahl(k.max_fehler_in_folge) || typeof k.pfad !== 'string' || !Array.isArray(k.zuordnung)) {
    throw new BeobachterFehler('konfiguration', 'takt_ms, frist_ms, max_fehler_in_folge, pfad und zuordnung erwartet');
  }
  if (k.zuordnung.some((z) => !['done', 'failed'].includes(z.ergebnis))) throw new BeobachterFehler('konfiguration', 'zuordnung nur auf done oder failed');
  wertAmPfad({}, k.pfad);
}

export class Beobachter {
  /**
   * @param {object} o
   * @param {object} o.konfiguration takt_ms, frist_ms, max_fehler_in_folge, pfad, zuordnung (RTA-BEO-02, -03)
   * @param {{braucht: string[], rufe: (params) => Promise<object>}} o.abruf status call of the effect adapter
   * @param {() => number} [o.jetzt] clock in ms
   * @param {(ms: number) => Promise<void>} [o.schlafe]
   */
  constructor({ konfiguration, abruf, jetzt = Date.now, schlafe = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
    pruefeKonfiguration(konfiguration);
    this.konfiguration = Object.freeze({ ...konfiguration });
    this.abruf = abruf;
    this.jetzt = jetzt;
    this.schlafe = schlafe;
  }

  /** Only the effect adapter configures cadence and deadline; a run or model never does (RTA-BEO-02). */
  konfiguriere(akteur, konfiguration) {
    if (akteur?.art !== 'effekt_adapter') return { ok: false, fehler: 'nicht_berechtigt' };
    pruefeKonfiguration(konfiguration);
    this.konfiguration = Object.freeze({ ...konfiguration });
    return { ok: true };
  }

  /**
   * Observe one effect. The call runs with the effect's own rights only (RTA-BEO-08).
   * @returns {Promise<{ausgang: 'reconciled'|'reconcile_failed', ergebnis?, beleg?, grund?, abrufe: object[]}>}
   */
  async beobachte(effekt) {
    const fehlend = this.abruf.braucht.filter((r) => !(effekt.rechte ?? []).includes(r));
    if (fehlend.length > 0) throw new BeobachterFehler('nicht_berechtigt', `Status-Abruf braucht ${fehlend.join(', ')}, der Effekt hatte das nicht`);
    const k = this.konfiguration;
    const beginn = this.jetzt();
    const abrufe = [];
    let fehlerInFolge = 0;
    for (;;) {
      const zeit = this.jetzt() - beginn;
      if (zeit >= k.frist_ms) return { ausgang: 'reconcile_failed', grund: 'frist', abrufe };
      let antwort;
      try {
        antwort = await this.abruf.rufe(effekt.parameter);
        fehlerInFolge = 0;
      } catch (e) {
        fehlerInFolge += 1;
        abrufe.push({ zeit, fehler: e.message });
        if (fehlerInFolge > k.max_fehler_in_folge) return { ausgang: 'reconcile_failed', grund: 'fehler', abrufe };
        await this.schlafe(k.takt_ms);
        continue;
      }
      const ergebnis = ordneZu(k.zuordnung, wertAmPfad(antwort, k.pfad)); // missing path or unmapped value: not finished
      abrufe.push({ zeit, ergebnis });
      if (ergebnis) return { ausgang: 'reconciled', ergebnis, beleg: JSON.stringify(antwort), abrufe };
      await this.schlafe(k.takt_ms);
    }
  }
}
