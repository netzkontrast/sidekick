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
Themenindex ohne doppelte Statusfelder und Runden mit Tool-Feld-Mapping bei Tool-Zustellung. Chat-Runden dürfen kompakt im Themenindex bleiben. Herkunft und sachliche Gründe dokumentieren,
keine privaten Gedankengänge. Zwei Folgefragen vorbereitet, nicht als gestellte Fragen ausgegeben.

## Discovery und Integration

Quelle: `.agents/skills/grilling/`; Claude-Code-Zugang als relativer Ordner-Symlink.
Codex-Metadaten erlauben implizites Laden; das Standard-Frontmatter bleibt portabel.
Automatisches Laden hängt vom Client und Einstellungen ab, nicht allein vom Dateinamen.
Skill und Referenzen enthalten alle nötigen Abläufe; kein Wrapper muss andere Skills laden.

Die drei portablen Skills aus PR #4 sind bereits auf main. Grilling ergänzt eine Zeile
im vorhandenen Skill-Router. Recherche, Planung und Entscheidungsreview können bei
echten Nutzerentscheidungen darauf zurückgreifen; reine Recherche bleibt Recherche.
Befugnisse kommen weiter aus Projektregeln. Die Fragenablage ersetzt keine Entscheidungsprotokolle.

## Beauftragter Umfang

Der Owner hat ausdrücklich einen Workflow im Verzeichnis beauftragt, in dem Fragen,
Antworten, offene Punkte und die Gründe hinter Fragen abgelegt werden. Die Anlage von
`docs/fragen/` setzt diesen Auftrag um; sie erfordert keine erneute Zustimmung.
Derselbe Auftrag enthielt den Abgleich aller PRs. Dieser Abgleich wurde berichtet;
ein separater zeitgebundener PR-Reviewbericht gehört nicht zum Grilling-Feature.

## Prüfung

[Evaluationsfälle](grilling-evaluation.json) trennen natürliche Trigger-Prompts von
Verhaltensszenarien einer bereits laufenden Session. Ein Verhaltensfall ist kein
Nachweis automatischer Auswahl.
Statische Prüfungen: Frontmatter, Referenz-/Dateilinks, Symlink, eindeutige Frage-IDs,
eine Statusquelle und Form der Evaluationsfälle. Live-AskUser/Client-Discovery und
Modellverhalten benötigen weiterhin einen echten Client-Lauf und sind ungetestet.
