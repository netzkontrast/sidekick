// Data contracts only: no runtime/claim/approval guarantees (V0 §7.2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateSchema } from '../lib/schema.js';

const read = (kind, name) => JSON.parse(fs.readFileSync(new URL(`../../../docs/spec/${kind}/${name}.json`, import.meta.url), 'utf8'));
const example = (name) => read('beispiele', name);
const check = (name, value) => validateSchema(read('schemas', `${name}.schema`), value);
const valid = (name, value) => assert.deepEqual(check(name, value), []);
const invalid = (name, value) => assert.ok(check(name, value).length > 0, JSON.stringify(value));

test('V0-FALL-33 old and new examples validate without mutation', () => {
  const bindings = {
    'auftrag-recherche': 'auftrag', 'auftrag-recherche-budget': 'auftrag',
    'effekt-artefakt-uebernahme': 'effekt', 'geraet-pc-heim': 'geraet',
    'erinnerung-kandidat': 'erinnerung', 'ereignis-input-answered': 'ereignis',
    'ereignis-budget-warning': 'ereignis', 'uebergabe-run': 'uebergabe',
    'uebergabe-kern': 'uebergabe', 'rueckwaerts-befund': 'rueckwaerts-befund',
  };
  for (const [file, schema] of Object.entries(bindings)) {
    const value = example(file);
    const before = JSON.stringify(value);
    valid(schema, value);
    assert.equal(JSON.stringify(value), before);
  }
  assert.deepEqual(validateSchema({ type: 'object', properties: { x: { default: 1, examples: [1] } } }, {}), []);
  assert.deepEqual(validateSchema({ uniqueItems: true }, [{ a: 1 }, { a: 2 }]), []);
  assert.ok(validateSchema({ uniqueItems: true }, [{ a: 1, b: 2 }, { b: 2, a: 1 }]).length > 0);
  assert.throws(() => validateSchema({ oneOf: [] }, 1), /nicht unterstützt/);
});

test('V0-FALL-34 thresholds and independent review budget enforce exact boundaries', () => {
  for (const [field, rejected, accepted] of [
    ['vorwarnung_anteil', [-0.1, 0, 1, 1.1, '0.8'], [0.001, 0.8, 0.999]],
    ['reparatur_anteil_max', [-0.1, 0, 1.001, '0.5'], [0.001, 0.5, 1]],
  ]) {
    for (const value of [...rejected, ...accepted]) {
      const a = example('auftrag-recherche-budget');
      a.budget[field] = value;
      (rejected.includes(value) ? invalid : valid)('auftrag', a);
    }
  }
  for (const review of [{ verlangt: true }, { verlangt: true, budget: {} },
    { verlangt: true, budget: { max_dauer_min: 0 } },
    { verlangt: true, budget: { max_dauer_min: 1, max_kosten_eur: -1 } }]) {
    invalid('auftrag', { ...example('auftrag-recherche-budget'), rueckwaertsabnahme: review });
  }
  valid('auftrag', { ...example('auftrag-recherche-budget'), rueckwaertsabnahme: { verlangt: false, budget: { max_dauer_min: 1, max_kosten_eur: 0 } } });
});

test('V0-FALL-35 handover requires all fields and evidence, never accepts owner acceptance as a worker criterion', () => {
  const base = example('uebergabe-run');
  for (const key of Object.keys(base)) {
    const u = structuredClone(base);
    delete u[key];
    invalid('uebergabe', u);
  }
  for (const edit of [
    (u) => { u.budgetstand.kosten_eur = -1; },
    (u) => { u.budgetstand.runs = 1.5; },
    (u) => { u.ergebnisse[0].artefakt_hash = 'sha256:bad'; },
    (u) => { u.ausgangsstand[0].hash = 'bad'; },
    (u) => { u.kriterienstand.k1 = 'accepted'; },
  ]) {
    const u = structuredClone(base); edit(u); invalid('uebergabe', u);
  }
  valid('uebergabe', base); // costs unknown (null), not zero
});

test('V0-FALL-36 core handover cannot claim quality or decide how to continue', () => {
  const base = example('uebergabe-kern');
  valid('uebergabe', base);
  invalid('uebergabe', { ...base, kriterienstand: { k1: 'erfuellt_laut_bearbeiter' } });
  invalid('uebergabe', { ...base, kriterienstand: { k1: 'offen' } });
  invalid('uebergabe', { ...base, naechster_schritt: 'Run automatisch neu starten' });
});

test('V0-FALL-37 backward findings enforce class-specific references', () => {
  const base = example('rueckwaerts-befund');
  for (const [klasse, bezug_auftrag, bezug_rekonstruktion] of [
    ['angenommen', null, 1], ['uebersehen', 'k1', null], ['anders_verstanden', 'k1', 1],
  ]) {
    const b = { ...base, klasse, bezug_auftrag, bezug_rekonstruktion };
    valid('rueckwaerts-befund', b);
    invalid('rueckwaerts-befund', { ...b, bezug_auftrag: bezug_auftrag === null ? 'k1' : null });
    invalid('rueckwaerts-befund', { ...b, bezug_rekonstruktion: bezug_rekonstruktion === null ? 1 : null });
  }
  invalid('rueckwaerts-befund', { ...base, bezug_rekonstruktion: 0 });
  invalid('rueckwaerts-befund', { ...base, klasse: 'accepted' });
});

test('V0-FALL-38 journal event names use a literal dot, including every type added in 0.2', () => {
  const base = example('ereignis-input-answered');
  const types = ['task.budget_warning', 'task.partially_submitted', 'task.handover_recorded',
    'task.handover_requested', 'task.repair_limit_reached', 'task.failed', 'run.usage_reported',
    'run.attempt_failed', 'run.attempt_succeeded', 'run.strategy_changed', 'task.backward_review_requested',
    'task.backward_reconstruction_recorded', 'task.backward_finding', 'task.backward_review_completed',
    'task.backward_review_not_performed', 'task.backward_review_waived', 'task.backward_finding_rated',
    'claim.rejected_inactive'];
  for (const typ of types) valid('ereignis', { ...base, typ });
  for (const typ of ['taskXfailed', 'task\\.failed', '.failed', 'task.', 'wrong.failed']) {
    invalid('ereignis', { ...base, typ });
  }
});
