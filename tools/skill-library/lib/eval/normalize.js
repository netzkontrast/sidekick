// Trace normalization with an explicit positive list (SLV0-EVAL-08, SLV0-INV-05).
// Only status, visible catalog, tools, plugins (name, source), model, activation evidence, run usage,
// client cost estimate and trace hash leave this module. No thinking text, no free model output,
// no tool inputs except the skill name. A request alone is not a confirmed activation; a missing
// catalog is unknown, not empty; an empty or failed trace never proves non-selection.
// Raw traces additionally get a cost balance (sizes and per-turn usage only, SLV0-EVAL-31/-32).
import { sha256Hex } from '../core.js';
import { evalMsg, EvalRefusal, requireSchema } from './common.js';
import { costBalance } from './costbalance.js';

export const NORMALIZER = 'sl-eval-normalize@1';
export const NORMALIZED_SCHEMA = 'eval-normalized-trace';
export const USAGE_FIELDS = ['input_tokens', 'output_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens'];
const SKILL_READ_RE = /(?:^|\/)(?:\.agents|\.claude)\/skills\/([^/]+)\/SKILL\.md$/;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const strOrNull = (v) => (typeof v === 'string' ? v : null);
const stringList = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : null);

function pickUsage(u) {
  if (!isObj(u)) return null;
  return Object.fromEntries(USAGE_FIELDS.map((f) => [f, Number.isInteger(u[f]) && u[f] >= 0 ? u[f] : null]));
}

function pickPlugins(v) {
  if (!Array.isArray(v)) return null;
  return v.filter(isObj).map((p) => ({ name: strOrNull(p.name), source: strOrNull(p.source) }));
}

function pickCost(v) {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
}

function invalid(label, message, line = null) {
  return new EvalRefusal([evalMsg('trace_invalid', label, message, line)]);
}

/** Normalize a raw Claude stream-json trace (JSON Lines). */
function fromStreamJson(text, label) {
  const events = [];
  const lines = text.split(/\r\n|\n|\r/);
  lines.forEach((line, i) => {
    if (line.trim() === '') return;
    let ev;
    try { ev = JSON.parse(line); } catch { throw invalid(label, `Zeile ${i + 1} ist kein JSON`, i + 1); }
    if (!isObj(ev)) throw invalid(label, `Zeile ${i + 1} ist kein Objekt`, i + 1);
    events.push(ev);
  });
  const init = events.find((e) => e.type === 'system' && e.subtype === 'init') ?? null;
  const requests = new Map(); // order of first appearance
  const results = new Map();
  let anonymous = 0;
  for (const ev of events) {
    const message = Object.hasOwn(ev, 'message') ? ev.message : ev;
    if (!isObj(message) || !Array.isArray(message.content)) continue;
    for (const block of message.content) {
      if (!isObj(block)) continue;
      if (block.type === 'tool_use') {
        const input = isObj(block.input) ? block.input : {};
        const key = typeof block.id === 'string' ? block.id : `\u0000anon${anonymous += 1}`;
        if (block.name === 'Skill') {
          requests.set(key, { mode: 'skill_tool', skill: strOrNull(input.skill), id: strOrNull(block.id) });
        } else if (block.name === 'Read') {
          const m = SKILL_READ_RE.exec(typeof input.file_path === 'string' ? input.file_path : '');
          if (m) requests.set(key, { mode: 'file_read', skill: m[1], id: strOrNull(block.id) });
        }
      } else if (block.type === 'tool_result' && typeof block.tool_use_id === 'string') {
        results.set(block.tool_use_id, !block.is_error);
      }
    }
  }
  const activations = [...requests.entries()].map(([key, r]) => ({
    mode: r.mode, skill: r.skill, tool_use_id: r.id, confirmed: results.has(key) ? results.get(key) : null,
  }));
  const final = [...events].reverse().find((e) => e.type === 'result') ?? null;
  const catalogSkills = init && Array.isArray(init.skills) ? stringList(init.skills) : null;
  return {
    trace_sha256: null, // set by caller from the raw bytes
    status: final && !final.is_error ?'completed' : 'incomplete_or_error',
    catalog: { status: catalogSkills ? 'beobachtet' : 'unbekannt', skills: catalogSkills },
    tools: init ? stringList(init.tools) : null,
    plugins: init ? pickPlugins(init.plugins) : null,
    model: init ? strOrNull(init.model) : null,
    activations,
    usage: final ? pickUsage(final.usage) : null,
    client_cost_estimate_usd: final ? pickCost(final.total_cost_usd) : null,
    cost_balance: costBalance(events, final ? pickUsage(final.usage) : null),
  };
}

/** Import a trace already normalized by the research helper (skill-pilot-v1). */
function fromPilot(obj, label) {
  if (typeof obj.trace_sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(obj.trace_sha256)) throw invalid(label, 'skill-pilot-v1 ohne gültigen trace_sha256');
  if (obj.status !== 'completed' && obj.status !== 'incomplete_or_error') throw invalid(label, 'skill-pilot-v1 mit unbekanntem status');
  if (!Array.isArray(obj.activation_evidence)) throw invalid(label, 'skill-pilot-v1 ohne activation_evidence');
  const activations = obj.activation_evidence.map((a) => {
    if (!isObj(a) || (a.mode !== 'skill_tool' && a.mode !== 'file_read')) throw invalid(label, 'Aktivierungsnachweis mit unbekanntem mode');
    return { mode: a.mode, skill: strOrNull(a.skill), tool_use_id: strOrNull(a.tool_use_id), confirmed: typeof a.confirmed === 'boolean' ? a.confirmed : null };
  });
  const skills = obj.catalog_observed === true ? stringList(obj.visible_skills) : null;
  return {
    trace_sha256: obj.trace_sha256,
    status: obj.status,
    catalog: { status: skills ? 'beobachtet' : 'unbekannt', skills },
    tools: stringList(obj.visible_tools),
    plugins: pickPlugins(obj.visible_plugins),
    model: strOrNull(obj.reported_model),
    activations,
    usage: pickUsage(obj.usage),
    client_cost_estimate_usd: pickCost(obj.reported_cost_usd),
    cost_balance: null, // the helper format keeps no per-turn usage or sizes (SLV0-EVAL-31)
  };
}

/**
 * Normalize trace bytes. Input is either a raw stream-json trace (JSONL) or a skill-pilot-v1 file.
 * Throws EvalRefusal(trace_invalid) for malformed input. An empty trace is valid but incomplete.
 */
export function normalizeTrace(buf, label = 'trace') {
  const bytes = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, 'utf8');
  const text = bytes.toString('utf8');
  if (Buffer.compare(Buffer.from(text, 'utf8'), bytes) !== 0) throw invalid(label, 'Spur ist kein gültiges UTF-8');
  let whole;
  try { whole = JSON.parse(text); } catch { whole = undefined; }
  let core;
  let sourceFormat;
  if (isObj(whole) && whole.helper_version === 'skill-pilot-v1') {
    core = fromPilot(whole, label);
    sourceFormat = 'skill-pilot-v1';
  } else {
    core = fromStreamJson(text, label);
    core.trace_sha256 = sha256Hex(bytes);
    sourceFormat = 'claude-stream-json';
  }
  const out = {
    schema_version: 1,
    normalizer: NORMALIZER,
    source_format: sourceFormat,
    input_sha256: sha256Hex(bytes),
    trace_sha256: core.trace_sha256,
    status: core.status,
    catalog: core.catalog,
    tools: core.tools,
    plugins: core.plugins,
    model: core.model,
    activations: core.activations,
    activation_observability: core.activations.length > 0 ? 'events_observed' : 'not_established',
    absence_is_proven: false,
    usage: core.usage,
    client_cost_estimate_usd: core.client_cost_estimate_usd,
    cost_balance: core.cost_balance,
    quality_scored: false,
  };
  requireSchema(NORMALIZED_SCHEMA, out, 'normalisierte Spur');
  return out;
}

/**
 * View of a normalized trace in the research helper's field names, restricted to the positive
 * list (plugins: name/source; usage: the four token fields). Used for equality tests against
 * skill_pilot.py and as input for run usage (tokens.js runUsageFromTrace).
 */
export function pilotView(n) {
  return {
    trace_sha256: n.trace_sha256,
    status: n.status,
    catalog_observed: n.catalog.status === 'beobachtet',
    visible_skills: n.catalog.skills,
    visible_tools: n.tools,
    visible_plugins: n.plugins,
    activation_evidence: n.activations.map((a) => ({ mode: a.mode, skill: a.skill, tool_use_id: a.tool_use_id, confirmed: a.confirmed })),
    activation_observability: n.activation_observability,
    absence_is_proven: false,
    usage: n.usage,
    reported_cost_usd: n.client_cost_estimate_usd,
    reported_model: n.model,
    quality_scored: false,
  };
}

/** Apply the same positive-list restriction to a skill_pilot.py output for comparison. */
export function restrictPilotOutput(p) {
  return {
    trace_sha256: p.trace_sha256,
    status: p.status,
    catalog_observed: p.catalog_observed,
    visible_skills: p.visible_skills,
    visible_tools: p.visible_tools,
    visible_plugins: Array.isArray(p.visible_plugins) ? p.visible_plugins.map((x) => ({ name: strOrNull(x?.name), source: strOrNull(x?.source) })) : p.visible_plugins ?? null,
    activation_evidence: p.activation_evidence,
    activation_observability: p.activation_observability,
    absence_is_proven: p.absence_is_proven,
    usage: pickUsage(p.usage),
    reported_cost_usd: p.reported_cost_usd,
    reported_model: p.reported_model,
    quality_scored: p.quality_scored,
  };
}
