# Research-Plan: lernbare Skill-Library im Anwendungskern

> Auftrag des Owners vom 30.10.2026 · Ausführung durch Claude, Ergebnisse agentenunabhängig.
> **Stand 31.10.2026: SL0–SL7 abgeschlossen.** Gemergt: #10 (acht Skills), #12 (SL5-Pilot, SL3/SL4/SL6/SL7), #13 (E3: K-MELDEN aktiv, Paketsatz-Hash `6d0f3353…`), #14/#15 (Werkzeuge Stufen 1–2). Menschliche Stichprobe der Modellurteile (SL1 §7): **Owner-Verzicht am 31.10.2026** (AskUserQuestion in der Claude-Code-Session); die Modellurteile gelten damit ohne menschliche Nachprüfung als abgenommen, vermerkt im [E3-Ergebnis](e3/E3-ergebnis-2026-10-30.md) §4. Der Plan ist abgeschlossen.
> Status 30.10.2026: SL0 und SL1 geliefert; SL1 nach Review einer getrennten Session überarbeitet, Owner-Review offen. Owner-Wahl des nächsten Abschnitts: SL1 korrigieren, dann C0 ([Q-20261030-sl-naechster-abschnitt](../../docs/fragen/skill-library/questions/Q-20261030-sl-naechster-abschnitt.md)). C0 vorbereitet, Starts blockiert (Anmelde-/Abrechnungsweg ungeklärt): [C0-Vorprüfung](eval-runs/C0-vorpruefung-2026-10-30.md). Verbrauchte CLI-Starts: 0 von ~40. SL2–SL7 geplant. Kein Skill geändert.
> Fortsetzung 30.10.2026 (Owner-`/goal`: Skills finalisieren, Plan folgen, Repos einbeziehen): SL2 geliefert; acht Skills im kanonischen Bestand, alle formal geprüft; Evaluationsfälle erweitert; keine Modellläufe (0 von ~40). Wirkung, Auswahl und Verhalten bleiben bis zu Läufen *offen*.
> Owner-Antworten zu Live-Budget, Reichweite, Feedbackdaten und Aktivierung: [docs/fragen/skill-library](../../docs/fragen/skill-library/index.md).
> Stand nach `/goal`-Durchlauf 30.10.2026: SL2 geliefert, SL3/SL4/SL6/SL7 als Entwürfe geliefert, SL5 als Diagnosepilot ausgeführt (C0, E1-Auswahl, E1-Verhalten, E2, M4; 38 von ~40 Starts). Owner-Runde 3 ([R-20261030-sl-runde3](../../docs/fragen/skill-library/rounds/R-20261030-sl-runde3.md)): Node ohne Dependencies, beide neuen Skills bleiben aktiv, E3 mit bis ~30 weiteren Läufen, Abnahme der Entwürfe durch Owner-Review und Merge von PR #12. E3 ausgeführt (28 von 30 Starts, [Ergebnis](e3/E3-ergebnis-2026-10-30.md)): K-MELDEN vorgelegt (Test 4 von 4 besser, 0 schlechter), K-FOLGEFRAGE verworfen. Offen: Owner-Merge von K-MELDEN (= Aktivierung, Hash `6d0f3353…`), menschliche Stichprobe. Implementierungs-PR 1 (Stufe 1, Node ohne Dependencies) liegt als PR #14 vor: 60/60 Tests, Validator 0 Fehler, Golden-Hash bestätigt; Eval-Harness (Stufe 2) liegt als PR #15 vor (gestapelt auf #14): 105/105 Tests, EVAL-01…11, Gleichheit mit dem Research-Helfer belegt. Damit ist die Owner-Reichweite Stufen 0–2 vollständig als PRs vorgelegt. Vorher offen: E3-Budget und Code-Sprache/-Ort ([Q-20261030-sl-code-sprache](../../docs/fragen/skill-library/questions/Q-20261030-sl-code-sprache.md)) sind Owner-Entscheidungen. Mit dem Merge von PR #10 (`03802a2`) hat der Owner die acht Skills aktiviert (Paketsatz-Hash `4ad5b6db…`, unverändert gegenüber B1).
> Früherer nächster Schritt (erledigt durch Weg C): Owner wählt einen Weg aus der C0-Vorprüfung §4 (eigener Rechner, API-Schlüssel als Secret oder ausdrücklich freigegebener Lauf hier). SL2 kann unabhängig davon beginnen, wenn der Owner das will.
> Ergänzende Vorbereitung im Work-Executor: [Pilot-Artefakte](library-experiments.md) mit eingefrorener Baseline, zwei getrennten Kandidaten und zwölf synthetischen Fällen. C0 hier lokal blockiert, weil die CLI fehlt; 0 Modellstarts. 14 Hilfsprogrammtests bestanden. Die Kandidaten sind nicht aktiv und ihre Wirkung ist ungemessen; SL5 gilt damit nicht als durchgeführt.
> Dieser Plan ist die einzige Statusablage für SL0–SL7. Bestehende Hub-Pakete bleiben im [Hub-Plan](../agent-hub/operations/PLAN.md).
> Einstieg: [vorhandene Synthese K1–K8](synthese.md), [Clean-Room-Plan](clean-room-plan.md), [Vision v5](../../docs/vision-v5-entwurf.md), [Projektregeln](../../AGENTS.md).

## /goal – erste Ausführung: nur SL0 und SL1

Erstelle eine belegte Bestandsaufnahme und ein reviewbares Evaluationsdesign für Sidekicks lernbare Skill-Library. Bearbeite ausschließlich SL0 und SL1. Liefere `library-inventory.md` und `library-evaluation-design.md` als überprüfbare Änderungen auf diesem PR-Branch; aktualisiere die PR-Beschreibung um Ergebnisse, Quellen und offene Nachweise.

Die Bestandsaufnahme ordnet alle neun Bereiche bestehenden Skills und K1–K8 zu. Das Evaluationsdesign definiert Baseline, Metriken, getrennte Splits, Client-Capabilities und die Korrekturvorschläge zu B06/B10. Keine Skill-Kandidaten optimieren, keine Lernexperimente ausführen und SL2–SL7 noch nicht beginnen. Abschluss dieser ersten Ausführung ist das Review der zwei Artefakte; danach wird der nächste begrenzte Abschnitt festgelegt.

## Gesamtziel der Forschungsreihe

Erarbeite über SL0–SL7 eine belegte, umsetzbare Spezifikation für eine vollständig aufeinander aufbauende, projektagnostische Skill-Library als Kernfähigkeit von Sidekick. Skills bilden ein versioniertes Prompt- und Verhaltensframework: auswählbar, kombinierbar, prüfbar und anhand geeigneter Erfahrungen optimierbar.

Die späteren Pakete zeigen an einem kleinen durchgängigen Fall, wie ein Auftrag passende Skills nutzt, Ergebnisse weitergibt, eine Unterbrechung übersteht und überprüftes Feedback einen besseren Kandidaten hervorbringt. Daraus entsteht ein kleiner Implementierungsauftrag. Das ist das Ziel der Forschungsreihe, nicht der Auftrag für eine einzelne Sitzung. Erfinde keinen Lernerfolg.

## 1. Was jetzt vorgegeben ist

**Owner-Vorgabe:** Die Library lebt innerhalb von Sidekick und ist eine Kernfähigkeit der Anwendung. Die bisherige Empfehlung eines separaten Produktrepos im Clean-Room-Plan ist damit überholt. Portable Pakete und austauschbare Optimierungsadapter bleiben erwünscht.

„Im Kern“ bedeutet: Skills sind erstklassige Produktobjekte mit Version, Verträgen, Ausführungsbezug und Evaluationshistorie. Ob dazu eine eigene Engine nötig ist und wie viel deterministischer Code erforderlich wird, ist Forschungsgegenstand. Skills verleihen keine Rechte. Der transaktionale Hub-Kern für Auftragsvertrag, Journal und Wirkungstore bleibt maßgeblich.

„Aufeinander aufbauend“ bedeutet eine explizite, kompatible Komposition. Es bedeutet nicht, alle Skills gleichzeitig zu laden oder aus jedem Skill unkontrolliert weitere aufzurufen. Die bestehende Regel gegen implizite Skill-Kaskaden bleibt bis zu einer geprüften Laufzeitspec gültig.

Dieser Auftrag autorisiert Recherche, eigene Specs, synthetische Fixtures und Vorschläge im PR. Er ist kein Auftrag zur sofortigen Installation aller Kandidaten, zum produktiven Selbsttraining, Deployment oder Merge. Neue Dependencies und externe kostenpflichtige Läufe werden mit konkretem Versuch und Budget zur Entscheidung vorgelegt. Unabhängige Recherche läuft weiter.

### Priorität und Verhältnis zum MVP

Bei knapper gemeinsamer Arbeitszeit haben blockierende Hub-P0-Prüfungen zu Paperclip/OpenHands und der Claude-Anbindung Vorrang. Der nächste begrenzte Library-Auftrag umfasst SL0/SL1 mit vorhandenen Artefakten; dafür werden weder P0-Pakete als erledigt erklärt noch zusätzliche Installationen vorausgesetzt. Priorität und Ergebnisse dieses Plans werden hier gepflegt, nicht in AGENTS.md.

SL2–SL7 bleiben Teil des vollständigen Forschungsumfangs und werden erst nach Review des SL0-/SL1-Ergebnisses in begrenzten Folgeaufträgen bearbeitet. Eine Unterbrechung beendet den Gesamtauftrag nicht; sie hinterlässt den nächsten überprüfbaren Schritt.

Dieser Rechercheplan erweitert die V1-Abnahme nicht. Sie richtet sich nach der dazu reviewten Spec und deren Contract-Tests. V1 kann die vier vorhandenen Skills unverändert nutzen; die lernbare Library ist das Produktziel für spätere geprüfte Schritte, keine neue Voraussetzung für den ersten funktionierenden Hub-Ablauf.

## 2. Ausgangslage und Wiederverwendung

Vorhanden sind vier Skills unter `.agents/skills/`: grilling, researching-repositories, planning-work-packages und reviewing-decision-gates. Claude-Zugänge liegen als Symlinks unter `.claude/skills/`; optionale Client-Metadaten erlauben implizite Auswahl. Eine funktionierende Auswahl im konkreten Client muss dennoch gemessen werden.

Die Evaluationsfälle in `docs/research/skill-evaluation.json` und `grilling-evaluation.json` sind ein Startpunkt, kein Nachweis ausgeführter Live-Tests. Prüfe vor Nutzung insbesondere B06 (Pausenereignis fehlt) und B10 (neue Fragen nur bei echter neuer Lücke). Der Grilling-Skill enthält noch projektgebundene Ablagehinweise; das gehört in lokale Konfiguration statt in portable Anleitung.

Die zwölf vorhandenen Dossiers und die [Web-Gegenprüfung](web-recherche-2026-10-30.md) zuerst nutzen. Nicht zwölf Untersuchungen neu beginnen. Für jede neue Behauptung Quelle, Lesedatum, tatsächlichen Commit und Evidenzstufe erfassen. Stände nach diesem Planungscommit beim Start abgleichen.

## Aktualisierter Abgleich nach dem Review

Gelesen am 30.10.2026: main `38333a40c5287de034a3fe1d84bd869bffb7ebf0`, nach Merge von PR #9. Offener Nachbar-PR: [#8 – V0-Spec](https://github.com/netzkontrast/sidekick/pull/8), aktuell geprüfter Kopf `02a175c715c52812a403e0fd7fba2e0f7670ac99`. Änderung gegenüber dem ersten Plan: fünf Folgecommits von PR #8 über Dateivergleich geprüft; der V0-Spec-Text und der Fragenindex sind gegenüber dem zuerst gelesenen Stand unverändert. Beim Ausführungsstart erneut abgleichen.

- **Neu in main:** [UI-Synthese](../ui-synthese.md). Sie verlangt eigene Bedienmuster für Rückfragen, Freigaben und unklare Ausgänge sowie getrennte Skill-Discovery-/Wirkungsnachweise. Es sind Dokumentenbefunde und Designhypothesen; keine Usability-Tests. Die private Canvas wurde für diesen Plan nicht geöffnet und wird nicht als geprüfte Quelle behandelt.
- **V0 liegt als Entwurf in PR #8 vor:** Begriffe, elf Invarianten, Zustandsautomaten, fünf Schemas und Fallmatrix `V0-FALL-01…17` sowie `V0-ABL-01`. Vorhandene Vertragsbegriffe und Fixtures als Ausgangspunkt prüfen; keine konkurrierende Library-Auftrags-/Effekt-/Erinnerungswelt erfinden. Bis Merge/Review bleiben sie Vorschläge.
- **Dort dokumentierte Owner-Antworten:** Kontinuität mit Vertrag/Journal/Tor, lokale Inferenz und Offline-Frontend im Schema vorsehen, erster Ablauf `research-report`. Der Fragenindex steht noch auf `awaiting_confirmation`; vorhandene Antworten respektieren, keine erneute Interviewrunde nur wegen dieses Plans auslösen.
- **Überschneidungen:** PR #8 bearbeitet Tore A–D und den Hub-Plan. Änderungen dieses PRs nur additiv einbringen, beim späteren Merge Sachstände zusammenführen. V0 nicht erneut schreiben und hier keinen Status von V0/V1 auf abgeschlossen setzen.

- **PR #11 ist ebenfalls offen:** [Owner-Entscheidungen](https://github.com/netzkontrast/sidekick/pull/11), Kopf `de8e6ae1023634998f992d8656a48d168563a152`. Er dokumentiert Claude Code als erste echte Runtime, die Fake-Runtime für Vertragstests und den Verbleib aller Arbeit im Repo. Sein Owner-Abschnitt wurde gelesen; dieser Plan schreibt ihn nicht parallel neu. Der Library-Discovery-Eintrag wurde aus Tor B in SL1/SL3 verlagert.
- **Integrationsreihenfolge:** Für die vollständige Integration PR #8 vor PR #10 bevorzugen; PR #11 und #10 können danach in beliebiger Reihenfolge integriert werden, wenn der zweite die gemeinsamen Dateien abgleicht. SL0/SL1 können die offenen Entwürfe schon prüfen; SL7 darf keinen ungeprüften Spec-Entwurf als verbindlichen Vertrag voraussetzen. Dieser Auftrag mergt keinen dieser PRs.

Folgerung: Die Library baut auf der entstehenden V0-Domäne auf. E2 verwendet den Rechercheablauf und seine Vertragsfälle; E3 prüft Skill-Kandidaten als Artefakte mit denselben Wirkungstoren.

Zusätzliche unabhängige Quellenprüfung am 30.10.2026: [Bericht und Prüfmanifest](../../docs/research/skill-library-primaerquellen-2026-10-30.md). SL1 trennt jetzt öffentliche Pflichtregressionen vom Holdout, präzisiert Runtime-Beobachtbarkeit und führt den 40-Läufe-Rahmen als Diagnosepilot ohne versprochenen E3-Lernerfolg. SL0/SL1 bleiben Entwürfe zur Review; kein Clientlauf wurde durch diese Gegenprüfung ausgeführt.

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
| **SL0 Bestand und Verträge** | abgenommen (Owner-Merge PR #10): [library-inventory.md](library-inventory.md) | Dieser Auftrag | `library-inventory.md`: vier Skills, bestehende K1–K8/WEB-IDs, neun Bereiche, Lücken und Abgrenzungen | Jeder Bereich zugeordnet; vorhandene Ergebnisse wiederverwendet; Client- und App-Discovery getrennt |
| **SL1 Forschungsbaseline** | abgenommen (Owner-Merge PR #10, nach Review überarbeitet): [library-evaluation-design.md](library-evaluation-design.md) | SL0 | `library-evaluation-design.md`: Fälle, Splits, Metriken, Versionierung, Budgetvorschlag | Positive/negative Trigger, Verhalten, Rechte-/Antwortregeln und Komposition enthalten; Widersprüche B06/B10 geklärt; Repo-Discovery, App-Auswahl, Komposition sowie Tool-/AskUser-Capabilities getrennt beschrieben |
| **SL2 Bereichsrecherche** | geliefert (Owner-Auftrag `/goal` „Skills finalisieren“, 30.10.2026): neun `area-*.md`. Umgesetzt: A01–A04 *geändert* (Beschreibungen unverändert als Auswahl-Baseline), A05–A08 als neue Skills *ergänzt*, A09 *zurückgestellt* bis Review des Erinnerungsvertrags; deterministische Anteile an SL7 übergeben | Review von SL0/SL1; Versuche nach dessen Design | Neun `area-*.md`, ergänzte Dossiers nur bei Auswahlbedarf | Für A01–A09 Fragen, Quellen, Minimalversuch und begründete Umsetzungskategorie vorhanden |
| **SL3 Kompositionsvertrag** | abgenommen (Owner-Merge PR #12, [A-20261030-sl-entwurfsabnahme](../../docs/fragen/skill-library/questions/Q-20261030-sl-entwurfsabnahme.md)): [library-composition.md](library-composition.md); offene Punkte O-1…O-7 dort | SL1 und relevante SL2-Befunde | `library-composition.md`: Datenmodell, Schichten, Versionen, Übergaben, Fehler- und Offline-Verträge | Ein vollständiger Beispielablauf plus Ablehnung von Zyklus, falscher Ausgabe und inkompatibler Version; Anforderungen gegen K1–K8 rückverfolgbar |
| **SL4 Lernvertrag** | abgenommen (Owner-Merge PR #12, [A-20261030-sl-entwurfsabnahme](../../docs/fragen/skill-library/questions/Q-20261030-sl-entwurfsabnahme.md)): [library-learning.md](library-learning.md); E3 danach ausgeführt ([Ergebnis](e3/E3-ergebnis-2026-10-30.md)) | SL1/SL3 | `library-learning.md`: Inhalts-/Auswahl-/Kompositionsoptimierung, Datenwege, Aktivierung und Rücknahme | Kandidat verändert aktive Library nicht; Testsatz bleibt unabhängig; Grenzen von Modelltraining klar |
| **SL5 Minimalnachweise** | Diagnosepilot ausgeführt (38 von ~40 Starts): [C0/E1-Auswahl](eval-runs/C0-E1-ergebnis-2026-10-30.md) – Auswahl 8/10 positiv, 2/2 negativ; [E1-Verhalten, E2, M4](eval-runs/E1V-E2-M4-ergebnis-2026-10-30.md) – Verhalten R 19/20, Komposition R 10/11, 0 Verstöße gegen harte Regeln, M4 B1 besser in 4 von 6 Paaren (0 schlechter) bei rund 2,3-fachen Kosten. Modellurteile; menschliche Stichprobe und E3 (eigenes Budget) offen | SL1–SL4, notwendige Zugänge | `library-experiments.md` mit Rohartefaktverweisen und tatsächlichen Befehlen | Drei unten beschriebene Versuche ausgeführt oder jeweils konkrete Blockade dokumentiert; keine simulierten Erfolgszahlen |
| **SL6 Synthese und Entscheidungen** | abgenommen (Owner-Merge PR #12, [A-20261030-sl-entwurfsabnahme](../../docs/fragen/skill-library/questions/Q-20261030-sl-entwurfsabnahme.md)): [Synthese-Fortschreibung](synthese.md), [Clean-Room-Stand](clean-room-plan.md), Befund Tor B, offene Punkte Tor A/D; nichts entschieden | SL2–SL5 | Bestehende `synthese.md` und `clean-room-plan.md` fortschreiben; passende Tore A/B/D aktualisieren | Jede Anforderung belegt oder eigene Vorgabe; Empfehlung gegen Status quo; keine doppelten Backlogs |
| **SL7 Implementierungsübergabe** | abgenommen und umgesetzt: [Spec Skill-Library V0](../../docs/spec/skill-library-v0.md) (PR #12); Stufe 1 Werkzeuge (PR #14) und Stufe 2 Eval-Harness (PR #15) gemergt, Node ohne Dependencies, 105/105 Tests | SL6 | Eigene ergänzende Spec unter `docs/` und kleiner erster Implementierungsauftrag; PR #8s Spec-Konventionen nach Review/Merge übernehmen | Ausgangsstand, Inputs, Kriterien, Tests, offene Fragen und Rücknahme enthalten; Forschungsbelege nicht als Laufzeitgarantie verkauft |

Reihenfolge: SL0 → SL1 → Review → SL2 → SL3 → SL4 → SL5 → SL6 → SL7. Unabhängige Quellenlektüre innerhalb SL2 ist möglich; dieser Plan verlangt keine Subagents. Eine vorhandene, belegte Antwort wird übernommen statt erneut erzeugt.

In SL0 zunächst alle neun Bereiche inventarisieren; die eigentliche Bereichsrecherche folgt nach Review in SL2. Danach entscheidende Lücken vertiefen. Kein generisches Framework implementieren, bevor Vertrag und Baseline stehen. Keine Aufwands-/Kostenersparnis vor Messung zusagen.

### 8.1 Phase 2: Portierung (P0–P12) und laufende Messrunden

Owner-Auftrag 31.10.2026 (Chat): „pick something incredible from each repo“ und „improve grilling“. Owner-Entscheidungen zu Reihenfolge, Budget (~60 Starts für P6–P10), P9 und P12: [R-20261031-port-runde1](../../docs/fragen/skill-library/rounds/R-20261031-port-runde1.md). Inhalt, Begründung und Abnahme: [Portierungsplan](portierungsplan-2026-10-31.md). Status nur hier.

| Paket | Highlight (Repo) | Status |
|---|---|---|
| P0 | Konfigurationsschutz in `eval prepare` vervollständigen (Befund aus AHP/C2P-Recherche) | umgesetzt in PR #21 (116/116 Tests) |
| P1 | Belegpflichtige Gutachten, `eval judge check` (skills-optimizer) | in Umsetzung (P1–P3 gemeinsam); Prototyp: [Zitatprüfung](e3/zitatpruefung-2026-10-31.md) (101/101 bei K-MELDEN, 66/83 bei M4) |
| P2 | Gegenkriterium und Nulllauf-Trennschärfe (automatic_prompt_engineer), dazu B1-Vorlauf in E3-Select (freigegeben, [A-20261031-e3-b1-vorlauf](../../docs/fragen/skill-library/questions/Q-20261031-e3-b1-vorlauf.md)) | Befund: Nulllauf besteht 20/31 grilling-Prüfungen ([Korrektur](grilling-runde/dev-ergebnis.md)); Umsetzung geplant |
| P3 | Gepflanzte Erwartungsbefunde mit 1:1-Zuordnung (skill-optimization, nur Konzept) | geplant |
| P4 | Kostenbilanz je Kontextklasse × Turns (skill-cost-optimizer) | geplant |
| P5 | `cite-check` mit Segmentregister (recursive-decomposition-skill) | geplant |
| P6 | Ausgabevertrag mit inhaltlich geprüften Pflichtblöcken, researching-repositories (dspy-advanced-prompting) | geplant; E3-Kandidat |
| P7 | grilling K-LADESTUFEN: Einstiegsweiche Neuanlage/Fortsetzung (prompt-engineering-skill) | Diagnose geliefert ([dev](grilling-runde/dev-ergebnis.md)); Kandidat geplant |
| P8 | grilling K-RUECKWAERTS: Rückwärtsabgleich vor der Zusammenfassung (prompt-architect) | geplant |
| P9 | `questions`-CLI mit Index als Projektion (claude-prompts-mcp) | freigegeben mit eng begrenzten Rechten ([A-20261031-p9-questions-cli](../../docs/fragen/skill-library/questions/Q-20261031-p9-questions-cli.md)); geplant |
| P10 | Rechteprofil je Lauf mit Kanarienfall (agentic-harness-patterns, nur öffentliche Doku) | geplant |
| P11 | Fail-closed `context-pack` (code2prompt) | geplant |
| P12 | Kern-Spec: Budget-Vorwarnung und Rückwärtsabnahme am Tor (meta-prompting, prompt-architect) | geplant; Owner-Review der V0-Spec |
| E3-2 | K-BELEG, K-WEGE (aus dem Tiefenabgleich) | abgeschlossen: beide **verworfen, kein Vorteil** (Select schlechter, B1 erfüllt den Kern bereits); Abbruch vor Test, 8/30 Starts; Testfamilien ungelaufen ([Ergebnis](e3/runde-2/E3-2-ergebnis-2026-10-31.md)) |
| DR | Deep Research Intent Capture, Interviewtechnik, Tree of Thoughts für grilling | läuft |

## 9. Drei spätere durchgängige Versuche (SL5)

SL1 entwirft diese Versuche; ausgeführt werden sie erst in SL5. Für spätere Kandidatensuche sind Baseline, Rubrik und Entwicklungs-/Auswahldaten vorher versioniert festzuhalten. Eine getrennte Review-Person oder -Session prüft das Evaluationsdesign; eine neue Session allein beweist keine Unabhängigkeit. Finale Testinhalte bleiben vom Optimierungsprozess getrennt. Ein Autor bewertet seine eigenen Varianten nicht als alleiniger unabhängiger Nachweis.

**E1 – Auswahl und Interview:** vorhandenes Grilling unverändert als Baseline. Frische Client-Sessions mit passenden und unpassenden Aufgaben; danach getrennt Verhalten bei Teilantwort, Korrektur und fehlendem Tool prüfen. Erfassen: sichtbare Discovery, Auswahl, gespeicherte Antworten, unnötige Nachfragen, Usage soweit verfügbar. Fehlende Observability nicht durch Vermutung ersetzen.

**E2 – Komposition und Übergabe:** an PR #8s `V0-ABL-01` angelehnter synthetischer Rechercheauftrag mit einer echten Entscheidungsunklarheit; Klärung → Quellenbefund → kurze Spec → Paket → Gate-Review. Nach einem Schritt unterbrechen und Ausgangsartefakt ändern. Eine zweite Session muss mit aktueller Version fortsetzen. Einen Schritt zusätzlich einzeln vergleichen; Artefaktübergaben und Fehler lokalisieren.

**E3 – Ein Lernschritt:** Aus ausschließlich freigegebenen synthetischen Entwicklungsfällen genau eine Änderung an einem Skill oder seiner Auswahlregel vorschlagen. Baseline, Rubrik und Runtime konstant halten; eingefrorenen Auswahl-/Testsatz beachten. Kandidat evaluieren, Aktivierungs-/Rücknahmeablauf im Testbestand durchspielen. Auch „kein Vorteil“ ist ein gültiges Ergebnis. Zunächst keine produktive Selbständerung und kein Fine-Tuning erforderlich.

Ohne Live-Client oder Budget: Schemas, deterministische Fixtures und ein ausführbares Versuchsprotokoll liefern; Live-Auswahl, Qualitätsvergleich und Lernerfolg bleiben ausdrücklich offen. Diese Blockade darf Quellenrecherche und Spec nicht stoppen.

## 10. Konkreter Startauftrag für Claude

1. Branch dieses PRs übernehmen; neuesten main-Stand und insbesondere PR #8 auf Überschneidungen prüfen. Falls V0 inzwischen gemergt ist, dessen Specs und synthetische Fixtures verwenden. Keine fremde Arbeit überschreiben.
2. AGENTS.md und diesen Plan lesen, vorhandene Synthese und vier Skill-Pakete prüfen. SL0 bearbeiten, nur dessen Status hier aktualisieren.
3. SL1 als erstes prüfbares Ergebnis liefern. Quellstände, Annahmen und Messplan belegen. Keine neun Bereichsberichte und keine SL5-Experimente in diesem ersten Auftrag erstellen.
4. Offene Präferenzen mit dem Grilling-Ablauf und einem verfügbaren nativen AskUser-Werkzeug klären. `docs/fragen/` nutzen. Technische Fakten selbst recherchieren. Bereits vorgegeben ist der Ort innerhalb Sidekicks; diese Frage nicht erneut stellen.
5. Konkrete offene Entscheidungen: Reichweite der ersten Version, zulässige Feedbackdaten, Aktivierungsbefugnis, externe Laufbudgets und Dependencies. Nur jeweils tatsächlich blockierende Punkte fragen; unabhängige Arbeit fortführen.
6. Nach SL0/SL1 den Stand samt Artefaktverweisen zur Review vorlegen. SL2–SL7 auf geplant belassen; keine automatische Weiterführung in derselben Sitzung. Bei Unterbrechung Paketstand und genau nächsten Schritt hier sichern; keine neue NOW-/Statusdatei anlegen.
7. PR-Beschreibung um tatsächliche Befunde und Checks aktualisieren. Klar trennen: Plan, recherchiert, lokal getestet, im Client gemessen und nicht ausgeführt. Nicht selbst mergen.

## Abnahme der ersten Ausführung (SL0/SL1)

- Bestandsaufnahme deckt vier vorhandene Skills, neun Bereiche und K1–K8/WEB-Verweise ab; sie berücksichtigt offene PRs ohne deren Aussagen als entschieden auszugeben.
- Evaluationsdesign trennt Discovery, Auswahl, Verhalten und Komposition sowie Entwurfs-, Auswahl- und Testdaten. B06 erhält einen expliziten Pausen-/Abbruchauslöser; B10 verlangt eine belegte neue Lücke statt automatisch weitere Fragen.
- Metriken, Versionsbindung, Rohresultatformat, Client-Capability-Nachweise und Ressourcenbedarf sind als prüfbare Vorschläge vorhanden.
- Review kann das Design bestätigen oder begründet ändern, bevor Kandidaten oder Ergebnisse entstehen. SL0/SL1 werden erst mit tatsächlichen Artefaktbelegen als abgeschlossen geführt; SL2–SL7 bleiben bis zum Review geplant.
- Es wird kein Baseline-Score, kein Tokengewinn und kein Lernerfolg behauptet, solange die dafür nötigen Versuche nicht ausgeführt sind.

## Definition of Done der gesamten Forschungsreihe

- Alle neun Bereiche haben begründete Empfehlungen; ein fehlender neuer Skill ist kein Fehler, sofern die Fähigkeit sinnvoll anders abgedeckt ist.
- Der Zusammenhang von Basisfertigkeiten, Komposition, Auswahl und Lernschleife ist spezifiziert und anhand eigener Fixtures prüfbar.
- Die existierenden K1–K8/WEB-Anforderungen sind zugeordnet, ergänzt oder mit Begründung verworfen; kein zweites unverbundenes Framework.
- Token-/Kontextkosten, Datenschutz, Offline-Fähigkeit, Modell-/Clientbindung und Rechte sind explizit behandelt.
- Drei Experimente haben echte Rohbelege oder konkrete begründete Blockaden. Nicht ausgeführte Experimente erfüllen keinen praktischen Nachweis.
- Der Abschluss unterscheidet **recherchierbar/spezifizierbar** von **praktisch bestätigt**. Für jeden blockierten Pflichtnachweis stehen Owner, benötigter Zugang und nächster Versuch fest.
- Claude kann aus dem Ergebnis einen kleinen ersten Implementierungs-PR beginnen, ohne die gesamte Recherche neu zu interpretieren.
