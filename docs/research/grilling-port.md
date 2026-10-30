# Grilling – Verhaltensübertragung für Sidekick

Quelle: [mattpocock/skills](https://github.com/mattpocock/skills/tree/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa),
Commit a496f5513d4a4cf889bc48e189e579f4b0bdf6aa, geprüft am 30.10.2026.
Quellskill, zugehörige Grilling-Dokumentation, grill-with-docs-Wrapper und MIT-Lizenz gelesen.
Eigenständige Formulierung; keine wörtliche Übersetzung oder Codeübernahme.
Der Autor der Umsetzung hat die Quelle gelesen; kein personell getrenntes Clean-Room-Verfahren behauptet.

| Beobachtbares Verhalten | Sidekick-Umsetzung |
|---|---|
| Plan/Idee kritisch bis zum gemeinsamen Verständnis hinterfragen | Grilling-Schleife im vereinbarten Umfang; Nutzer kann pausieren/abbrechen |
| Entscheidungen nach Voraussetzungen ordnen | depends_on, needs_review und Prüfung der Sachbelege |
| Unabhängige Fragen pro Runde | Ganze fragbare Menge ermitteln, nach Tool-Limit/Bedienlast in Teilrunden zustellen |
| Empfehlungen je Frage | Begründete, von Antworten getrennte Empfehlungen |
| Fakten selbst ermitteln | Tools/Quellen verwenden, Nutzerentscheidungen nicht selbst beantworten |
| Forschung blockiert nur abhängige Fragen | blocked_research plus unabhängige Arbeit |
| Nach Antworten nächste Runde neu bestimmen | Antwortverlauf, Folgefragen und transitive Neubewertung |
| Abschließendes gemeinsames Verständnis | Zusammenfassung samt Bestätigung dokumentieren, bestehende Bestätigung respektieren |
| Dokumentations-Wrapper | Eigenständig nutzbarer Skill mit bedarfsweise geladenen Referenzen, ohne Pflicht-Skillkette |

Bewusste Änderungen: keine pauschalen Subagent-Aufrufe, keine suggestive „Ja = Empfehlung“-
Formulierung, keine unbegrenzte Rundengröße, keine künstliche zusätzliche
Ausführungsfreigabe bei schon bestehender Autorisierung. Native AskUser-Tools bevorzugen;
deren tatsächliche Grenzen gelten vor der Skill-Anweisung.

## Persistenz

[Fragenablage](../fragen/README.md): kanonische Fragen mit Antwortverlauf, kompakter
Themenindex und Runden mit Tool-Feld-Mapping. Herkunft und sachliche Gründe dokumentieren,
keine privaten Gedankengänge. Zwei Folgefragen vorbereitet, nicht als gestellte Fragen ausgegeben.

## Discovery und Integration

Quelle: `.agents/skills/grilling/`; Claude-Code-Zugang als relativer Ordner-Symlink.
Codex-Metadaten erlauben implizites Laden; das Standard-Frontmatter bleibt portabel.
Automatisches Laden hängt vom Client und Einstellungen ab, nicht allein vom Dateinamen.
Skill und Referenzen enthalten alle nötigen Abläufe; kein Wrapper muss andere Skills laden.

PR #4 ist unabhängig und noch nicht vorausgesetzt. Nach dessen Übernahme können
Research-, Planungs- und Review-Skills bei echten Nutzerentscheidungen auf grilling
verweisen; reine Recherche bleibt Recherche. Befugnisse kommen weiter aus Projektregeln.
Die Fragenablage erweitert die bestehende Dokumentation innerhalb des vom Nutzer
beauftragten Umfangs und ersetzt keine Entscheidungsprotokolle.

## Prüfung

[Evaluationsfälle](grilling-evaluation.json) decken Trigger, Abhängigkeiten, Tool-Fallback,
Teilantworten, Korrekturen, Wiederaufnahme, sensible Daten und Abschluss ab.
Statische Validierung bestanden: YAML/Frontmatter, Symlink, Referenz-/Dateilinks, eindeutige unbeantwortete Frage-IDs und 14 Evaluationsfixtures. Vier synthetische Abhängigkeitsszenarien wurden deterministisch geprüft; das ist kein Modell-Verhaltenstest.
Live-AskUser/Client-Discovery sind damit nicht nachgewiesen und benötigen einen echten Client-Lauf.

## PR-Abgleich

[PR #1–#4 geprüft](sidekick-pr-review-2026-10-30.md). Grilling benötigt PR #4 nicht;
beim Zusammenführen beide AGENTS-Router erhalten. PR #3 ist Planungsinput und entscheidet
weder Runtime noch Normativität der eingebetteten Spec.
