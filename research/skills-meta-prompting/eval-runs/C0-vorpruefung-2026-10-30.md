# C0 – Vorprüfung und Blockade

> Stand 30.10.2026 · Owner-Wahl [Q-20261030-sl-naechster-abschnitt](../../../docs/fragen/skill-library/questions/Q-20261030-sl-naechster-abschnitt.md): SL1 korrigieren, dann C0.
> Grundlage: [SL1 §4, §9](../library-evaluation-design.md) am Branch-Stand `ef0ce98`.
> **Verbrauchte CLI-Starts: 0 von ~40.** Kein Modelllauf, kein Score.

## Ergebnis in einem Satz

Die kostenlosen Vorprüfungen sind erledigt und der isolierte Messbestand ist vorbereitet. Die beiden kostenpflichtigen C0-Starts sind **blockiert**,
weil der Anmelde- und Abrechnungsweg in dieser Umgebung nicht geklärt ist (SL1 §9 verlangt das vor dem ersten Start).

## 1. Kostenlose Vorprüfungen (ausgeführt)

| Prüfung | Befehl / Quelle | Ergebnis | Evidenz |
|---|---|---|---|
| Client-Version | `claude --version` | `2.1.314 (Claude Code)` | lokal geprüft |
| Flags für C0 | `claude --help` | `--disable-slash-commands`, `--setting-sources`, `--output-format stream-json`, `--verbose`, `--max-budget-usd`, `--bare`, `--add-dir`, `--tools`, `--permission-mode` vorhanden | lokal geprüft |
| `--bare` und Anmeldung | `claude --help` | Unter `--bare` gilt nur `ANTHROPIC_API_KEY` oder `apiKeyHelper`; OAuth und Keychain werden nie gelesen | dokumentiert (`--help`) |
| API-Schlüssel vorhanden? | `env` (nur Namen), `~/.claude/settings*.json` | Kein `ANTHROPIC_API_KEY`, kein `apiKeyHelper` | lokal geprüft |
| Lokale Anmeldedaten | `~/.claude/.credentials.json` (nur Schlüsselnamen) | nur `mcpOAuth`, keine Claude-Anmeldung | lokal geprüft |
| Anmeldeweg dieser Session | Umgebungsvariablen (nur Namen) | Vom Host verwaltet: `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST`, Proxy über `ANTHROPIC_BASE_URL`, dazu sitzungsgebundene Variablen (`CLAUDE_CODE_SESSION_ID`, `CLAUDE_CODE_MESSAGING_SOCKET`, `CLAUDE_CODE_TEE_SDK_STDOUT`, Ingress-Token) | lokal geprüft |
| Konkurrierende Skills | Dateisystem | Nutzer-Skills unter `~/.claude/skills/` (`session-start-hook`, `synced`) und synchronisierte Plugins unter `~/.claude/plugins/` vorhanden | lokal geprüft |

## 2. Vorbereiteter Messbestand

Im Session-Scratchpad, nicht im Repo:

- **B1:** Verzeichnis mit nur `.claude/skills/` und Kopien (keine Symlinks) der vier Skills. Keine `CLAUDE.md`, keine `AGENTS.md`.
- **B0:** leeres Verzeichnis ohne Skill-Dateien und ohne Projektregeln (Review-Punkt 1).

Inhaltshashes der Prüflinge (SHA-256 über die sortierten SHA-256 aller Dateien des Skill-Ordners, gekürzt auf 16 Zeichen), Stand `ef0ce98`:

| Skill | Hash |
|---|---|
| grilling | `f18a9e1117bc8030` |
| planning-work-packages | `d06465a3e32f4fe0` |
| researching-repositories | `0e161fcaa38abb84` |
| reviewing-decision-gates | `aa1b84169034714b` |

## 3. Warum die Starts blockiert sind

1. **Abrechnung unklar.** Ein `claude -p` in dieser Umgebung erbt die vom Host verwaltete Anmeldung. Ob die Starts dem Owner-Konto, der
   Cloud-Session oder einem anderen Kontingent zugerechnet werden, ist nicht dokumentiert. USD-Werte wären bestenfalls „unbekannt“.
   `--max-budget-usd` ist ohne Nachweis keine Kostensperre (SL1 §9).
2. **Nebenwirkung auf die laufende Session möglich.** Der Kindprozess erbt Session-ID, Messaging-Socket und Tee-Einstellungen dieser Session.
   Ob seine Ausgabe oder seine Ereignisse in die laufende Session des Owners gelangen, ist **offen**. Ein Messlauf darf die Umgebung, in der er
   gemessen wird, nicht verändern.
3. **Weg (b) `--bare` ist hier nicht möglich.** Ohne `ANTHROPIC_API_KEY` startet `--bare` nicht. Damit lassen sich die beiden Isolationswege
   aus SL1 §4 in dieser Umgebung nicht vergleichen.
4. **Isolation von Nutzer-Skills und Plugins unbelegt.** Ob `--setting-sources project` die Skills unter `~/.claude/skills/` und die
   synchronisierten Plugins ausblendet, ist offen. Laut SL1 §4 stoppen unerwartete Skills die kontrollierte Reihe.

Ein Start mit bereinigter Umgebung (`env -i` mit nur `PATH` und `HOME`) würde 2 nicht mehr berühren, scheitert aber vermutlich an der Anmeldung
und wäre trotzdem ein gezählter Start. Deshalb nicht ohne Freigabe versucht.

## 4. Wege aus der Blockade

| Weg | Was nötig ist | Folge |
|---|---|---|
| **A: Owner-Rechner** | Owner führt die zwei Befehle aus §5 lokal aus und legt die Ausgaben in `eval-runs/` ab | Anmeldeweg ist der des Owners und bekannt; `--bare` nur mit eigenem API-Schlüssel |
| **B: API-Schlüssel als Umgebungs-Secret** | Owner hinterlegt einen eigenen `ANTHROPIC_API_KEY` in den Umgebungseinstellungen der Cloud-Session | Beide Isolationswege testbar, Abrechnung über diesen Schlüssel nachvollziehbar |
| **C: Verschachtelter Lauf hier** | Owner bestätigt ausdrücklich, dass Abrechnung über die Host-Anmeldung und mögliche Rückwirkung auf die Session akzeptiert sind | Schnellster Weg, aber Kosten „unbekannt“ und Nebenwirkung erst nachträglich prüfbar |

## 5. Vorbereitete C0-Befehle

Prompt beider Starts: Trigger-Fall GT-01 aus `grilling-evaluation.json` („Grill mich zu diesem Plan: Lass uns die noch offenen Produktentscheidungen klären.“).
Er prüft in einem Start Discovery, Auswahl, Sichtbarkeit des Skill-Aufrufs, AskUser im headless Lauf und die Usage-Felder.

```bash
# C0-B1: vier Skills sichtbar, Isolationsweg (a)
cd <messbestand>/b1
claude -p "Grill mich zu diesem Plan: Lass uns die noch offenen Produktentscheidungen klären." \
  --output-format stream-json --verbose --setting-sources project --max-budget-usd 0.50 \
  > c0-b1.jsonl 2> c0-b1.err

# C0-B0: keine Skill-Dateien, Skill-Funktion aus
cd <messbestand>/b0
claude -p "Grill mich zu diesem Plan: Lass uns die noch offenen Produktentscheidungen klären." \
  --output-format stream-json --verbose --setting-sources project --disable-slash-commands --max-budget-usd 0.50 \
  > c0-b0.jsonl 2> c0-b0.err
```

Zeitlimit je Start: 5 Minuten, danach abbrechen und als Fehler zählen.

Auszuwerten und mit den Rohdaten abzulegen (Feldnamen nach SL1 §8):

| Frage | Woran ablesbar |
|---|---|
| Welche Skills, Tools und Plugins waren sichtbar? | `system`/`init`-Ereignis der Spur |
| Wurde ein Skill aufgerufen, und ist das als Ereignis erkennbar? | Tool-Aufrufe in der Spur; Read auf `SKILL.md` als „manuell geladen“ |
| Ist ein AskUser-Werkzeug verfügbar? | Tool-Liste im `init`-Ereignis, Tool-Aufrufe, Fehlermeldung |
| Welche Usage-Felder kommen? | `result`-Ereignis: Input, Output, Cache, Kosten; fehlende Werte als „unbekannt“ |
| Lädt B0 wirklich nichts? | Keine Skills im `init`, kein Skill-Aufruf, kein Read auf `SKILL.md` |

Vor dem Commit: Spuren auf Secrets, E-Mail-Adressen und Session-Tokens prüfen und schwärzen.

## 6. Nächster Schritt

Owner wählt einen Weg aus §4. Bis dahin bleibt C0 offen; SL2 kann unabhängig davon beginnen, falls der Owner das will.
