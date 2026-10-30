# Research-Synthese: Oberfläche und Design für Sidekick

**Methode:** Dokumenten- und Artefaktanalyse (keine Nutzerinterviews) | **Quellen:** 9 Quellengruppen
**Datum:** 2026-10-30 | **Researcher:** Claude Code im Auftrag des Owners
**Bezug:** [Design-Canvas](https://claude.ai/artifact/MH2ZNLNG34C78JtAE9RC8e) (privat, nur für den Owner sichtbar)

## Executive Summary

Alle Quellen laufen auf dieselbe Aussage hinaus: **Die Entscheidung ist das Produkt.** Die Oberfläche
muss vor allem drei Dinge leisten:

- Tore schnell und sicher entscheidbar machen.
- Unsicherheit ehrlich zeigen: Ausgang unklar, Kosten unbekannt, Aussage unbelegt.
- Vertrauen in Bearbeiter sichtbar mit Nachweisen wachsen lassen.

Der aktuelle Entwurf deckt die Inbox gut ab. Vier Lücken hat er:
- **Rückfragen:** Sie werden wie eine Freigabe behandelt, nicht als Runde mit Abhängigkeiten.
- **Freigabe-Müdigkeit:** Es gibt keinen Weg, aus einer Entscheidung eine Regel zu machen.
- **Vertrag anlegen:** Für den Kern „Vertrag“ fehlt eine Oberfläche zum Erstellen.
- **Vertrauen:** Scorecards mit Stichprobengröße und Autonomie-Regler fehlen.

Die Motion bleibt verspielt. Sie belohnt aber Abschluss und Klarheit, nicht schnelles Durchklicken.

## Quellen

Statt Teilnehmer gibt es Quellengruppen. „Verbreitung“ zählt, wie viele davon ein Thema stützen.

| Kürzel | Quelle | Stand |
|---|---|---|
| V | [Vision](../docs/vision.md): §4 Szenarien, §5 Produkterlebnis, §11 Autonomie, §15–17 Assistenz, Benachrichtigung, Scorecards, §23 Metriken, §24 Risiken | v4 |
| A | [Analyse](../docs/analyse-und-uebernahmeplan.md) §3: Korrekturen vor der Spec | main |
| K | [Kern-These](kern-first-principles.md): Vertrag, Journal, Tor | main |
| R | [Skills-/Meta-Prompting-Synthese](skills-meta-prompting/synthese.md) und [Web-Gegenprüfung](skills-meta-prompting/web-recherche-2026-10-30.md) | main |
| G | Grilling-Skill: `.agents/skills/grilling/` mit Workflow und Formaten | main |
| D | Repo-Dossiers mit UI-relevanten Mustern: code2prompt (Token-Map), skills-optimizer (Kandidat, Inventar, Restore), prompt-architect („keine Technik nötig“), APE/DSPy (Score mit Stichprobenzahl), recursive-decomposition (Segmentprotokoll), agentic-harness-patterns (erlauben/fragen/verweigern) | [Dossiers](skills-meta-prompting/README.md) |
| C | Entwurf v1 (Leitstand) und v2 (verspielt, mit Motion) auf der Canvas | 2026-10-30 |
| U | Signale des Owners in dieser Session: „fun UI“, „lots of motion“, mobil freigeben, Deutsch | Session |
| GH | Arbeitsweise in diesem Repo: Issues, PR-Reviews, `docs/fragen/` als handgemachtes Vertrag/Journal/Tor | main |

## Key Themes

### Thema 1: Die Entscheidung ist das Produkt
**Verbreitung:** 6 von 9 (V, A, K, G, D, GH)
**Zusammenfassung:** Der Mensch ist der Engpass. Jede Wartesituation braucht Kontext, Folgen und eine Empfehlung, die als Empfehlung erkennbar ist.
**Belege:**
- „Jede Wartesituation beantwortet zwei Fragen: worauf, und was passiert, wenn ich nichts tue.“ (V §5)
- „Freigabe = Aktion + Parameter-Hash + Gültigkeit; die UI zeigt genau das Freigegebene“ (V §11.3)
- „Typisierte Effekte, kanonische Parameter, Artefakt-Hash, Zielressource und Ausgangsversion binden; konkrete Wirkung in UI anzeigen.“ (A §3)
- Inbox = Ansicht auf offene Tore (K §3)
**Folgerung:** Die Inbox bleibt der Startbildschirm. Jede Tor-Art (Freigabe, Rückfrage, Abnahme, Ausgang unklar) braucht ein *eigenes* Bedienmuster, keine Einheitskarte mit zwei Buttons.

### Thema 2: Ehrlichkeit über Unsicherheit
**Verbreitung:** 6 von 9 (V, A, R, D, K, C)
**Zusammenfassung:** Der Hub zeigt, was er *nicht* weiß, gleichrangig mit dem, was er weiß.
**Belege:**
- „Kosten getrennt nach gemessen, reserviert, geschätzt und unbekannt“ (V §6)
- „Vorhandene Sessions als eingeschränkt überwacht kennzeichnen.“ (A §3)
- „Format, Auswahl und Wirkung sind drei verschiedene Nachweise“ (R, Querschnitt 5)
- „Eine erreichbare URL beweist die zugehörige Behauptung nicht.“ (A §3)
**Folgerung:** Ein festes visuelles Vokabular für Gewissheit: *gemessen* (voll), *geschätzt* (gestrichelt), *unbekannt* (hohl), *unklar* (Koralle mit Abgleich-Aktion). Das gilt einheitlich für Kosten, Belege, Effekte und Sessions.

### Thema 3: Freigabe-Müdigkeit gegen Kontrolle
**Verbreitung:** 4 von 9 (V, A, K, U)
**Zusammenfassung:** Viele Tore machen den Hub zur Bürokratie. Das ist die riskanteste Annahme aus der Kern-These.
**Belege:**
- Risiko „Freigabe-Müdigkeit“, Gegenmaßnahme „Bündelung, Freigabe-Regeln pro Projekt, Autonomie-Stufen“ (V §24)
- „Push auf Feature-Branches frei, Merge nur nach Freigabe“ als Regelbeispiel (V §11.3)
- Entscheidungslatenz unter 15 min als MVP-Metrik (V §23)
**Folgerung:** Jede Freigabe bietet „Als Regel vorschlagen“ an. Die Regel wird ein eigener Vorschlag; der Owner bestätigt ihn separat, mit Geltungsbereich und Ablaufdatum. Die Risikostufe bestimmt die Geste: Tippen bei geringem Risiko, Halten bei Außenwirkung.

### Thema 4: Rückfragen sind Runden, nicht Ja/Nein
**Verbreitung:** 3 von 9 (G, V, R)
**Zusammenfassung:** Eine Frage hat Optionen mit Folgen und eine getrennte Empfehlung. Sie kann von anderen Fragen abhängen und Teilantworten bekommen. Schweigen ist nie Zustimmung.
**Belege:**
- „Wähle nur Fragen, deren Voraussetzungen beantwortet oder belegt sind … abhängige Fragen folgen später.“ (G)
- „Schweigen, Timeout oder übersprungene Felder sind keine Zustimmung.“ (G)
- WEB-R8: „Timeout erzeugt keine Zustimmung“ als harte Regression (R)
**Folgerung:** Eine eigene Ansicht für Rückfrage-Runden: unabhängige Fragen nebeneinander, abhängige gesperrt mit sichtbarem Grund, freie Antwort möglich, Absenden auch teilweise, kein vorausgewählter Default.

### Thema 5: Vertrauen wächst sichtbar und belegt
**Verbreitung:** 4 von 9 (V, D, R, A)
**Zusammenfassung:** Autonomie ist ein Regler, der mit nachgewiesenem Vertrauen steigt. Scorecards brauchen Stichprobengröße, sonst täuschen sie.
**Belege:**
- „Getrennt geführt werden: Identität · behauptete Fähigkeiten · nachgewiesene Fähigkeiten · Befugnis.“ (V §11.2)
- „Scorecards verleihen keine Rechte.“ (A §3)
- „Ergebnis enthält Score *und* Stichprobenzahl je Kandidat.“ (APE-B3, D)
**Folgerung:** Eine Crew-Ansicht mit Scorecards (Wert plus n), getrennt nach behauptet und nachgewiesen. Der Autonomie-Regler zeigt bei jeder Stufe, welche Grants sich ändern. Dazu ein Kill-Switch pro Bearbeiter (V §17).

### Thema 6: Ein Vertrag entsteht im Dialog, nicht im Formular
**Verbreitung:** 4 von 9 (V, K, D, G)
**Zusammenfassung:** Neuer Auftrag: Aus Freitext entwirft die Assistenz Ziel, Kriterien, Playbook und Datenklasse. Jeder Vorschlag ist als Vorschlag markiert und wird einzeln übernommen.
**Belege:**
- „Freitext → Assistent entwirft Kriterien, Playbook und Bearbeiter → bestätigen“ (V §5)
- „Vorschlagen, nicht handeln“ (V §6)
- „keine Technik nötig“-Option bei der Technikwahl (D, prompt-architect)
**Folgerung:** Ein Vertragseditor mit Vorschlagsfeldern (gestrichelt, „Vorschlag“, einzeln übernehmen), einem Kostenvoranschlag als *Schätzung* und Bearbeitervorschlägen mit Scorecard und n. Offene Unklarheiten werden zu Rückfragen statt zu Annahmen.

### Thema 7: Artefakte sind Kandidaten, auch Skills und Prompts
**Verbreitung:** 3 von 9 (D, R, K)
**Zusammenfassung:** Code, Skills und Prompts werden gleich geändert: als Kandidat, mit Inventarprüfung, Toren, Apply und Restore.
**Belege:** SO-R1 bis R5 (skills-optimizer); K6 und K1.5 (R); „Skill ändern“ als Playbook (K §5)
**Folgerung:** Die Abnahme-Ansicht zeigt einen Vergleich von Quelle und Kandidat mit Inventar-Checks. Für Skills kommen Discovery und Wirkung als getrennte Ergebnisse dazu. (Als nächster Schritt notiert, auf der Canvas noch nicht gezeichnet.)

### Thema 8: Freude ja, aber für Klarheit
**Verbreitung:** 2 von 9 (U, C)
**Zusammenfassung:** Der Owner wünscht ausdrücklich eine verspielte UI mit viel Bewegung. Gleichzeitig darf Motion keine schnelle Zustimmung belohnen.
**Belege:** „redesign and make it a fun ui - with Lots of motion“ (U); Entwurf v2 belohnt jede Freigabe mit Flug und Toast (C)
**Folgerung:**
- Motion erklärt Zustandswechsel: Karte geht ins Journal, Abhängigkeit entsperrt sich, Vertrauen steigt.
- Gefeiert wird nur Inbox leer und eine abgeschlossene Runde, nicht die einzelne Freigabe.
- Halten statt Tippen bei riskanten Effekten macht die Geste bewusst.

## Insights → Opportunities

| Insight | Opportunity | Impact | Aufwand |
|---|---|---|---|
| Tor-Arten haben verschiedene Bedienlogik (T1, T4) | Eigene Bedienmuster je Tor-Art, Rückfrage-Runde als eigene Ansicht | Hoch | Mittel |
| Freigabe-Müdigkeit ist das Kernrisiko (T3) | „Als Regel vorschlagen“ an jeder Freigabe; risikoabhängige Geste | Hoch | Niedrig |
| Unsicherheit hat kein einheitliches Vokabular (T2) | Gewissheits-Legende (gemessen, geschätzt, unbekannt, unklar) überall | Hoch | Niedrig |
| Vertragserstellung fehlt (T6) | Vertragseditor mit Vorschlagsfeldern und Kostenschätzung | Hoch | Mittel |
| Scorecards ohne n täuschen (T5) | Crew-Ansicht mit n, behauptet und nachgewiesen, Regler, Kill-Switch | Mittel | Mittel |
| Sessions haben unterschiedliche Kontrolltiefe (T2) | Badge „verwaltet“ oder „eingeschränkt überwacht“ an jedem Bearbeiter | Mittel | Niedrig |
| Skills werden wie Code geändert (T7) | Abnahme-Ansicht mit Vergleich und Inventar, Discovery und Wirkung getrennt | Mittel | Hoch |
| Kontext ist unsichtbar (V §12, code2prompt) | Kontextpaket-Ansicht mit Token-Map und Datenklasse | Mittel | Mittel |

## Nutzersegmente

| Segment | Merkmale | Bedürfnisse | Größe |
|---|---|---|---|
| Owner am Schreibtisch | eine Person, mehrere Agent-Systeme, lange Sessions | schnell entscheiden, Überblick, Verträge formulieren | primär (MVP) |
| Owner unterwegs | Telefon, kurze Unterbrechungen | eine Entscheidung in unter 30 s, sicher gegen Fehlbedienung | primär (S4) |
| Menschliche Bearbeiter | Lektorat, Review, Mitglied | gleicher Vertrag wie Agents, klare Aufträge, keine Rechte-Überraschungen | später (Teams) |
| Agents als Nutzer | MCP-Clients, Claude Code | maschinenlesbare Verträge, Rückfrage-API, eindeutige Tor-Ergebnisse | parallel (über MCP) |

## Recommendations

1. **Hoch: Rückfrage-Runde als eigene Ansicht** (T4, T1). Sie ist die häufigste nicht-binäre Entscheidung. Grilling liefert die Regeln dafür bereits.
2. **Hoch: „Als Regel vorschlagen“ und risikoabhängige Geste** (T3, T8). Das ist die billigste Maßnahme gegen das Kernrisiko.
3. **Hoch: Vertragseditor mit Assistenz-Vorschlägen** (T6). Ohne ihn gibt es für den ersten Kern keine Oberfläche.
4. **Mittel: Crew und Vertrauen** (T5, T2). Scorecards mit n, Regler mit sichtbarer Auswirkung, Kill-Switch, Kontrollmodus der Session.
5. **Mittel: Gewissheits-Legende als Designsystem-Baustein** (T2).
6. **Später: Abnahme-Ansicht für Skill- und Prompt-Kandidaten und Kontextpaket mit Token-Map** (T7).

Umgesetzt auf der Canvas: 1–4, dazu die Legende aus 5 in Vertrag und Crew.

## Questions for Further Research

- Wie viele Tore pro Tag erzeugt ein realer Auftrag? Davon hängt ab, ob Bündeln reicht oder Regeln Pflicht werden. Test: die Woche aus der Kern-These (§7).
- Wie hoch ist die Entscheidungslatenz mobil im Vergleich zum Desktop? Braucht Halten auf dem Telefon zu lange?
- Verstehen Owner „eingeschränkt überwacht“ ohne Erklärung?
- Feiert die Motion im Alltag noch oder nervt sie nach einer Woche? Option: Motion-Intensität als Einstellung.

## Methodology Notes

- Es gab **keine Nutzerinterviews, Umfragen oder Usability-Tests**. Die Themen stammen aus Projektdokumenten, Recherche-Ergebnissen und den Signalen eines einzigen Nutzers (Owner) in dieser Session.
- Die Zitate stammen aus Dokumenten, nicht von Teilnehmenden. Die „Verbreitung“ zählt Quellengruppen, nicht Personen.
- Bias: Die meisten Quellen schreibt dieselbe Person oder dieselbe Agent-Session. Übereinstimmung zwischen ihnen ist deshalb ein schwächerer Beleg als unabhängige Nutzerdaten.
- Nächster echter Datenpunkt: die Testwoche aus der Kern-These mit Zeit- und Toreprotokoll.
