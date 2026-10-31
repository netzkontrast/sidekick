// Rubric per skill (SLV0-EVAL-13/-14/-15, K5.6): structure, unique IDs, binding to the package
// content hash, and the rules raw records and reports follow when they reference a rubric.
// Reads only. A stale rubric is reported, never re-bound (a new binding is a new rubrik_version).
import { compareCodepoints, sortMessages } from '../core.js';
import { evalMsg, EvalRefusal, schemaErrors } from './common.js';

export const RUBRIC_SCHEMA = 'eval-rubric';
const VERSION_RE = /^([a-z0-9]+(?:-[a-z0-9]+)*)@([1-9][0-9]*)$/;
/** Group key for versions that do not follow <skill>@<n>; all of them count as one rubric. */
export const LEGACY_GROUP = '';

/** Rubric name of a version: the part before '@' for <skill>@<n>, otherwise LEGACY_GROUP. */
export function rubricName(version) {
  const m = VERSION_RE.exec(version);
  return m ? m[1] : LEGACY_GROUP;
}

/**
 * Check one rubric on its own: schema, version prefix, file name, unique criterion and case-type
 * IDs, case types reference existing criteria, `kern` is one of the case type's criteria.
 * Returns {schemaOk, messages}.
 */
export function checkRubricStructure(rubric, label, { fileName = null } = {}) {
  const errs = schemaErrors(RUBRIC_SCHEMA, rubric);
  if (errs.length > 0) {
    return { schemaOk: false, messages: errs.map((e) => evalMsg('rubric_invalid', label, `Schema eval-rubric: ${e}`)) };
  }
  const messages = [];
  if (rubricName(rubric.rubrik_version) !== rubric.skill) {
    messages.push(evalMsg('rubric_invalid', label, `rubrik_version ${rubric.rubrik_version} gehört nicht zu skill ${rubric.skill}`));
  }
  if (fileName !== null && fileName !== `${rubric.skill}.json`) {
    messages.push(evalMsg('rubric_invalid', label, `Dateiname ${fileName} statt ${rubric.skill}.json`));
  }
  const ids = new Set();
  for (const k of rubric.kriterien) {
    if (ids.has(k.id)) messages.push(evalMsg('rubric_id_duplicate', label, `Kriterium ${k.id} mehrfach`));
    ids.add(k.id);
  }
  const types = new Set();
  for (const ft of rubric.fall_typen) {
    if (types.has(ft.id)) messages.push(evalMsg('rubric_id_duplicate', label, `Fall-Typ ${ft.id} mehrfach`));
    types.add(ft.id);
    const seen = new Set();
    for (const id of ft.kriterien) {
      if (!ids.has(id)) messages.push(evalMsg('rubric_invalid', label, `Fall-Typ ${ft.id} nennt unbekanntes Kriterium ${id}`));
      if (seen.has(id)) messages.push(evalMsg('rubric_id_duplicate', label, `Fall-Typ ${ft.id} nennt ${id} mehrfach`));
      seen.add(id);
    }
    if (!ft.kriterien.includes(ft.kern)) messages.push(evalMsg('rubric_invalid', label, `kern ${ft.kern} ist kein Kriterium des Fall-Typs ${ft.id}`));
  }
  return { schemaOk: true, messages };
}

/**
 * Check rubrics together against the current content hashes (SLV0-EVAL-14).
 * @param {{label: string, fileName: string|null, rubric: object}[]} items
 * @param {Map<string, string>} hashes package name → content hash (valid packages only)
 * @returns {{rubriken: object[], messages: object[]}}
 */
export function checkRubrics(items, hashes) {
  const messages = [];
  const rows = [];
  const skillOwner = new Map();
  const idOwner = new Map();
  for (const { label, fileName, rubric } of items) {
    const own = checkRubricStructure(rubric, label, { fileName });
    const local = [...own.messages];
    if (!own.schemaOk) {
      messages.push(...local);
      rows.push({ datei: label, skill: typeof rubric?.skill === 'string' ? rubric.skill : null, rubrik_version: null, gueltig: false });
      continue;
    }
    if (skillOwner.has(rubric.skill)) {
      local.push(evalMsg('rubric_invalid', label, `zweite Rubrik für ${rubric.skill} (schon in ${skillOwner.get(rubric.skill)}); je Skill eine Rubrik`));
    } else {
      skillOwner.set(rubric.skill, label);
    }
    for (const id of new Set(rubric.kriterien.map((k) => k.id))) {
      if (idOwner.has(id)) local.push(evalMsg('rubric_id_duplicate', label, `Kriterium ${id} steht schon in ${idOwner.get(id)}`));
      else idOwner.set(id, label);
    }
    const current = hashes.get(rubric.skill) ?? null;
    if (current === null) {
      local.push(evalMsg('rubric_stale', label, `Paket ${rubric.skill} fehlt oder ist ungültig; kein aktueller Inhaltshash`));
    } else if (current !== rubric.paket_hash.value) {
      local.push(evalMsg('rubric_stale', label, `paket_hash ${rubric.paket_hash.value.slice(0, 12)}… ungleich aktuellem Inhaltshash ${current.slice(0, 12)}…; neue rubrik_version nötig`));
    }
    messages.push(...local);
    const je = { M3: 0, M4: 0, R: 0 };
    for (const k of rubric.kriterien) je[k.ebene] += 1;
    rows.push({
      datei: label,
      skill: rubric.skill,
      rubrik_version: rubric.rubrik_version,
      paket_hash: rubric.paket_hash.value,
      aktueller_hash: current,
      kriterien: rubric.kriterien.length,
      je_ebene: je,
      deterministisch: rubric.kriterien.filter((k) => k.pruefart === 'deterministisch').length,
      fall_typen: rubric.fall_typen.map((ft) => ({ id: ft.id, kern: ft.kern, kriterien: ft.kriterien.length })),
      gueltig: local.length === 0,
    });
  }
  rows.sort((a, b) => compareCodepoints(a.datei, b.datei));
  return { rubriken: rows, messages: sortMessages(messages) };
}

/**
 * Bind a raw record to a rubric (SLV0-EVAL-15). Mutates `record.rubrik_version` when it is unset.
 * Throws EvalRefusal (rubric_invalid, rubric_id_duplicate, rubric_mismatch, rubric_stale).
 */
export function bindRecordToRubric(record, rubric, label = 'rubrik') {
  const own = checkRubricStructure(rubric, label);
  if (own.messages.length > 0) throw new EvalRefusal(own.messages);
  const messages = [];
  if (record.rubrik_version === undefined || record.rubrik_version === null) {
    record.rubrik_version = rubric.rubrik_version;
  } else if (record.rubrik_version !== rubric.rubrik_version) {
    messages.push(evalMsg('rubric_mismatch', 'rubrik_version', `Metadaten nennen ${record.rubrik_version}, Rubrik ist ${rubric.rubrik_version}`));
  }
  const crit = new Map(rubric.kriterien.map((k) => [k.id, k]));
  for (const a of Array.isArray(record.assertions) ? record.assertions : []) {
    const k = crit.get(a?.id);
    if (k) {
      if (k.pruefart !== a.art || k.r_regel !== (a.r_regel ?? null)) {
        messages.push(evalMsg('rubric_mismatch', `assertions/${a.id}`, `Assertion passt nicht zum Kriterium (Prüfart ${k.pruefart}, r_regel ${k.r_regel})`));
      }
    } else if (a?.art === 'rubrik' || (a?.r_regel ?? null) !== null) {
      messages.push(evalMsg('rubric_mismatch', `assertions/${a?.id}`, `Assertion ${a?.id} ist kein Kriterium von ${rubric.rubrik_version}`));
    }
  }
  if (record.variante === 'B1') {
    const s = Array.isArray(record.skills) ? record.skills.find((x) => x?.name === rubric.skill) : undefined;
    if (!s) {
      messages.push(evalMsg('rubric_mismatch', 'skills', `Variante B1 nennt den Rubrik-Skill ${rubric.skill} nicht`));
    } else if (s.sha256 !== rubric.paket_hash.value) {
      messages.push(evalMsg('rubric_stale', 'skills', `Inhaltshash von ${rubric.skill} im Lauf ${String(s.sha256).slice(0, 12)}… ungleich paket_hash ${rubric.paket_hash.value.slice(0, 12)}…`));
    }
  }
  if (messages.length > 0) throw new EvalRefusal(messages);
  return record;
}

/**
 * Rubric versions of a record set and mixing violations (SLV0-EVAL-15).
 * @returns {{versionen: {rubrik_version, rohdatensatz_ids}[], messages}}
 */
export function rubricVersionsOf(records, pinned = []) {
  const byVersion = new Map();
  for (const r of records) {
    if (typeof r.rubrik_version !== 'string') continue;
    if (!byVersion.has(r.rubrik_version)) byVersion.set(r.rubrik_version, []);
    byVersion.get(r.rubrik_version).push(r.run_id);
  }
  const versionen = [...byVersion.entries()].sort(([a], [b]) => compareCodepoints(a, b))
    .map(([v, ids]) => ({ rubrik_version: v, rohdatensatz_ids: [...new Set(ids)].sort(compareCodepoints) }));
  return { versionen, messages: mixingMessages(versionen, pinned) };
}

/** Messages for two versions of the same rubric, or a version that differs from a pinned one. */
export function mixingMessages(versionen, pinned = []) {
  const messages = [];
  const groups = new Map();
  for (const v of versionen) {
    const g = rubricName(v.rubrik_version);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(v.rubrik_version);
  }
  for (const [g, vs] of [...groups.entries()].sort(([a], [b]) => compareCodepoints(a, b))) {
    if (vs.length > 1) messages.push(evalMsg('rubric_version_mixed', g === LEGACY_GROUP ? 'rubrik_version' : g, `Rubrikversionen gemischt: ${vs.join(', ')}`));
  }
  for (const p of pinned) {
    const others = (groups.get(rubricName(p)) ?? []).filter((v) => v !== p);
    if (others.length > 0) messages.push(evalMsg('rubric_version_mixed', p, `Rohdaten nennen ${others.join(', ')} statt der verlangten ${p}`));
  }
  return messages;
}
