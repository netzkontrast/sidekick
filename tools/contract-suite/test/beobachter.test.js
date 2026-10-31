// Observer cases RTA-FALL-41…47 (runtime-adapter-v0.md RTA-BEO) against the observer prototype on a
// virtual clock; where a case names a core reaction, the result goes through the kern-port.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Beobachter, BeobachterFehler } from '../referenzkern/beobachter.js';
import { SUITE, OWNER, RUN, ADAPTER } from '../lib/pruefling.js';
import { AUFTRAG, A, ok, journalValid, bisAbnahme, withK } from './helfer.js';

const KONF = {
  takt_ms: 1000, frist_ms: 10_000, max_fehler_in_folge: 3, pfad: '$.status',
  zuordnung: [{ wert: 'succeeded', ergebnis: 'done' }, { wert: 'failed', ergebnis: 'failed' }],
};
const EFFEKT = { id: 'e-1', rechte: ['status:lesen'], parameter: { ziel: AUFTRAG.befugnis.grants[0].ziel } };

/** Observer on a virtual clock; `antworten` are returned in turn (an Error is thrown), the last one repeats. */
function beobachter(antworten, { konfiguration = KONF, braucht = ['status:lesen'] } = {}) {
  let t = 0;
  const aufrufe = [];
  const b = new Beobachter({
    konfiguration, jetzt: () => t, schlafe: async (ms) => { t += ms; },
    abruf: {
      braucht,
      rufe: async (params) => {
        aufrufe.push({ t, params });
        const a = antworten[Math.min(aufrufe.length - 1, antworten.length - 1)];
        if (a instanceof Error) throw a;
        return a;
      },
    },
  });
  b.aufrufe = aufrufe;
  return b;
}

/** Example flow up to an unclear takeover effect (V0-FALL-07 start). */
async function bisUnklar(k) {
  const { acc } = await bisAbnahme(k);
  ok(await k.send('effect.approve', OWNER(), { effekt_id: acc.effekt_id, gebunden_an: { parameter_hash: acc.parameter_hash, ziel: AUFTRAG.befugnis.grants[0].ziel, auftrag_version: 1, epoch: 1 } }));
  ok(await k.send('test.effect_mode', SUITE, { effekt_id: acc.effekt_id, modus: 'antwort_verloren' }));
  return acc.effekt_id;
}

/** Report the observer result through the effect adapter (RTA-BEO-06, -07). */
async function melde(k, effektId, r) {
  if (r.ausgang === 'reconciled') return ok(await k.send('effect.reconcile', ADAPTER, { effekt_id: effektId, ergebnis: r.ergebnis, beleg: r.beleg }));
  return ok(await k.send('effect.reconcile_failed', ADAPTER, { effekt_id: effektId, grund: r.grund, abrufe: r.abrufe.length }));
}

withK('RTA-FALL-41 running, running, succeeded: three calls at the configured cadence, then reconciled done with evidence', async (k) => {
  const id = await bisUnklar(k);
  const b = beobachter([{ status: 'running' }, { status: 'running' }, { status: 'succeeded', id: 'x-1' }]);
  const r = await b.beobachte(EFFEKT);
  assert.deepEqual(b.aufrufe.map((a) => a.t), [0, 1000, 2000]);
  assert.ok(b.aufrufe.every((a) => a.params === EFFEKT.parameter), 'feste Parameter');
  assert.equal(r.ausgang, 'reconciled');
  assert.equal(r.ergebnis, 'done');
  assert.deepEqual(JSON.parse(r.beleg), { status: 'succeeded', id: 'x-1' });
  await melde(k, id, r);
  assert.equal((await k.state('effekt', id)).zustand, 'reconciled');
  assert.equal((await k.state('auftrag', A)).zustand, 'completed');
});

test('RTA-FALL-42 a run cannot set cadence or deadline; the configuration stays unchanged', () => {
  const b = beobachter([{ status: 'running' }]);
  assert.deepEqual(b.konfiguriere(RUN('r-1'), { ...KONF, takt_ms: 1, frist_ms: 999_999 }), { ok: false, fehler: 'nicht_berechtigt' });
  assert.deepEqual(b.konfiguriere({ art: 'owner', id: 'owner' }, { ...KONF, takt_ms: 1 }), { ok: false, fehler: 'nicht_berechtigt' });
  assert.deepEqual({ ...b.konfiguration }, KONF);
  assert.throws(() => { b.konfiguration.takt_ms = 1; }, TypeError);
  assert.deepEqual(b.konfiguriere(ADAPTER, { ...KONF, takt_ms: 500 }), { ok: true });
});

withK('RTA-FALL-43 unmapped status until the deadline: effect stays outcome_unknown, reconcile_failed with reason frist', async (k) => {
  const id = await bisUnklar(k);
  const b = beobachter([{ status: 'paused' }]);
  const r = await b.beobachte(EFFEKT);
  assert.deepEqual([r.ausgang, r.grund], ['reconcile_failed', 'frist']);
  assert.equal(b.aufrufe.length, 10);
  await melde(k, id, r);
  const e = await k.state('effekt', id);
  assert.equal(e.zustand, 'outcome_unknown');
  assert.equal(e.abgleich_gescheitert, 'frist');
  assert.equal((await k.state('auftrag', A)).zustand, 'outcome_unknown');
  assert.ok((await journalValid(k)).some((ev) => ev.typ === 'effect.reconcile_failed' && ev.daten.grund === 'frist'));
});

test('RTA-FALL-44 status answer without the path counts as not finished, not as an error', async () => {
  const b = beobachter([{ anderes: 1 }, { status: 'succeeded' }]);
  const r = await b.beobachte(EFFEKT);
  assert.deepEqual(r.abrufe.map((a) => ('fehler' in a ? 'fehler' : a.ergebnis)), [null, 'done']);
  assert.equal(r.ausgang, 'reconciled');
});

test('RTA-FALL-45 mapping true → done does not match 1 or "true"', async () => {
  const konfiguration = { ...KONF, pfad: '$.fertig', zuordnung: [{ wert: true, ergebnis: 'done' }] };
  const b = beobachter([{ fertig: 1 }, { fertig: 'true' }, { fertig: true }], { konfiguration });
  const r = await b.beobachte(EFFEKT);
  assert.deepEqual(r.abrufe.map((a) => a.ergebnis), [null, null, 'done']);
});

withK('RTA-FALL-46 four failed calls in a row with max 3: reconcile_failed with reason fehler, effect stays outcome_unknown', async (k) => {
  const id = await bisUnklar(k);
  const b = beobachter([new Error('503'), new Error('503'), new Error('503'), new Error('503'), { status: 'succeeded' }]);
  const r = await b.beobachte(EFFEKT);
  assert.deepEqual([r.ausgang, r.grund, b.aufrufe.length], ['reconcile_failed', 'fehler', 4]);
  await melde(k, id, r);
  assert.equal((await k.state('effekt', id)).zustand, 'outcome_unknown');
  assert.ok((await journalValid(k)).some((ev) => ev.typ === 'effect.reconcile_failed' && ev.daten.grund === 'fehler'));
});

test('RTA-FALL-47 a status call needing a right the effect did not have is refused without calling', async () => {
  const b = beobachter([{ status: 'succeeded' }], { braucht: ['status:lesen', 'repo:schreiben'] });
  const effekt = structuredClone(EFFEKT);
  await assert.rejects(b.beobachte(effekt), (e) => e instanceof BeobachterFehler && e.code === 'nicht_berechtigt');
  assert.equal(b.aufrufe.length, 0);
  assert.deepEqual(effekt.rechte, EFFEKT.rechte, 'kein Rechtezuwachs');
});
