# DSPy für Sidekick – Integrationsplan entlang des Buches

> 31.10.2026 · **Planungsentwurf, keine Installation oder Aktivierung.**
> Auftrag: das Begleitrepo zu *Context Engineering with DSPy* lesen und Sidekicks Ausbau mit DSPy planen.
> Sidekick-Basis: `d0da7b1a2321dfef5949ec6b4f7b580ba9244f00` (PR #30).
> Buch-Begleitrepo: `92d97caf59d8d09b14d9cfe89d12fce3b9efc38c` (aktuelles `main`, geprüft 31.10.2026).
> Gelesen wurden Begleitcode, ausgewählte Notebook-Zellen und Erläuterungen, nicht der vollständige Buchtext.
> Status dieser Pakete ausschließlich im [Library-Research-Plan](library-research-plan.md); Hub-Status im [Hub-Plan](../agent-hub/operations/PLAN.md).

## 1. Ziel und Empfehlung

Sidekick soll aus bewerteten Arbeitsergebnissen bessere **Skill-Texte, Auswahlentscheidungen und Kontextprogramme** gewinnen.
DSPy übernimmt dafür deklarierte Modellprogramme und ihre Optimierung. Ergebnisse sind versionierte Kandidaten, die durch die
bestehende Evaluation und Aktivierung gehen. **Vertrag, Journal und Freigabetor bleiben deterministisch.**

Die Empfehlung erweitert den bisherigen Ansatz aus PR #31: Messverfahren allein nachzubauen schöpft den neuen Auftrag nicht aus.
Wir planen zusätzlich einen isolierten Python-Adapter mit DSPy/GEPA als echte Optimierungswerkstatt. Der Node-Harness und
bestehende Claude-Code-Skills bleiben weiter verwendbar. Zunächst wird nur **ein** Ziel optimiert: `grilling` bei der Arbeit
mit der bereits integrierten `questions`-CLI. Hier gibt es prüfbare Zustandsregeln und eine konkrete offene Nutzenfrage (QO-1).

Das erste Ergebnis ist ein Kandidat, der dieselbe Arbeit verlässlich mit geringerem Gesamtaufwand erledigt – oder ein dokumentiertes
Nullergebnis. Ein kürzerer Prompt, gültiges Ausgabeformat oder hoher selbst vergebener Score reichen nicht.

## 2. Aktueller Stand und bestehende Arbeiten

Auf `main` vorhanden: acht Skill-Pakete; Paket-/Registry-/Hashprüfung; Rubriken; Split- und Start-Ledger;
Belegprüfung; Nulllauf; Dateiprüfungen; Befund-/Zitatprüfung; Kontextpakete; Kostenbilanz; Fragen-CLI;
V0-Datenverträge. Nach PR #30: 214 Node- und 14 Research-Tests. Diese Zahlen sind der bisherige Stand, keine neuen DSPy-Tests.
Eine Hub-Produktlaufzeit fehlt. Ein funktionierendes Modell-/Toolprogramm ersetzt die noch offenen Tore A–D nicht.

Laufende Nachbararbeiten, beim Lesen offen:

| Arbeit | Nutzen für diesen Plan | Umgang |
|---|---|---|
| [PR #31](https://github.com/netzkontrast/sidekick/pull/31), AP1 | Buch-/AFS-Dossiers und Herkunft | wiederverwenden; Buchstand aktualisieren, kein zweites Dossier anlegen |
| [PR #32](https://github.com/netzkontrast/sidekick/pull/32), AP2 | Runtime-Adapter-Vertrag | Harness-Anbindung daran ausrichten; keine zweite Runtime-Spec |
| AP3 aus #31 | gepaarte Statistik, Kostenobergrenze, Positionskontrolle | Voraussetzung D1; vorhandenen Arbeitsauftrag ergänzen |
| AP4 aus #31 | eigene AGENTS.md-Fallfamilie | nach erstem Skill-Pilot verwenden, nicht parallel dieselben Fälle erfinden |
| AP5 aus #31 | Kontextverdichtung und Trajektorien-Prüfung | in D6/D7 wiederverwenden |
| SL3 / SL4 | Komposition, Lernvertrag und Aktivierung am Hash | verbindliche Leitplanken; neue Dimensionen ausdrücklich spezifizieren |

Der neue Plan rechtfertigt weder Installationen aus Quell-READMEs noch Modellstarts. Dependencies, Ausführungsort und Budget
werden vor der jeweiligen Ausführung konkretisiert. Der Auftrag verlangt jetzt Planung, keinen kostenpflichtigen Versuch.

## 3. Was der neuere Buchstand verändert

Das offene AP1-Dossier referenziert `a633241…`. Seitdem hat das Begleitrepo einen großen Abgleich mit dem gedruckten Buch erhalten.
Am gelesenen neuen Commit gibt es 346 versionierte Dateien und 58 Notebooks; die alte Zahl 771 gehört zum früheren Stand.
`BOOK_NOTES.md` erklärt Abweichungen zwischen gedruckten Listings, ausführbaren Zellen und gespeicherten Experimenten [B0].

| Befund | Evidenz | Konsequenz für Sidekick |
|---|---|---|
| Kapitel 6 verwendet einen gehashten, paarweise getrennten Datensatz; gespeicherte Resultate sind ohne neue Inferenz prüfbar | Code gelesen; Hash, 300 Zeilen und disjunkte Splitgruppen lokal geprüft [B4] | eigene Familien vor der Optimierung trennen; bestehende Gruppenlogik erweitern |
| Baseline 43/80, GEPA 64/80, COPRO 45/80, SIMBA 38/80 | Zähler aus gespeicherten Vorhersagen lokal nachgerechnet [B4] | GEPA ist ein Kandidat; keine pauschale Überlegenheit aller Optimizer. COPRO 50 % aus dem alten Dossier ist am neuen Stand überholt |
| Der KI-Detektor-Test ist bewusst schwierig für die Baseline ausgewählt | im README offengelegt [B4] | diese Steigerung nicht als Prognose für Sidekick verwenden; zusätzlich repräsentative, unverzerrte Familien brauchen |
| Die gespeicherten Vergleichsprogramme stammen teilweise aus DSPy 3.2.1, GEPA aus 3.3.0 | Ergebnisdokumentation [B4] | gleiche Version und Modelle im eigenen Vergleich; Konfigurationen nicht nachträglich mischen |
| Kapitel 11 verwendet `gepa.optimize_anything` für freien Skill-/AGENTS.md-Text | Notebook-Code gelesen [B7] | freier Text braucht einen Blackbox-Evaluator; `dspy.GEPA` kompiliert nicht automatisch eine SKILL.md-Datei |
| AGENTS.md-Notebook optimiert und bewertet dieselben 20 Fälle; aktueller Compile-Deckel 80 Metrikaufrufe | Zellen 13/14 gelesen [B7] | Muster übernehmen, Messdesign mit eigenem Holdout verbessern; frühere Beschreibung eines 3-Aufrufe-Smokes gilt dort nicht mehr |
| Kapitel 5 liefert 50 illustrative Labels, keine dokumentierten menschlichen Gutachten | Notebook-Anmerkung gelesen [B3] | keine künstlichen Labels als menschliche Kalibrierung ausgeben |
| Kapitel 10 exportiert Nachrichten eines Aufrufs; Adapterwechsel verändert die Darstellung | Zellen 18–26 gelesen [B6] | ein Verlaufseintrag ist noch kein allgemeiner Export einer mehrstufigen Pipeline |

Die Zahlen belegen vorhandene Artefakte des Begleitrepos. Es gab hier **keinen neuen Modelllauf** und keinen Nachweis einer
Wirkung auf Sidekick. Buch-Modellnamen bleiben in Quellenbelegen unverändert; für eigene Versuche werden tatsächlich verfügbare
und zulässige Modelle separat gewählt und protokolliert.

## 4. Kapitel für Kapitel: was Sidekick daraus baut

Die Kapitel geben die Lernreihenfolge vor. Die Umsetzung wird nach messbarem Nutzen geschnitten, nicht nach Notebook-Anzahl.

| Kapitel | Prinzip / gelesener Einstieg | Konkrete Nutzung | Paket und Abnahme |
|---|---|---|---|
| 1 – Introduction to Context Engineering | Aufgaben als Signaturen statt freier Platzhaltertexte | explizite Ein-/Ausgaben für Skill-Auswahl, Klärungsplan, Befunde und Übergaben; keine Rechte in Signaturen | D0: Zuordnung zu Sidekicks bestehenden Artefakttypen |
| 2 – Introduction to DSPy | `Signature`, `Predict`, `Example`, `Module`, Router | schlanke native Programme; Datenfelder und erwartete Ausgaben trennen | D2: gleiche Eingabe durch unveränderte und optimierte Programmfassung |
| 3 – DSPy in Eight Steps | Aufgabe → Baseline → Daten → Metrik → Optimierung → Prüfung | ein vollständiger Versuch pro Hypothese; erst Messvertrag, dann Optimizer | D0–D4: reproduzierbarer Versuchsbericht statt Demo-Erfolg |
| 4 – Strategies for Collecting Datasets | Fehleranalyse und gezielte neue Beispiele | eigene deutsche Fälle aus synthetischen Situationen und freigegebenen Repo-Artefakten; Fehlerfamilien statt kopierter Texte | D1: unabhängige Familien, positive/negative Trigger und Referenzen |
| 5 – Evaluation Metrics | deterministische Metriken, kalibrierter Judge, Feedback je Prädiktor | vorhandene Prüfungen geben ID, Ist/Soll und Beleg als Optimierer-Feedback zurück | D1: absichtlich fehlerhafte Ausgaben fallen durch; Richter-Version bleibt im Versuch fest |
| 6 – Deep Dive into Prompt Optimizers | Few-shot-Baselines, GEPA, MIPROv2; Kosten und gesperrter Test | erst manuelle/Few-shot-Baseline, dann ein GEPA-Lauf; MIPROv2 nur als begründeter Folgevergleich | D3/D4: Endnutzen bei gleichen Modell-/Harness-Bedingungen |
| 7 – Custom Modules, Types, and Adapters | typisierte Ausgabe, mehrstufige Programme, JSON-/Markdown-Adapter | kleine Module mit validierten Übergaben; Darstellung vor der Optimierung festlegen | D2/D5: Parser und Renderer in Zielruntime geprüft; Flex vorerst zurückstellen |
| 8 – Building AI Agents | Retrieval, History, RLM, begrenzte Werkzeugschleifen | Retrieval/Kontextauswahl über zulässige Quellen; nachprüfbare Verdichtung; RLM erst bei nachgewiesenem Bedarf | D6: Quellen-/Korrekturerhalt bei geringerem Kontextaufwand |
| 9 – Real-World Use Cases | Recherche in Schritten, Rückbindung an Quellen, Trajektorienbewertung | query-plan → finding → Bericht; nicht nur Endtext, auch externe Werkzeugschritte/Belege prüfen | D7: fehlerhaftes Zwischenartefakt wird nicht still zu belegtem Wissen |
| 10 – Putting DSPy into Production | Speichern, Export, Serving, Tracing | gepinnte Programm-/Promptartefakte, Replay, Modellkonfiguration getrennt, Rücknahme | D5: getestete Fassung wird exakt geladen; keine privaten Rohtraces veröffentlichen |
| 11 – Optimizing Coding Agents with DSPy | freie Skill-Texte optimieren, AGENTS.md-Fälle, Skill-Discovery | realen Coding-Harness als Evaluator verwenden; neue Skills aus freigegebenen Fehlerclustern nur vorschlagen | D3/D4 zuerst; Discovery und AGENTS.md-Optimierung nach Pilot |

Bei Kapitel 7 bleibt die konkrete Python-Implementierung eines Ablaufs zunächst fest. `Flex` könnte sie ebenfalls optimieren [B5];
das würde Sidekicks bisherige Begrenzung auf eine geänderte Dimension erweitern und braucht einen eigenen späteren Vertrag.
Kapitel 8 legitimiert keinen automatischen Mem0-Import und keine Umwandlung alter Chat-Zusammenfassungen in bestätigtes Wissen.

## 5. Architektur: zwei getrennte Integrationspfade

### 5.1 Native DSPy-Programme

Ein kleiner Python-Bereich wird als austauschbarer Optimierungsadapter unter `research/` vorgeschlagen. Konkrete Pfade,
Ein-/Ausgabeschemas und Commands werden in D0/D2 spezifiziert; noch keine ausführbare API behaupten.
Der Node-Harness behält Baseline, Splitzugriff, Kandidatenprüfung, Belege, Ausgaben und Aktivierungsentscheidung.

| Vorgeschlagenes Modul | Eingaben | Ausgaben | Deterministische Grenze |
|---|---|---|---|
| `PlanClarification` | Auftrag, belegte Fakten, offene Entscheidungen | Fragenvorschläge, Abhängigkeiten, markierte Annahmen | kein `answer`, keine Zustandsänderung; `questions`-CLI prüft spätere Commands |
| `SelectSkills` | Aufgabe, zulässiger Metadatenkatalog | Skill-IDs oder `none`, knappe Begründung mit Referenzen | Capability-/Datenklassenfilter vor der Rangfolge; Status und Hash nachprüfen |
| `ExtractFindings` | Quellenabschnitte mit Commit-/Zeilenreferenzen | `finding`-Kandidaten samt Unsicherheiten | Fundstellenexistenz und Evidenzschema prüfen; Bedeutung separat bewerten |
| `BuildHandoff` | bestätigte Ereignisse und Artefaktreferenzen | Übergabevorschlag | V0-Übergabeschema; Budgetstand und autoritative Bindungen setzt der Kern |
| `SelectContext` | Aufgabe und bereits zulässige Belege | geordnete Referenzliste, Auslassungen | nur erlaubte IDs, feste Größenobergrenze, Pflichtregeln unverlierbar |

Das sind **Vorschläge für Programme**, keine fünf neuen Skills und keine neue Domänenwelt. Ein vorhandener Artefakttyp wird
wiederverwendet; fehlt ein Feld, wird dessen Ergänzung spezifiziert. `Predict` ist Ausgangspunkt; `ChainOfThought`, `Refine`,
`BestOfN` oder Ensembles kommen nur mit gemessener Wirkung und Gesamtkostenrechnung hinzu. Größere Aufrufzahlen sind kein Gratisgewinn.

`dspy.GEPA` optimiert später die benannten Prädiktoren eines solchen Programms anhand von Trainingsdaten und Feedback [B2/B3/B4].
Es schreibt weder das Journal noch Freigaben. Ein programmatischer Baseline-Router und `none` bleiben Vergleichsoptionen.
Ein gelerntes Capability- oder Rechtefilter wird nicht eingeführt.

### 5.2 Freie Skill-Texte im echten Harness

Für `.agents/skills/*/SKILL.md` folgt der Plan Kapitel 11: `gepa.optimize_anything` erzeugt Textkandidaten;
`dspy.LM` kann das Reflexionsmodell bedienen. Das ist die GEPA-Bibliothek mit einem externen Evaluator,
nicht der Compiler `dspy.GEPA` eines nativen DSPy-Moduls.

1. Node friert die Baseline samt Paket-/Quell-/Rubrikhash ein und stellt nur dev bereit.
2. Der Optimierer erhält die freigegebene veränderbare Textregion sowie minimierte dev-Fehlerberichte.
3. Ein neu spezifizierter Renderer erzeugt daraus eine exakte Ersetzung gegen den Snapshot.
4. `eval bind` prüft Baseline, eindeutige Fundstelle und Änderungsdimension. Geschützte Abschnitte werden zusätzlich verglichen.
5. Eine isolierte Arbeitskopie lädt den Kandidaten über die echten Skill-Mechanismen der Zielruntime.
6. Ein zum Runtime-Vertrag passender Runner startet Claude Code; die bestehenden Node-Prüfer liefern Resultate und Feedback.
7. Der Optimierer darf nur auf seinem internen dev/validation-Bereich wählen; die äußeren select/test-Familien erhält er nicht.
8. Export ist ein Kandidat plus Manifest, kein Schreiben in die aktive Library.

Das Notebook nutzt für seine Demo einen direkten LM-Aufruf mit Skill-Text als Systemnachricht. Diese Näherung genügt Sidekick
nicht: Skill-Discovery, Dateizugriffe, Permission-Regeln, Unterbrechung und CLI-Aufrufe müssen im realen Harness gemessen werden.
Ein nur in DSPy gemessener Textgewinn wird nicht auf Claude Code übertragen.

**Credential-Grenze:** Das Reflexionsmodell nutzt einen eigenen dokumentierten API-/lokalen Providerpfad. Claude Code läuft über
seinen erlaubten offiziellen Client. Ein Claude-Abo ist nicht automatisch ein DSPy-API-Zugang; keine Abo-Tokens extrahieren.
Fehlt ein Zugang, werden Replay und Offline-Prüfungen durchgeführt, Live-Wirkung bleibt offen.

### 5.3 Produktintegration nach dem Nachweis

Vorgeschlagene Datenstrecke:

`freigegebene Erfahrung → Fehlerfamilie → Optimierungsauftrag → Kandidat → gesperrte Evaluation → Owner-Aktivierung am Hash`.

Der Optimierungsprozess besitzt keine produktiven Grants, keinen Schreibzugang zur aktiven Library und keinen Zugang zum Test.
Das spätere Hub-Playbook behandelt Skill-Optimierung wie andere Arbeit. Sein Auftrag und Journal liegen im Hub;
der DSPy-Prozess meldet nur Artefakte, Usage, Fehler und Vorschläge. Bis V1 existiert, erfüllen PRs und der vorhandene Eval-Harness
manuell diese Rolle. Wir bauen dafür keine zweite Workflow-Engine.

## 6. Messvertrag vor dem ersten Versuch

### Daten und Splits

- Vor dem ersten Kandidaten eigene Ursprungsfamilien festlegen; Abwandlungen einer Episode bleiben zusammen.
- Bestehende E3-Testfamilien gelten als verbraucht. Veröffentlichte Buchaufgaben werden nicht zu Sidekicks Holdout.
- Der Optimierer sieht nur dev. Falls er intern Validation braucht, wird diese aus dev vorab getrennt.
  Sidekicks äußeres select wählt zwischen vollständig eingefrorenen Kandidaten; test bleibt bis danach gesperrt.
- Herkunft, synthetischer Status, Lizenz, Freigabe und Datenklasse je Fall festhalten. Private Rohsessions und zurückgezogene
  Erinnerungen sind keine Trainingsdaten. Ein bestätigtes Gedächtnisobjekt erteilt keine Trainingsfreigabe.
- B1-Vorlauf und Negativkontrollen fortführen. Eine perfekte Qualitätsbaseline schließt Kostenverbesserung nicht aus:
  Kostenkandidaten brauchen gleiche bestandene Prüfungen plus vorher festgelegtes Aufwandsziel.

### Metrik und Feedback

**Harte Regeln sind Vetos**, keine Gewichte in einer Mittelung. Unberechtigte Wirkung, angenommene Nutzerantwort,
veränderte Grants oder Zugriff auf gesperrte Daten schließen den Kandidaten aus, auch bei besserem Durchschnitt.

Danach getrennt berichten:

| Größe | Nachweis |
|---|---|
| Zustands- und Vertragsrichtigkeit | `eval check`, Fragen-CLI-Invarianten, Nulllauf und Mutationen |
| Inhalt/Quellen | `eval findings`, `cite-check`, passender Ausgabevertrag; Zitatgültigkeit beweist noch keine Stützung der Aussage |
| Nutzen der Klärung | entscheidungsrelevante Fragen, erhaltene Abhängigkeiten, keine unbelegte Tatsache aus Annahmen; eingefrorene Rubrik |
| Gesamtaufwand | Worker, Reflexion, Judges, Wiederholungen, Fehler und Nacharbeit; Usage gemeldet/geschätzt/unbekannt unterscheiden |
| Betrieb | Latenz, Turns, Cache-Regime, abgelehnte Tool-Aufrufe und Parserfehler |
| Unsicherheit | gepaarte Ergebnisse je Ursprungsfamilie, Cluster-Bootstrap; Wiederholungen nicht als unabhängige Familien zählen |

Ein Fehlerbericht nennt Fall-/Prüf-ID, beobachteten Befund, erwartete Bedingung und öffentliches Belegfragment.
Keine privaten Denktexte werden für Reflexion oder Training benötigt. Labels und erwartete Antworten werden nicht versehentlich
in `.with_inputs(...)` aufgenommen. `pred_name`/`pred_trace` können bei nativen Modulen Feedback gezielt zuordnen [B3].
Ein Judge darf die Wahrheit nicht aus dem Kandidatentext ableiten und seine Rubrik nicht während derselben Runde verändern.

Ein neuer menschlicher Labelsatz zur Judge-Kalibrierung ist eine **optionale, eigene** Arbeit. Der frühere Verzicht auf menschliche
Stichproben wird respektiert; er ist kein menschliches Kalibrierungsresultat. Ohne Labels bleibt der Judge als unkalibriertes
Modellurteil ausgewiesen. Kandidat und Richter werden nicht im selben Versuch gegeneinander angepasst.

### Vorgeschlagene Entscheidungsregel

Vor dem Lauf festlegen, nicht nach Sichtung der Ergebnisse: null harte Regelverstöße; keine Verschlechterung der kritischen
Zustandsfälle; auf unabhängigen Familien mindestens gleicher Nutzen; für den Kostenpilot als Ziel beispielsweise
**20 % weniger gemeldete Kosten je erfolgreich abgeschlossenem Fall**. Die 20 % sind ein Vorschlag, kein bestehender Beschluss.
Turns und Tokens erklären den Unterschied, ersetzen aber bei fehlenden Kostendaten keine Dollar-Einsparung.

Ein Pilot mit kleinen Fallzahlen kann die nächste Runde rechtfertigen, nicht eine allgemeine Zuverlässigkeitsgarantie.
Bei unklarer Unsicherheit oder Zielverfehlung bleibt die aktive Baseline bestehen. Auch die Erstellungskosten zählen:
Amortisationsfälle = Optimierungsmehrkosten / gemessene Einsparung je Fall, nur wenn diese positiv und bekannt ist.

## 7. Arbeitspakete und Reihenfolge

Die Abhängigkeitsfolge ist D0 → D1 → D2 → D3 → D4 → D5; D6/D7 folgen erst nach dem Pilot.
Ein Offline-Pilot kann vor fertigem V1 stattfinden; dessen Produktintegration wartet auf den Hub-Vertrag.
Alle folgenden Paketnamen und Ausgabepfade sind Planungsziele, keine bereits implementierten Befehle.

### D0 – Zielvertrag und Quellenstand (Kapitel 1–3)

- **Eingabe:** dieser Plan, SL3/SL4, AP1-Dossier und aktueller Buchcommit.
- **Ergebnis:** Ergänzung des bestehenden Dossiers auf `92d97ca…`; eigene Verhaltensspec für den Optimierungsadapter,
  zugewiesene Änderungsregionen, Schnittstelle zum Node-Harness, Modell-/Adapter-/Versionsmanifest.
- **Abnahme:** beide Pfade aus §5 unterscheidbar; `candidate` kann nicht aktiv werden; keine erfundenen Runtime-Fähigkeiten;
  Eingabe-/Ausgabetypen auf bestehende Sidekick-Verträge abgebildet.
- **Grenzen:** nur synthetische/public-Daten; AP2 bleibt Runtime-Vertrag. DSPy 3.3.0 und GEPA 0.1.1 sind der Referenzstand
  des Buches, nicht automatisch freigegebene oder neueste Dependencies. Installation später isoliert und gepinnt.
- **Nächster Verbraucher:** D1/D2. Noch keine Optimierung und keine neue Plugin-/Serviceinstallation.

### D1 – Daten, Metriken und Kosten (Kapitel 4–6; AP3/AP4 ergänzen)

- **Ergebnis:** eigene grilling-Familien, Fehlerklassen, geschützte R-Regeln, manifestierte Splits,
  Metrik→Feedback-Zuordnung; AP3 um atomare Kostenreservierung und Kostenstatus ergänzen.
- **Abnahme:** fehlendes/erfundenes Zitat, Empfehlung als Antwort, falsche Frageversion, vergessene Abhängigkeit,
  Pause/Frist und unerlaubte Dateischreibversuche werden als Fehler oder explizit unbekannt erkannt.
  Ein unberührter Arbeitsbaum besteht keine Erfolgsprüfung für erforderliche Arbeit.
- **Kosten:** vor jedem Worker-, Reflexions-, Judge- und Retry-Aufruf eine Obergrenze reservieren und danach abrechnen.
  Unsichere Providerpreise oder Kosten bleiben kenntlich; `max_metric_calls` begrenzt nicht alle Modellaufrufe.
  Eine API-Ausgabeobergrenze ist nur bei belastbar begrenztem Aufrufpreis hart erzwingbar.
- **Recovery:** Reservierungen bleiben nach Prozessverlust sichtbar; unklare Abrechnung wird nicht als null freigegeben.
  Der Thread-Lock des Buchbeispiels allein genügt nicht für mehrere Sidekick-Prozesse.
- **Nächster Verbraucher:** D2/D3. Die Qualitätsrubrik steht vor Kandidatensuche fest.

### D2 – Isolierte DSPy-/GEPA-Brücke und Offline-Prüfung (Kapitel 2, 7, 10, 11)

- **Ergebnis:** Python-Projekt mit minimalem Lockfile; keine vollständige Installation der rund 30 Buch-Dependencies.
  Ein nativer `Predict`-Pfad und ein Blackbox-Evaluator-Pfad mit einem eigenen synthetischen Dummy-Worker.
  Node bleibt für Status, Hash, Splitzugang, Rubrik und Prüfbericht maßgeblich.
- **Abnahme:** Schemafehler, falsche Baseline, mehr als eine Änderungsdimension und Schreiben außerhalb der Kandidatenablage
  werden abgewiesen. Ein Dummy-Lauf kann ohne API-Schlüssel vollständig bis zum Vergleichsbericht gelangen.
  JSON-Datensätze haben definierte Größenlimits, ID-Bindungen und Timeouts; kein freies Shell-Command-Feld.
- **Rechte/Daten:** Rückmeldung auf JSON-/Artefaktreferenzen begrenzen; getrennte Arbeitsräume für Autor und Auswerter,
  Kanarienzugriff auch für Bewerter/Fallautoren. Ein Kontextpaket allein erzwingt diese Grenze nicht.
- **Rücknahme:** Adapter deaktivieren; der bestehende manuelle Eval-Ablauf bleibt nutzbar.
- **Nächster Verbraucher:** D3. Offline-Tests beweisen nur den Datenweg, keinen Lernerfolg.

### D3 – Erster echter Skill-Versuch: grilling + questions-CLI (Kapitel 6 und 11)

**Hypothese:** Ein optimierter, begrenzter Hinweis auf die Fragen-CLI reduziert die Buchführung, ohne Antworten,
Abhängigkeiten, Konflikte und Pausen falsch zu behandeln.

- **B1:** heutiger freigegebener grilling-Text.
- **M:** ein manuell formulierter Hinweis auf die CLI als einfache Vergleichsänderung.
- **K:** von GEPA vorgeschlagene Fassung derselben veränderbaren Region.
- Alle Varianten erhalten denselben Toolkatalog, dieselbe Fragen-CLI und dasselbe Rechteprofil.
  Nur die Instruktionsregion ändert sich. Die Baseline darf die CLI ebenfalls verwenden; die Spur zeigt, ob sie es tut.
- Skill-Auswahlmetadaten bleiben gleich; dies ist ein Verhaltenstest, kein Discovery-Test.
- Die vollständigen Fälle laufen in der echten Claude-Code-Runtime. Das Reflexionsmodell darf nur minimiertes dev-Feedback sehen.
  In einer Umgebung ohne Claude-CLI wird der Versuch nicht durch einen direkten LM-Systemprompt simuliert.

**Vorgeschlagener Umfang für eine erste vollständige Runde:** 24 dev-Familien mit vorab getrennter interner Validation,
8 äußere select-Familien, 20 unabhängige test-Familien und 12 öffentliche kritische Regressionsfälle.
Nicht jede Variante läuft auf jedem Split:

| Teil | Begrenzung echter Harness-Starts |
|---|---:|
| GEPA-Suche inklusive ihrer internen Bewertungen | höchstens 40 |
| äußere Auswahl B1/M/K auf 8 Familien, ein Start je Variante | 24 |
| B1 gegen einen eingefrorenen Gewinner, 20 Familien × 2 Wiederholungen × 2 Varianten | 80 |
| Regression des Gewinners | 12 |
| Gesamt der vollständigen Runde | höchstens 156 |

Eine vorgeschaltete Smoke-Runde auf separaten dev-Fällen umfasst höchstens 8 zusätzliche Harness-Starts und
4 Reflexionsaufrufe. Für die vollständige Runde kommen höchstens 24 Reflexionsaufrufe hinzu.
Im Erfolgsfall bedeutet das bis zu 164 Harness-Starts plus Reflexion und gegebenenfalls separat gezählte Judges;
alle Dimensionen gehören ins Manifest. Ein schneller Optimierer-Deckel ist kein Versprechen, dass genügend Suchschritte möglich sind.

**Budgetvorschlag:** Smoke bis 5 USD, vollständige Runde bis weitere 60 USD, jeweils über alle beteiligten Modelle und Fehler.
Dies sind zu prüfende Obergrenzen, keine Kostenschätzung, kein Verbrauch und keine Ausführungsfreigabe.
Die früheren ~60 Starts für andere P-Pakete werden nicht dafür wiederverwendet. Bei zu teurer Preflight-Prognose Umfang reduzieren
und vor dem Lauf neu festlegen. Das Budget oder der Startdeckel darf ein Experiment jederzeit als unentschieden beenden.

**Abnahme:** valide Spuren und unveränderte Prüfungen; Nutz-/Aufwandsziel aus §6 erfüllt oder ausdrückliches Nullergebnis;
kein Kandidat außerhalb dev verändert; Kosten von Reflexion/Judges nicht unterschlagen.
Ein manueller Gewinner ist ebenso akzeptabel wie ein GEPA-Gewinner – die Library profitiert vom Ergebnis.

### D4 – Unabhängige Prüfung und Aktivierungsvorschlag (Kapitel 5, 6, 11)

- **Ergebnis:** gesperrter gepaarter Test nur für den ausgewählten Hash; rohe Prüfresultate, Familienstatistik,
  A/B-Reihenfolge kontrolliert, Belege nachgeprüft, Kosten/Fehler/Latenz und Amortisation.
- **Abnahme:** Kandidatenautor sieht keine Testdaten; Richter kennt keine Zuordnung; harte Regeln sind Vetos;
  Fehler bleiben im Nenner. Ein weiterer Kandidat nach Testeinsicht braucht neue Testfamilien.
- **Aktivierung:** ausschließlich bestehender Owner-Prozess am getesteten Paket-Hash, mit Revert und Beobachtungsfenster.
  Neue aktive Texte erfordern neue passende Rubrik-Bindungen in einem nachvollziehbaren Schritt.
- **Wichtig:** die äußeren select/test-Prüfer bleiben unverändert; ein optimierter Judge wird nicht mitoptimiert.

### D5 – Export und Hub-Anschluss (Kapitel 7 und 10)

- **Ergebnis:** versioniertes Bundle: Programmcode-Commit, Signature-/Adapterversion, Instruktionen, erlaubte Beispiele,
  Ausgabe-/Parservertrag, Schema, Skill-Hash, Evaluationsreferenzen und Kompatibilitätsmatrix.
- **Freier Skill-Text:** exportierter Patch entspricht exakt der geprüften Region; erneutes Binden ergibt denselben Pakethash.
- **Native Module:** Zustand als JSON auf eigene, gepinnte Modulklasse laden. Keine fremden Pickle-/Cloudpickle-Artefakte importieren.
  Python-Code und Dependency-Version gehören zum Manifest; ein JSON-Zustand allein enthält keine mehrstufige Programmlogik.
- **Prompt-Export:** Eingabeplatzhalter, System-/User-Rollen, Demos und Parser gezielt rendern. Eine einzelne letzte LM-Nachricht
  enthält nicht alle Schritte, Retrieval-Operationen oder Toolschleifen. Kein blindes Auslesen und Wiederverwenden von `history[-1]`.
- **Abnahme:** mindestens zwei verschiedene Eingaben pro Exportvertrag; keine eingefrorenen konkreten Beispielwerte;
  dieselbe Darstellung bei Training und Deployment. Struktur/Parser exakt prüfen, Verhalten in der Zielruntime erneut messen.
- **Hub:** erst mit V1/V4 als eigener kontrollierter Runtime-/Optimierer-Adapter. Optimierungsabbruch erhält Manifest und
  Kandidatenstand, setzt keine Freigabe; unbekannte Außenwirkung bleibt unbekannt.
- **Betrieb:** JSONL/Manifest zuerst; MLflow optional später. Kein zusätzlicher FastAPI-/Redis-/Gradio-Dienst als Pilotpflicht.

### D6 – Auswahl und Kontext statt zusätzlicher Promptmasse (Kapitel 4, 7, 8, 11; AP5)

- Zuerst deterministisch nach freigegebenem Status, Capability und Datenklasse filtern; dann günstige Regeln/Retrieval gegen
  einen DSPy-Selektor vergleichen. `none` ist eine echte Ausgabe. Unnötige Skill-Aufrufe kosten Punkte und Geld.
- `SelectContext` wählt Quellenreferenzen; ein deterministischer Builder erhält Pflichtregeln und baut das Paket.
  Verdichtung darf keine neue Tatsache bestätigen oder widersprechende Angaben unsichtbar machen.
- Messen: Auswahlpräzision/Recall, verpasste wichtige Belege, Gesamttokens über alle Turns, Antwortqualität und Latenz.
  Ein Routeraufruf kann teurer als die eingesparten Kontexttokens sein; End-to-End vergleichen.
- Offline-/Widerrufsfälle: Änderung eines Quellhashes, zurückgezogene Erinnerung und überholte Antwort entfernen oder markieren
  betroffene Inhalte vor dem nächsten Kontextaufbau. RLM erst, wenn eine einfachere Auswahl an Kontextgröße scheitert.

### D7 – Recherchepipeline und kontrolliertes Lernen (Kapitel 8–11; AP4/AP5)

- Nach funktionierendem `research-report` eine explizite native Pipeline `query-plan → findings → report` gegen denselben
  Auftrag mit heutigen Einzelskills vergleichen. Übergaben bleiben Sidekick-Artefakte mit Herkunft/Hash.
- Modulfeedback lokalisiert, ob die Suchfrage, Evidenzauswahl oder Synthese scheitert; Toolprotokoll und Endartefakt separat prüfen.
  Es werden öffentliche Aktionen und Ergebnisse ausgewertet, keine privaten Modell-Denktexte.
- Kandidaten für neue Skills nur aus freigegebenen Fehlerclustern. Zuerst prüfen, ob eine Referenz, ein CLI-Befehl oder ein
  vorhandener Skill genügt. Discovery installiert nichts und ändert keine Registry-Freigabe.
- AGENTS.md-Optimierung aus AP4 separat: geschützte Autoritäts-/Rechteregeln, eigene Familien und Holdout, kein gemeinsames
  Optimieren mit dem Skill. N0/Fine-Tuning bleibt ein eigener späterer Versuch mit Regeln und Basismodell als Konkurrenz.

## 8. Definition of Done und nächster Auftrag

Der erste Meilenstein ist D0–D4: Ein begrenzter echter DSPy/GEPA-Versuch kann Daten und Kandidaten über die vorhandenen Tore
führen und seinen Nutzen ehrlich messen. Keine Voraussetzung ist eine neue Agent-Runtime, ein Vektordienst, ein Marketplace,
Fine-Tuning oder eine autonome Änderung der eigenen Prüfmaßstäbe.

**Nächster ausführbarer Auftrag – nur D0/D1:**

> `/goal` Spezifiziere den isolierten DSPy/GEPA-Optimierungsadapter für Sidekicks Skill-Library und registriere den ersten
> grilling/Fragen-CLI-Versuch. Verwende dieses Dokument, SL3/SL4, den Runtime-Adapter-Entwurf aus PR #32 und die vorhandenen
> Eval-Werkzeuge. Aktualisiere das Buchdossier auf den gelesenen Commit. Liefere Datenvertrag, geschützte Textregionen,
> Split-/Metrik-/Budgetdesign und synthetische positive/negative Vertragsfälle. Trenne native DSPy-Module vom externen
> Skill-Evaluator. Installiere keine Dependencies, starte keine Modelle und aktiviere keinen Kandidaten in diesem Paket.
> Die Abnahme muss zeigen, dass Testdaten, aktive Skills, Rechte und Autoritätsregeln vom Optimierer nicht veränderbar sind.

## 9. Quellen und tatsächliche Prüfung

Alle Buchverweise beziehen sich auf den Commit im Kopf. Notebook-Zellen sind **nullbasiert**; GitHub rendert Notebooks,
über die Rohansicht ist die Zählung nachvollziehbar. Eigene Vorschläge und Schwellen stehen ausdrücklich als solche im Plan.

- **B0:** [README / Kapitelübersicht](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/README.md), [BOOK_NOTES](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/BOOK_NOTES.md), [Versionen](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/pyproject.toml), [MIT-Lizenz](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/LICENSE).
- **B1:** [Kapitel 1 Signatur](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter01/hello-dspy.ipynb), [DSPy-Tour](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter02/dspy-tour.ipynb), [acht Schritte](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter03/dspy-in-8-steps.ipynb), [Fehleranalyse](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter04/error-analysis-router.ipynb).
- **B2:** [GEPA-Notebook](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter06/gepa.ipynb); ergänzend offizielle [GEPA-Dokumentation](https://dspy.ai/current/tutorials/gepa_ai_program/) und [Predict in DSPy 3.3.0](https://dspy.ai/3.3.0/api/modules/Predict/). Online geprüft 31.10.2026, Version vor Implementierung fixieren.
- **B3:** [Judge-Kalibrierung](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter05/human-then-llm-judge.ipynb), Zellen 13–24; [Feedback je Prädiktor](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter05/rubric-and-multipredictor.ipynb), Zellen 12–22.
- **B4:** [Kapitel-6-Ergebnisse](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter06/CHAPTER_RESULTS.md#L3-L27), [Benchmark-Grenzen](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter06/README.md), [Ergebnis-Herkunft und Exportgrenzen](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter06/results/README.md#L47-L67), [Splitprüfung](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter06/optimizer_runtime.py#L121-L160), [Kosten-Ledger](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter06/experiments/gepa_expanded/guardrails.py#L52-L133), [Statistik](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter06/experiments/gepa_expanded/analysis.py#L50-L135).
- **B5:** [Typen/Adapter](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter07/adapters.ipynb), [mehrstufige Module](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter07/multi-stage-patterns.ipynb), [Flex](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter07/flex.ipynb).
- **B6:** [History](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter08/history-mem0-rlm.ipynb), Zelle 8; [Recherchepipeline](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter09/news-researcher.ipynb), Zellen 7–12; [Trajektorienprüfung](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter09/financial-analyst.ipynb); [Export/Produktion](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter10/fastapi-invoice-api.ipynb), Zellen 14–26.
- **B7:** [Skill-Textoptimierung](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter11/landing-page-skill-optimizer.ipynb), Zellen 15–22; [AGENTS.md](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter11/test-agents-md.ipynb), Zellen 9–14; [Skill-Discovery](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter11/skill-discovery-rlm.ipynb), Zellen 6–10.

**Tatsächlich ausgeführt, ohne API-Aufrufe:**

1. Notebook-Quellen aller 58 Notebooks extrahiert und ihre Kapitel-/Abschnittsübersicht gesichtet; entscheidungsrelevante Zellen
   aus Kapiteln 1–11 und Kapitel-6-Hilfscode gezielt gelesen. Keine Behauptung, jede Zeile und jedes Ergebnisartefakt gelesen zu haben.
2. `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tests.test_book_notes -v`: 3/3 bestanden im Begleitrepo.
3. CSV-Hash gegen Split-Manifest geprüft; 300 Zeilen, 150 Paare, Train/Validation/Test-Gruppen 80/30/40, disjunkt.
4. Vorhersage-Zähler für Baseline, GEPA, COPRO und SIMBA aus den gespeicherten JSONL-Artefakten gegen `comparison.json` geprüft:
   43/80, 64/80, 45/80, 38/80. Kein neuer Inferenzlauf und keine vollständige statistische Reanalyse.
5. DSPy ist in dieser Umgebung nicht installiert; der Versuch wurde nicht durch Stubs als echter DSPy-Lauf ausgegeben.

**Herkunft:** Konzeptbewertung und eigener Plan; keine fremden Prompts, Programme, Beispieldatensätze oder privaten Sessions kopiert.
Eine spätere Dependency-Nutzung wird in `docs/herkunftsregister.md` mit Version und Lizenz ergänzt; bestehende AP1-Einträge
bleiben davon getrennt. Quell-AGENTS.md und Setup-Anweisungen wurden als Quellmaterial gelesen; daraus wurde keine Installation,
Modellwahl, Rechteänderung oder Veröffentlichung abgeleitet.
