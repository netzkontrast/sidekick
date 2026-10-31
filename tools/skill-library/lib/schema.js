// Minimal JSON Schema (2020-12) checker for exactly the keywords used by
// docs/spec/schemas/skill-package.schema.json. Written for this repo without a dependency
// (handover L4). Any keyword outside this list is an internal error, never silently ignored.

const SUPPORTED = new Set([
  '$schema', '$id', 'title', 'description', '$defs', '$ref',
  'type', 'const', 'enum', 'required', 'properties', 'additionalProperties',
  'items', 'minLength', 'maxLength', 'pattern', 'minimum', 'format', 'allOf', 'if', 'then',
]);

export class SchemaUnsupportedError extends Error {}

function jsonType(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  return typeof v; // string, boolean, object
}

function typeMatches(v, t) {
  const actual = jsonType(v);
  if (t === 'number') return actual === 'number' || actual === 'integer';
  return actual === t;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  if (typeof a === 'object') {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    return deepEqual(ka, kb) && ka.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/** RFC 3339 date-time. `format` is checked as an assertion here (own decision, documented in README). */
export function isDateTime(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(\.\d+)?([Zz]|[+-](\d{2}):(\d{2}))$/.exec(s);
  if (!m) return false;
  const [y, mo, d, h, mi, se] = [m[1], m[2], m[3], m[4], m[5], m[6]].map(Number);
  if (mo < 1 || mo > 12 || d < 1) return false;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const maxDay = mo === 2 && !leap ? 28 : DAYS[mo - 1];
  if (d > maxDay || h > 23 || mi > 59 || se > 60) return false;
  if (m[9] !== undefined && (Number(m[9]) > 23 || Number(m[10]) > 59)) return false;
  return true;
}

function cpLen(s) { let n = 0; for (const _ of s) n += 1; return n; } // eslint-disable-line no-unused-vars

function resolveRef(root, ref) {
  if (!ref.startsWith('#/')) throw new SchemaUnsupportedError(`nur lokale $ref unterstützt: ${ref}`);
  let node = root;
  for (const part of ref.slice(2).split('/')) {
    const key = part.replace(/~1/g, '/').replace(/~0/g, '~');
    if (node === null || typeof node !== 'object' || !(key in node)) throw new SchemaUnsupportedError(`$ref nicht auflösbar: ${ref}`);
    node = node[key];
  }
  return node;
}

/** Returns a list of {pointer, message}; empty means valid. */
export function validateSchema(schema, value, root = schema, pointer = '') {
  if (schema === true) return [];
  if (schema === false) return [{ pointer, message: 'Schema false' }];
  for (const k of Object.keys(schema)) {
    if (!SUPPORTED.has(k)) throw new SchemaUnsupportedError(`Schema-Schlüsselwort nicht unterstützt: ${k}`);
  }
  const errors = [];
  const at = pointer || '/';
  if (schema.$ref) errors.push(...validateSchema(resolveRef(root, schema.$ref), value, root, pointer));
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => typeMatches(value, t))) {
      errors.push({ pointer: at, message: `Typ ${jsonType(value)} statt ${types.join('|')}` });
      return errors;
    }
  }
  if ('const' in schema && !deepEqual(value, schema.const)) {
    errors.push({ pointer: at, message: `Wert ungleich const ${JSON.stringify(schema.const)}` });
  }
  if (schema.enum && !schema.enum.some((e) => deepEqual(value, e))) {
    errors.push({ pointer: at, message: `Wert nicht in enum ${JSON.stringify(schema.enum)}` });
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && cpLen(value) < schema.minLength) errors.push({ pointer: at, message: `kürzer als ${schema.minLength}` });
    if (schema.maxLength !== undefined && cpLen(value) > schema.maxLength) errors.push({ pointer: at, message: `länger als ${schema.maxLength}` });
    if (schema.pattern !== undefined && !new RegExp(schema.pattern, 'u').test(value)) errors.push({ pointer: at, message: `verletzt Muster ${schema.pattern}` });
    if (schema.format !== undefined) {
      if (schema.format !== 'date-time') throw new SchemaUnsupportedError(`format nicht unterstützt: ${schema.format}`);
      if (!isDateTime(value)) errors.push({ pointer: at, message: 'kein RFC-3339-date-time' });
    }
  }
  if (typeof value === 'number' && schema.minimum !== undefined && value < schema.minimum) {
    errors.push({ pointer: at, message: `kleiner als ${schema.minimum}` });
  }
  if (jsonType(value) === 'object') {
    for (const req of schema.required ?? []) {
      if (!Object.hasOwn(value, req)) errors.push({ pointer: at, message: `Pflichtfeld fehlt: ${req}` });
    }
    const props = schema.properties ?? {};
    for (const [k, v] of Object.entries(value)) {
      const childPtr = `${pointer}/${k.replace(/~/g, '~0').replace(/\//g, '~1')}`;
      if (Object.hasOwn(props, k)) {
        errors.push(...validateSchema(props[k], v, root, childPtr));
      } else if (schema.additionalProperties === false) {
        errors.push({ pointer: childPtr, message: 'Feld nicht erlaubt (additionalProperties: false)' });
      } else if (schema.additionalProperties !== undefined && schema.additionalProperties !== true) {
        errors.push(...validateSchema(schema.additionalProperties, v, root, childPtr));
      }
    }
  }
  if (Array.isArray(value) && schema.items !== undefined) {
    value.forEach((item, i) => errors.push(...validateSchema(schema.items, item, root, `${pointer}/${i}`)));
  }
  for (const sub of schema.allOf ?? []) errors.push(...validateSchema(sub, value, root, pointer));
  if (schema.if !== undefined) {
    if (validateSchema(schema.if, value, root, pointer).length === 0 && schema.then !== undefined) {
      errors.push(...validateSchema(schema.then, value, root, pointer));
    }
  }
  return errors;
}
