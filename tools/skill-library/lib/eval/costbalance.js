// Cost balance per context class and turn (SLV0-EVAL-35…38, spec §7.7).
// Only sizes leave this module, never content. Bytes are exact (UTF-8); tokens are only what the
// client reported per turn, or an estimate from a named estimator in the report; both are never mixed.
// Unknown stays null with a reason, never 0 (SLV0-INV-05). Concept after skill-cost-optimizer (clean-room).
import { compareCodepoints } from '../core.js';
import { sumTokens, estimateToken, unknownToken } from '../tokens.js';

export const COST_BALANCE_METHOD = 'sl-eval-cost-balance@1';
/** Field order of per-turn usage (as in SLV0-EVAL-08). */
export const TURN_USAGE_FIELDS = ['input_tokens', 'output_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens'];
export const UNATTRIBUTABLE = 'nicht_zuordenbar';

const SKILL_READ_RE = /(?:^|\/)(?:\.agents|\.claude)\/skills\/([^/]+)\/SKILL\.md$/;
const TOOL_NAME_RE = /^[A-Za-z0-9_.:-]{1,128}$/;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const utf8 = (s) => Buffer.byteLength(s, 'utf8');
const jsonBytes = (v) => utf8(JSON.stringify(v) ?? 'null');
const count = (v) => (Number.isInteger(v) && v >= 0 ? v : null);

/** Payload size of a tool_result content (string; list: text or JSON per item; missing: 0). */
function toolResultBytes(content) {
  if (content === undefined || content === null) return 0;
  if (typeof content === 'string') return utf8(content);
  if (Array.isArray(content)) {
    return content.reduce((acc, item) => acc + (isObj(item) && item.type === 'text' && typeof item.text === 'string' ? utf8(item.text) : jsonBytes(item)), 0);
  }
  return jsonBytes(content);
}

/** Payload size of one content block (spec §7.7). */
function blockBytes(block) {
  if (typeof block === 'string') return utf8(block);
  if (!isObj(block)) return jsonBytes(block);
  if (block.type === 'text' && typeof block.text === 'string') return utf8(block.text);
  if (block.type === 'thinking' && typeof block.thinking === 'string') return utf8(block.thinking);
  if (block.type === 'redacted_thinking' && typeof block.data === 'string') return utf8(block.data);
  if (block.type === 'tool_use') return jsonBytes(block.input ?? null);
  if (block.type === 'tool_result') return toolResultBytes(block.content);
  return jsonBytes(block);
}

function toolResultClass(block, toolUses) {
  const use = typeof block.tool_use_id === 'string' ? toolUses.get(block.tool_use_id) : undefined;
  if (!use || typeof use.name !== 'string' || !TOOL_NAME_RE.test(use.name)) return UNATTRIBUTABLE;
  if (use.name === 'Skill') return 'skill_laden';
  if (use.name === 'Read') {
    const p = isObj(use.input) && typeof use.input.file_path === 'string' ? use.input.file_path : '';
    return SKILL_READ_RE.test(p) ? 'skill_laden' : 'datei_lesen';
  }
  return `tool_ergebnis:${use.name}`;
}

function blockClass(block, role, toolUses) {
  if (typeof block === 'string') return role === 'user' ? 'nutzer_text' : UNATTRIBUTABLE;
  if (!isObj(block)) return UNATTRIBUTABLE;
  if (role === 'assistant') {
    if (block.type === 'text') return 'assistant_text';
    if (block.type === 'thinking' || block.type === 'redacted_thinking') return 'assistant_denken';
    if (block.type === 'tool_use') return 'assistant_werkzeugaufruf';
    return UNATTRIBUTABLE;
  }
  if (block.type === 'tool_result') return toolResultClass(block, toolUses);
  if (block.type === 'text') return 'nutzer_text';
  return UNATTRIBUTABLE;
}

const isSubagent = (ev) => ev.parent_tool_use_id !== undefined && ev.parent_tool_use_id !== null;
const messageOf = (ev) => (Object.hasOwn(ev, 'message') ? ev.message : ev);

/**
 * Cost balance of a parsed stream-json trace (SLV0-EVAL-35/-36). `events` are the parsed JSON
 * objects in order; `totalUsage` is the run usage picked from the final result (or null).
 */
export function costBalance(events, totalUsage) {
  // Pass 1: tool uses (for result classes) and turns of the main session.
  const toolUses = new Map();
  const turnIndex = new Map(); // message.id → turn number
  const turnUsage = []; // index turn-1 → usage of the last event of that turn
  let anonymous = 0;
  const eventTurn = new Map(); // event index → turn number (main assistant events)
  events.forEach((ev, i) => {
    const message = messageOf(ev);
    if (isObj(message) && Array.isArray(message.content)) {
      for (const b of message.content) {
        if (isObj(b) && b.type === 'tool_use' && typeof b.id === 'string' && !toolUses.has(b.id)) toolUses.set(b.id, { name: b.name, input: b.input });
      }
    }
    if (ev.type !== 'assistant' || isSubagent(ev)) return;
    const key = isObj(message) && typeof message.id === 'string' ? message.id : `\u0000anon${anonymous += 1}`;
    if (!turnIndex.has(key)) turnIndex.set(key, turnIndex.size + 1);
    const t = turnIndex.get(key);
    eventTurn.set(i, t);
    const u = isObj(message) && isObj(message.usage) ? message.usage : null;
    turnUsage[t - 1] = Object.fromEntries(TURN_USAGE_FIELDS.map((f) => [f, u ? count(u[f]) : null]));
  });
  const n = turnIndex.size;

  // Pass 2: sizes per class with later turns.
  const classes = new Map();
  let started = 0; // turns begun before the current event
  events.forEach((ev, i) => {
    if (eventTurn.has(i)) started = Math.max(started, eventTurn.get(i));
    if (ev.type !== 'assistant' && ev.type !== 'user') return;
    const message = messageOf(ev);
    if (!isObj(message)) return;
    let blocks;
    if (Array.isArray(message.content)) blocks = message.content;
    else if (typeof message.content === 'string') blocks = [message.content];
    else return;
    const sub = isSubagent(ev);
    const later = sub ? 0 : n - (eventTurn.get(i) ?? started);
    for (const block of blocks) {
      const cls = sub ? 'unteragent' : blockClass(block, ev.type, toolUses);
      const bytes = blockBytes(block);
      const c = classes.get(cls) ?? { class: cls, blocks: 0, bytes: 0, bytes_x_later_turns: 0 };
      c.blocks += 1;
      c.bytes += bytes;
      c.bytes_x_later_turns += bytes * later;
      classes.set(cls, c);
    }
  });
  const classList = [...classes.values()].sort((a, b) => compareCodepoints(a.class, b.class));
  const sum = Object.fromEntries(TURN_USAGE_FIELDS.map((f) => [f, n === 0 || turnUsage.some((u) => u[f] === null) ? null : turnUsage.reduce((a, u) => a + u[f], 0)]));
  const total = isObj(totalUsage) ? totalUsage : null;
  const remainder = Object.fromEntries(TURN_USAGE_FIELDS.map((f) => {
    const t = total ? count(total[f]) : null;
    return [f, t === null || sum[f] === null ? null : t - sum[f]];
  }));
  const out = {
    method: COST_BALANCE_METHOD,
    turns: turnUsage.map((usage, k) => ({ turn: k + 1, usage })),
    turn_usage_sum: sum,
    usage_remainder: remainder,
    classes: classList,
    bytes_total: classList.reduce((a, c) => a + c.bytes, 0),
    bytes_x_later_turns_total: classList.reduce((a, c) => a + c.bytes_x_later_turns, 0),
  };
  checkBalance(out, total ?? undefined);
  return out;
}

/** Invariant SLV0-EVAL-36/-35: class sums equal totals; turn sum + remainder equals the total. */
export function checkBalance(cb, totalUsage = undefined) {
  const b = cb.classes.reduce((a, c) => a + c.bytes, 0);
  const bt = cb.classes.reduce((a, c) => a + c.bytes_x_later_turns, 0);
  if (b !== cb.bytes_total || bt !== cb.bytes_x_later_turns_total) throw new Error('interner Fehler: Klassensummen ungleich Gesamt (SLV0-EVAL-36)');
  if (totalUsage !== undefined) {
    for (const f of TURN_USAGE_FIELDS) {
      const s = cb.turn_usage_sum[f];
      const r = cb.usage_remainder[f];
      if (s !== null && r !== null && s + r !== totalUsage?.[f]) throw new Error(`interner Fehler: Turn-Summe + Rest ungleich Gesamt für ${f}`);
    }
  }
}

/** Normalized cost_balance → raw record field `kostenbilanz` (German field names). */
export function toRawBalance(cb) {
  if (!isObj(cb)) return null;
  return {
    verfahren: cb.method,
    turns: cb.turns.map((t) => ({ turn: t.turn, usage: { ...t.usage } })),
    usage_summe_turns: { ...cb.turn_usage_sum },
    usage_rest: { ...cb.usage_remainder },
    klassen: cb.classes.map((c) => ({ klasse: c.class, bloecke: c.blocks, bytes: c.bytes, bytes_mal_folgeturns: c.bytes_x_later_turns })),
    bytes_gesamt: cb.bytes_total,
    bytes_mal_folgeturns_gesamt: cb.bytes_x_later_turns_total,
  };
}

// ---------------------------------------------------------------------------------------------
// Report block `kostenbilanz` per level (SLV0-EVAL-37/-38). Every value names its raw records.

const cmp = (a, b) => compareCodepoints(String(a), String(b));
const idsOf = (rs) => [...new Set(rs.map((r) => r.run_id))].sort(cmp);
const wertfeld = (wert, rs, beleg = null) => ({ wert, rohdatensatz_ids: idsOf(rs), beleg: wert === null ? beleg : null });

/** Reported per-run turn usage sum of one field as a token record (SLV0-TOK-01/-06). */
function turnToken(r, f) {
  if (!isObj(r.kostenbilanz)) return unknownToken('lauf:turns', `Lauf ${r.run_id} ohne Kostenbilanz`);
  const v = r.kostenbilanz.usage_summe_turns[f];
  if (v === null) return unknownToken('lauf:turns', `Lauf ${r.run_id}: Turn-Summe ${f} unbekannt`);
  return { wert: v, quelle: 'gemeldet', methode: `client-usage@${r.modell ?? 'modell-unbekannt'}`, bezug: 'lauf:turns', beleg: `spur_sha256:${r.spur_sha256}` };
}

function costPerCriterion(rs) {
  const costs = rs.map((r) => r.usage?.kosten_client_schaetzung?.wert);
  const noCost = rs.filter((_, i) => typeof costs[i] !== 'number').map((r) => r.run_id).sort(cmp);
  const kosten = noCost.length > 0 ? null : costs.reduce((a, c) => a + c, 0);
  const nonR = rs.flatMap((r) => r.assertions.filter((a) => a.r_regel === null));
  const passed = nonR.filter((a) => a.ergebnis === 'bestanden').length;
  let beleg = null;
  if (noCost.length > 0) beleg = `ohne Kostenschätzung: ${noCost.join(', ')} (SLV0-TOK-08)`;
  else if (passed === 0) beleg = 'kein erfülltes Kriterium (keine bestandene Assertion ohne r_regel)';
  const wert = beleg === null ? kosten / passed : null;
  return {
    wert,
    quelle: wert === null ? 'unbekannt' : 'berechnet',
    kosten_usd: wertfeld(kosten, rs, beleg),
    erfuellte_kriterien: nonR.length === 0 ? null : { zaehler: passed, nenner: nonR.length, rohdatensatz_ids: idsOf(rs) },
    rohdatensatz_ids: idsOf(rs),
    beleg: wert === null ? beleg : `Summe kosten_client_schaetzung / ${passed} bestandene Assertions ohne r_regel (SLV0-EVAL-38)`,
  };
}

/** Per-variant balance of a set of raw records (one variant, one level). */
function variantBalance(rs, estimator) {
  const withB = rs.filter((r) => isObj(r.kostenbilanz));
  const without = rs.filter((r) => !isObj(r.kostenbilanz)).map((r) => r.run_id).sort(cmp);
  const why = without.length > 0 ? `ohne Kostenbilanz: ${without.join(', ')} (SLV0-EVAL-37)` : null;
  const sumOf = (fn) => (why ? null : withB.reduce((a, r) => a + fn(r.kostenbilanz), 0));
  const usageTurns = {};
  const usageRest = {};
  for (const f of TURN_USAGE_FIELDS) {
    usageTurns[f] = { ...sumTokens(rs.map((r) => turnToken(r, f)), `summe:turns:${f}`), rohdatensatz_ids: idsOf(rs) };
    const restUnknown = withB.filter((r) => r.kostenbilanz.usage_rest[f] === null).map((r) => r.run_id).sort(cmp);
    if (why) usageRest[f] = wertfeld(null, rs, why);
    else if (restUnknown.length > 0) usageRest[f] = wertfeld(null, rs, `Rest ${f} unbekannt: ${restUnknown.join(', ')}`);
    else usageRest[f] = wertfeld(sumOf((b) => b.usage_rest[f]), rs);
  }
  const names = [...new Set(withB.flatMap((r) => r.kostenbilanz.klassen.map((k) => k.klasse)))].sort(cmp);
  const klassen = names.map((klasse) => {
    const pick = (field) => sumOf((b) => b.klassen.find((k) => k.klasse === klasse)?.[field] ?? 0);
    const bytes = pick('bytes');
    const tokens = bytes === null ? unknownToken(`klasse:${klasse}`, why) : estimateToken(bytes, estimator, `klasse:${klasse}`);
    return {
      klasse,
      bloecke: wertfeld(pick('bloecke'), rs, why),
      bytes: wertfeld(bytes, rs, why),
      bytes_mal_folgeturns: wertfeld(pick('bytes_mal_folgeturns'), rs, why),
      tokens: { ...tokens, rohdatensatz_ids: idsOf(rs) },
    };
  });
  return {
    laeufe_mit_bilanz: { zaehler: withB.length, nenner: rs.length, rohdatensatz_ids: idsOf(rs) },
    turns: wertfeld(sumOf((b) => b.turns.length), rs, why),
    usage_turns: usageTurns,
    usage_rest: usageRest,
    bytes_gesamt: wertfeld(sumOf((b) => b.bytes_gesamt), rs, why),
    bytes_mal_folgeturns_gesamt: wertfeld(sumOf((b) => b.bytes_mal_folgeturns_gesamt), rs, why),
    klassen,
    kosten_je_erfuelltem_kriterium: costPerCriterion(rs),
  };
}

function differenz(a, b, rs, beleg = null) {
  const wert = a === null || b === null ? null : a - b;
  return { wert, minuend_wert: a, subtrahend_wert: b, rohdatensatz_ids: idsOf(rs), beleg: wert === null ? beleg ?? 'eine Seite unbekannt' : beleg };
}

function tokenDiff(m, s, rs) {
  if (m.quelle === 'unbekannt' || s.quelle === 'unbekannt') return differenz(m.wert, s.wert, rs, 'eine Seite unbekannt (SLV0-TOK-05)');
  if (m.methode !== s.methode || m.quelle !== s.quelle) return differenz(null, null, rs, `Methoden verschieden: ${m.methode} gegen ${s.methode} (SLV0-TOK-05)`);
  return differenz(m.wert, s.wert, rs, `${m.quelle}, ${m.methode}`);
}

function pairDiff(minuend, subtrahend, mRs, sRs, caseIds) {
  const all = [...mRs, ...sRs];
  const m = variantBalance(mRs, null);
  const s = variantBalance(sRs, null);
  const usageTurns = {};
  const usageRest = {};
  for (const f of TURN_USAGE_FIELDS) {
    usageTurns[f] = tokenDiff(m.usage_turns[f], s.usage_turns[f], all);
    usageRest[f] = differenz(m.usage_rest[f].wert, s.usage_rest[f].wert, all);
  }
  const names = [...new Set([...m.klassen, ...s.klassen].map((k) => k.klasse))].sort(cmp);
  // Within a side with a balance for every run, a missing class is 0 bytes; without, unknown.
  const side = (bal, klasse, field) => (bal.bytes_gesamt.wert === null ? null : bal.klassen.find((k) => k.klasse === klasse)?.[field].wert ?? 0);
  return {
    minuend,
    subtrahend,
    case_ids: caseIds,
    minuend_ids: idsOf(mRs),
    subtrahend_ids: idsOf(sRs),
    turns: differenz(m.turns.wert, s.turns.wert, all),
    usage_turns: usageTurns,
    usage_rest: usageRest,
    bytes_gesamt: differenz(m.bytes_gesamt.wert, s.bytes_gesamt.wert, all),
    bytes_mal_folgeturns_gesamt: differenz(m.bytes_mal_folgeturns_gesamt.wert, s.bytes_mal_folgeturns_gesamt.wert, all),
    klassen: names.map((klasse) => ({
      klasse,
      bytes: differenz(side(m, klasse, 'bytes'), side(s, klasse, 'bytes'), all),
      bytes_mal_folgeturns: differenz(side(m, klasse, 'bytes_mal_folgeturns'), side(s, klasse, 'bytes_mal_folgeturns'), all),
    })),
    kosten_usd: differenz(m.kosten_je_erfuelltem_kriterium.kosten_usd.wert, s.kosten_je_erfuelltem_kriterium.kosten_usd.wert, all),
  };
}

/**
 * Block `kostenbilanz` of one level: per variant, and differences B1 − B0 and K-… − B1 over the
 * cases that have runs of both variants (SLV0-EVAL-37/-38). No quotient except cost per criterion.
 */
export function levelBalance(records, { estimator = null } = {}) {
  const variants = [...new Set(records.map((r) => r.variante))].sort(cmp);
  const jeVariante = variants.map((v) => ({ variante: v, ...variantBalance(records.filter((r) => r.variante === v), estimator) }));
  const pairs = [];
  if (variants.includes('B1') && variants.includes('B0')) pairs.push(['B1', 'B0']);
  if (variants.includes('B1')) for (const v of variants) if (v.startsWith('K-')) pairs.push([v, 'B1']);
  const differenzen = [];
  for (const [mv, sv] of pairs) {
    const sCases = new Set(records.filter((r) => r.variante === sv).map((r) => r.case_id));
    const caseIds = [...new Set(records.filter((r) => r.variante === mv && sCases.has(r.case_id)).map((r) => r.case_id))].sort(cmp);
    if (caseIds.length === 0) continue;
    const inCases = (v) => records.filter((r) => r.variante === v && caseIds.includes(r.case_id));
    differenzen.push(pairDiff(mv, sv, inCases(mv), inCases(sv), caseIds));
  }
  return { je_variante: jeVariante, differenzen };
}
