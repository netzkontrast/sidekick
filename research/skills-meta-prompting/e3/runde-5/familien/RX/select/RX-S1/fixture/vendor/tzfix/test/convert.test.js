import { strict as assert } from 'node:assert';
import { toUtc } from '../src/convert.js';

assert.equal(toUtc('2026-01-10T12:00', 'UTC'), '2026-01-10T12:00:00.000Z');
