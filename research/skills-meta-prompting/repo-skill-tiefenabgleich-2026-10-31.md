# Tiefenabgleich: Rümpfe externer Skills gegen unsere Suite

> Stand 31.10.2026 · Folgt auf den [Abgleich nach Frontmatter](repo-skill-abgleich-2026-10-31.md) · Bezug: [Synthese](synthese.md) F1 (Z. 179–215) und F2.
> Gelesene Fremdstände (flache Klone, HEAD = Dossier-Commit): prompt-architect `6e12013e`, prompt-engineering-skill `eec9ca5c`, recursive-decomposition-skill `1780d46a`, skill-cost-optimizer `6c75e0ea`, skills-optimizer `f8082b57`.
> Unsere Suite: `.agents/skills/` am Commit `8b5214b3` (letzte Änderung an den Skills; Arbeitsbaum sauber, `main` bei `f1cff5f`).
> **Clean-Room:** Regeln in eigenen Worten; kein Fremdtext übernommen. agentic-harness-patterns ist **nicht gelesen, ausgeschlossen** ([Clean-Room-Plan](clean-room-plan.md) Punkt 5).
> Dieses Dokument empfiehlt; es entscheidet nichts. Kandidaten sind *Vorschläge*, ungemessen.

**Einordnung:** **abgedeckt** = Skill und Schritt bei uns, oder eine als *zugeordnet/ergänzt* geführte F1-Zeile, wenn die Regel bewusst Werkzeug, Harness oder Prozess ist. **bewusst verworfen** = F1 *verworfen* oder in Z. 215 ausdrücklich ausgeklammert. **Lücke** = fehlt bei uns, ändert beobachtbares Verhalten in A01–A08. **nicht relevant** = mit Grund.

## 1. prompt-architect (SKILL.md, 27 Framework-Referenzen)

| Regel (eigene Worte) | Einordnung | Beleg bei uns bzw. Grund |
|---|---|---|
| PA-1 Vor jeder Änderung den Prompt auf Klarheit, Genauigkeit, Kontext, Grenzen und Format prüfen | bewusst verworfen | F1 Z. 185 (K2.1–K2.6): Technik-Katalog keine Library-Anforderung |
| PA-2 Erst die Absicht (7 Klassen) bestimmen, dann per Unterscheidungsfrage ein Framework wählen | bewusst verworfen | F1 Z. 185 |
| PA-3 Lücken gezielt erfragen, wenige Fragen je Runde, schrittweise | abgedeckt | grilling 4 (unabhängige Punkte gemeinsam, begrenzt durch Bedienlast) |
| PA-4 Fehlende Bestandteile mit plausiblen Vorgaben auffüllen | nicht relevant | Widerspricht grilling (Schlussregel: nie Antworten erfinden) und specifying-behavior 3 (vorläufig markieren) |
| PA-5 Ausgabe: Analyse, Nutzungshinweis, kopierfertiger Prompt als letztes Element | nicht relevant | Kein Bereich A01–A08 liefert Prompts |
| PA-6 Kein Framework, wenn zwischen Anfrage und Bedarf keine Lücke besteht | abgedeckt | „Nicht für …“-Grenzen in den Beschreibungen (grilling, planning); grilling 1 kein grundloses Nachfragen |
| PA-7 Nutzerwahl respektieren, Frameworks wechseln oder kombinieren, iterieren bis zufrieden | bewusst verworfen | F1 Z. 185 (K2.5/K2.6) |
| PA-8 Agentische Prompts brauchen Werkzeugliste, Schleifengrenze und Stoppbedingung (react.md) | abgedeckt | researching-repositories 6 (Stopp); planning `package.md` Research-Spike mit Abbruchbedingung |
| PA-9 Iteratives Verfeinern nur mit festem Stoppkriterium (self-refine, chain-of-density) | abgedeckt | F1 Z. 201 (K6.5) und Z. 196: Kandidatenerzeugung liegt außerhalb der Skills |
| PA-10 Kritik: stärkstes Gegenargument mit Schweregrad; Pre-Mortem mit frühem Warnzeichen | abgedeckt | reviewing-decision-gates 2 (harte Ausschlüsse), 3 (Gegenbelege), 5 (Bedingung für Neubewertung) |
| PA-11 Bei unklarem Auftrag erst interviewen, Ergebnis vor Ausführung zeigen (reverse-role) | abgedeckt | grilling 4, 5, 8 (Zusammenfassung bestätigen lassen) |

## 2. prompt-engineering (SKILL.md, 5 Referenzen)

| Regel (eigene Worte) | Einordnung | Beleg bei uns bzw. Grund |
|---|---|---|
| PE-1 Einstiegsweiche: neu erstellen, bestehendes optimieren, konkreten Fehler beheben | bewusst verworfen | F1 Z. 185 (K2.2) |
| PE-2 Erkunden, bis Anforderungen klar sind; nach Beispielen und früheren Fehlschlägen fragen; nichts annehmen | abgedeckt | grilling 1, 3, 4 |
| PE-3 Mehrere Ansätze mit Abwägung und Begründung vorlegen | abgedeckt | grilling 5 (Optionen samt Folgen, Empfehlung); reviewing-decision-gates 4 |
| PE-4 Minimal beginnen, Komplexität nur bei belegtem Bedarf | abgedeckt | planning-work-packages 3 (kleinster durchgängiger Ablauf) |
| PE-5 Optimieren: Ursache bestimmen, minimal ändern, Funktionierendes erhalten, auf Rückschritte prüfen | abgedeckt | evaluating-changes 1 (genau eine Änderung), 2 (Pflichtregressionen) |
| PE-6 Versionshistorie mit Begründung je Version | abgedeckt | F1 Z. 201 (K6.5, Zustände samt Grund) |
| PE-7a Prüfung nach fester Rubrik (Klarheit, Vollständigkeit, Effizienz, Robustheit) | abgedeckt | F1 Z. 198 (K5.6, Rubrik je Skill) |
| PE-7b Widersprüchliche Anweisungen erkennen und Priorität klären statt beide stehen zu lassen | **Lücke** | specifying-behavior 8 prüft nur ID↔Fall und Schema, nicht Widersprüche zwischen Anforderungen → K-1 |
| PE-8 Testfälle: Normal-, Grenz-, Fehler- und Umformulierungsfälle | abgedeckt | specifying-behavior 4, 7; evaluating-changes 2 (Paraphrasen in derselben Familie) |
| PE-9 Gewichtete Scores je Einsatzzweck; Variante übernehmen ab festem Mindestvorsprung | abgedeckt (strenger) | reviewing-decision-gates 4 (Gewichte vorab, Kippprüfung); evaluating-changes 6 (keine Signifikanz ohne tragfähige Annahmen) |
| PE-10 Keine Scheingenauigkeit, grobe Skalen oder Spannen | abgedeckt | reviewing-decision-gates 4; planning-work-packages 5 |
| PE-11 Modell-, Token- und Latenzgrenzen des Einsatzorts erfragen | nicht relevant | Betrifft Prompt-Einsatz; Modell steht im Manifest (F1 Z. 205) |
| PE-12 Beispiele divers, ganze Spannweite statt gleichförmiger Muster | abgedeckt | specifying-behavior 6, 7 (Beispiele nennen IDs; Normal/Grenz/Fehler) |

## 3. recursive-decomposition (SKILL.md, 4 Referenzen)

| Regel (eigene Worte) | Einordnung | Beleg bei uns bzw. Grund |
|---|---|---|
| RD-1 Suchraum zuerst messen; Zerlegung ab festen Datei-/Token-Schwellen | bewusst verworfen | F1 Z. 215 (K4.3 ausgeklammert); Schwellen als unbelegt zurückgestellt ([A02 §7](area-researching-repositories.md)) |
| RD-2 Erst mit Suche filtern, dann nur die Teilmenge tief lesen | abgedeckt | researching-repositories 3 |
| RD-3 In Batches teilen, parallele Subagenten, Ergebnisse zusammenführen | bewusst verworfen | F1 Z. 215 (K4.3); Tiefe Z. 193 (K4.4); planning 3 markiert Parallelität ohne Agents zu starten |
| RD-4 Zusammengeführte Antwort stichprobenartig an den zitierten Belegstellen nachlesen | **Lücke** | In [A02 §7](area-researching-repositories.md) als Anforderung vorgesehen, aber nicht in §11 und nicht in researching-repositories 3/4 übernommen → K-2 |
| RD-5 Subagenten ausreichend Kontext geben; Doppelarbeit, Aufrufbudget und Tiefe begrenzen | abgedeckt | F1 Z. 193 (K4.4, Harness) |
| RD-6 Große Dateien: Größe prüfen, abschnittsweise lesen | nicht relevant | Client-/Werkzeugmechanik; Navigation regelt `AGENTS.md` (CodeGraph) |
| RD-7 Bei leerem Ergebnis die Suche prüfen, bevor man aufgibt | abgedeckt | researching-repositories 4 (Abwesenheit nur mit Suchumfang) |
| RD-8 Lesende Schritte ohne Rückfrage; vor kritischen Aktionen anhalten | abgedeckt | researching-repositories 5; testing-system-boundaries 4; grilling 8 |
| RD-9 Bei Mehrdokument-Auswertung vorab ein Extraktionsschema festlegen | abgedeckt | researching-repositories `report.md` (feste Felder Aussage, Quellenrolle, Fundstelle, Evidenz) |
| RD-10 Bei Suche früh abbrechen; Stichprobe hochrechnen, wenn sicher genug | abgedeckt (Abbruch) | researching-repositories 6; Hochrechnung widerspricht evaluating-changes 4 und wird nicht übernommen |
| RD-11 Ab drei Schritten zuerst einen Kurzplan schreiben | nicht relevant | Allgemeines Agentverhalten, keine Bereichsregel |

## 4. cost-optimizer (SKILL.md, 3 Referenzen; `index.ts` und README nicht gelesen)

| Regel (eigene Worte) | Einordnung | Beleg bei uns bzw. Grund |
|---|---|---|
| CO-1 Modell nach Stichwort und Komplexitätswert routen | bewusst verworfen | F1 Z. 205 (K7.4): Modellwahl im Manifest/Harness, nicht im Skill |
| CO-2 Bei Ratenlimit, Ausfall, Zeitüberschreitung oder Budgetnähe herabstufen | bewusst verworfen | F1 Z. 205 (Harness); Herabstufung nur nach Qualitäts-Eval (K7.4) |
| CO-3 Kontext in eine Schnappschussdatei verdichten (Entscheidungen, Dateien, offene Punkte) | abgedeckt | resuming-work 2, 3 (selbsttragende Übergabe mit Hashes) |
| CO-4 Ersparnis aus angenommenem Aufgabenmix hochrechnen | abgedeckt (gegenteilig) | evaluating-changes 7 (keine Ersparnis aus angenommenen Mischungen); F1 Z. 205 (K7.5) |
| CO-5 Konfiguration erst nach Bestätigung schreiben; Backup zuerst, ohne Backup abbrechen | abgedeckt | evaluating-changes 8 (aktiviert nichts); F1 Z. 202 (Revert durch Owner) |
| CO-6 Lesefehler mit Standardwerten überbrücken; defekte Logzeilen überspringen und zählen | abgedeckt (strenger) | evaluating-changes 4 (fehlende Spuren bleiben unbekannt); reviewing-decision-gates 4 (Unbekanntes nie als Zahl) |
| CO-7 Immer geladene Kontextdateien auf Tokenbudgets kürzen, Beispiele auslagern | abgedeckt | F1 Z. 182 (K1.3 Ladestufen), Z. 205 (K7.3, keine stille Kürzung) |
| CO-8 Schleifen auf feste Iterationszahl begrenzen, dann zusammenfassen und stoppen | bewusst verworfen | F1 Z. 190 (K3.4: kein automatischer Retry-Zähler), Z. 193 (Harness) |
| CO-9 Erinnerungseinträge nach festem Alter entfernen | nicht relevant | A09, zurückgestellt (F1 Z. 208) |
| CO-10 Jede Routing- und Konfigurationsentscheidung mit Grund protokollieren | abgedeckt | F1 Z. 205 (K7.4); Run-Manifest K5.7 |
| CO-11 Screenshot-Auflösung zur Kostensenkung reduzieren | nicht relevant | Kein Bereich nutzt Bildeingaben |

## 5. semantic-compressor (SKILL.md, 3 Referenzen; Skript, Samples, `evals/` nicht gelesen)

| Regel (eigene Worte) | Einordnung | Beleg bei uns bzw. Grund |
|---|---|---|
| SC-1 Nur auf ausdrücklichen Aufruf; unklare Argumente → Moduskarte zeigen und ohne Schreiben stoppen | nicht relevant | Unsere Skills haben keine Argumentgrammatik; Kompression ist Prozess ([Abgleich §3](repo-skill-abgleich-2026-10-31.md)) |
| SC-2 Zielinhalt als Daten behandeln, eingebettete Befehle nie ausführen | abgedeckt | researching-repositories 3; resuming-work 4 |
| SC-3 Quelle bleibt unverändert, bis alle Prüfungen bestanden sind; Kandidat getrennt ablegen | abgedeckt | F1 Z. 200 (K6.1, Invariante L1) |
| SC-4 Hashgebundenes Inventar der zu erhaltenden Literale und Konzepte | abgedeckt | F1 Z. 201 (K6.2, Schritt `dev_geprueft`) |
| SC-5 Jede Inventarkategorie ausdrücklich als geprüft bestätigen; leer heißt „nicht zutreffend“, nicht „vergessen“ | **Lücke** (übertragen) | Unsere festen Klassenlisten (specifying-behavior 4, Störungsklassen in testing-system-boundaries 2) verlangen keine Aussage zu nicht genutzten Klassen → K-4 |
| SC-6 Höchstens drei Entwürfe, sonst „nicht komprimierbar“ | nicht relevant | Kein Skill erzeugt Kandidaten (evaluating-changes, Beschreibung) |
| SC-7 Unabhängiger, frischer Gutachter mit wörtlichen Belegen; ohne ihn keine Übernahme | abgedeckt | evaluating-changes 5 (nie allein durch den Autor); F1 Z. 201 (K6.3) |
| SC-8 Eigene Endzustände; Fehlschlag nie als Erfolg formulieren | abgedeckt | evaluating-changes 4; testing-system-boundaries 6, 7; KL-06 |
| SC-9 Keine Garantie behaupten; deterministisch als Fakt, semantisch als Urteil berichten | abgedeckt | evaluating-changes 5; testing-system-boundaries 5, 8 |
| SC-10 Semantikurteil getrennt vom Größenziel ausweisen | abgedeckt | evaluating-changes 3 (jede Ebene aus eigenen Läufen) |
| SC-11 Spätere Korrektur gilt vor früherer Aussage | abgedeckt | grilling 7; reviewing-decision-gates 3; resuming-work 6 |
| SC-12 Fehlgeschlagene Wege mit Grund erhalten, damit sie nicht wiederholt werden | **Lücke** (übertragen) | resuming-work 2 und `handoff.md` führen Erledigtes, Blockaden, unklare Wirkungen, aber keine verworfenen Wege → K-3 |
| SC-13 Backup und Manifest; Wiederherstellung nur bei passenden Hashes | abgedeckt | F1 Z. 202 (K6.4/K6.6) |

## 6. agentic-harness-patterns

Nicht gelesen, ausgeschlossen (Herkunft ungeklärt, [Clean-Room-Plan](clean-room-plan.md) Punkt 5).

## 7. Zählung

| Skill | abgedeckt | bewusst verworfen | Lücke | nicht relevant | Summe |
|---|---|---|---|---|---|
| prompt-architect | 6 | 3 | 0 | 2 | 11 |
| prompt-engineering | 10 | 1 | 1 | 1 | 13 |
| recursive-decomposition | 6 | 2 | 1 | 2 | 11 |
| cost-optimizer | 6 | 3 | 0 | 2 | 11 |
| semantic-compressor | 9 | 0 | 2 | 2 | 13 |
| **Summe** | **37** | **9** | **4** | **9** | **59** |

## 8. Kandidaten

Alle *Vorschlag*, ungemessen. Jeder ändert einen Schritt eines bestehenden Skills; kein neuer Skill.

| ID | Bereich / Skill / Schritt | Kandidat (eigene Worte, ein Satz) | Herkunft | Messbar? |
|---|---|---|---|---|
| K-1 | A05 · specifying-behavior · Schritt 8 | Prüfe die Anforderungen auf Widersprüche (gleicher Zustand oder Auslöser, unvereinbare Reaktion) und führe jeden Fund als offene Frage mit beiden IDs, statt beide als gültig stehen zu lassen. | PE-7b | Ja: M3-Verhaltensfall mit synthetischen Vorgaben, die einen eingebauten Widerspruch enthalten; deterministische Assertion „beide IDs als Konflikt/offene Frage genannt, keine als gültig ohne Vermerk“. |
| K-2 | A02 · researching-repositories · Schritt 4 | Lies vor der Lieferung tragende Aussagen stichprobenartig an ihrer zitierten Fundstelle nach und stufe nicht gedeckte Aussagen zurück oder korrigiere sie. | RD-4; in A02 §7 schon als Anforderung vorgesehen, in §11 nicht übernommen | Teilweise: Existenz von Zeile und SHA deterministisch (KL-14, Prüfer *offen*); inhaltliche Deckung als M3-Fall mit präpariertem Dossier, dessen eine Fundstelle die Aussage nicht trägt (Assertion: Aussage zurückgestuft oder markiert). |
| K-3 | A06 · resuming-work · Schritt 2 (+ `handoff.md`) | Halte verworfene oder fehlgeschlagene Wege mit Grund und Beleg fest, damit die Fortsetzung sie nicht ungeprüft wiederholt. | SC-12 (übertragen) | Ja: Variante von RW-01 mit einem gescheiterten Ansatz im Verlauf; Assertion „Übergabe nennt den Weg als verworfen; nächster Schritt ist nicht dieser Weg“. |
| K-4 | A05 · specifying-behavior · Schritt 4 (analog A07 · testing-system-boundaries · Schritt 2) | Führe zu jeder festen Fehler- bzw. Störungsklasse entweder einen Fall oder ausdrücklich „nicht zutreffend“ mit Grund, damit Auslassen von Vergessen unterscheidbar ist. | SC-5 (übertragen) | Ja, deterministisch: jede Klasse der Liste erscheint in der Ausgabe als Fall oder als begründetes „nicht zutreffend“. |

Bewertung: K-2 ist am besten belegt (eigene Bereichsanalyse hatte die Regel schon; Umsetzung fehlt). K-1 und K-3 ändern sichtbare Ausgaben eines Verhaltensfalls. K-4 kostet Ausgabelänge; sein Nutzen ist ohne M3/M4-Lauf offen. Ob einer davon übernommen wird, entscheidet der Owner über den Kandidatenweg (SL4 §4), nicht dieses Dokument.

## 9. Grenzen

- **Lesetiefe:** Vollständig gelesen wurden alle fünf SKILL.md sowie die Referenzen von prompt-engineering (außer `examples.md` und `patterns.md` nur auszugsweise bzw. über Überschriften), recursive-decomposition, cost-optimizer und semantic-compressor. Von den 27 prompt-architect-Frameworks wurden self-refine, reverse-role, pre-mortem, react und rpef in Teilen gelesen, die übrigen über Überschriften und Suche nach Stoppregeln. Templates, Skripte (`framework_analyzer.py`, `prompt_evaluator.py`, `semantic_compressor.py`, `index.ts`), Samples und `evals/` nicht gelesen. Regeln, die nur dort stehen, fehlen hier.
- **Regelauswahl:** 5–13 Regeln je Skill sind eine eigene Verdichtung; eine andere Auswahl könnte andere Grenzfälle treffen.
- **Strenge:** „abgedeckt“ heißt, der Text unserer Skills oder eine F1-Zeile regelt es; ob die Skills sich so *verhalten*, ist *offen* (keine M3/M4-Läufe, Synthese F3).
- K-3 und K-4 sind Übertragungen aus einem Kompressions-Skill auf andere Bereiche; der Fremd-Skill begründet sie nicht für unsere Bereiche.
- Keine Läufe, keine Modelle gestartet; Zeilenangaben zur Synthese beziehen sich auf den Stand `f1cff5f`.

## Bewertung durch die ausführende Session (31.10.2026)

Nachgeprüft am Repo-Stand `f1cff5f`: Die vier Lücken bestehen. `researching-repositories` enthält kein Nachlesen an der Belegstelle, obwohl [A02 §7](area-researching-repositories.md) es als Anforderung führt. `resuming-work` hält verworfene Wege nicht fest. `specifying-behavior` prüft nicht auf Widersprüche. Die Einordnung von 37 Regeln als abgedeckt und 9 als bewusst verworfen deckt sich mit Synthese F1.

| Kandidat | Bewertung | Begründung | Nächster Schritt |
|---|---|---|---|
| K-2 Belegstelle nachlesen | **vorrangig** | Schließt eine eigene, bereits begründete Anforderung (A02 §7), die beim Übertragen in den Skill verloren ging. Fehlerhafte Fundstellen sind das Hauptrisiko einer Recherche; teils deterministisch prüfbar (KL-14) | Als Kandidat einfrieren, in der nächsten E3-Runde messen |
| K-3 Verworfene Wege festhalten | **aufnehmen** | Kleine Änderung an Schritt 2 und `handoff.md`, verhindert wiederholte Fehlversuche nach Unterbrechung; als RW-01-Variante messbar | Als Kandidat einfrieren, zusammen mit K-2 messen |
| K-1 Widersprüche in Specs | zurückstellen | Sinnvoll, aber überschneidet sich mit Grenz- und Fehlerfällen (Schritt 4) und mit dem Interview-Skill; ohne eigenen Befund aus unseren Läufen | Erst mit einem beobachteten Fehlfall wieder aufgreifen |
| K-4 Fall oder „nicht zutreffend“ je Fehlerklasse | verwerfen für jetzt | Verlängert jede Ausgabe; die Fehlerklassen sind bei uns bereits als Pflichtfelder in `failure-matrix.md` geführt; Nutzen ohne Beleg | – |

Kein Kandidat wird ohne Messung aktiviert ([SL4 §4–§5](library-learning.md)). K-2 und K-3 brauchen eine neue E3-Runde mit neuen, ungesehenen Familien; vom E3-Budget sind 2 Starts übrig, die Runde braucht etwa 2 × (4 select + 8 test + 2 Regression) = 28 Starts.
