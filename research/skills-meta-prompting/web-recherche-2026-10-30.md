# Web-Gegenprüfung: Skills, Meta-Prompting und Evaluation

Stand: 30.10.2026. Verfasser: ChatGPT/Codex. Ergänzt die Repo-/Codelektüre in PR #6,
ohne deren Dossiers zu verändern. Ausgangspunkt: PR-Head
1208d83656f1192dcaae6237252e9301549b190a. Keine Installation, Modellaufrufe,
kostenpflichtigen Experimente oder Übernahme fremder Prompts durchgeführt.

## Kurzurteil

Ein Rewrite sollte drei getrennte Aufgaben unterstützen: Skills zuverlässig auswählen,
deren Ausführung bewerten und Kandidaten kontrolliert verbessern. Ein gemeinsames
Herkunfts-/Versionsmodell verbindet sie. Ein einziger „Prompt-Optimierer“ vermischt
dagegen unterschiedliche Ziele.

Für Sidekick zuerst Evaluation der vorhandenen Skills und persistente Fragen-/Antwort-
Interaktionen bauen. Automatische Prompt-Optimierung erst danach als austauschbaren,
budgetierten Vorschlagsprozess prüfen. Keine neue Architekturentscheidung getroffen.

## Quellenregister

Alle folgenden Primärquellen am 30.10.2026 über Web-Recherche gelesen. Dokumentationsseiten
sind beweglich; Abrufdatum ersetzt keine unveränderliche Revision. Für Implementierung
Version und relevante Vertragsstellen zusätzlich fixieren. Paper-PDFs/Versuche wurden
nicht vollständig reproduziert; Paperbefunde hier auf Abstract-/Projektbeschreibungsniveau.

| ID | Quelle / Stand | Gelesener Inhalt |
|---|---|---|
| S1 | [Agent Skills Specification](https://agentskills.io/specification) | Format, Metadaten, Progressive Disclosure, Validierung |
| S2 | [Agent Skills: Evaluating output quality](https://agentskills.io/skill-creation/evaluating-skills) | realistische Fälle, Baseline, Assertions, Vergleich und Messung |
| S3 | [APE, arXiv:2211.01910](https://arxiv.org/abs/2211.01910) | Abstract: Instruktionskandidaten erzeugen und anhand einer Zielfunktion auswählen |
| S4 | [Meta Prompting, arXiv:2311.11482](https://arxiv.org/abs/2311.11482) | Abstract; [offizielles Projekt](https://github.com/meta-prompting/meta-prompting) |
| S5 | [Task-Agnostic Scaffolding, arXiv:2401.12954](https://arxiv.org/abs/2401.12954) | Abstract: andere Verwendung des Begriffs Meta-Prompting |
| S6 | [GEPA, arXiv:2507.19457v2](https://arxiv.org/abs/2507.19457v2) | Abstract, Revision 14.02.2026: Feedback und Kandidatensuche |
| S7 | [DSPy Optimizer Guide 3.4.1](https://dspy.ai/3.4.1/diving-deeper/choosing-an-optimizer/) | Auswahl, Metriken, getrennte Kandidaten und gespeicherte Optimierungsresultate |
| S8 | [DSPy GEPA Overview](https://dspy.ai/current/tutorials/gepa_ai_program/) | textuelles Ausführungsfeedback und Variantenbildung |
| S9 | [Claude: Token Counting](https://platform.claude.com/docs/en/build-with-claude/token-counting) | modellbezogene Inputschätzung und Einschränkungen |
| S10 | [Claude: Prompt Caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) | Präfix-Cache, Usage-Kategorien, Produkt-/Modellabhängigkeit |
| S11 | [Claude Code Permissions](https://code.claude.com/docs/en/permissions) | allow/ask/deny und deren Priorität |
| S12 | [Claude Code Hooks](https://code.claude.com/docs/en/hooks) | öffentliche Lifecycle-/Hook-Ereignisse und Steuerungsverträge |

## 1. Skill-Format ist kein Ausführungssystem

**Dokumentiert (S1):** Name und Beschreibung sind Metadaten; der Instruktionskörper und
zusätzliche Ressourcen werden bedarfsweise geladen. Frontmatter-Validierung prüft
Konventionen, nicht Verhalten. allowed-tools ist experimentell und clientabhängig.

**Ableitung:** Sidekick braucht getrennte Prüfungen für Format, tatsächliche Discovery,
Auswahl und Ausführung. Eine valide SKILL.md ist kein Beleg, dass ein Client sie findet
oder bei einer bestimmten Aufgabe lädt. Metadaten und Referenzen gehören ebenfalls in
die Kostenmessung; ein kurzer Haupttext allein reicht nicht.

**Abnahmevorschlag:** Pro Zielclient und Version prüfen: Skill gefunden, richtige
Auswahl bei positiven Fällen, kein unnötiges Laden bei negativen Fällen und Zugriff auf
die tatsächlich benötigte Referenz. Jede Ebene separat berichten.

## 2. Evaluation vor Optimierung

**Dokumentiert (S2):** Realistische Nutzerprompts, erwartete Ergebnisse und Eingabedateien
bilden Testfälle. Der Guide beschreibt Vergleiche mit und ohne Skill sowie belegte
Assertions. Mechanische Eigenschaften eignen sich für Skripte; andere Eigenschaften
benötigen fachliche Bewertung.

**Ableitung:** Eine Trigger-Evaluation enthält keinen vorab erzwungenen Skill-Aufruf.
Eine Verhaltensevaluation darf den Skill gezielt laden, muss das aber ausweisen.
Vorhandene Grilling-Fixtures sind Testdesign, noch keine Erfolgsquote.

**Abnahmevorschlag:** Dieselben Fälle mit gleicher Runtime, gleichem Modell, denselben
Tools und Eingaben gegen Baseline und Kandidat ausführen. Ausgaben, Skill-Auswahl,
Tool-Spuren, Rückfragen, Fehler, Latenz und Usage sichern. Datenschutz und Zugriffsrechte
beachten. Ergebnisbewertung soll sachliche Erfüllung prüfen, nicht bloße Wortzahl.

## 3. Meta-Prompting bezeichnet mehrere Verfahren

**Dokumentiert (S4/S5):** Strukturorientiertes Prompting und agentische Koordination über
verschiedene Rollen werden beide unter Meta-Prompting beschrieben. Die Arbeiten
untersuchen unterschiedliche Aufgaben und Versuchsaufbauten.

**Ableitung:** Keine universelle „Meta-Prompting Engine“ als bereits bewiesene Verbesserung
spezifizieren. Getrennt untersuchen: strukturierte Aufgabenverträge, kontrollierte
Zerlegung und Prompt-Kandidatenerzeugung. Mathematische Formalisierung belegt keine
Zuverlässigkeit eines verteilten Agent-Hubs.

Der Game-of-24-Vergleich im offiziellen S4-Projekt verwendet ein wiederverwendbares
Programm mit über Aufgaben amortisierten Kosten. Das ist kein allgemeiner Nachweis für
einmalige Dialoge oder frei laufende Agent-Sessions. Historische Modell-/Benchmarkwerte
nicht als aktuelle Sidekick-Leistung darstellen.

## 4. APE und GEPA: zwei Optimierungsideen

**Dokumentiert (S3):** APE erzeugt Instruktionskandidaten und wählt sie anhand einer
Zielfunktion. Die Studie prüft ausgewählte NLP-Aufgaben; daraus folgt keine allgemeine
Skill-Verbesserung über Clients hinweg.

**Dokumentiert (S6/S8):** GEPA nutzt textuelles Feedback aus Ausführungen, um
Promptvarianten vorzuschlagen und zu vergleichen. Verbesserungen im Paper sind
Versuchsergebnisse, keine Zusage für Sidekicks Aufgaben.

**Dokumentiert (S7):** DSPy setzt Programm und Metrik voraus. Optimierte Varianten können
gespeichert und später verwendet werden. Optimizerwahl und Zielmetrik bleiben explizit.

**Ableitung:** Ein späterer Optimierungsadapter darf einen Kandidaten produzieren,
aber keine aktiven Skills still überschreiben. Daten für Entwurf/Optimierung,
Variantenwahl und abschließende Prüfung trennen. Kosten von Kandidatenerzeugung und
Bewertung gegen spätere Nutzung amortisieren; Modellwechsel erneut evaluieren.
Nicht gleichzeitig CoT-Modul, Beispiele, Instruktionen und Testset verändern und dann
den Gewinn einer einzigen Maßnahme zuschreiben.

## 5. Token-, Kontext- und Kosteneffizienz unterscheiden

**Dokumentiert (S9):** Input-Tokenzählung hängt vom angegebenen Modell und vom strukturierten
Request ab; der Zähl-Endpunkt liefert eine Schätzung und deckt nicht alle Requestformen
ab. Tatsächliche Nutzung kann abweichen.

**Dokumentiert (S10):** Cache-Lesen, Cache-Schreiben und ungecachte Eingaben werden getrennt
gemeldet. Wiederverwendbare Präfixe und konkrete Produkt-/Modellbedingungen beeinflussen
Cache-Nutzen.

**Ableitung:** Keine Prozentersparnis aus Zeilen-/Wortverhältnissen ableiten.
Für lokale Ersatz-Tokenizer Schätzstatus und Tokenizer-Version ausweisen.
Kürzung kann Qualität, Auswahlverhalten, Referenzabrufe und Cache-Nutzung verändern.

Vorgeschlagene Messfelder: Provider/Modell/Clientversion, Skill-Hash, Eingabe-/Ausgabetokens,
Cache-Lese-/Schreibtokens soweit verfügbar, Summen über alle Wiederholungen,
Optimierungsaufwand, Latenz, Abnahmequote und Kosten pro akzeptierter Aufgabe.
Bei Abo-Runtimes fehlende Kosten als unbekannt führen. Keine hypothetische API-Rechnung
als tatsächlich angefallenen Betrag ausgeben.

## 6. Öffentliche Harness-Verträge statt unbelegter Interna

**Dokumentiert (S11):** Es gibt öffentliche allow/ask/deny-Regeln; deny wird vor ask und
allow ausgewertet. **Dokumentiert (S12):** Hooks haben veröffentlichte Ereignisse und
Steuerungsverträge.

Das belegt allgemeine Anforderungen an Berechtigungen und Lifecycle.
Es belegt weder die interne Dispatcher-Architektur noch pauschal feste Kontextquoten,
Memoisierungsdetails oder Rekursionstiefen aus dem auffälligen Harness-Dossier.

**Ableitung:** Solche Detailbehauptungen aus der normativen Rewrite-Spec fernhalten,
bis eine unbedenkliche öffentliche Quelle oder ein eigener Versuch sie trägt.
Für Skills und geladene Skripte gilt: Verhaltensempfehlungen verleihen keine
Ausführungsrechte. Ein Prompt ist kein technischer Schutz gegen Shell-/Netzwerkzugriff.

## 7. Konkrete Ergänzungen für die Synthese

Die folgenden Anforderungen sind eigene Vorschläge, keine schon beschlossenen Vorgaben.

| ID | Vorschlag | Nachweis |
|---|---|---|
| WEB-R1 | Skill-, Referenz-, Modell-, Client- und Eval-Version je Run binden | Ergebnis lässt sich eindeutig zuordnen |
| WEB-R2 | Discovery, Trigger, Verhalten und Regression getrennt ausweisen | Getrennte Fallmengen und Resultate |
| WEB-R3 | Optimierung nur als Kandidat mit unveränderter Baseline | Quelle bleibt bis zu expliziter Übernahme unverändert |
| WEB-R4 | Testdaten vor Kandidatensuche abtrennen | Keine Auswahl nach finalen Testergebnissen |
| WEB-R5 | Inhaltliche Erfolgskriterien statt Keyword-/Längenoptimierung | Falsche wortreiche Antwort fällt durch |
| WEB-R6 | Tatsächliche Usage, Schätzung und unbekannte Kosten unterscheiden | Messbericht nennt Quelle und Einheit |
| WEB-R7 | Gesamten Auftrag inklusive Nacharbeit und Optimierung rechnen | Kosten pro akzeptiertem Ergebnis |
| WEB-R8 | Kritische Rechte- und Antwortregeln als harte Regressionen | Timeout erzeugt keine Zustimmung; fremde Inhalte ändern keine Rechte |
| WEB-R9 | Kandidaten und Ergebnisse begrenzt und reversibel verwalten | Hashgebundene Übernahme, Vorzustand und Rücknahmepfad |
| WEB-R10 | Öffentliche Verträge von unbelegten Interna unterscheiden | Jede normative Forderung hat geeignete Herkunft oder eigene Begründung |

## 8. Kleine nächste Versuche

1. **Grilling-Auswahl:** wenige positive/negative Nutzerprompts in frischer Session;
   Discovery und Auswahl getrennt protokollieren.
2. **Grilling-Verhalten:** unabhängige/abhängige Fragen, Teilantwort, Timeout und
   Antwortkorrektur. Zustände und gespeicherte Antworten gegen erwartetes Verhalten prüfen.
3. **Kompression:** Original und kürzere eigene Variante auf denselben Aufgaben,
   inklusive gleichbleibender Tools und Retrieval-/Referenzkosten vergleichen.
4. **Später Optimierung:** erst mit belastbarer Baseline APE-artige Kandidatensuche oder
   GEPA-Adapter isoliert prüfen. Training/Variantenwahl/Test und Budgets vorher festlegen.

Nicht ausgeführt. Vor externen Modellläufen Zugang, Datenklasse und tatsächliches Budget
klären. Grilling klärt Nutzerpräferenzen; Recherche beantwortet technische Fakten.
Eine Pflicht zu wiederholten Interviews entsteht daraus nicht.

## Offene Punkte

- Die Web-Prüfung bestätigt keine Lizenzkorrektur in den zwölf Forks.
- Fehlende LICENSE oder ungeklärte Herkunft bleiben vor Text-/Codeübernahme separat zu klären.
- Die zwölf Dossiers sind weiterhin nötig; diese Gegenprüfung ersetzt deren Codelektüre nicht.
- Live-Client-Evals, Tokenzählung und Leistungs-/Kostengewinne sind nicht gemessen.
- DSPy als Dependency oder Teil des Produktkerns ist nicht beschlossen; ein externer
  Optimierungsworker hinter dem vorhandenen Run-/Artefaktmodell wäre der erste Prüfkandidat.
