# Abgleich: Skills in den verfügbaren Repos gegen unsere Suite

> Stand 31.10.2026 · Teil des Owner-Auftrags „schau auch in die verfügbaren Repos für unsere Skills-Suite“ · Bezug: [Synthese](synthese.md) F1, [Dossiers](README.md#untersuchte-repositories).
> Clean-Room: nur Frontmatter, Umfang und Fundort gelesen; kein Fremdtext übernommen.

## 1. Aktualität der Dossiers

Für alle zwölf Repos aus dem [Research-Einstieg](README.md) wurde am 31.10.2026 der aktuelle `HEAD` per `git ls-remote` gelesen und mit dem im Dossier gelesenen Commit verglichen. **Ergebnis: 12 von 12 unverändert** (z. B. prompt-architect `6e12013`, skills-optimizer `f8082b5`, recursive-decomposition-skill `1780d46`). Die Dossiers und damit SL2–SL6 bleiben gültig (*praktisch geprüft*).

## 2. Welche Skills die Repos enthalten

Flache Klone aller zwölf Repos (nur lesend, im Session-Scratchpad), Suche nach `SKILL.md`:

| Repo | Skill (`name`) | Umfang | Zweck laut Beschreibung | Stand in unserer Suite |
|---|---|---|---|---|
| prompt-architect | `prompt-architect` | 342 Zeilen | Prompts mit einem Katalog aus 27 Frameworks analysieren und verbessern | **Nicht übernommen.** Technik-Katalog mit Weiche ist keine Library-Anforderung (Synthese F1: K2.1–K2.3, K2.5, K2.6 verworfen) |
| prompt-engineering-skill (eigenes Material) | `prompt-engineering` | 243 Zeilen | Prompts entwerfen, optimieren, iterieren | **Nicht als eigener Skill.** Rubrik- und Edit-Historie-Ideen (PES-R3/R5) sind in K5.6/K6.5 und SL4 eingeflossen |
| recursive-decomposition-skill | `recursive-decomposition` | 185 Zeilen | Große Kontexte rekursiv zerlegen (RLM) | **Teilweise.** Zerlegung nur als Inhalt des `context-package` von resuming-work; Kontext-Builder nicht in V1 (K4.1/K4.2, K4.4) |
| skill-cost-optimizer | `cost-optimizer` | 856 Zeilen | Kostenmodell, Modellwahl, Budgets | **Als Werkzeug statt Skill.** Token-Zählung in Stufe 1 (PR #14), Start-Ledger und Kostenfelder in Stufe 2 (PR #15); K7.1–K7.7 |
| skills-optimizer | `semantic-compressor` (+ 3 Test-Fixtures) | 217 Zeilen | Skill-Markdown sicher kürzen, nur auf ausdrücklichen Aufruf | **Als Prozess statt Skill.** Kandidat → Prüfung → Urteil → Owner-Merge (SL4, E3); `evaluating-changes` bewertet solche Kandidaten |
| agentic-harness-patterns-skill | `agentic-harness-patterns` (+ `-zh`) | 251 Zeilen | Harness-Muster als Wissens-Skill | **Ausgeschlossen bis zur Klärung** (Herkunft laut Autor aus geleaktem Quelltext; [Clean-Room-Plan](clean-room-plan.md) Punkt 5). Nur öffentlich begründbare Anforderungen (K8.1/K8.4) |
| meta-prompting, automatic_prompt_engineer, dspy-advanced-prompting, claude-prompts-mcp, skill-optimization, code2prompt | – | – | enthalten keine `SKILL.md` | Konzepte über die Dossiers in K2–K7 eingeflossen |

## 3. Ergebnis

- Kein Repo enthält einen Skill, der eine Lücke der acht Bereiche A01–A08 schließt. A09 (Wissenskonsolidierung) bleibt bewusst zurückgestellt.
- Die drei Optimierungs-Skills (cost, compression, prompt) sind in unserer Suite **Werkzeug oder Prozess**, nicht Skill: Sie ändern Skills, und Änderungen laufen über Messung und Owner-Merge.
- Kein neuer Kandidat für die Suite. Ein Wiederaufgreifen von prompt-architect oder recursive-decomposition setzt einen Beleg voraus, dass ein Bereich sie braucht (Synthese F1).
