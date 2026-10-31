// Keeps abdeckung.json in step with the specs and the test names: every case ID from the three specs
// has exactly one status; "automatisiert" needs a test whose name starts with the ID; "offen" and
// "daten" need a reason, and no test may claim an ID that is listed as open.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SUITE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.join(SUITE, '..', '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const idsIn = (p, prefix) => [...new Set([...read(p).matchAll(new RegExp(`^\\| (${prefix}-\\d\\d) \\|`, 'gm'))].map((m) => m[1]))];

function testIds() {
  const ids = new Set();
  for (const f of ['kern.test.js', 'runtime-adapter.test.js']) {
    for (const [, name] of read(`tools/contract-suite/test/${f}`).matchAll(/(?:test|withK)\('([^']+)'/g)) {
      const m = name.match(/^((?:V0-FALL|KP-FALL|RTA-FALL|V0-ABL|KP-INV)-\d\d(?:\/\d\d)*)/);
      if (!m) continue;
      const [a, b] = m[1].split('-');
      for (const n of m[1].split('-')[2].split('/')) ids.add(`${a}-${b}-${n}`);
    }
  }
  return ids;
}

test('abdeckung.json lists every case ID of V0, kern-port and runtime-adapter exactly once, with consistent status', () => {
  const abd = JSON.parse(fs.readFileSync(path.join(SUITE, 'abdeckung.json'), 'utf8')).faelle;
  const spec = ['V0-ABL-01', ...idsIn('docs/spec/v0-ziel-und-vertraege.md', 'V0-FALL'), ...idsIn('docs/spec/kern-port-v0.md', 'KP-FALL'), ...idsIn('docs/spec/runtime-adapter-v0.md', 'RTA-FALL')];
  assert.deepEqual(Object.keys(abd).sort(), [...new Set(spec)].sort(), 'IDs in abdeckung.json und Specs weichen ab');
  const tests = testIds();
  for (const [id, v] of Object.entries(abd)) {
    assert.ok(['automatisiert', 'offen', 'daten'].includes(v.status), `${id}: Status ${v.status}`);
    if (v.status === 'automatisiert') assert.ok(tests.has(id), `${id} als automatisiert geführt, aber kein Test beginnt damit`);
    else {
      assert.ok(typeof v.grund === 'string' && v.grund.length > 10, `${id}: Grund fehlt`);
      assert.ok(!tests.has(id), `${id} ist ${v.status}, hat aber einen Test`);
    }
  }
});
