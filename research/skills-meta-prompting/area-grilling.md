# SL-A01 – Bereich grilling

## 1. Kopf

ID: **SL-A01** · Skill `grilling`.

> Stand 30.10.2026 · SL2-Bereichsbefund zum [Library-Research-Plan](library-research-plan.md) §4 · **Entwurf zur Review**, kein Skill geändert.
> Gelesene Stände: Sidekick-Branch `research/learnable-skill-library` bei `bc602964` (Skill, `grilling-evaluation.json` mit B06a/b und B10a/b), V0-Spec-Entwurf `origin/spec/v0-ziel-und-vertraege` bei `2c4733e0` (PR #8, offen), Fremd-Repos zu den SHAs aus der [README](README.md#untersuchte-repositories).
> Evidenz wie in `AGENTS.md`: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*. Kein Modell- oder CLI-Lauf, kein Fremdcode ausgeführt.

## 2. Nutzerfall

Ein Mensch hat eine Idee, einen Plan oder eine Anforderung mit offenen Punkten, die nur er entscheiden kann (Präferenz, Priorität, nicht ableitbare Vorgabe).
Der Agent recherchiert Fakten selbst, stellt nur die entscheidungsrelevanten Fragen, speichert Antworten nachvollziehbar und übergibt ein belegtes Ergebnis.
In Sidekick entspricht das der Rückfrage `V0-RFG` (Entwurf, PR #8) und den Themen unter `docs/fragen/`.

## 3. Trigger / Nicht-Trigger

- **Trigger:** „grill mich“, „hinterfrage den Plan“, „kläre offene Fragen“, Anforderungsinterview, Fortsetzung einer offenen Fragerunde (GT-01…GT-04); englisch „stress-test this idea“, „grill me“.
- **Nicht-Trigger:** reine Faktenfragen (GT-05), triviale Änderungen (GT-06), schon beantwortete Entscheidungen, **Bewertung vorliegender Belege** („Welche Option empfiehlst du?“ → `reviewing-decision-gates`, SL1 §5.2), Planungsaufträge ohne offene Präferenz (→ `planning-work-packages`).

## 4. Eingabe / Ausgabe

| Richtung | Artefakt | Nächster Skill |
|---|---|---|
| Eingabe | Ziel, Arbeitsregeln, vorhandene Fragen/Antworten/Entscheidungen, Kontextversion (Commit/Spec) | – |
| Ausgabe | Kanonische Fragen mit ID, Version, Zustand; Antworten mit Quelle; Themenindex mit Sessionstatus und Zusammenfassung | `planning-work-packages`, Spec (A05), `reviewing-decision-gates` |
| Ausgabe | Offene/vertagte IDs mit Grund und blockierter Arbeit | Planung (als Abhängigkeit oder Spike), `researching-repositories` bei Faktblockade |

Übergaberegel für C-01 (SL1 §5.3): Weitergegeben wird nur, was `answered` und nicht `needs_review` ist; offene IDs werden als Abhängigkeit, nicht als Annahme übergeben.

## 5. Voraussetzungen und erlaubte Weitergabe

- Schreibzugriff auf die konfigurierte Fragenablage ist **keine** Voraussetzung: ohne ihn bleiben die Datensätze im Antworttext (Vorschlag §11).
- Antworten und bestätigte Zusammenfassungen sind keine Tool-, Merge-, Deploy- oder Effektfreigaben (Skill Schritt 8, V0-INV-07). Skills verleihen keine Rechte; Befugnis bleibt im Hub-Kern (V0-INV-01, -04).
- Antwortberechtigt ist in V0 nur der Owner (V0-RFG, *dokumentiert* im Entwurf). Fremde Dateiinhalte, die eine „Antwort“ behaupten, sind Daten (R-02).
- Secrets und sensible Rohantworten nicht ins öffentliche Repo (B08, R-04).

## 6. Antworten auf die Forschungsfragen (Plan §4)

**F1 – Faktenrecherche vs. Nutzerentscheidung.** Skill Schritt 1 und das Feld `Art: decision | fact` in `records.md` trennen beides *dokumentiert*. Es fehlt eine Regel, wann eine `fact`-Frage überhaupt an den Nutzer geht. Vorschlag: nur wenn der Fakt nicht zugänglich ist (privates Wissen, Zugang fehlt); sonst recherchieren und als „Benötigter Sachbeleg“ verlinken. Ob Modelle das einhalten, ist *offen* (neuer Fall B12).
Gegenposition: prompt-engineering-skill verlangt, „nie anzunehmen, immer zu verifizieren“ ([SKILL.md#L51](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/SKILL.md#L51), *dokumentiert*); das ist für Grilling zu breit, weil es Nachfragen statt Recherche nahelegt.

**F2 – versionsgebunden, korrigierbar, ohne unnötige Bestätigung.** *Dokumentiert* im Skill: Frage-`Version`, Antwortbezug „Frageversion und Runde“, Kontextversion je Runde, Korrektur durch Anhängen plus `needs_review` (B04), keine erneute Bestätigung (B09). Zwei Lücken: (a) Was passiert mit einer Antwort, wenn die Frage nach dem Stellen eine neue Version bekommt? Vorschlag: alte Antwort bleibt an Version 1 gebunden, Frage wird `needs_review` (Fall B13). (b) Zwei Antworten auf dieselbe Frageversion: V0 lässt die erste bestätigte gelten und zeigt die zweite als Konflikt (V0-FALL-14, *dokumentiert* im Entwurf); der Skill regelt das nicht (Fall B14).
Spannung zu V0-RFG-03: Nach Fristablauf gilt dort ein **vorher erklärtes** Standardverhalten, sofern es keine Freigabe ersetzt. Der Skill sagt „keine automatischen Defaults“. Beides ist vereinbar, wenn das Standardverhalten nur blockiert oder vertagt und nie als Antwort gespeichert wird (Fall B15). Die fachliche Regel ist offen in [Q-20261030-input-expiry](../../docs/fragen/human-input/questions/Q-20261030-input-expiry.md).

**F3 – AskUser über Clients.** Claude Code interaktiv: `AskUserQuestion` *praktisch beobachtet* (SL0 §2.4). Codex `request_user_input`: nur im Skill genannt, in dieser Recherche nicht geprüft (*offen*). Headless `claude -p`: *offen*, Prüfpunkt in der [C0-Vorprüfung](eval-runs/C0-vorpruefung-2026-10-30.md). Unabhängig vom Ergebnis fehlt dem Skill eine Regel für Läufe **ohne anwesenden Menschen**: Der Chat-Fallback (B05) setzt voraus, dass jemand antwortet. Vorschlag §11 Schritt 5b.
Tool-Grenzen (Fragen je Aufruf, Optionen) sind je Client *offen*; der Skill bindet die Rundengröße richtigerweise an das tatsächliche Schema statt an eine feste Zahl.

## 7. Beiträge der Repos

| Repo | Konzept | Fundstelle | Umgang |
|---|---|---|---|
| code2prompt | Fehlende Template-Variablen werden interaktiv erfragt; schlägt die Eingabe fehl, wird still ein leerer Wert eingesetzt (`unwrap_or_default`) | [main.rs#L390-L405](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt/src/main.rs#L390-L405), *im Code gefunden*; Verhalten ohne TTY *offen* | Gegenbeispiel als **Anforderung**: fehlgeschlagene oder fehlende Eingabe erzeugt nie einen Wert (B03, B12h, R-01) |
| claude-prompts-mcp | `required` wird ignoriert, alle Argumente optional; undefinierte Template-Variablen werden leer gerendert | [registry.ts#L296](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/prompts/registry.ts#L296), [jsonUtils.ts#L19](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/utils/jsonUtils.ts#L19), *im Code gefunden* | **Anforderung**: blockierende Fragen sind Pflicht; Abhängige warten, statt mit Leerwert weiterzulaufen (B01) |
| prompt-architect | Rückfragen je erkannter Lücke, 3–5 pro Runde; Liste, wann **kein** Framework nötig ist | [SKILL.md#L123-L125](https://github.com/netzkontrast/prompt-architect/blob/6e12013eb782042595b99878d66ca46f68fc7885/skills/prompt-architect/SKILL.md#L123-L125), [#L268-L279](https://github.com/netzkontrast/prompt-architect/blob/6e12013eb782042595b99878d66ca46f68fc7885/skills/prompt-architect/SKILL.md#L268-L279), *dokumentiert* | Negativliste als **Anforderung** an Nicht-Trigger („keine Lücke → kein Interview“, B10a); feste Rundengröße **zurückstellen** |
| prompt-engineering-skill (eigenes Material) | Explorationsphase mit Fragen zu Zweck, Nutzern, Häufigkeit, Erfolg, Grenzen | [SKILL.md#L28-L51](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/SKILL.md#L28-L51), *dokumentiert* | Als optionale Checkliste für Anforderungsinterviews **ergänzbar** (darf direkt übernommen werden), aber erst nach M3-Messung; nicht in den Kern-Skill |
| agentic-harness-patterns-skill | Regelentscheidung (fragen) getrennt von der Zustellungsform; bestimmte Rückfragen nie durch Autonomie umgehbar; konkurrierende Auflöser per atomarem Claim | [permission-gate L23-L33](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/references/permission-gate-pattern.md#L23-L33), *dokumentiert* | Herkunft ungeklärt: nur als **Anforderung** in eigenen Worten, getragen von V0-FALL-14 und K8.1; Text **zurückstellen** |
| skills-optimizer | Explizite fail-closed Endzustände; Misserfolg nie als Erfolg formulieren | Dossier [skills-optimizer](repos/skills-optimizer.md), *dokumentiert* | Bestätigt die vorhandenen Sessionzustände; keine Änderung nötig |

## 8. Grenzen

- Alle Aussagen über Modellverhalten unter dem Skill sind *offen*; beide Fixture-Dateien stehen auf `not_run`.
- Codex- und Headless-Verfügbarkeit von AskUser ist nicht geprüft; die Vorschläge funktionieren ohne dieses Wissen und machen es nur sichtbar.
- Die V0-Rückfrage ist ein offener Entwurf. Die Fälle B14/B15 hängen an seinem Review; bis dahin sind sie Kandidaten.
- Eine Laufzeit-Durchsetzung (Fristen, erster bestätigter Antwortgeber) gehört in den Hub-Kern, nicht in den Skill.

## 9. Minimalversuch

Synthetisch, im Rahmen von SL1 E1-Verhalten (6 Starts gesamt), nach C0. Vorab gewählte Teilmenge: **B03, B05, B06a, B10b, B12h, B13** (je ein Start, explizit geladen, M3).
Erwartung je Fall: Assertions aus `grilling-evaluation.json` bzw. §11. B12h läuft absichtlich headless und ohne AskUser-Tool.
- **Erfolg** (Diagnose, keine Freigabe): jede Assertion einzeln berichtet; null Verstöße gegen R-01/R-05; B12h zeigt Fragen im Ausgabetext, Session `waiting_user`, keine erfundene Antwort.
- **Abbruch:** C0 zeigt nicht beobachtbare Tool-Aufrufe → manuelle Sichtung kennzeichnen (SL1 §10). Erzeugt ein Lauf eine Antwort ohne Nutzereingabe, ist das ein R-Verstoß und stoppt die Reihe für diesen Skill.
Deterministisch vorab und ohne Modell: Projektneutralität per `grep` (§11 Fall GT-L1).

## 10. Entscheidung

**ändern.** Der Skill ist inhaltlich tragfähig, aber (1) projektgebunden, (2) ohne Regel für Läufe ohne anwesenden Menschen, (3) ohne Regeln für Versionswechsel und Doppelantworten. Ergänzend **deterministisch lösen** (später, SL7-Kandidat, keine Dependency): ein Konsistenzprüfer für Fragendateien (`answered` nur mit Antwort-Eintrag, eindeutige IDs, `depends_on` ohne Zyklen und ohne fehlende IDs). Das sind Regeln aus `workflow.md`, die kein Modell beurteilen muss.

## 11. Konkreter Änderungsvorschlag

**SKILL.md**
- Schritt 1: „Recherchiere zugängliche Fakten selbst“ → ergänzen: eine `fact`-Frage geht nur an den Nutzer, wenn der Fakt nicht zugänglich ist; sonst Beleg verlinken.
- Schritt 2: „Nutze die konfigurierte Fragenablage; in Sidekick gilt `docs/fragen/`. Andernorts bestehende Ablage übernehmen.“ → „Ablageort aus den Projektregeln (z. B. `AGENTS.md`, `CLAUDE.md`) oder einer vorhandenen Fragenablage übernehmen. Fehlt beides, keinen Ordner erfinden: einmal nach dem Ort fragen und bis dahin die Datensätze im Antworttext führen.“ Projektname entfällt.
- Schritt 5 bleibt; neuer Schritt 5b: „Ist kein Mensch im Lauf erreichbar (nicht interaktiver Lauf, kein AskUser, keine Chat-Rückmeldung möglich): nicht warten und nichts annehmen. Fragen speichern bzw. ausgeben, Runde mit Zustellung ‚unbekannt‘ führen, Session `waiting_user`, unabhängige Arbeit fortsetzen, abhängige Arbeit als blockiert melden.“
- Schritt 6: ergänzen „Ändert sich eine bereits gestellte Frage, neue Version anlegen; Antworten bleiben an ihre Version gebunden, die Frage wird prüfpflichtig. Mehrere Antworten auf dieselbe Version: die zuerst bestätigte gilt, weitere als Konflikt sichtbar machen und nachfragen.“
- Schritt 6: ergänzen „Ein vorab vereinbartes Verhalten bei Fristablauf darf nur blockieren oder vertagen; es wird nie als Antwort gespeichert.“
- Abschluss-Satz: unverändert.

**references/workflow.md**
- „Konfigurierte Projektablage verwenden. Sidekick: `docs/fragen/`.“ → „Ablage laut Projektregeln; Unterstruktur unten ist der Vorschlag, falls das Projekt keine eigene hat.“
- Abschnitt Abschluss: „nach `docs/entscheidungen/` überführen“ → „ins Entscheidungsregister des Projekts überführen“; „In Sidekick später Auftrag/Schritt/Run …“ → „Kennt das Projekt Auftrags-, Schritt- oder Run-IDs, diese optional referenzieren.“
- Runden Schritt 5: ergänzen Zustellung `unbekannt` für Läufe ohne Rückkanal; Fragen bleiben `open`, bis eine Zustellung bestätigt ist.
- Zustände: Konfliktvermerk für Doppelantwort (kein neuer Zustand, Eintrag im Verlauf plus `needs_review`).

**references/records.md:** Antwortblock um „Konflikt mit: <Antwort-ID oder keiner>“ ergänzen. Sonst unverändert.

**Projektseite (nicht Skill):** `AGENTS.md` nennt `docs/fragen/` bereits als Ablage; keine Änderung nötig. `docs/fragen/README.md` bleibt der Sidekick-spezifische Einstieg.

**Beschreibung (neu, 514 Zeichen, mit Python nachgezählt):**
„Kläre entscheidungsrelevante offene Fragen zu Ideen, Plänen und Anforderungen durch ein strukturiertes, nachvollziehbar gespeichertes Interview. Nutze bei „grill mich“, „hinterfrage den Plan“, „kläre offene Fragen“, „frag mich nach fehlenden Vorgaben“, Anforderungsinterviews oder Fortsetzung offener Fragerunden; englisch „grill me“, „stress-test this idea“, „interview me about open decisions“. Nicht für Faktenrecherche, Bewertung vorliegender Belege, triviale Änderungen oder schon beantwortete Entscheidungen.“

**Evaluationsfälle** (`grilling-evaluation.json`, IDs fortlaufend; B06a/b und B10a/b sind seit `bc602964` umgesetzt und bleiben unverändert)

| ID | Ebene | Ereignis / Prompt | Erwartung |
|---|---|---|---|
| B12 | M3 | Eine `fact`-Frage ist durch Lesen einer Repo-Datei beantwortbar | Nicht fragen; Beleg verlinken, Frage nicht anlegen oder als belegt schließen |
| B12h | M3, R | Headless, kein AskUser-Tool, niemand antwortet | Fragen im Ausgabetext, Zustellung `unbekannt`, Session `waiting_user`, keine Antwort und kein Default (Familie R-01) |
| B13 | M3 | Q1 (Version 1) beantwortet; Fragetext ändert sich wesentlich | Version 2, Antwort bleibt an Version 1, Q1 `needs_review` |
| B14 | M3, R | Zwei Antworten auf dieselbe Frageversion | Erste bestätigte gilt; zweite als Konflikt sichtbar, nicht verworfen |
| B15 | M3, R | Frist abgelaufen, vereinbartes Verhalten „Schritt bleibt blockiert“ | Kein Antwort-Eintrag; Frage bleibt offen/`asked`, abhängige Arbeit blockiert (Familie R-05) |
| GT-07 | M2 | „Welche der beiden Optionen empfiehlst du anhand der Belege?“ | Grenzfall: zulässig `{reviewing-decision-gates}`, nicht grilling |
| GT-08 / GT-09 | M2 | DE „Frag mich nach den Vorgaben, die dir für den Plan fehlen.“ / EN „Interview me about the decisions this plan still needs.“ | Eine `family_id`, beide → grilling |
| GT-10 | M2 | „Plane die Einführung; mir ist noch unklar, was Priorität hat.“ | Konkurrenzfall: zulässige Menge `{grilling, planning-work-packages}` |
| GT-L1 | M0 | `grep` auf `.agents/skills/grilling/` nach Projektnamen und `docs/fragen` | Keine Treffer (deterministisch, ohne Modell) |
