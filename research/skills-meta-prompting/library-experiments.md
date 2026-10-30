# Skill-Pilot: C0, eingefrorene Baseline und Änderungskandidaten

> Stand 30.10.2026 · Beginn der vom Owner bestätigten nächsten Ausführung.
> Ausgangsstand: `de8efef578f72c4c44d8e604e7ccc9e96706171c` auf PR #10.
> [Design](library-evaluation-design.md) · [Plan/Status](library-research-plan.md).
> **C0 lokal blockiert: Claude CLI fehlt. Keine Modellläufe und kein Lerngewinn gemessen.**

## Tatsächliches Ergebnis

Der lokale Vorcheck findet weder `claude` noch `codex` im PATH. Die von einer früheren Claude-Session dokumentierte CLI 2.1.314 liegt in einem anderen Executor. Dessen [eigene C0-Vorprüfung](eval-runs/C0-vorpruefung-2026-10-30.md) ist inzwischen ebenfalls dokumentiert und nennt einen ungeklärten Anmelde-/Abrechnungsweg. Deren Verfügbarkeit wird hier nicht unterstellt. Es wurde keine neue CLI installiert, kein Login gestartet und keine Credential-Datei gelesen.

Die unabhängigen Teile wurden durchgeführt:

- 13 kanonische Skill-Dateien am oben genannten Stand eingefroren, jeweils mit SHA-256.
- Zwei getrennte, nicht aktive Kandidaten für Grilling formuliert.
- Zwölf synthetische Fälle und 24 geplante Vergleichskonfigurationen vorbereitet.
- Ein kleiner Research-Helfer zum Einfrieren, Vorbereiten, Zählen und Normalisieren von Spuren implementiert.
- 14 lokale Hilfsprogrammtests bestanden. Sie führen keine Modelle aus und messen keine Skillwirkung.

Die Vorbereitung ist kein produktiver Library-Kern, kein automatischer Optimierer und kein Ersatz für einen echten Baseline-Vergleich. Der Helfer liegt nur im Research-Bereich und gehört nicht in Produkt-Builds.

## Eingefrorene Artefakte

| Artefakt | Zweck |
|---|---|
| [skill-pilot-baseline.json](skill-pilot-baseline.json) | Exakte Texte aller 13 Dateien, Quellcommit, Einzelhashes und Gesamthash |
| [skill-pilot-candidates.json](skill-pilot-candidates.json) | Baseline-gebundene Textänderungen, Hypothesen und getrennte Dimensionen |
| [skill-pilot-cases.json](skill-pilot-cases.json) | Zwölf Fälle mit Ursprungsfamilie, erlaubter Skill-Menge und synthetischen Dateien |
| [skill-pilot-c0.json](skill-pilot-c0.json) | Tatsächlicher fehlender Client; Auth nicht geprüft, Modellstarts 0 |
| [skill-pilot-checks.json](skill-pilot-checks.json) | Statische Kandidatenprüfung und lokale Prüfergebnisse |
| [skill_pilot.py](skill_pilot.py) | Manueller Hilfsrunner, ausschließlich Python-Standardbibliothek |
| [test_skill_pilot.py](test_skill_pilot.py) | Deterministische Tests des Hilfsrunners |

Gesamthash der Baseline: `d1a04e2631f55cd9f14d52db535d32c410b42a26641ddc4e41bfc3a9d4ea38c4`.

## Kandidaten und Entscheidungskriterien

### K-DESC: Auswahlbeschreibung

Nur die Beschreibung in Grilling wird geändert. Nutzerentscheidungen werden von recherchierbaren Fakten und schon bestätigten Vorgaben klarer abgegrenzt.

Statisch: Beschreibung 342 → 282 Zeichen; gesamte SKILL.md 3409 → 3340 UTF-8-Bytes. Das sind keine Modell-Tokens und kein Nachweis besserer Auswahl.

Hypothese: weniger unnötige Interviews bei technischen Fakten und bestätigten Plänen, ohne echte Interviewaufträge zu verpassen. Vor Aktivierung auf unabhängigen Fällen prüfen; ein einzelner positiver Entwicklungsfall reicht nicht.

### K-PORTABLE: Projektbindung

Der Skill übernimmt Fragenablage und Entscheidungsregister aus den umgebenden Projektvorgaben. Sidekick und seine festen Pfade entfallen aus dem portablen Skill-Rumpf und seiner Workflow-Referenz. Regeln für echte Antworten, Abhängigkeiten, Pausen, Korrekturen und Freigaben bleiben erhalten.

Statisch: zwei geänderte Dateien, zusammen 7938 → 7957 UTF-8-Bytes. Das Ziel ist Wiederverwendbarkeit, keine behauptete Kürzung. Alle vier Skill-Metadaten wurden mit dem bereits vorhandenen YAML-Parser geprüft; der Runner benötigt diesen Parser nicht.

Hypothese: dieselbe Anleitung funktioniert in verschiedenen Projekten ohne implizite Sidekick-Pfade. Mit unterschiedlicher Projektkonfiguration und fehlendem Ablagehinweis testen. Solange C0 fehlt, bleibt diese Wirkung offen.

Die beiden Kandidaten werden getrennt verglichen, nicht gleichzeitig aktiviert. Kanonische Dateien unter `.agents/skills/` sind unverändert. Die normale Client-Discovery lädt die JSON-Kandidaten nicht.

## Zwölf Fälle und 24 geplante Konfigurationen

Vier Fälle verwenden B0, B1, K-DESC und K-PORTABLE; acht weitere verwenden B1. Damit gibt es 24 vorbereitete Konfigurationen, keine 24 ausgeführten Läufe.

- Positive Fälle für Interview, Repo-Recherche, Planung und Entscheidungsprüfung.
- Negativfälle für direkt ablesbare Fakten, Tippfehler, einfache Erklärung und vollständig festgelegte Ausführung.
- Nahe Grenzfälle: „kläre offene Frage“ meint technische Recherche; ein bestätigter Plan braucht kein neues Interview; harte Entscheidungskriterien brauchen keine erneute Präferenzabfrage.

Alle Fälle sind Entwicklungs-/Diagnosematerial und öffentlich im Repo. Sie sind ausdrücklich kein unabhängiger Holdout. Spätere Variantenwahl und Abschlussprüfung benötigen andere Ursprungsfamilien.

B0 enthält lokal keine Skill-Dateien und keine AGENTS.md/CLAUDE.md. Eine kurze Projektkonfiguration wird in allen Armen identisch dem Aufgabenprompt vorangestellt. Das vermeidet Skillnamen als Ladehinweis; globale Nutzer-/Plugin-Skills werden dadurch aber nicht technisch ausgeschlossen. Diese Isolation muss C0 im echten Client nachweisen.

Der Helfer erzeugt frische Arbeitsverzeichnisse und überschreibt keine vorhandenen Versuche. Lokale vorbereitete Arbeitsverzeichnisse werden nicht ins Repo übernommen; sie sind aus den eingefrorenen Artefakten reproduzierbar.

## Reproduktion ohne Modellzugang

Vom Repo-Root:

```bash
python -m unittest discover -s research/skills-meta-prompting -p test_skill_pilot.py -v
python research/skills-meta-prompting/skill_pilot.py doctor --output /tmp/sidekick-c0.json
python research/skills-meta-prompting/skill_pilot.py prepare --snapshot research/skills-meta-prompting/skill-pilot-baseline.json --candidates research/skills-meta-prompting/skill-pilot-candidates.json --cases research/skills-meta-prompting/skill-pilot-cases.json --output /tmp/sidekick-skill-pilot
```

Das Ausgabeziel muss frisch sein. Der Helfer startet selbst keinen Modelllauf. Die Tests liefen in dieser Ausführung erfolgreich: **14 von 14**, und der Prepare-Schritt erzeugte **24** Arbeitskonfigurationen mit **0** Modellstarts.

## Durchführung im Executor mit Claude CLI

1. Neuesten PR-Stand und vorhandene Laufbelege abgleichen, damit mehrere Sessions das gemeinsame Budget nicht doppelt verbrauchen.
2. Lokales `doctor` ausführen und tatsächliche CLI-/Auth-/Abrechnungspfade prüfen. Das Ergebnis hier ersetzt keinen Vorcheck in jenem Executor.
3. Höchstens die vorgesehenen C0-Läufe starten. Effektive Skills, Tools, Plugins und die Beobachtbarkeit erfolgreicher Aktivierung feststellen. B0 muss tatsächlich skillfrei sein; ein fehlendes Ereignis beweist das nicht.
4. Vor jedem Start einen Versuch im gemeinsamen Studien-Ledger erfassen; Fehlstarts und Wiederholungen zählen. `record-start` reserviert lokal atomar einen Zähler und lehnt oberhalb des konfigurierten Limits, maximal 40, ab. Es ist ein Hilfsprotokoll und keine systemübergreifende Kostensperre. Bereits anderswo verbrauchtes Budget zuerst berücksichtigen.
5. Nach höchstens zwei C0-Läufen Ergebnis dokumentieren und stoppen, entsprechend der [Owner-Wahl des nächsten Abschnitts](../../docs/fragen/skill-library/questions/Q-20261030-sl-naechster-abschnitt.md). Die 24 Rezepte sind vorbereitete Optionen für einen späteren Abschnitt, keine zusätzliche Freigabe und nicht alle automatisch Pflicht. Ein späterer Kandidatenvergleich muss in das verbleibende Gesamtbudget passen.
6. Redigierte Spuren und erzeugte Artefakte getrennt sichern. `normalize` speichert Katalog-/Aktivierungsnachweise, Usage und Status; private Denktexte oder freie Modellausgaben werden daraus nicht exportiert. Die tatsächliche Qualität anhand der zulässigen Ergebnisartefakte prüfen.
7. Kandidatenwirkung, neue unabhängige Fälle und Aktivierung getrennt behandeln. Kein automatischer Merge.

Beispiel für eine lokale Reservierung und die nachfolgende Normalisierung einer bereits vorhandenen synthetischen Spur:

```bash
python research/skills-meta-prompting/skill_pilot.py record-start --ledger /tmp/sidekick-budget.json --trial-id PIL-01--B1 --limit 40 --output /tmp/sidekick-reservation.json
python research/skills-meta-prompting/skill_pilot.py normalize --trace /tmp/sidekick-trace.jsonl --output /tmp/sidekick-normalized.json
```

Die Record-Operation startet selbst nichts. Nach einer Unterbrechung eine vorhandene Lockdatei zuerst abgleichen, nicht blind löschen. Der Normalisierer wurde mit synthetischen Ereignissen geprüft; tatsächliche Clientformate bleiben Teil von C0. Ein beantragter Skill-Aufruf wird ohne erfolgreiche Tool-Antwort nicht als bestätigte Aktivierung geführt. Fehlende Spuren und Fehlerläufe ergeben keinen negativen Auswahlscore.

## Offene Blockade und nächster konkreter Schritt

**C0 live sowie B0/B1-/Kandidatenläufe:** blockiert durch fehlenden Claude-Client in diesem Executor. Zuständig für den nächsten Nachweis ist die ausführende Session im bereits autorisierten Claude-Executor; benötigt werden dessen installierte CLI, der zulässige Auth-Pfad und ein überprüfter isolierter Messbestand.

Die aktuelle User-Anweisung bestätigt die nächste begrenzte Ausführung. Sie ersetzt keine fehlende Software und keine Messdaten. Alle bis hier berichteten Ergebnisse sind statische oder deterministische Hilfsprogrammprüfungen; Auswahlqualität, Verhaltensqualität und Lerngewinn bleiben offen.
