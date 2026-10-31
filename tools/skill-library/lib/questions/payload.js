// Strict payload validation for the questions CLI (docs/spec/questions-cli-v0.md QCLI-CMD-01) and the secret scan
// over every string a write command would store (QCLI-INV-07).
import { findSecrets, REDACTION_HINT } from './secrets.js';
import { msg } from './store.js';

const CONTROL = /[\u0000-\u001f\u007f]/u; // eslint-disable-line no-control-regex

/**
 * Validate `value` against `schema` ({key: spec}); spec: {type: string|int|bool|array|object, required, enum,
 * items (spec), props (schema)}. Returns messages (payload_invalid / field_invalid).
 */
export function validate(value, schema, prefix = '') {
  const out = [];
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [msg('payload_invalid', `${prefix || 'Nutzdaten'}: Objekt erwartet`, { field: prefix || null, rule: 'QCLI-CMD-01' })];
  }
  for (const k of Object.keys(value)) {
    if (!Object.hasOwn(schema, k)) out.push(msg('payload_invalid', `unbekannter Schlüssel ${prefix}${k}`, { field: `${prefix}${k}`, rule: 'QCLI-CMD-01' }));
  }
  for (const [k, spec] of Object.entries(schema)) {
    const v = value[k];
    const name = `${prefix}${k}`;
    if (v === undefined || v === null) {
      if (spec.required) out.push(msg('payload_invalid', `Pflichtfeld ${name} fehlt`, { field: name, rule: 'QCLI-CMD-01' }));
      continue;
    }
    out.push(...checkValue(v, spec, name));
  }
  return out;
}

function checkValue(v, spec, name) {
  const bad = (m) => [msg('payload_invalid', `${name}: ${m}`, { field: name, rule: 'QCLI-CMD-01' })];
  switch (spec.type) {
    case 'string':
      if (typeof v !== 'string') return bad('Zeichenkette erwartet');
      if (v.trim() === '') return spec.allowBlank ? [] : bad('darf nicht leer sein');
      if (CONTROL.test(v)) return [msg('field_invalid', `${name}: Zeilenumbruch oder Steuerzeichen nicht erlaubt (einzeiliges Feld)`, { field: name, rule: 'QCLI-CMD-01' })];
      if (spec.enum && !spec.enum.includes(v)) return bad(`erlaubt: ${spec.enum.join(', ')}`);
      return [];
    case 'int':
      return Number.isInteger(v) && v >= 1 ? [] : bad('positive Ganzzahl erwartet');
    case 'bool':
      return typeof v === 'boolean' ? [] : bad('true oder false erwartet');
    case 'array': {
      if (!Array.isArray(v)) return bad('Liste erwartet');
      if (spec.nonEmpty && v.length === 0) return bad('darf nicht leer sein');
      return v.flatMap((item, i) => (spec.items.type === 'object'
        ? validate(item, spec.items.props, `${name}[${i}].`)
        : checkValue(item, spec.items, `${name}[${i}]`)));
    }
    case 'object':
      return validate(v, spec.props, `${name}.`);
    default:
      throw new Error(`unknown spec type ${spec.type}`);
  }
}

/** Secret findings in every string of `value` (deep). Messages name field, pattern and position only. */
export function scanSecrets(value, prefix = '') {
  const out = [];
  const walk = (v, name) => {
    if (typeof v === 'string') {
      for (const f of findSecrets(v)) {
        out.push(msg('secret_detected', `${name || 'Wert'}: secret-artiger Wert (Muster ${f.pattern}, Position ${f.index}). ${REDACTION_HINT}`, { field: name || null, rule: 'QCLI-INV-07' }));
      }
    } else if (Array.isArray(v)) {
      v.forEach((x, i) => walk(x, `${name}[${i}]`));
    } else if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) walk(x, name ? `${name}.${k}` : k);
    }
  };
  walk(value, prefix);
  return out;
}

export const SOURCE_SCHEMA = {
  by: { type: 'string', allowBlank: true },
  channel: { type: 'string', allowBlank: true },
  time: { type: 'string' },
  ref: { type: 'string' },
};

/**
 * Words that identify an agent, a model, a recommendation, a default or a deadline as the author of an answer
 * (QCLI-INV-02, -04). Matched as whole words, case-insensitive.
 */
const NOT_HUMAN = [
  'agent', 'assistant', 'assistent', 'claude', 'codex', 'copilot', 'gpt', 'gemini', 'llm', 'model', 'modell', 'ki', 'ai', 'bot',
  'system', 'empfehlung', 'empfohlen', 'recommendation', 'default', 'standard', 'standardverhalten', 'frist', 'fristablauf',
  'deadline', 'timeout', 'automatisch', 'automatic', 'auto',
];
const NOT_HUMAN_RE = new RegExp(`(^|[^\\p{L}\\p{N}])(${NOT_HUMAN.join('|')})(?=$|[^\\p{L}\\p{N}])`, 'iu');

export function notHumanWord(by) {
  const m = NOT_HUMAN_RE.exec(by);
  return m ? m[2] : null;
}
