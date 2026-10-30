# SL-A05 – specifying-behavior

## 1. Kopf

> **ID:** SL-A05 · **Stand:** 30.10.2026 · Teil von SL2 im [Library-Research-Plan](library-research-plan.md) §4 · **Entwurf zur Review**.
> **Gelesene Stände:** Sidekick `e87cd30`; V0-Spec-Entwurf `origin/spec/v0-ziel-und-vertraege` `2c4733e0` (`docs/spec/README.md`, `v0-ziel-und-vertraege.md` §2–§7; **Entwurf**, nicht gemergt);
> Fremd-Repos an den SHAs aus [README](README.md#untersuchte-repositories). Externe Methodenquellen am 30.10.2026 über Websuche gelesen (Auszüge, keine Volltextprüfung).
> **Evidenz:** *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*. Kein Modelllauf; der Skill-Entwurf ist **nicht praktisch geprüft**.

## 2. Nutzerfall

Vor einer Verhaltensänderung (AGENTS.md: „Spec-driven“) soll beobachtbares Verhalten so beschrieben werden, dass Planung und Tests darauf verweisen können:
stabile Anforderungs-IDs, Zustände, Fehlerfälle, Schemas und synthetische Vertragsfälle. Heute macht das der Mensch mit dem Agenten ohne Skill; V0 ist so entstanden.

## 3. Trigger / Nicht-Trigger

- **Trigger:** „Spezifiziere das Verhalten“, „Akzeptanzkriterien/Fehlerfälle festlegen“, „write a behavior spec“, „define acceptance criteria before coding“.
- **Nicht-Trigger:** Implementierung einer Spec; Zerlegung einer fertigen Spec in Pakete (→ planning-work-packages); offene Präferenzen klären (→ grilling); Optionen bewerten (→ reviewing-decision-gates); Tippfehler in einer Spec.
- **Konkurrenzfälle:** „Plane und spezifiziere Feature X“ (zulässige Menge {specifying-behavior, planning-work-packages}, Reihenfolge laut Plan §6: erst Spec).

## 4. Eingabe / Ausgabe

| Richtung | Artefakt | Von / an |
|---|---|---|
| Eingabe | Ziel, beantwortete Fragen (IDs), Befunde mit Evidenz, bestehende Spec-Konvention und IDs | grilling, researching-repositories, Projektregeln |
| Ausgabe | Spec-Änderung mit Anforderungs-IDs, Zustandstabelle, Schema-Änderung, synthetische Beispiele, Fallliste (ID → Fall), offene Fragen/vorläufige IDs | planning-work-packages (Abnahme verweist auf IDs), A07 testing-system-boundaries (Fälle), reviewing-decision-gates (IDs als Kriterien) |

## 5. Voraussetzungen und erlaubte Weitergabe

Lesen der Projektregeln und vorhandener Specs; Schreibrecht nur auf die Spec-Ablage im Rahmen des Auftrags. Der Skill verleiht keine Rechte: Eine geschriebene Spec ist ein Entwurf bis zur Review/Merge nach Projektregel (Kern I3); sie autorisiert keine Implementierung und keinen Effekt (V0-INV-07).
Weitergegeben werden nur IDs und Fälle, keine Kopien des Anforderungstexts (sonst Doppelpflege).

## 6. Forschungsfragen (Plan §4)

**F1 – Welche Methode beschreibt beobachtbares Verhalten, Zustände und Fehler kompakt?**
Verglichen (Lektüre, kein Versuch):
- **EARS** – fünf Satzmuster (immer, *While* Zustand, *When* Ereignis, *Where* Variante, *If/Then* unerwünschtes Verhalten) mit fester Reihenfolge ([Mavin, offizielle Seite](https://alistairmavin.com/ears); [Paper 2009](https://ccy05327.github.io/SDD/08-PDF/Easy%20Approach%20to%20Requirements%20Syntax%20(EARS).pdf)), *dokumentiert*. Stärke: Fehlerverhalten bekommt eine eigene Form.
- **Gherkin** – Given/When/Then, *Scenario Outline* mit *Examples*-Tabellen, Tags können auf externe Anforderungs-IDs verweisen; Szenarien sollen das Was, nicht das Wie beschreiben ([Referenz](https://cucumber.io/docs/gherkin/reference), [Better Gherkin](https://cucumber.io/docs/bdd/better-gherkin), [Tags](https://cucumber.io/docs/cucumber/api)), *dokumentiert*. Stärke: Beispiel = Test. Schwäche: neue Werkzeugkette (Dependency, erst fragen).
- **V0-Konvention** – IDs `V0-<Bereich>-<nn>`, nie umnummern; Zustandstabellen mit Spalte „Autorität“ und Beispiel; Fallmatrix als spätere Contract-Tests; JSON Schema 2020-12 plus synthetische Beispiele (*dokumentiert*, Entwurf PR #8).

Ergebnis (eigene Ableitung): Die V0-Konvention trägt bereits Zustände, Autorität und Fehlerfälle. Ergänzend nützt EARS als **Satzform** für einzelne Anforderungen (besonders *If/Then* für ungültige Eingabe, Timeout, Abbruch). Gherkin bleibt optionale Darstellung der Fälle, keine Pflicht. Der Skill schreibt keine Methode fest, sondern übernimmt die Projektkonvention und nennt nur Mindestinhalte.

**F2 – Anforderung, Schema, Beispiel und Test ohne Doppelpflege verbinden.**
- Jede Tatsache hat genau einen Ort: Text in der Spec (ID), Struktur im Schema, konkrete Werte im Beispiel, Erwartung im Fall. Beispiele und Fälle **verweisen** auf IDs (Gherkin-Tags zeigen dasselbe Muster, *dokumentiert*).
- JSON Schema kennt `examples` als Annotation; Einträge *sollen* validieren, müssen aber nicht ([Annotations](https://json-schema.org/understanding-json-schema/reference/annotations)), *dokumentiert* → Validierung der Beispiele gegen das Schema ist ein eigener deterministischer Check.
- Rückverfolgbarkeit (jede ID ≥ 1 Fall, jeder Fall → existierende ID, IDs eindeutig, nie umnummeriert) ist **deterministisch lösbar** und gehört zum Validator (K1.2) bzw. SL7, nicht in Modellverhalten.
- Gegenbeispiel aus dem Bestand: Dokumentiertes und geparstes Kettenformat weichen ab, zwei Ketten ergeben still 0 Schritte (claude-prompts-mcp, *praktisch nachgewiesen* im [Dossier](repos/claude-prompts-mcp.md)) → „Format und Parser aus einer Quelle; Ladefehler sichtbar“ (K3.3).

## 7. Beitrag der verfügbaren Repos

| Repo | Konzept | Fundstelle | Umgang |
|---|---|---|---|
| dspy-advanced-prompting | Signatur mit typisierten Ein-/Ausgabefeldern; Ausgabeschema enthält Pflichtfeld „Beispiel“ direkt neben den Abschnitten | [structured_output.py L32–46](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/techniques/structured_output.py#L32-L46), *im Code gefunden* | **Anforderung** (K2.4): Skill-Ein-/Ausgaben als Signatur beschreiben; ob das Beispiel gegen das Schema geprüft wird, ist dort *offen* |
| dspy-advanced-prompting | Testfall mit ID, Typ (funktional, Grenzfall, adversarial, Regression …), Eingabe, Erwartung, Kriterien | [evaluation_framework.py L24–58](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/evaluations/evaluation_framework.py#L24-L58), *im Code gefunden* | **Anforderung:** Falltyp als Feld; Fall verweist zusätzlich auf Anforderungs-ID (fehlt dort) |
| claude-prompts-mcp | Kettenschritt mit Ein-/Ausgabe-Mapping; fehlende Eingabe nur als Warnung, Schritt läuft weiter | [types/index.ts L79–84](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/types/index.ts#L79-L84), [prompt-executor.ts L218–229](https://github.com/netzkontrast/claude-prompts-mcp/blob/7e1fb3f02a226b232464a5ae98132d25344813dd/server/src/orchestration/prompt-executor.ts#L218-L229), *im Code gefunden* (Executor ohne Aufrufer laut Dossier) | **Anforderung (Gegenbeispiel):** fehlende Pflichteingabe ist ein spezifizierter Fehlerfall, kein stilles Weiterlaufen; an SL3 |
| prompt-engineering-skill (eigenes Material) | Mindest-Testfälle: Normal, Grenz, Fehler, mehrdeutig, Stress | [antipatterns.md L391–397](https://github.com/netzkontrast/prompt-engineering-skill/blob/eec9ca5c9c99c9baaa1e5104374139771224fd3f/prompt-engineering/references/antipatterns.md#L391-L397), *dokumentiert* | **übernehmen** als Fallklassen (eigenes Material, sinngemäß) |
| agentic-harness-patterns-skill | – | – | **zurückstellen**; kein Spec-Beitrag, Herkunft problematisch |
| recursive-decomposition-skill | Vorab definiertes Ergebnisschema für Teilaufgaben | [Dossier](repos/recursive-decomposition-skill.md) RD-R3 | **zurückstellen** für A05; relevant für SL3-Übergaben |

## 8. Grenzen

Der Skill kann Vollständigkeit nicht beweisen; er erzeugt Kandidaten-Anforderungen, die eine Review braucht. Rückverfolgbarkeit und Schema-Validierung sind ohne Validator nur behauptet. Die Spec-Konvention des Projekts ist selbst noch Entwurf (PR #8); der Skill darf sie nicht als verbindlich ausgeben. Ob ein Client den Skill getrennt von planning-work-packages auswählt, ist *offen* (M2).

## 9. Minimalversuch (synthetisch, nicht ausgeführt)

Plan-Nachweis „Spec für Skill-Aufruf mit ungültigem Input, Rückfrage und Abbruch“. Fixture-Familie `spec-skill-call`: fiktives Projekt mit ID-Schema `<P>-<Bereich>-<nn>`, ein Skill mit Pflichteingabe `ziel`.
Erwartete Ausgabe: ≥ 3 Anforderungen (ungültige Eingabe → sichtbare Ablehnung ohne Teilwirkung; Rückfrage → Zustand „wartet“, keine Default-Antwort; Abbruch → eigener Endzustand, kein Erfolg), Zustandstabelle mit Autorität, je ID ≥ 1 Fall, ein synthetisches Beispiel mit ID-Verweis.
Erfolg: SB-01 deterministisch prüfbar über ID-Liste und Fallverweise (Skript zählt Verweise). Abbruch: Ausgabe enthält Code/Implementierung oder legt eine offene Frage fest → Fehlschlag, kein Rubrik-Ausgleich. Ausführung erst in SL5 im Budgetrahmen; heute *offen*.

## 10. Entscheidung

***ergänzen*** (neuer portabler Skill) plus ***deterministisch lösen*** für ID-Eindeutigkeit, Rückverfolgbarkeit und Beispiel-gegen-Schema (Validator, SL7). Aktivierung erst nach Review der Spec-Konvention aus PR #8; der Skill liest die Konvention aus dem Projekt und bleibt davon unabhängig.

## 11. Skill-Entwurf `specifying-behavior` (nicht aktiv, nicht geprüft)

```markdown
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
```

Rumpf 254 Wörter, Beschreibung 598 Zeichen (lokal mit `split()`/`len()` gezählt; keine Tokens, kein Validator).

**Referenz `references/spec-entry.md` (Entwurf):**

```markdown
# Spec-Eintrag <Gegenstand>
Version / Status: <Entwurf | in Review | gültig>   Bezug: <Fragen-/Entscheidungs-IDs>
Ziel / Nicht-Ziele:
Anforderungen: | ID | Zustand/Auslöser | beobachtbare Reaktion | vorläufig? |
Zustände: | ID | Zustand | Übergang hinein | Autorität | Beispiel |
Fehlerfälle: ungültige Eingabe · fehlende Fähigkeit · Timeout · Abbruch · Konflikt · unklarer Ausgang
Schema-Änderung: <Datei, Version, kompatibel ja/nein>
Fälle: | Fall-ID | Typ (normal/grenz/fehler) | deckt IDs | Ausgangslage | Ereignis | Erwartung |
Rückverfolgbarkeit: geprüft mit <Werkzeug> | nicht geprüft (Lücke)
Offene Fragen:
```

**Evaluationsfälle (Familien in Klammern; Split-Zuordnung vor Lauf nach SL1 §5.5):**

```json
[
 {"id":"SB-01","prompt":"Spezifiziere, wie sich ein Skill-Aufruf bei ungültiger Eingabe, Rückfrage und Abbruch verhält.","expected_skill":"specifying-behavior","fixture":"Projektkonvention: IDs <P>-<Bereich>-<nn>, JSON Schema, synthetische Beispiele; keine bestehende Spec zum Skill-Aufruf. (spec-skill-call)","assertion":"Eigene Anforderungs-IDs für ungültige Eingabe, Rückfrage und Abbruch; Abbruch ist kein Erfolg; jede ID hat mindestens einen Fall; kein Code."},
 {"id":"SB-02","prompt":"Write a behavior spec with acceptance cases for the CSV import before we code it.","expected_skill":"specifying-behavior","fixture":"Bestehende Spec mit IMP-01..IMP-03; Frage zum Trennzeichen offen, keine Antwort. (spec-csv-import)","assertion":"IMP-01..03 unverändert, neue IDs angehängt; Trennzeichen als offene Frage, betroffene Anforderung vorläufig; keine Festlegung."},
 {"id":"SB-N1","prompt":"Implementiere V0-FALL-12 laut gemergter Spec.","expected_skill":null,"fixture":"Spec gemergt, Fall vollständig beschrieben. (spec-implement-near-miss)","assertion":"specifying-behavior nicht laden; Spec nicht neu schreiben."},
 {"id":"SB-N2","prompt":"Zerlege die gemergte Import-Spec in Arbeitspakete.","expected_skill":"planning-work-packages","fixture":"Spec mit IDs und Fällen vorhanden. (spec-plan-competition)","assertion":"Planung statt neuer Spec; Pakete verweisen auf vorhandene IDs."}
]
```
