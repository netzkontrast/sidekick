# SL-A09 – consolidating-knowledge

> ID **SL-A09** · Stand 30.10.2026 · Bereichsrecherche SL2 im [Library-Research-Plan](library-research-plan.md) · **Entwurf zur Review**.
> Gelesene Stände: Sidekick `e87cd30` (dieser Branch); V0-Spec nur als Entwurf von `origin/spec/v0-ziel-und-vertraege` [`2c4733e0`](https://github.com/netzkontrast/sidekick/blob/2c4733e0a0b52e801fe940d7e3889bdb7dfb9ac1/docs/spec/v0-ziel-und-vertraege.md) (§4.8 V0-ERI, V0-INV-10/-11, V0-FALL-15, [`erinnerung.schema.json`](https://github.com/netzkontrast/sidekick/blob/2c4733e0a0b52e801fe940d7e3889bdb7dfb9ac1/docs/spec/schemas/erinnerung.schema.json)); Fremd-Repos an den SHAs aus [README](README.md#untersuchte-repositories), lokal auf dieselben SHAs geprüft.
> Evidenz: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*; *Ableitung* = eigene Schlussfolgerung. In dieser Arbeit wurde kein Modell, kein Fremdcode und kein Test ausgeführt.

## 1. Nutzerfall

Nach einem Auftrag liegen Antworten, Entscheidungen, Messergebnisse, Korrekturen und Agent-Zusammenfassungen vor. Jemand will daraus überprüfbare Wissenskandidaten machen (Fakt, Vorliebe, Projektregel, offenes Vorhaben), Widersprüche zu bestätigtem Wissen sehen, Korrekturen nachvollziehbar führen und getrennt entscheiden, was als Übungsfall an Evaluation (A08) oder Optimierer gehen darf. Im Hub ist das V0-ABL-01 Schritt 12 und Vision §12.1 (`knowledge.propose` → Review).

## 2. Trigger / Nicht-Trigger

- **Trigger:** „Was haben wir gelernt?“, „Erkenntnisse festhalten“, „Erinnerung vorschlagen“, „Wissen konsolidieren“, „lessons learned“, „propose memory entries“, „consolidate findings“.
- **Nicht-Trigger:** ganzen Chatverlauf speichern; persönliche Notiz ohne Quelle; Faktenrecherche; verbindliche Regel direkt ändern; einen bestehenden Eintrag nur nachschlagen.

## 3. Eingabe / Ausgabe

| Richtung | Inhalt | Von / an |
|---|---|---|
| Eingabe | Belegte Ausgangspunkte (Antwortprotokolle aus A01, Befunde aus A02, Entscheidungen aus A04, Vergleichsberichte aus A08), bestätigte Einträge im Geltungsbereich, Datenklasse | A01, A02, A04, A08 |
| Ausgabe | Kandidatenliste im Erinnerungsformat (Quelle mit Fundstelle, Art, Geltungsbereich, Gültigkeit, Zustand `candidate`, Trainingsfreigabe `false`) | Owner zur Bestätigung; danach Kontextpakete (nur `confirmed`) |
| Ausgabe | Konflikte, prüfpflichtige Folgeartefakte, verworfene Hinweise mit Grund; optional Übungsfall-Vorschläge | Owner; nach Freigabe A08 (Fallpflege mit `family_id`/Split) |

## 4. Voraussetzungen und erlaubte Weitergabe

Der Skill schlägt nur vor. Bestätigen, korrigieren, verwerfen und zurückziehen darf nur der Owner (V0-ERI-02…05, Entwurf). Schweigen ist keine Zustimmung. Rohsessions, Secrets und `local-only`-Inhalte gehen nicht in Kandidaten, Repo oder an Optimierungsdienste (Plan §7, V0-INV-09/-11); Inhalte werden referenziert, nicht kopiert. Übungsfälle nur aus synthetischen oder freigegebenen Repo-Artefakten ([Owner-Antwort Feedbackdaten](../../docs/fragen/skill-library/questions/Q-20261030-sl-feedbackdaten.md)).

## 5. Antworten auf die Forschungsfragen (Plan §4)

**F1 – Was darf aus Sessions zu Wissen und was zu Trainingsbeispielen werden?** Wissen: nur Aussagen mit mindestens einer überprüfbaren Quelle, als Kandidat bis zur Owner-Bestätigung (V0-INV-10, Schema `quellen.minItems: 1`, *dokumentiert* im Entwurf). Hypothesen, Entwürfe und Agent-Berichte bleiben Arbeitsnotizen (Vision §12.1). Eine Zusammenfassung ist keine Quelle, sondern ein Hinweis, der gegen das Original geprüft wird (*Ableitung*). Übungsfälle sind eine **getrennte** Freigabe (`trainingsfreigabe`, in V0 immer `false`): Datenklasse zulässig, Eingabe und erwartetes Ergebnis getrennt (DSPy-Datenmodell, *dokumentiert*, P4), Ursprungsfamilie und Split vor jeder Nutzung (SL1 §5.5). Nutzerfeedback ist ein Signal, kein objektives Label (Plan §7). Ein gespeicherter Fakt ist kein Modelltraining (Plan §3).

**F2 – Herkunft, Widerspruch, Gültigkeit, Korrektur und Rückzug.** Herkunft: Quelle mit Art, Referenz und Fundstelle; bei Artefakten zusätzlich Version/Hash (*Ableitung*, analog Hash-Bindung in skills-optimizer). Widerspruch: Zustand `conflicted`, beide sichtbar, Owner entscheidet (V0-ERI-06); nichts wird überschrieben. Gültigkeit: Geltungsbereich und `gueltig_bis`; Alter allein ist kein Rückzugsgrund. Gegenbeispiel: skill-cost-optimizer lässt Gedächtniseinträge nach zwei Wochen entfernen (*dokumentiert*, Prompt-Regel). Korrektur: neue Fassung `superseded` mit Verweis auf die alte; abhängige Fälle, Entscheidungen und Kontextpakete werden prüfpflichtig (*Ableitung*, analog Grilling Schritt 7). Rückzug: `withdrawn` wirkt deterministisch im Kern; Index, Caches und neue Kontextpakete folgen (V0-FALL-15). Rückzug aus bereits trainierten Gewichten ist ein anderes Problem und bleibt ausgeschlossen, solange nicht trainiert wird (Plan §7). Ob abgeleitete Übungsfälle beim Rückzug automatisch gesperrt werden, ist *offen* (SL4).

## 6. Beitrag der verfügbaren Repos

| Repo | Konzept | Fundstelle | Umgang |
|---|---|---|---|
| agentic-harness-patterns-skill | Getrennte Speicherschichten; Übernahme in kuratierte Regeln nur mit Freigabe | [memory-persistence L11–39](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/references/memory-persistence-pattern.md#L11-L39) (*dokumentiert*) | Nur als bestehende Anforderung K8.3; Text nicht übernehmen (Herkunft auffällig) |
| skill-cost-optimizer | Altersbasiertes Löschen ohne Inventar | [SKILL.md L664](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/SKILL.md#L664) | Als Negativregel: Ablauf nur über vereinbarte Gültigkeit |
| skills-optimizer | Hashgebundenes Inventar dessen, was erhalten bleiben muss | [Skript L510–525](https://github.com/netzkontrast/skills-optimizer/blob/f8082b57b3138260e9e45767fd6229711362678b/.claude/skills/semantic-compressor/scripts/semantic_compressor.py#L510) | Als Anforderung: Kandidat bindet Quellversion; Korrektur prüft erneut |
| eigener Pilot-Helfer | Spur-Normalisierung ohne private Denktexte und freie Ausgaben | [test_skill_pilot.py L116–134](test_skill_pilot.py) | Muster für Datenminimierung (V0-INV-11) |
| dspy-advanced-prompting, skill-optimization, APE, GEPA | Trainingsdaten- und Split-Disziplin nur indirekt | siehe [A08](area-evaluating-changes.md#6-beitrag-der-verfügbaren-repos) | Gilt für Übungsfälle über A08 |

## 7. Grenzen

Der Skill kann Löschpfade, Kontextfilter und Datenklassen nicht erzwingen; das ist Kernaufgabe. Er erkennt nur Widersprüche zu Einträgen, die er sieht. Der Erinnerungsvertrag ist ein unreviewter Entwurf. Kein Training aus Erinnerungen in V0.

## 8. Minimalversuch (synthetisch, nicht ausgeführt)

Fixture: synthetisches Antwortprotokoll Q-1 (Option A „zuerst kleiner messbarer Versuch“), eine Agent-Zusammenfassung, die fälschlich Option B nennt, und eine spätere Owner-Korrektur „gilt nur bei Technikvergleichen“; ein aus der alten Fassung abgeleiteter Eval-Fall.

| Fall | Situation | Soll (deterministisch prüfbar) |
|---|---|---|
| KN-01 | Belegte Beobachtung | Kandidat validiert gegen `erinnerung.schema.json` (Entwurf); Quelle Q-1 mit Fundstelle; `candidate`; `trainingsfreigabe: false` |
| KN-02 | Falsche Zusammenfassung | Kein Kandidat aus der Zusammenfassung; Abweichung zu Q-1 gemeldet; kein Zustand `confirmed` (vgl. R-05) |
| KN-03 | Spätere Korrektur | Neue Fassung mit `ersetzt` auf alte; abgeleiteter Eval-Fall als prüfpflichtig gemeldet; alte Fassung nicht als aktuell vorgeschlagen |

B0 gegen B1, je Fall ein Start: 6 Starts, außerhalb des 40er-Pilots. Erfolg: B1 erfüllt 3/3, 0 Selbstbestätigungen. Abbruch/Nullergebnis: B0 gleichwertig → kein Skill, nur Schema-Validator und Kernregeln.

## 9. Entscheidung

**Deterministisch lösen + ergänzen, Installation zurückgestellt.** Zustände, Quellenpflicht, Konfliktmarkierung, Rückzug und Kontextfilter gehören in den Kern (V0-ERI, SL3/SL7) samt Schema-Validator. Ein portabler Skill erzeugt nur Kandidaten. Installation erst nach Review von V0-ERI und dem Minimalversuch; Übungsfall-Freigabe und Training aus Erinnerungen bleiben bis SL4 zurückgestellt.

## 10. Skill-Entwurf `consolidating-knowledge`

```markdown
---
name: consolidating-knowledge
description: Verdichte Beobachtungen, Antworten und Korrekturen aus abgeschlossener Arbeit zu belegten Wissenskandidaten, die ein Mensch bestätigt, korrigiert oder verwirft. Prüft Herkunft, Widersprüche, Geltungsbereich und Rückzug und trennt Wissen von freigegebenen Übungsfällen. Nutze bei „was haben wir gelernt“, „Erkenntnisse festhalten“, „Erinnerung vorschlagen“, „Wissen konsolidieren“, „lessons learned“, „propose memory entries“, „consolidate findings“. Nicht zum Speichern ganzer Chatverläufe, für Notizen ohne Quelle, Faktenrecherche oder das direkte Ändern verbindlicher Regeln.
---

# Wissen konsolidieren

1. Lies Arbeitsregeln, Ablage und Zustandsmodell für Wissen sowie bestätigte Einträge im betroffenen Geltungsbereich. Fehlt eine Ablage, liefere Kandidaten nur in der Antwort.
2. Sammle nur überprüfbare Ausgangspunkte: ausdrückliche Antworten, Entscheidungen, versionierte Artefakte, Messergebnisse mit Rohdaten. Zusammenfassungen sind Hinweise; prüfe sie gegen das Original.
3. Formuliere je Kandidat eine knappe Aussage mit Art, Quelle samt Fundstelle und Version, Geltungsbereich, Gültigkeit und Datenklasse nach der [Kandidatenform](references/candidate.md). Ohne Quelle kein Kandidat. Keine Geheimnisse oder sensiblen Rohinhalte, nur Verweise.
4. Gleiche mit bestätigtem Wissen ab. Bei Widerspruch markiere beide Einträge und lege die Entscheidung vor; überschreibe nichts. Eine Korrektur wird eine neue Fassung mit Verweis auf die alte; nenne abhängige Einträge, Fälle und Entscheidungen als prüfpflichtig.
5. Behandle Rückzug vollständig: Zurückgezogenes erscheint in keinem neuen Kandidaten, Kontext oder Übungsfall. Alter ist kein Rückzugsgrund; Ablauf nur über vereinbarte Gültigkeit.
6. Trenne Wissen von Übungsfällen. Schlage einen Fall nur vor, wenn die Daten dafür freigegeben sind, Eingabe und erwartetes Ergebnis getrennt vorliegen und er vor Nutzung einer Ursprungsfamilie und einem Split zugeordnet wird. Standard: nicht freigegeben. Nutzerfeedback ist ein Signal, kein objektives Label.
7. Lege die Kandidaten dem Menschen zur Bestätigung, Korrektur oder Ablehnung vor. Bestätige nie selbst; Schweigen ist keine Zustimmung, Bestätigung erteilt keine Ausführungsrechte.
8. Liefere Kandidaten, Konflikte, prüfpflichtige Folgen und nicht aufgenommene Hinweise mit Grund.
```

Referenz `references/candidate.md` (Entwurf): Felder Kandidaten-ID · Version · ersetzt · Art (Fakt/Vorliebe/Regel/offenes Vorhaben) · Kurzaussage · Inhaltsverweis · Quellen (Art, Referenz, Fundstelle, Version/Hash) · Datenklasse · Geltungsbereich · gültig bis · Zustand (immer Kandidat) · Konflikt mit · Übungsfall-Freigabe (Standard nein) · prüfpflichtige Folgen.

Evaluationsfälle (Felder wie `skill-evaluation.json`; `fixture` entspricht dort `input`). IDs: CKN-P1, CKN-P2, CKN-N1, CKN-N2.

```json
[
  {"prompt": "Halte fest, was wir aus diesem Auftrag gelernt haben.", "expected_skill": "consolidating-knowledge", "fixture": "Synthetisch: Antwortprotokoll Q-1 wählt Option A; Agent-Zusammenfassung behauptet Option B.", "assertion": "Kandidat nur aus Q-1 mit Fundstelle; Abweichung der Zusammenfassung benannt; Zustand Kandidat, keine Selbstbestätigung."},
  {"prompt": "Consolidate these findings into memory entries; the owner corrected rule m-1 yesterday.", "expected_skill": "consolidating-knowledge", "fixture": "Bestätigte Regel m-1 v1; Owner-Korrektur 'gilt nur für Technikvergleiche'; ein Eval-Fall wurde aus m-1 v1 abgeleitet.", "assertion": "Neue Fassung verweist auf m-1 v1; abgeleiteter Fall prüfpflichtig; kein Übungsfall ohne Freigabe."},
  {"prompt": "Speichere den kompletten Chatverlauf dauerhaft ab.", "expected_skill": null, "fixture": "Persönliche Rohsession ohne Auswahl.", "assertion": "Skill nicht laden; Rohverlauf wird kein Wissenskandidat."},
  {"prompt": "Was steht in Entscheidung D-3?", "expected_skill": null, "fixture": "Entscheidung direkt lesbar.", "assertion": "Skill nicht laden; nachschlagen statt konsolidieren."}
]
```
