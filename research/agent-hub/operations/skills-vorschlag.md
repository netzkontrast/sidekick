# Skills für die Arbeit im Repo: Vorschlag

> Stand: 30.10.2026 · Status: **Vorschlag, noch nichts angelegt** · Grundlage: [Recherche zu AGENTS.md, CodeGraph und Skills](../../../docs/research/agents-md-und-codegraph.md), [AGENTS.md](../../../AGENTS.md), bisherige Arbeitsweise in diesem Repo

## Ausgangslage

In Phase 0 wiederholen sich im Repo dieselben Abläufe:

- ein Repo-Dossier anlegen oder fortschreiben,
- ein Entscheidungstor protokollieren,
- einen externen Planungsinput einordnen (bisher zweimal: Analyse, ChatGPT-Spec),
- Experimente dokumentieren,
- vor dem PR Links und Status konsistent halten.

Heute stehen diese Abläufe als Fließtext in `AGENTS.md` (Abschnitt „Arbeit mit dem Research-Ordner“, ca. 50 Zeilen). Sie gehen also bei jeder Sitzung in den Kontext, auch wenn niemand ein Dossier anfasst.

**Grundregel aus der Recherche:**

- In `AGENTS.md`/`CLAUDE.md` gehört, was *immer* gilt.
- In Skills gehören *Abläufe*, die nur bei Bedarf geladen werden.
- In Hooks und Skripte gehört, was *erzwungen* oder deterministisch geprüft werden muss.

Skills sollen die Arbeit nicht neu erfinden, sondern die Regeln aus `AGENTS.md` und den Vorlagen ausführbar machen.

## Vorgeschlagene Skills

### Jetzt (Phase 0)

| Skill | Wann er greift | Was er tut | Ersetzt / nutzt |
|---|---|---|---|
| **`research-dossier`** | „Untersuche Repo X“, „Dossier zu Paperclip fortschreiben“, P0-Punkt aus dem Backlog bearbeiten | 1. Backlog-Punkt wählen. 2. Commit-SHA fixieren. 3. Permalinks auf die gelesene Fassung setzen. 4. Belegstatus je Aussage vergeben. 5. Beobachtung und Schluss trennen. 6. Dossier und Backlog aktualisieren, nächsten Schritt hinterlassen. | `AGENTS.md` → „Ablauf einer Untersuchung“; Vorlage `docs/research/dossiers/_vorlage.md` |
| **`decision-record`** | „Tor A bewerten“, „Entscheidung festhalten“, Owner trifft eine Entscheidung | Protokoll unter `docs/entscheidungen/` fortschreiben: Status `offen → in Prüfung → entschieden`, Kriterien und Ausschlüsse, Belege nur aus Dossiers mit SHA, verworfene Alternativen, Rücknahmekriterium. Danach Statustabellen in `docs/entscheidungen/README.md` und `README.md` sowie den Backlog nachziehen. Bei Übernahmen Eintrag ins Herkunftsregister. | Protokollaufbau in `docs/entscheidungen/README.md`; `docs/herkunftsregister.md` |
| **`planning-input`** | Owner liefert ein externes Dokument (ChatGPT, Gemini, Notizen) „als Input“ | 1. Original unverändert mit Herkunftskopf unter `research/agent-hub/inputs/` ablegen. 2. Reflexion schreiben: übernehmen / widersprechen / Lücken gegenüber Vision und Analyse. 3. Nummerierte Vorschläge mit Status, Owner-Entscheidungen markieren. 4. Index und Backlog verlinken. Nichts davon gilt als Entscheidung. | Bisher zweimal von Hand gemacht |
| **`docs-consistency`** | Vor jedem PR, nach größeren Doku-Änderungen | Ein Skript prüft relative Links und Anker. Danach Abgleich: Tor-Status in `docs/entscheidungen/` gegen die README-Tabelle, Dossier-„nächster Schritt“ gegen den Backlog, keine Secrets oder Logs. Am Ende ein PR-Text nach Konvention: neue Befunde, Unsicherheiten, tatsächlich ausgeführte Prüfungen. | `AGENTS.md` → „Vor Abschluss …“; die Linkprüfung bisher ad hoc per Python |

### Ab Phase 0, Schritt 3 (Experimente)

| Skill | Wann er greift | Was er tut |
|---|---|---|
| **`experiment-log`** | Nordstern-Test, Fault-Test, Spike | Protokoll unter `research/agent-hub/experiments/` mit Versionen, Voraussetzungen, Befehlen, erwartetem und tatsächlichem Ergebnis und Grenzen. Test-IDs nach gemeinsamer Nummerierung (T01–T20). Nicht ausgeführte Tests bleiben ausdrücklich `offen`. Kein Ergebnis aus README-Aussagen ableiten. |

### Ab Phase 0b (Spec)

| Skill | Wann er greift | Was er tut |
|---|---|---|
| **`spec-authoring`** | Kapitel der normativen Spec schreiben oder ändern | Fester Aufbau: Invarianten, Zustandsautomat, Commands/Events, Fehlerfälle, zugeordnete Test-IDs. Clean-Room-Check: nur beobachtbares Verhalten, keine fremden Namen, Prompts oder Fixtures. Jede Abweichung von der Vision mit Verweis auf Analyse oder Entscheidung. |

### Ab Phase 1 (Code)

| Skill | Wann er greift | Was er tut |
|---|---|---|
| **`analyzing-change-impact`** | Vor Umbenennung oder Refactoring | `codegraph impact`, Aufrufer prüfen, grep für Strings und Kommentare ergänzen (wie in der Recherche vorgeschlagen) |
| **`selecting-affected-tests`** | Nach Änderungen | `git diff --name-only HEAD \| codegraph affected --stdin --quiet`, nur betroffene Tests ausführen |
| **`runtime-adapter-check`** | Neuer oder geänderter Runtime-Adapter (zuerst Claude Code) | Capability-Matrix aus Tor B gegen die reale Version abgleichen, Fake-Runtime- und Live-Smoke getrennt berichten: „dokumentiert / implementiert / bestanden / Grenzen“ |

## Bewusst keine Skills

- **„Erst CodeGraph, dann editieren“:** Das gilt immer und steht deshalb in `AGENTS.md`. Ein Skill würde erst laden, wenn es zu spät ist.
- **Deep Research:** Der vorhandene Skill `deep-research` reicht. Die Repo-Regel „Berichte nach `docs/research/`“ steht bereits in `AGENTS.md`.
- **Grenzen** (keine Secrets, kein Push auf `main`): Das gehört als Deny-Regel in `.claude/settings.json` bzw. als Hook, nicht in einen Skill.

## Gestaltungsregeln

- **Ort:** `.claude/skills/<name>/SKILL.md`. Das lesen Claude Code (erste Runtime) sowie Copilot und Cursor. Für Codex ggf. später ein Spiegel unter `.agents/skills/`.
- **Frontmatter:**
  - nur Standardfelder (`name`, `description`, optional `allowed-tools`), damit die Skills über Claude Code hinaus portabel bleiben;
  - `name` englisch, lowercase-hyphen;
  - `description` deutsch, in der dritten Person, mit Auslösern („Verwenden, wenn …“).
- **Inhalt:** Deutsch und knapp (Ziel unter 150 Zeilen). Er verweist auf Vorlagen, statt sie zu kopieren, und gibt *einen* Standardweg statt eines Menüs.
- **Deterministisches gehört in Skripte:** Linkprüfung und Statusabgleich kommen als Skript unter `scripts/` (ein Python-Skript ohne Abhängigkeiten) und werden aus `docs-consistency` aufgerufen. Skripte liegen außerhalb von `research/`.
- **Evals:** Je Skill drei Testprompts. Prüfung in einer frischen Sitzung: Greift er? Hält er die Ablage ein? Erst danach gilt der Skill als fertig.
- **AGENTS.md verschlanken:** Wenn `research-dossier` und `docs-consistency` stehen, schrumpft der Abschnitt „Arbeit mit dem Research-Ordner“ auf die Ablagetabelle plus Verweis auf die Skills. Das spart bei jeder Sitzung Kontext.

## Optional: Hooks

| Hook | Zweck | Wann |
|---|---|---|
| Deny-Regeln in `.claude/settings.json` | `.env` lesen/schreiben, `git push` auf `main` verbieten | jetzt sinnvoll, klein |
| `PreToolUse` auf `git push` → Linkprüfung | Kaputte Links blockieren | wenn `docs-consistency` steht |
| `SessionStart` → `codegraph sync` | Index in Cloud-Sessions aktuell halten | erst mit Code (Phase 1) |

## Reihenfolge

1. `docs-consistency` mit Skript: sofortiger Nutzen bei jedem PR und Grundlage für den Hook.
2. `research-dossier`: der häufigste Ablauf der nächsten Tage (Paperclip, OpenHands, Claude ACP).
3. `decision-record`: sobald Tor A/B Befunde hat.
4. `planning-input`: kleiner Aufwand, Muster existiert bereits.
5. `experiment-log`, `spec-authoring`: mit Beginn der jeweiligen Phase.
6. Danach `AGENTS.md` verschlanken, Deny-Regeln ergänzen.
