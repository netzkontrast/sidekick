# Unabhängige Primärquellenprüfung: lernbare Skill-Library

> 30.10.2026 · Eigene Recherche und statische Gegenprüfung zu SL0/SL1.
> Geprüfter Sidekick-Stand: `38f4c73ecbcbe0bc10706c52c87186a77af7c11b` auf PR #10.
> [Bestandsaufnahme](../../research/skills-meta-prompting/library-inventory.md) · [Evaluationsdesign](../../research/skills-meta-prompting/library-evaluation-design.md) · [Maschinenlesbarer Prüfstand](skill-library-source-audit.json).
> Kein Modelllauf, keine Installation, kein trainiertes oder aktiviertes Skill-Artefakt.

## Ergebnis

Die Produktidee hat eine konkrete technische Grundlage: Skills können als Textartefakte aus Ausführungsfeedback optimiert werden. Ein neuer eigener Universaloptimierer ist dafür zunächst nicht begründet. Die erste Sidekick-Version sollte Paketvertrag, Versionsbindung, Validator, kleine Auswahl-/Verhaltensmessung und Rohbelege liefern. Ein Optimierer wird später ein Adapter, der Kandidaten erzeugt.

Die unabhängige Prüfung bestätigt die vier vorhandenen Skill-Pakete in den unten genannten statischen Eigenschaften. Sie findet zugleich Änderungen am Evaluationsdesign: Regressionen und unabhängige Tests trennen, effektive Skill-Sichtbarkeit prüfen und den 40-Läufe-Rahmen als Diagnosepilot behandeln.

## Gelesene Originalquellen

Alle folgenden Fassungen wurden am 30.10.2026 über GitHub gelesen. Die Aussagen beziehen sich auf diese Quellen, nicht auf einen installierten oder praktisch getesteten Client.

| ID | Primärquelle, tatsächlich gelesene Stellen | Commit |
|---|---|---|
| P1 | Agent Skills: [Format](https://github.com/agentskills/agentskills/blob/69ef37e9424c0a7ea9dd2293b559e43ec8176379/docs/specification.mdx), [Client-Integration](https://github.com/agentskills/agentskills/blob/69ef37e9424c0a7ea9dd2293b559e43ec8176379/docs/client-implementation/adding-skills-support.mdx) | `69ef37e9424c0a7ea9dd2293b559e43ec8176379` |
| P2 | Agent Skills: [Beschreibung optimieren](https://github.com/agentskills/agentskills/blob/69ef37e9424c0a7ea9dd2293b559e43ec8176379/docs/skill-creation/optimizing-descriptions.mdx), [Outputqualität evaluieren](https://github.com/agentskills/agentskills/blob/69ef37e9424c0a7ea9dd2293b559e43ec8176379/docs/skill-creation/evaluating-skills.mdx) | gleicher Commit wie P1 |
| P3 | Anthropic Python SDK: [Typen/Skill-Optionen](https://github.com/anthropics/claude-agent-sdk-python/blob/1ea8cb74ddcdadbfaa9b20dfa8268e18047851e7/src/claude_agent_sdk/types.py), [CLI-Transport](https://github.com/anthropics/claude-agent-sdk-python/blob/1ea8cb74ddcdadbfaa9b20dfa8268e18047851e7/src/claude_agent_sdk/_internal/transport/subprocess_cli.py), [Permission-E2E-Tests](https://github.com/anthropics/claude-agent-sdk-python/blob/1ea8cb74ddcdadbfaa9b20dfa8268e18047851e7/e2e-tests/test_tool_permissions.py) | `1ea8cb74ddcdadbfaa9b20dfa8268e18047851e7` |
| P4 | DSPy: [Datenmodell und Input/Label-Trennung](https://github.com/stanfordnlp/dspy/blob/25162c4fc05c2d2d019b0ffb5b6b2a9f315ec007/docs/docs/learn/evaluation/data.md), [GEPA-Verfahren](https://github.com/stanfordnlp/dspy/blob/25162c4fc05c2d2d019b0ffb5b6b2a9f315ec007/docs/docs/api/optimizers/GEPA/overview.md) | `25162c4fc05c2d2d019b0ffb5b6b2a9f315ec007` |
| P5 | GEPA: [gskill-Anleitung](https://github.com/gepa-ai/gepa/blob/02ea4152ff6e512484cb5298046bfe967aea4735/docs/docs/guides/gskill.md), [Trainings-/Optimierungsskript](https://github.com/gepa-ai/gepa/blob/02ea4152ff6e512484cb5298046bfe967aea4735/src/gepa/gskill/gskill/train_optimize_anything.py), [Claude-Skill-Adapter](https://github.com/gepa-ai/gepa/blob/02ea4152ff6e512484cb5298046bfe967aea4735/src/gepa/gskill/gskill/evaluate/claude_code_skills.py) | `02ea4152ff6e512484cb5298046bfe967aea4735` |

Zusätzlich gelesen: GEPA-Blog zur Skill-Optimierung, CLI-Proposer-Anleitung, Permission-Callback-Beispiel, GEPA-Lizenz und Agent-Skills-Dokumentationslizenz. Die öffentlichen Claude-Webdokumente waren in dieser Gegenprüfung nicht abrufbar. Frühere Aussagen der Claude-Session über ihren lokalen Client sind deshalb Fremdbefunde; insbesondere exakte Kontextbudgets und einzelne CLI-Flags wurden von dieser Session nicht lokal bestätigt.

## F1 – Paketstandard und Sidekick-Vertrag sind zwei Schichten

**Dokumentiert, P1:** Das Format definiert SKILL.md, Pflichtmetadaten und optionale Ressourcen. Die Spezifikation schreibt keinen bestimmten Installationspfad vor. Die Integrationsanleitung behandelt lokale Pfadsuche, Cloud-Bereitstellung, Sichtbarkeit und Aktivierung getrennt; Aktivierung kann auch über Datei-Lesen statt über ein spezielles Skill-Werkzeug erfolgen.

**Ableitung:** Sidekick kann portable Pakete erhalten und einen separaten Laufzeitvertrag für Ein-/Ausgaben, Versionen, Komposition und Befugnisse ergänzen. Ein valides SKILL.md ist noch kein kompatibler Pipeline-Schritt. C0 muss zwischen *entdeckt*, *im Modellkatalog offengelegt* und *tatsächlich aktiviert* unterscheiden. Nur nach `Skill`-Tool-Aufrufen zu suchen kann Datei-Aktivierungen übersehen.

Die Client-Anleitung empfiehlt unter anderem tolerantes Laden und späteres Nachlesen geänderter Dateien. Für reproduzierbare Sidekick-Läufe wählen wir das nicht ungeprüft: Vor Aktivierung müssen freigegebener Paketstand und Hash stimmen. Diese strengere Laufbindung ist unsere eigene Anforderung.

## F2 – Beschreibung und Instruktion getrennt verbessern

**Dokumentiert, P2:** Die Autoren behandeln Triggerqualität und Outputqualität als getrennte Evaluationen. Schwierige Negativfälle sollen nahe am Anwendungsgebiet liegen. Wiederholungen zeigen schwankende Auswahl. Outputvergleiche nutzen dieselbe Aufgabe mit und ohne Skill.

**Ableitung:** Kein überladener Skilltext als Ersatz für eine unklare Beschreibung. Zuerst Auswahlfehler lokalisieren, dann genau Beschreibung oder Inhalt ändern. Passende Skill-Mengen müssen bei mehrdeutigen Aufgaben zulässig sein; ein frei erfundenes einziges „richtiges“ Label würde guten Alternativen einen Fehler anrechnen.

Die Leitfäden enthalten Explorationsschritte, bei denen Assertions nach ersten Ergebnissen ergänzt werden. Das ist für Entwicklung sinnvoll, aber keine unabhängige Abschlussprüfung. Sidekick friert die Schlussrubrik vor dem finalen Vergleich ein und erklärt nachträgliche Änderungen als neue Evaluationsversion.

## F3 – SDK bietet konkrete Auswahlkontrolle und Observability-Verträge

**Im Code gefunden, P3:** `ClaudeAgentOptions.skills` unterscheidet `None`, leere Liste, konkrete Namen und `all`. Laut Typkommentar bedeutet `None` keine SDK-Autokonfiguration, nicht „Skills aus“. Die Filterung betrifft Katalog/Skill-Werkzeug; Dateien bleiben über andere Werkzeuge erreichbar. Der Transport behandelt Skill-Defaults und Settings-Quellen separat.

Der Typ für die Initialisierungsnachricht enthält Listen für Skills, Werkzeuge und Plugins; Nachrichten besitzen Tool-Use-Blöcke, Ergebnisnachrichten Usage-/Kostenfelder. Das liefert Prüfpunkte, aber keinen Nachweis des Ausgabeformats der auf dem anderen System installierten CLI.

**Ableitung:** SDK als begrenzten C0-Kandidaten prüfen, keine neue Dependency installieren. Mit tatsächlichem Client/SDK/CLI-Paar sichtbare Skills und Werkzeuge aufzeichnen; `--setting-sources project` allein nicht als Isolation behaupten. Ungeplante Skills führen zum Abbruch der kontrollierten Messreihe. Rohspuren sind für das konkrete Ausgabeformat zu normalisieren.

**Im Code gefunden:** Permission-Callbacks werden bei bereits erlaubten Aufrufen unter Umständen nicht konsultiert; die SDK-Dokumentation verweist für jede Tool-Verwendung auf PreToolUse. Eine Callback-Liste ist daher kein vollständiges Aufrufjournal. Auch diese Beobachtungslogik muss C0 prüfen. Für tatsächliche Grenzen sind zusätzliche Mechanismen nötig; der Context-Filter ist keine Sandbox.

## F4 – gskill ist ein konkreter Lernansatz, kein Sidekick-Nachweis

**Dokumentiert, P5:** gskill verbindet automatisch erzeugte, testbare Coding-Aufgaben mit GEPA und einem reflektierenden Vorschlagsmodell. Optimiert wird Text, kein Modellgewicht. Anleitung und Code verlangen zusätzliche Laufzeit-/Datensatzumgebung.

**Im Code gefunden:** Das Skript bildet Trainings-, Validierungs- und Testmengen, übergibt Training/Validierung an den Optimierer und speichert den besten Text. Ein separater Evaluator verpackt Text in ein Claude-Skill-Paket. Die Struktur stützt die gewünschte Trennung von eigener Library und Optimierungsadapter.

**Grenze:** Verpacken oder Installieren beweist keine tatsächliche Aktivierung. Die dokumentierten Ergebnisse anderer Repositories beweisen weder deutsche Interviewqualität noch geräteübergreifende Sidekick-Komposition. Der Blog enthält zudem abweichende Zahlen zwischen Fließtext und Diagrammbeschriftungen; diese Zahlen werden nicht als Planungsgrundlage übernommen.

Bewertung und offene Nachweise stehen im [gskill-Dossier](../../research/skills-meta-prompting/repos/gepa-gskill.md). Erst ein kleiner Gegenversuch gegenüber einem einfachen manuellen/regelbasierten Kandidaten würde eine Dependency-Auswahl rechtfertigen.

## F5 – Unabhängige Tests dürfen keine Regressionkopien sein

**Dokumentiert, P4:** Eingaben und Zielwerte sind getrennte Datenteile. GEPA kann Validierungsdaten ausdrücklich zur Variantenwahl nutzen; sie sind dann kein unabhängiger Schluss-Test.

**Eigener methodischer Befund:** Der bisherige SL1-Vorschlag legt dieselben R-Fälle in jeden Split. Diese bleiben wertvolle öffentliche Pflichtregressionen, müssen aber getrennt vom Holdout berichtet werden. Neue Rückfrage-/Rechtevarianten erhalten eigene Ursprungsfamilien und landen erst danach in dev/select/test. Sprachvarianten bleiben in derselben Familie.

Bei korrelierten Aufgaben oder Wiederholungen sind einzelne Assertions keine unabhängigen Stichproben. Berichte nennen Aufgabenfamilien, Wiederholungen und Beobachtungen getrennt. Als eigene Beispielrechnung unter unabhängigen Bernoulli-Annahmen: Selbst null Fehler in 40 Versuchen verträgt noch eine einseitige 95-%-Obergrenze von ungefähr 7,2 % für die Fehlerrate. Diese Modellannahme ist keine Aussage zur echten Sicherheit.

## F6 – Was mit 40 Läufen beantwortbar ist

Der bisherige Plan verteilt auf Discovery, Verhalten, Komposition und Lernen. Für einen gepaarten Vergleich benötigt aber schon jede Aufgabe mindestens einen Lauf pro Variante; Wiederholungen, Vorschläge und Judge-Aufrufe kosten weitere Ausführungen.

**Eigene Empfehlung:** zuerst ein Diagnosepilot innerhalb des bestehenden Rahmens; ein E3-Lernerfolg ist damit nicht versprochen. Der überarbeitete SL1-Plan unterscheidet Diagnoseergebnis, Pilotvergleich und Aktivierungsnachweis. Vor dem ersten kostenpflichtigen C0-Lauf müssen Zählweise und gültige Limits feststehen; Kosten erst nach dem Lauf zu begrenzen käme zu spät. Nicht verwendete Reserve wird nicht automatisch für Kandidatensuche ausgegeben.

## Statische Gegenprüfung der vier Skills

13 Dateien dieses Sidekick-Stands wurden erneut gelesen. Eine eigene JavaScript-Auswertung überprüfte Namen/Ordnergleichheit, Beschreibungslänge, die aus SKILL.md verlinkten relativen Ziele und die Präsenz der impliziten Auswahl-Metadaten. Der Git-Baum weist vier Claude-Verknüpfungen als Symlinks aus. Deren Zielauflösung wurde in dieser Gegenprüfung nicht ausgeführt.

| Skill | UTF-8-Bytes | Wörter | Beschreibungszeichen |
|---|---|---|---|
| grilling | 3409 | 387 | 342 |
| planning-work-packages | 1872 | 214 | 273 |
| researching-repositories | 1791 | 201 | 264 |
| reviewing-decision-gates | 1753 | 198 | 267 |

Diese Werte stimmen mit Claudes Größenbefund überein. Das ist kein vollständiger YAML-/skills-ref-Validator und kein Discovery-Test. Rohdaten und Ausgangsstand stehen im [Prüfmanifest](skill-library-source-audit.json).

## Konsequenz für die neun Bereiche

A01: Rückfragezustände und Werkzeugcapabilities; A02: Quellenprovenienz; A03/A05: kompakte Ein-/Ausgabeverträge; A04: Empfehlung versus Entscheidung; A06: versionierte Übergaben; A07: deterministische Ausfallfixtures; A08: getrennte Auswahl-/Wirkungsevaluation; A09: bestätigte Daten vor Lernkandidaten. Die Bestandsaufnahme deckt diese Zuordnung bereits ab; die Gegenprüfung erfindet keine neun neuen Implementierungsaufträge.

Nächster sinnvoller Nachweis ist C0 plus ein eingefrorener Baseline-Pilot nach Review. Echte Client-Auswahl, deutsche Verhaltensqualität, Ende-zu-Ende-Komposition und ein Lerngewinn bleiben offen. SL2–SL7 werden durch diesen Bericht nicht als erledigt geführt.
