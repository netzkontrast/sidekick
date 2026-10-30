---
name: specifying-behavior
description: Beschreibe beobachtbares Verhalten als prüfbare Spezifikation mit stabilen Anforderungs-IDs, Zuständen, Fehler- und Grenzfällen, synthetischen Beispielen und daraus abgeleiteten Vertragsfällen. Nutze diesen Skill bei „spezifiziere das Verhalten“, „schreib die Spec vor dem Code“, „Akzeptanzkriterien festlegen“, „welche Fehlerfälle muss das abdecken“, „write a behavior spec“, „define acceptance criteria“ oder „specify edge cases before coding“. Nicht für Implementierung, Zerlegung in Arbeitspakete, Repo-Recherche, Entscheidungsreviews, das Klären offener Präferenzen oder reine Textkorrekturen.
---

# Verhalten spezifizieren

1. Lies Projektregeln, Spec-Konvention (Ablage, ID-Schema, Schema- und Beispielformat) sowie vorhandene Specs, Antworten und Entscheidungen. Übernimm die Konvention; erfinde keine Ablage. Vergebene IDs nie umnummerieren.
2. Grenze Gegenstand, Beteiligte und Nicht-Ziele ein. Beschreibe, was von außen beobachtbar ist, nicht wie es gebaut wird.
3. Trenne Vorgaben, belegte Befunde und Annahmen. Lege offene Präferenz- oder Entscheidungsfragen nicht selbst fest: vermerke sie mit Bezug und markiere betroffene Anforderungen als vorläufig.
4. Schreibe jede Anforderung als einzelnen prüfbaren Satz mit stabiler ID: Zustand oder Auslöser, wer reagiert, beobachtbare Reaktion. Gib unerwünschtem Verhalten eigene Anforderungen: ungültige Eingabe, fehlende Fähigkeit, Timeout, Abbruch, Konflikt.
5. Beschreibe Zustände und erlaubte Übergänge als Tabelle mit Autorität und Beispiel. Nenne Endzustände und unklare Ausgänge ausdrücklich; ein unklarer Ausgang zählt nie als Erfolg.
6. Ergänze Datenstrukturen im Schemaformat des Projekts. Beispiele sind synthetisch, frei von Secrets und echten Personendaten und nennen die IDs, die sie abdecken.
7. Leite je Anforderung mindestens einen Vertragsfall ab (Normal-, Grenz- oder Fehlerfall) mit Ausgangslage, Ereignis und deterministisch prüfbarer Erwartung. Fälle verweisen auf IDs, statt Anforderungstext zu wiederholen.
8. Prüfe Rückverfolgbarkeit: jede ID hat einen Fall, jeder Fall eine existierende ID, Beispiele passen zum Schema. Nutze vorhandene Prüfwerkzeuge; fehlen sie, benenne die Lücke statt ein Ergebnis zu behaupten.
9. Liefere Spec-Änderung, Fallliste, offene Fragen und vorläufige IDs als Eingabe für Planung und Tests. Die Spec bleibt Entwurf bis zur Review nach Projektregel; sie erteilt keine Rechte zu Implementierung, Merge oder Wirkung.

Nutze vorhandene Vorlagen; sonst öffne [Spec-Eintrag](references/spec-entry.md). Keine Implementierung und keine fremden Texte in die Spec.
