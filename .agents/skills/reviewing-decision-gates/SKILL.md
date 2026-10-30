---
name: reviewing-decision-gates
description: Prüfe, ob Belege eine Projekt- oder Architekturentscheidung tragen. Nutze diesen Skill bei Entscheidungsreviews, Build-vs-Buy, Optionsvergleichen, Go/No-Go, Phasenfreigabe oder 'are we ready to decide'. Nicht für allgemeines Brainstorming oder ein reines Code-Review.
---

# Entscheidungen prüfen

1. Lies Entscheidungsfrage, Kriterien, Optionen, Grenzen und vorhandene Belege, dazu wer laut Projektregeln entscheiden darf und den aktuellen Status an der kanonischen Stelle. Prüfe die benannte Entscheidung, nicht das gesamte Projekt. Fehlen Kriterien, schlage sie ausdrücklich als vorläufig vor.
2. Trenne harte Ausschlüsse von Präferenzen. Ordne jedem entscheidenden Kriterium Befund, Quelle/Version, Evidenzstufe und verbleibende Unsicherheit zu.
3. Prüfe Aktualität, Vergleichbarkeit und Gegenbelege. Eine dokumentierte Funktion ist kein bestandener Praxistest. Unbekannt bedeutet weder bestanden noch gescheitert. Fehlende Evidenz nicht durch Scores verdecken. Ist ein tragender Befund seit einer früheren Empfehlung korrigiert oder veraltet, markiere diese Empfehlung als prüfpflichtig, statt sie zu übernehmen. Fehlende Vergleichsbasis gilt als offen.
4. Bewerte Alternativen unter denselben Randbedingungen, einschließlich Status quo, wenn sinnvoll. Rechne gewichtete Scores nur mit expliziten Gewichten und belegten Werten; harte Ausschlüsse übersteuern Summen. Lege Gewichte vor Einsicht in die Befunde fest oder kennzeichne sie als nachträglich; setze Unbekanntes nie als Zahl ein, nutze Spannen statt Scheinpunkte und prüfe, ob eine plausible Gewichtsänderung die Rangfolge kippt.
5. Gib eine Empfehlung mit Status: **entscheidungsreif**, **weiterer Nachweis nötig** oder **unter aktuellen Bedingungen nicht tragfähig**. Benenne tragende Gründe, Folgen und Bedingung für spätere Neubewertung. Weise Empfehlung, Entscheidung und Ausführungsbefugnis getrennt aus („Entscheider: offen“ oder benannt mit Quelle); „entscheidungsreif“ ist keine Entscheidung.
6. Bei Lücken: benenne den kleinsten entscheidungsrelevanten Versuch samt Abnahme und Zeit-/Aufwandsgrenze, soweit bekannt. Schließe nachrangige Fragen nicht vorsorglich alle auf.
7. Führe den Status nur an der kanonischen Stelle des Projekts; melde abweichende Indizes, statt sie still anzugleichen.

Verwende das vorhandene Entscheidungsformat; sonst öffne [Reviewform](references/review.md). Ändere verbindliche Entscheidungen nur im autorisierten Rahmen. Eine Empfehlung ist keine Freigabe zur Ausführung.
