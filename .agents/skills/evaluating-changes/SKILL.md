---
name: evaluating-changes
description: Bewerte, ob eine einzelne Änderung an Prompts, Skills, Auswahlregeln oder Agent-Konfiguration gegenüber einer eingefrorenen Baseline tatsächlich besser ist. Trennt Auswahl, Verhalten, Ergebniswirkung und Zusammenspiel, schützt Testdaten vor Lecks und rechnet den Gesamtaufwand. Nutze bei „ist die neue Variante besser“, „Kandidat gegen Baseline vergleichen“, „Eval-Ergebnisse auswerten“, „A/B-Test für den Skill“, „compare candidate against baseline“, „did this prompt change help“. Nicht zum Erzeugen oder Optimieren von Kandidaten, für Code-Reviews, allgemeine Statistikfragen oder die Freigabe einer Änderung.
---

# Änderungen evaluieren

1. Lies Ziel, Baseline- und Kandidatenstand mit Hashes, Fälle, Rubrik und Messrahmen. Unterscheiden sich mehr als eine Sache oder Laufzeit, Modell, Werkzeuge oder Eingaben, stoppe mit „nicht vergleichbar“ und nenne die Unterschiede.
2. Prüfe die Daten vor jeder Bewertung: Splits nach Ursprungsfamilie vorab festgelegt, Paraphrasen in derselben Familie, Testfälle vom Kandidatenautor ungesehen und noch nicht für eine Auswahl verbraucht. Führe Pflichtregressionen getrennt vom unabhängigen Test.
3. Werte jede Ebene nur aus ihren eigenen Läufen: Format, Auffindbarkeit, Auswahl ohne expliziten Aufruf, Verhalten mit geladenem Skill, Wirkung gegenüber Baseline, Übergaben, harte Regeln.
4. Nutze nur gespeicherte Rohresultate. Fehlende Spuren, Fehlerläufe und nicht beobachtbare Aktivierungen bleiben unbekannt.
5. Prüfe Kritisches mit deterministischen Assertions. Ein Modellurteil zählt nur mit fixierter Version und Rubrik, menschlicher Stichprobe und nie allein durch den Kandidatenautor. Länge und Überzeugungskraft sind kein Treffer; jeder Verstoß gegen harte Regeln blockiert.
6. Berichte gepaart je Fall besser, gleich oder schlechter mit Zähler, Nenner, Familien und Wiederholungen. Bei kleinen Stichproben nur beschreiben; keine Signifikanz ohne tragfähige Annahmen.
7. Rechne den Aufwand je akzeptiertem Ergebnis: Usage samt Cache, Fehlversuche, Nacharbeit, Bewertungs- und Optimierungsläufe, Längenzuwachs. Kennzeichne gemeldet, geschätzt, unbekannt; keine Ersparnis aus angenommenen Aufgabenmischungen.
8. Empfiehl verwerfen, mit neuen unabhängigen Fällen weiter prüfen oder zur Aktivierung vorlegen, jeweils mit Rücknahmepfad und betroffenen abhängigen Artefakten. Nutze die [Berichtsform](references/comparison-report.md), wenn keine Projektvorlage existiert. Aktiviere nichts und ändere weder Rubrik noch Fälle.
