# Research-Plan: lernbare Skill-Library im Anwendungskern

> Auftrag des Owners vom 30.10.2026 · Ausführung durch Claude, Ergebnisse agentenunabhängig.
> Status: Plan erstellt; Forschungspakete noch nicht ausgeführt.
> Dieser Plan ist die einzige Statusablage für SL0–SL7. Bestehende Hub-Pakete bleiben im [Hub-Plan](../agent-hub/operations/PLAN.md).
> Einstieg: [vorhandene Synthese K1–K8](synthese.md), [Clean-Room-Plan](clean-room-plan.md), [Vision v5](../../docs/vision-v5-entwurf.md), [Projektregeln](../../AGENTS.md).

## /goal

Erarbeite eine belegte, umsetzbare Spezifikation für eine vollständig aufeinander aufbauende, projektagnostische Skill-Library als Kernfähigkeit von Sidekick. Skills bilden ein versioniertes Prompt- und Verhaltensframework: auswählbar, kombinierbar, prüfbar und anhand geeigneter Erfahrungen optimierbar.

Zeige an einem kleinen durchgängigen Fall, wie ein Auftrag passende Skills nutzt, ihre Ergebnisse weitergibt, eine Unterbrechung übersteht und überprüftes Feedback einen besseren Skill-Kandidaten hervorbringt. Formuliere anschließend den kleinsten Implementierungsauftrag. Erfinde keinen Lernerfolg.

## 1. Was jetzt vorgegeben ist

**Owner-Vorgabe:** Die Library lebt innerhalb von Sidekick und ist eine Kernfähigkeit der Anwendung. Die bisherige Empfehlung eines separaten Produktrepos im Clean-Room-Plan ist damit überholt. Portable Pakete und austauschbare Optimierungsadapter bleiben erwünscht.

„Im Kern“ bedeutet: Skills sind erstklassige Produktobjekte mit Version, Verträgen, Ausführungsbezug und Evaluationshistorie. Ob dazu eine eigene Engine nötig ist und wie viel deterministischer Code erforderlich wird, ist Forschungsgegenstand. Skills verleihen keine Rechte. Der transaktionale Hub-Kern für Auftragsvertrag, Journal und Wirkungstore bleibt maßgeblich.

„Aufeinander aufbauend“ bedeutet eine explizite, kompatible Komposition. Es bedeutet nicht, alle Skills gleichzeitig zu laden oder aus jedem Skill unkontrolliert weitere aufzurufen. Die bestehende Regel gegen implizite Skill-Kaskaden bleibt bis zu einer geprüften Laufzeitspec gültig.

Dieser Auftrag autorisiert Recherche, eigene Specs, synthetische Fixtures und Vorschläge im PR. Er ist kein Auftrag zur sofortigen Installation aller Kandidaten, zum produktiven Selbsttraining, Deployment oder Merge. Neue Dependencies und externe kostenpflichtige Läufe werden mit konkretem Versuch und Budget zur Entscheidung vorgelegt. Unabhängige Recherche läuft weiter.

## 2. Ausgangslage und Wiederverwendung

Vorhanden sind vier Skills unter `.agents/skills/`: grilling, researching-repositories, planning-work-packages und reviewing-decision-gates. Claude-Zugänge liegen als Symlinks unter `.claude/skills/`; optionale Client-Metadaten erlauben implizite Auswahl. Eine funktionierende Auswahl im konkreten Client muss dennoch gemessen werden.

Die Evaluationsfälle in `docs/research/skill-evaluation.json` und `grilling-evaluation.json` sind ein Startpunkt, kein Nachweis ausgeführter Live-Tests. Prüfe vor Nutzung insbesondere B06 (Pausenereignis fehlt) und B10 (neue Fragen nur bei echter neuer Lücke). Der Grilling-Skill enthält noch projektgebundene Ablagehinweise; das gehört in lokale Konfiguration statt in portable Anleitung.

Die zwölf vorhandenen Dossiers und die [Web-Gegenprüfung](web-recherche-2026-10-30.md) zuerst nutzen. Nicht zwölf Untersuchungen neu beginnen. Für jede neue Behauptung Quelle, Lesedatum, tatsächlichen Commit und Evidenzstufe erfassen. Stände nach diesem Planungscommit beim Start abgleichen.

## Aktueller Abgleich vor dem PR

Gelesen am 30.10.2026: main `38333a40c5287de034a3fe1d84bd869bffb7ebf0`, nach Merge von PR #9. Offener Nachbar-PR: [#8 – V0-Spec](https://github.com/netzkontrast/sidekick/pull/8), geprüfter Kopf `2c4733e0a0b52e801fe940d7e3889bdb7dfb9ac1`. Beim Ausführungsstart erneut abgleichen.

- **Neu in main:** [UI-Synthese](../ui-synthese.md). Sie verlangt eigene Bedienmuster für Rückfragen, Freigaben und unklare Ausgänge sowie getrennte Skill-Discovery-/Wirkungsnachweise. Es sind Dokumentenbefunde und Designhypothesen; keine Usability-Tests. Die private Canvas wurde für diesen Plan nicht geöffnet und wird nicht als geprüfte Quelle behandelt.
- **V0 liegt als Entwurf in PR #8 vor:** Begriffe, elf Invarianten, Zustandsautomaten, fünf Schemas und Fallmatrix `V0-FALL-01…17` sowie `V0-ABL-01`. Vorhandene Vertragsbegriffe und Fixtures als Ausgangspunkt prüfen; keine konkurrierende Library-Auftrags-/Effekt-/Erinnerungswelt erfinden. Bis Merge/Review bleiben sie Vorschläge.
- **Dort dokumentierte Owner-Antworten:** Kontinuität mit Vertrag/Journal/Tor, lokale Inferenz und Offline-Frontend im Schema vorsehen, erster Ablauf `research-report`. Der Fragenindex steht noch auf `awaiting_confirmation`; vorhandene Antworten respektieren, keine erneute Interviewrunde nur wegen dieses Plans auslösen.
- **Überschneidungen:** PR #8 bearbeitet Tore A–D und den Hub-Plan. Änderungen dieses PRs nur additiv einbringen, beim späteren Merge Sachstände zusammenführen. V0 nicht erneut schreiben und hier keinen Status von V0/V1 auf abgeschlossen setzen.

Folgerung: Die Library baut auf der entstehenden V0-Domäne auf. E2 verwendet den Rechercheablauf und seine Vertragsfälle; E3 prüft Skill-Kandidaten als Artefakte mit denselben Wirkungstoren.

## 3. Forschungsmodell: vier getrennte Lernziele

| Ebene | Was verändert werden darf | Was gemessen werden muss |
|---|---|---|
| **Inhalt** | Instruktionen, Beispiele, kurze Metadaten und bedarfsweise Referenzen | Ergebnisqualität, Regressionen und gesamter Token-/Nacharbeitsaufwand |
| **Auswahl** | Welche Skills zu Auftrag, Gerät und Fähigkeiten passen; einschließlich „kein Skill“ | Präzision/Recall, unnötige Aufrufe, verpasste Skills und Ablehnungsfälle |
| **Komposition** | Reihenfolge, Übergaben, Kontextbudget und geeignete Kombinationen | Endergebnis gegenüber Einzelskills; Fehlerfortpflanzung, Kosten und Abbruchverhalten |
| **Modellparameter** | Später etwa ein lokaler Router oder spezialisierter Vorschlagsgenerator | Vorteil gegenüber Regeln, Retrieval und Basismodell; Export-/Betriebsaufwand |

Beginne bei einer unveränderten Baseline. Prompt-Optimierung, Regelverbesserung und Fine-Tuning sind verschiedene Verfahren. Ein neuer Fakt im Gedächtnis ist noch kein Modelltraining; eine gespeicherte Zusammenfassung beweist keinen besseren Skill.

Prüfe APE-artige Induktion und feedbackbasierte Optimierung wie GEPA/DSPy als austauschbare Ansätze anhand vorhandener Quellen. Kein Framework ist vorentschieden. Nicht alles ist eine Prompt-Aufgabe: Parser, Rechteprüfung, IDs, Statusübergänge und Hashvergleich können deterministischer Code sein.

## 4. Alle neun Skill-Bereiche

Jeder Bereich liefert ein kurzes Forschungsdokument unter `research/skills-meta-prompting/` mit ID `SL-A01` bis `SL-A09`. Das sind Bereichsbefunde, keine neuen Status-Backlogs. Vorgeschlagene Dateinamen: `area-<skill-name>.md`.

Gemeinsamer Inhalt: Nutzerfall; Trigger und Nicht-Trigger; Eingabe/Ausgabe; Voraussetzungen und erlaubte Weitergabe; Quellen; Grenzen; Minimalversuch; Erfolg/Abbruch; Entscheidung „bestehenden Skill ändern / ergänzen / deterministisch lösen / zurückstellen“. Vollständige Repo-Dossiers nach Projektvorlage nur für tatsächlich weiterverfolgte externe Kandidaten.

| ID / Bereich | Entscheidende Forschungsfragen | Kleiner Nachweis und Anschluss |
|---|---|---|
| **A01 grilling** | Wie trennen wir Faktenrecherche und Nutzerentscheidungen? Wie bleiben Antworten versionsgebunden, korrigierbar und ohne unnötige Bestätigung nutzbar? Wie funktioniert AskUser über unterschiedliche Clients? | Unabhängige/abhängige Fragen, Teilantwort, Timeout, Pause und Korrektur mit nativen Tools oder dokumentiertem Fallback. Ausgabe: belegte Antworten/offene IDs als Eingabe für Spec und Planung. |
| **A02 researching-repositories** | Wann genügt eine Quellenmatrix, wann braucht es Codeprüfung/Dossier? Wie werden behauptete Funktionen, Lizenzen und tatsächlich geprüfte Stände getrennt? | Ein bekannter README-/Code-Widerspruch aus der bestehenden Recherche. Ausgabe: Befund mit Evidenz, Integrationsempfehlung und offenem Versuch; nutzbar für Gate-Review. |
| **A03 planning-work-packages** | Wie entstehen kleine durchgängige Pakete statt Featurelisten? Welche Felder zu Zustandseigentum, Datenweg, Befugnis, Wiederaufnahme und Abnahme sind notwendig? | Einen Skill-Auftrag und einen Hub-Auftrag zerlegen; keine zweite Statusquelle. Ausgabe: referenzierte Pakete mit Kriterien, Übergaben und Abhängigkeiten. |
| **A04 reviewing-decision-gates** | Wie verhindern wir Scheinpräzision durch Scores? Wie halten wir Empfehlungen, Owner-Entscheidungen und Ausführungsbefugnis auseinander? Wie bleibt das Register konsistent? | Option mit hohem Score, aber verletztem Muss-Kriterium; korrigierte Evidenz macht Empfehlung prüfpflichtig. Ausgabe: begründete Entscheidungsreife plus fehlender Nachweis. |
| **A05 specifying-behavior** | Welche Spezifikationsmethode beschreibt beobachtbares Verhalten, Zustände und Fehler kompakt? Wie verbinden wir Anforderung, Schema, Beispiel und Test ohne Doppelpflege? | Spec für Skill-Aufruf mit ungültigem Input, Rückfrage und Abbruch. Ausgabe: stabile Anforderungs-IDs und synthetische Vertragsfälle für Planung/Tests. |
| **A06 resuming-work** | Welche minimale Übergabe erhält Absicht und nächsten Schritt? Wie werden Repo-/Artefaktänderungen, veralteter Kontext und laufende Prozesse abgeglichen? | Zwei getrennte Sessions mit dazwischen geändertem Ausgangsstand. Ausgabe: aktuelles Kontextpaket, Unsicherheiten und nächster Schritt; kein behauptetes Prozess-Resume. |
| **A07 testing-system-boundaries** | Welche Ausfallmatrix ist wiederverwendbar? Wie trennen wir Zustellung, Run-Zustand und Wirkung? Welche Tests verlangen isolierte Umgebung? | Doppelte Nachricht, veraltete Epoch, verlorene Effektantwort, Widerruf und lokaler Offline-Fall in Fake-Umgebung. Ausgabe: Rohbelege gegen Spec-IDs, keine unerlaubten produktiven Störungen. |
| **A08 evaluating-changes** | Wie messen wir Discovery, Auswahl, Verhalten und Komposition getrennt? Wie verhindern wir Testlecks und Optimierung auf den Judge? Wie rechnen wir Gesamtaufwand? | Eingefrorene Baseline gegen genau eine eigene Änderung, getrennte Splits, Rohresultate. Ausgabe: belastbare Vergleichsbewertung samt Unsicherheit und Rücknahmeempfehlung. |
| **A09 consolidating-knowledge** | Was darf aus Sessions zu Wissen und was zu Trainingsbeispielen werden? Wie funktionieren Herkunft, Widerspruch, Gültigkeit, Korrektur und Rückzug? | Belegte Beobachtung, falsche Zusammenfassung und spätere Korrektur. Ausgabe: überprüfbarer Erinnerungskandidat; nur geeignete freigegebene Fälle an A08/Optimierer. |

Bereiche ohne eigene sinnvolle Skill-Grenze dürfen zusammengeführt oder als Referenz umgesetzt werden, wenn alle Anforderungen und Fälle nachvollziehbar erhalten bleiben. Neun Bereiche sind verbindlicher Untersuchungsumfang, keine vorweggenommene Anzahl installierter Skills.

## 5. Quellenstrategie

1. Interne Regeln, vier vorhandene Skills, Evaluationsfälle, v5 und die Synthese K1–K8 inventarisieren. Pro Bereich vorhandene Anforderungs-IDs zuordnen.
2. Existierende Repo-Dossiers gezielt wiederverwenden: Prompt-/Skillformat und Katalog (PA/PES), Optimierung (APE/DSPY/MP), Ketten/Registry (CPM), Kontext (RD/C2P), Änderungen (SO/SOPT) und Kosten (SCO). Fundstellen im Dossier prüfen; kein ungeprüftes Ergebnis als bewiesen übernehmen.
3. Öffentliche Originaldokumentation zu Agent Skills, den konkreten Claude-/Codex-Clients sowie Optimierungsverfahren aus der Web-Gegenprüfung aktualisieren. Spezifikation, Client-Erweiterung und Herstellerbehauptung trennen.
4. Nur für offene Fragen zusätzliche GitHub-Kandidaten suchen. Zuerst zwei relevante Kandidaten pro Frage vergleichen; nur bei einer benannten Lücke erweitern. Für Spec/Übergabe/Fehlertests etablierte Vertrags-, Workflow- und Testansätze prüfen. Für Gedächtnis Letta und den vorhandenen Selfplay-/Needle-Befund einordnen.
5. Bei Auswahlkandidaten Quellcode und Tests an fixiertem Commit prüfen. Reproduzierbare Minimalversuche vor großen Installationen. Lizenz von Code, Prompttext, Beispielen und Datensätzen getrennt erfassen.

Suchergebnisse sind ein Einstieg, keine Evidenz. Ein Framework muss nicht integriert werden, um ein beobachtbares Verhalten eigenständig zu spezifizieren. Auffällige Leak-Herkunft und ungeklärte Datensatzlizenzen bleiben gemäß bestehendem Clean-Room-Plan ausgeschlossen. Ein implementierender Agent erhält später die eigene Spec und Tests; ein juristisch getrenntes Clean-Room-Verfahren wird hier nicht behauptet.

## 6. Wie die Library zusammenarbeitet

Untersuche als Hypothese diese fachliche Folge:

**Klärung bei Bedarf → Recherche bei Bedarf → Verhalten spezifizieren → Pakete planen → Entscheidung prüfen → ausführen und Grenzen testen → Ergebnis evaluieren → Wissen konsolidieren.**

`resuming-work` kann an jeder Unterbrechung anschließen. Evaluation beurteilt auch einzelne Komponenten. Konsolidierte Erfahrungen dürfen neue Optimierungskandidaten speisen; sie verändern aktive Regeln nicht direkt.

Die Forschungsreihenfolge ist davon verschieden: Eval-Vertrag und Baseline müssen vor Optimierung stehen. Fähigkeiten werden nur geladen, wenn sie gebraucht werden. Abhängigkeit, Alternative und optionale Empfehlung sind unterschiedliche Beziehungen.

Zu spezifizieren und gegeneinander zu prüfen:

- **Paketvertrag:** stabile Identität, Inhaltshash, Version, Trigger, Ein-/Ausgabe, Voraussetzungen, Effekte als Anforderungen, Referenzen, Herkunft und Testfälle. Portable SKILL.md-Konventionen erhalten; zusätzliche Laufzeitdaten getrennt halten, falls das Format sie nicht vorsieht.
- **Komposition:** Ein-/Ausgaben tatsächlich kompatibel? Wie werden fehlende Daten, Zyklen, Rekursion und Teilfehler erkannt? Alternative: kleine explizite Pipeline vor generischem Planner.
- **Auflösung:** Versionen und Referenzen für einen Run fixieren. Laufende Runs wechseln nicht still auf neue Skills. Inkompatible Abhängigkeiten und fehlende Fähigkeiten sichtbar ablehnen.
- **Kontext:** Metadaten zuerst, Skill-Rumpf bei Auswahl, Referenzen bei Bedarf. Projektwissen und persönliche Daten zweckgebunden zuliefern; Kontextbudget ohne stillen Verlust kritischer Regeln.
- **Laufzeit:** Skills empfehlen Verhalten, der Harness erzwingt Rechte, Datenklasse, Budget und Nebenwirkungen. Fremde Quellen und erzeugte Kandidaten sind keine vertrauenswürdigen Anweisungen.
- **Oberflächen:** Repo-Skill-Discovery und Auswahl in Sidekicks eigener Runtime sind getrennte Adapter. Nicht jede Chat-Oberfläche liest Repo-Skills.
- **Offline:** gepinnte freigegebene Library lokal verfügbar, Synchronisation und Konflikte sichtbar. Keine unkontrollierte Vermischung konkurrierender freigegebener Versionen.
- **Produktansicht:** Welche Skills liefen warum, welche Version wurde genutzt, welcher Lernkandidat entstand und worauf beruht der Vergleich? Erst fachliche Projektion beschreiben, kein UI-Bau in dieser Recherche.

Ein vollständiges hierarchisches Skill-System kann kleine Basisfertigkeiten, zusammengesetzte Arbeitsabläufe und Projektkonfiguration unterscheiden. Ob eigene neue Basis-Skills helfen oder nur mehr Metadatenkosten erzeugen, muss der Vergleich zeigen.

### UI und Design als Querschnitt

Die UI-Synthese aus PR #9 ist zusätzliche Eingabe für SL2/SL3: A01 liefert Fragenrunden, A03/A05 Auftragsvorschläge, A04 Entscheidungsbelege, A06 Aktualität/Unsicherheit, A08 Kandidatenvergleiche und A09 Erinnerungskorrekturen. Diese Ergebnisse müssen als strukturierte Daten von der UI darstellbar sein; ein Agent muss keine UI bedienen, um sie zu erzeugen.

Untersuche, ob ein vorhandener allgemeiner Design-Skill ausreicht und welche Regeln erst nach Nutzungsnachweisen in einen eigenen Skill gehören. Ein zehnter eigener Skill ist nicht vorentschieden. Halte verspielte Motion, mobile Bedienung, Tastatur-/Screenreader-Zugang und reduzierte Bewegung als Prüffragen fest. Animation, Scorecards und gutes Aussehen sind keine zusätzliche Freigabe oder Evidenz. Ein Modellurteil ersetzt keinen Usability-Test.

## 7. Lern- und Änderungsschleife

**Erfahrung → geeigneter Feedbackfall → Kandidat → Entwicklungsvergleich → Auswahl → unabhängiger Test → autorisierte Aktivierung → Beobachtung/Rücknahme.**

Für jede Stufe Herkunft, Versionen, berechtigten Zugriff und Abbruchpfad klären. Übernommenes Nutzerfeedback ist ein Signal, keine automatisch objektive Zielmarke. Korrekturen, Ablehnungen und Ergebnisse dürfen nicht unbesehen gegenseitig als Begründung dienen.

Mindestregeln für den Forschungsentwurf:

- Trainings-/Entwurfs-, Auswahl- und finalen Testsatz nach Ursprungsaufgabe/Session trennen, bevor Varianten entstehen. Keine Paraphrasen derselben Episode über Splits verteilen.
- Finalen Test nicht wiederholt zur Kandidatensuche verwenden. Bei erneuter Optimierung nach Einsicht neuen unabhängigen Test vorsehen; gemessene Unsicherheit nennen.
- Auswahlentscheidung und Ausführung getrennt messen. Keine Lernbehauptung allein aus niedrigerem Loss, kürzerem Prompt oder überzeugenderem Judge-Text.
- Deterministische Prüfungen, menschliche Abnahme und Modellurteile auseinanderhalten. Kritische Fälle durch konkrete Assertions prüfen; Judge-Version fixieren und Stichproben menschlich kontrollieren.
- Fehler, Abbrüche und Nacharbeit in den Gesamtaufwand aufnehmen. Usage, Schätzungen und unbekannte Kosten getrennt; Optimierungsaufwand gegen spätere Nutzung rechnen.
- Kandidatenerzeugung, Budget und Iterationszahl vor dem Lauf begrenzen. Die Grenze rechtfertigt keinen kostenpflichtigen Aufruf ohne passende Autorisierung.
- Aktivierung an geprüfte Artefakthashes binden; getestete Version und aktive Version vergleichen. Rücknahme auch bei abhängigen Skills planen.
- Persönliche Rohsessions nicht in Git oder an Optimierungsdienste senden. Externe Faktenkorrektur und Rückzug bereits trainierter Gewichte sind unterschiedliche Probleme.
- Keine autonome Änderung der eigenen Bewertungsmaßstäbe. Rubrikänderungen separat versionieren und Vergleich neu begründen.

Needle bleibt ein früher eigenständiger Versuch N0 aus dem Hub-Plan. Prüfe hier seine mögliche Rolle als Router/Vorschlagsmodell, ohne darauf die gesamte Library zu gründen oder große Modelle für allgemeine Arbeit zu ersetzen.

## 8. Forschungspakete und Status

| Paket | Status | Voraussetzung | Ergebnis / vorgeschlagene Ablage | Abnahme |
|---|---|---|---|---|
| **SL0 Bestand und Verträge** | offen | Dieser Auftrag | `library-inventory.md`: vier Skills, bestehende K1–K8/WEB-IDs, neun Bereiche, Lücken und Abgrenzungen | Jeder Bereich zugeordnet; vorhandene Ergebnisse wiederverwendet; Client- und App-Discovery getrennt |
| **SL1 Forschungsbaseline** | offen | SL0 | `library-evaluation-design.md`: Fälle, Splits, Metriken, Versionierung, Budgetvorschlag | Positive/negative Trigger, Verhalten, Rechte-/Antwortregeln und Komposition enthalten; Widersprüche B06/B10 geklärt |
| **SL2 Bereichsrecherche** | offen | SL0; Versuche nach SL1 | Neun `area-*.md`, ergänzte Dossiers nur bei Auswahlbedarf | Für A01–A09 Fragen, Quellen, Minimalversuch und begründete Umsetzungskategorie vorhanden |
| **SL3 Kompositionsvertrag** | offen | SL1 und relevante SL2-Befunde | `library-composition.md`: Datenmodell, Schichten, Versionen, Übergaben, Fehler- und Offline-Verträge | Ein vollständiger Beispielablauf plus Ablehnung von Zyklus, falscher Ausgabe und inkompatibler Version; Anforderungen gegen K1–K8 rückverfolgbar |
| **SL4 Lernvertrag** | offen | SL1/SL3 | `library-learning.md`: Inhalts-/Auswahl-/Kompositionsoptimierung, Datenwege, Aktivierung und Rücknahme | Kandidat verändert aktive Library nicht; Testsatz bleibt unabhängig; Grenzen von Modelltraining klar |
| **SL5 Minimalnachweise** | offen | SL1–SL4, notwendige Zugänge | `library-experiments.md` mit Rohartefaktverweisen und tatsächlichen Befehlen | Drei unten beschriebene Versuche ausgeführt oder jeweils konkrete Blockade dokumentiert; keine simulierten Erfolgszahlen |
| **SL6 Synthese und Entscheidungen** | offen | SL2–SL5 | Bestehende `synthese.md` und `clean-room-plan.md` fortschreiben; passende Tore A/B/D aktualisieren | Jede Anforderung belegt oder eigene Vorgabe; Empfehlung gegen Status quo; keine doppelten Backlogs |
| **SL7 Implementierungsübergabe** | offen | SL6 | Eigene ergänzende Spec unter `docs/` und kleiner erster Implementierungsauftrag; PR #8s Spec-Konventionen nach Review/Merge übernehmen | Ausgangsstand, Inputs, Kriterien, Tests, offene Fragen und Rücknahme enthalten; Forschungsbelege nicht als Laufzeitgarantie verkauft |

Reihenfolge: SL0 → SL1 → SL2 → SL3 → SL4 → SL5 → SL6 → SL7. Unabhängige Quellenlektüre innerhalb SL2 ist möglich; dieser Plan verlangt keine Subagents. Eine vorhandene, belegte Antwort wird übernommen statt erneut erzeugt.

Erst alle neun Bereiche knapp abdecken, dann entscheidende Lücken vertiefen. Kein generisches Framework implementieren, bevor Vertrag und Baseline stehen. Keine Aufwands-/Kostenersparnis vor Messung zusagen.

## 9. Drei erste durchgängige Versuche

**E1 – Auswahl und Interview:** vorhandenes Grilling unverändert als Baseline. Frische Client-Sessions mit passenden und unpassenden Aufgaben; danach getrennt Verhalten bei Teilantwort, Korrektur und fehlendem Tool prüfen. Erfassen: sichtbare Discovery, Auswahl, gespeicherte Antworten, unnötige Nachfragen, Usage soweit verfügbar. Fehlende Observability nicht durch Vermutung ersetzen.

**E2 – Komposition und Übergabe:** an PR #8s `V0-ABL-01` angelehnter synthetischer Rechercheauftrag mit einer echten Entscheidungsunklarheit; Klärung → Quellenbefund → kurze Spec → Paket → Gate-Review. Nach einem Schritt unterbrechen und Ausgangsartefakt ändern. Eine zweite Session muss mit aktueller Version fortsetzen. Einen Schritt zusätzlich einzeln vergleichen; Artefaktübergaben und Fehler lokalisieren.

**E3 – Ein Lernschritt:** Aus ausschließlich freigegebenen synthetischen Entwicklungsfällen genau eine Änderung an einem Skill oder seiner Auswahlregel vorschlagen. Baseline, Rubrik und Runtime konstant halten; eingefrorenen Auswahl-/Testsatz beachten. Kandidat evaluieren, Aktivierungs-/Rücknahmeablauf im Testbestand durchspielen. Auch „kein Vorteil“ ist ein gültiges Ergebnis. Zunächst keine produktive Selbständerung und kein Fine-Tuning erforderlich.

Ohne Live-Client oder Budget: Schemas, deterministische Fixtures und ein ausführbares Versuchsprotokoll liefern; Live-Auswahl, Qualitätsvergleich und Lernerfolg bleiben ausdrücklich offen. Diese Blockade darf Quellenrecherche und Spec nicht stoppen.

## 10. Konkreter Startauftrag für Claude

1. Branch dieses PRs übernehmen; neuesten main-Stand und insbesondere PR #8 auf Überschneidungen prüfen. Falls V0 inzwischen gemergt ist, dessen Specs und synthetische Fixtures verwenden. Keine fremde Arbeit überschreiben.
2. AGENTS.md und diesen Plan lesen, vorhandene Synthese und vier Skill-Pakete prüfen. SL0 bearbeiten, nur dessen Status hier aktualisieren.
3. SL1 als erstes prüfbares Ergebnis liefern. Danach alle neun Bereiche in SL2 bearbeiten; relevante Originalquellen und fixierte GitHub-Stände belegen.
4. Offene Präferenzen mit dem Grilling-Ablauf und einem verfügbaren nativen AskUser-Werkzeug klären. `docs/fragen/` nutzen. Technische Fakten selbst recherchieren. Bereits vorgegeben ist der Ort innerhalb Sidekicks; diese Frage nicht erneut stellen.
5. Konkrete offene Entscheidungen: Reichweite der ersten Version, zulässige Feedbackdaten, Aktivierungsbefugnis, externe Laufbudgets und Dependencies. Nur jeweils tatsächlich blockierende Punkte fragen; unabhängige Arbeit fortführen.
6. SL3–SL7 durchführen, soweit Nachweise und Zugänge reichen. Bei Unterbrechung Paketstand, Belegverweise und genau nächsten Schritt in dieser Datei sichern; keine neue NOW-/Statusdatei anlegen.
7. PR-Beschreibung um tatsächliche Befunde und Checks aktualisieren. Klar trennen: Plan, recherchiert, lokal getestet, im Client gemessen und nicht ausgeführt. Nicht selbst mergen.

## Definition of Done der Recherche

- Alle neun Bereiche haben begründete Empfehlungen; ein fehlender neuer Skill ist kein Fehler, sofern die Fähigkeit sinnvoll anders abgedeckt ist.
- Der Zusammenhang von Basisfertigkeiten, Komposition, Auswahl und Lernschleife ist spezifiziert und anhand eigener Fixtures prüfbar.
- Die existierenden K1–K8/WEB-Anforderungen sind zugeordnet, ergänzt oder mit Begründung verworfen; kein zweites unverbundenes Framework.
- Token-/Kontextkosten, Datenschutz, Offline-Fähigkeit, Modell-/Clientbindung und Rechte sind explizit behandelt.
- Drei Experimente haben echte Rohbelege oder konkrete begründete Blockaden. Nicht ausgeführte Experimente erfüllen keinen praktischen Nachweis.
- Der Abschluss unterscheidet **recherchierbar/spezifizierbar** von **praktisch bestätigt**. Für jeden blockierten Pflichtnachweis stehen Owner, benötigter Zugang und nächster Versuch fest.
- Claude kann aus dem Ergebnis einen kleinen ersten Implementierungs-PR beginnen, ohne die gesamte Recherche neu zu interpretieren.
