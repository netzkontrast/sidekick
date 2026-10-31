// Deterministic file checks, null run and B1 pre-run (SLV0-EVAL-22…25).
// The check format is the one of the research checker check_case.py (§7.3); changes come from
// comparing a baseline tree with a workspace tree instead of `git status`. A null run evaluates
// every check against the unchanged fixture: failing → `trennend`, passing → `erhaltend`.
// Reads only; never starts a process.
import { compareCodepoints, sortMessages } from '../core.js';
import { evalMsg, UsageError, requireSchema } from './common.js';
import { readTree, entryText, diffTrees, requireDir } from './tree.js';
import { checkId, ruleOf } from './casedir.js';

export const CHECKER = 'sl-eval-check@1';
export const B1_SCHEMA = 'eval-b1-vorlauf';

/** Frontmatter as check_case.py reads it: `---\n…\n---` at the start, `key: value` split at the first ':'. */
export function frontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  const out = {};
  if (m) {
    for (const line of m[1].split(/\r\n|\r|\n/)) {
      const i = line.indexOf(':');
      if (i >= 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return out;
}

const startsWithAny = (paths, prefix) => paths.filter((p) => p.startsWith(prefix));
const inSkippedDir = (p) => p.split('/').slice(0, -1).some((s) => s === '.git' || s === '.claude');

/**
 * Evaluate one check. `before`/`after` are trees from readTree; `diff` is diffTrees(before, after).
 * Returns {ok, detail}.
 */
export function evaluateCheck(check, rule, { after, diff }) {
  if (rule === 'only_changed_under') {
    const bad = diff.changed.filter((p) => !p.startsWith(check.only_changed_under));
    return { ok: bad.length === 0, detail: bad.length ? `außerhalb geändert: ${bad.join(', ')}` : 'ok' };
  }
  if (rule === 'no_new_files_under') {
    const added = startsWithAny(diff.added, check.no_new_files_under);
    return { ok: added.length === 0, detail: added.length ? `neu: ${added.join(', ')}` : 'ok' };
  }
  if (rule === 'new_file_under') {
    const added = startsWithAny(diff.added, check.new_file_under);
    const any = check.contains_any ?? [''];
    const hit = added.filter((p) => { const t = entryText(after.get(p)) ?? ''; return any.some((x) => t.includes(x)); });
    return { ok: hit.length > 0, detail: `neu: ${added.join(', ') || '–'}; passend: ${hit.join(', ') || '–'}` };
  }
  if (rule === 'absent_anywhere') {
    const hits = [...after.entries()].filter(([p, e]) => !inSkippedDir(p) && e.kind === 'file' && entryText(e).includes(check.absent_anywhere)).map(([p]) => p);
    return { ok: hits.length === 0, detail: hits.length ? `gefunden in ${hits.join(', ')}` : 'ok' };
  }
  const text = entryText(after.get(check.file));
  if (text === null) return { ok: false, detail: 'Datei fehlt' };
  if (rule === 'frontmatter' || rule === 'frontmatter_in') {
    const fm = frontmatter(text);
    const want = check[rule];
    const bad = Object.keys(want).filter((k) => (rule === 'frontmatter' ? fm[k] !== want[k] : !want[k].includes(fm[k])));
    return { ok: bad.length === 0, detail: bad.length ? `ist ${JSON.stringify(Object.fromEntries(bad.map((k) => [k, fm[k] ?? null])))}` : 'ok' };
  }
  if (rule === 'contains') return { ok: text.includes(check.contains), detail: text.includes(check.contains) ? 'ok' : 'fehlt' };
  if (rule === 'not_contains') return { ok: !text.includes(check.not_contains), detail: text.includes(check.not_contains) ? 'vorhanden' : 'ok' };
  if (rule === 'regex') {
    const ok = new RegExp(check.regex).test(text);
    return { ok, detail: ok ? 'ok' : 'kein Treffer' };
  }
  if (rule === 'count_at_least') {
    const [s, n] = check.count_at_least;
    const c = text.split(s).length - 1;
    return { ok: c >= n, detail: `${c} Treffer` };
  }
  throw new UsageError(`unbekannte Regel ${rule}`);
}

/** Evaluate all checks of a case for the given trees. */
function evaluateAll(caseObj, before, after) {
  const diff = diffTrees(before, after);
  return (caseObj.checks ?? []).map((chk, i) => {
    const rule = ruleOf(chk, `${caseObj.id} checks[${i}]`);
    return { id: checkId(caseObj.id, chk, i), regel: rule, ...evaluateCheck(chk, rule, { before, after, diff }) };
  });
}

/** Null run of one loaded case folder (SLV0-EVAL-23): workspace = baseline = unchanged fixture. */
export function nullRunCase({ caseObj, fixtureDir }) {
  const fixture = readTree(fixtureDir);
  const pruefungen = evaluateAll(caseObj, fixture, fixture).map((r) => ({
    id: r.id, regel: r.regel, nulllauf: r.ok ? 'besteht' : 'faellt', trennschaerfe: r.ok ? 'erhaltend' : 'trennend', detail: r.detail,
  }));
  return {
    case_id: caseObj.id,
    pruefungen,
    trennend: pruefungen.filter((p) => p.trennschaerfe === 'trennend').length,
    erhaltend: pruefungen.filter((p) => p.trennschaerfe === 'erhaltend').length,
  };
}

/** Null run over several case folders; cases with checks but none discriminating get a warning. */
export function nullRun(cases) {
  const faelle = cases.map(nullRunCase).sort((a, b) => compareCodepoints(a.case_id, b.case_id));
  const messages = faelle.filter((f) => f.pruefungen.length > 0 && f.trennend === 0)
    .map((f) => evalMsg('no_discriminating_check', f.case_id, `keine trennende Prüfung: der Nulllauf besteht alle ${f.erhaltend}; das Ergebnis des Falls beruht allein auf Bewertung`));
  const ohnePruefung = faelle.filter((f) => f.pruefungen.length === 0).map((f) => f.case_id);
  return {
    faelle,
    zaehlung: {
      faelle: faelle.length,
      pruefungen: faelle.reduce((n, f) => n + f.pruefungen.length, 0),
      trennend: faelle.reduce((n, f) => n + f.trennend, 0),
      erhaltend: faelle.reduce((n, f) => n + f.erhaltend, 0),
      faelle_ohne_trennende_pruefung: faelle.filter((f) => f.pruefungen.length > 0 && f.trennend === 0).map((f) => f.case_id),
      faelle_ohne_pruefung: ohnePruefung,
    },
    messages: sortMessages(messages),
  };
}

/**
 * `eval check` (SLV0-EVAL-22): checks of a case against a workspace. Baseline is `baselineDir`
 * or the fixture. Each check becomes a raw-record assertion with discrimination from the null run
 * (EVAL-23) and a role when its ID is the case's kern_kriterium or gegen_kriterium (EVAL-24).
 */
export function checkWorkspace({ caseObj, fixtureDir }, workspaceDir, baselineDir = null) {
  requireDir(workspaceDir, 'Arbeitsverzeichnis');
  if (baselineDir !== null) requireDir(baselineDir, 'Ausgangsstand');
  const before = readTree(baselineDir ?? fixtureDir);
  const after = readTree(workspaceDir);
  const results = evaluateAll(caseObj, before, after);
  const nulllauf = new Map(nullRunCase({ caseObj, fixtureDir }).pruefungen.map((p) => [p.id, p.trennschaerfe]));
  const rolle = (id) => (id === caseObj.kern_kriterium ? 'kern' : id === caseObj.gegen_kriterium ? 'gegen' : null);
  const pruefungen = results.map((r) => ({ id: r.id, regel: r.regel, ergebnis: r.ok ? 'bestanden' : 'nicht_bestanden', detail: r.detail, trennschaerfe: nulllauf.get(r.id), rolle: rolle(r.id) }));
  return {
    case_id: caseObj.id,
    ausgangsstand: baselineDir === null ? 'fixture' : 'angegeben',
    pruefungen,
    bestanden: pruefungen.filter((p) => p.ergebnis === 'bestanden').length,
    nicht_bestanden: pruefungen.filter((p) => p.ergebnis === 'nicht_bestanden').length,
    assertions: pruefungen.map((p) => ({ id: p.id, art: 'deterministisch', bewerter: CHECKER, ergebnis: p.ergebnis, r_regel: null, trennschaerfe: p.trennschaerfe, rolle: p.rolle })),
  };
}

/**
 * B1 pre-run in select (SLV0-EVAL-25): B1's absolute core verdicts per select case decide whether
 * the family set can discriminate. Returns {result, code} with exit code 0 only for `trennend`.
 */
export function b1Precheck(data, label) {
  requireSchema(B1_SCHEMA, data, label);
  const seen = new Set();
  for (const f of data.faelle) {
    if (seen.has(f.case_id)) throw new UsageError(`${label}: doppelte Fall-ID ${f.case_id}`);
    seen.add(f.case_id);
  }
  const ids = (k) => data.faelle.filter((f) => f.kern === k).map((f) => f.case_id).sort(compareCodepoints);
  const trennend = ids('nicht_erfuellt');
  const nicht = ids('erfuellt');
  const unklar = ids('unklar');
  const where = data.kandidat ?? 'select';
  let ergebnis;
  let folge;
  const messages = [];
  if (trennend.length > 0) {
    ergebnis = 'trennend';
    folge = 'Kandidat läuft in select; die B1-Läufe des Vorlaufs sind die B1-Seite der Paare.';
  } else if (unklar.length > 0) {
    ergebnis = 'unklar';
    folge = 'Kein Kandidatenstart: unklare Kernurteile zuerst klären (Beleg oder Prüfer).';
    messages.push(evalMsg('core_verdict_unclear', where, `B1 verfehlt den Kern in keinem Fall; unklar: ${unklar.join(', ')}`));
  } else {
    ergebnis = 'nicht_trennend';
    folge = 'Kein Kandidatenstart in select: trennende Familie von einer getrennten Session schreiben lassen oder Kandidat zurückstellen („zurückgestellt, Familie nicht trennend“).';
    messages.push(evalMsg('family_not_discriminating', where, `B1 erfüllt den Kern in allen ${nicht.length} select-Fällen`));
  }
  return {
    result: { modus: 'b1-vorlauf', kandidat: data.kandidat ?? null, ergebnis, trennende_faelle: trennend, nicht_trennende_faelle: nicht, unklare_faelle: unklar, folge, messages },
    code: ergebnis === 'trennend' ? 0 : 1,
  };
}
