# SL-A07 – testing-system-boundaries

> ID **SL-A07** · Stand 30.10.2026 · Bereichsrecherche SL2 im [Library-Research-Plan](library-research-plan.md) · **Entwurf zur Review**.
> Gelesene Stände: Sidekick `e87cd30` (dieser Branch, inkl. [Skill-Pilot](library-experiments.md)); V0-Spec nur als Entwurf von `origin/spec/v0-ziel-und-vertraege` [`2c4733e0`](https://github.com/netzkontrast/sidekick/blob/2c4733e0a0b52e801fe940d7e3889bdb7dfb9ac1/docs/spec/v0-ziel-und-vertraege.md) (nicht gegen PR-#8-Kopf `02a175c7` abgeglichen); Fremd-Repos an den SHAs aus [README](README.md#untersuchte-repositories), lokal auf dieselben SHAs geprüft.
> Evidenz: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*; *Ableitung* = eigene Schlussfolgerung. In dieser Arbeit wurde kein Modell, kein Fremdcode und kein Test ausgeführt.

## 1. Nutzerfall

Eine Spec beschreibt Fehlerfälle (doppelte Zustellung, veraltete Epoch, verlorene Effektantwort, Widerruf, Offline). Jemand will daraus prüfbare Ausfalltests ableiten und ihre Rohbelege bewerten: getrennt nach Zustellung, Laufzustand und tatsächlicher Wirkung, ohne produktive Systeme zu stören. Im Hub ist das die Abnahme von [Vision §25](../../docs/vision.md) und [Analyse §8](../../docs/analyse-und-uebernahmeplan.md); portabel gilt es für jeden zustandsbehafteten, verteilten Ablauf.

## 2. Trigger / Nicht-Trigger

- **Trigger:** „Ausfalltests aus der Spec ableiten“, „Fehlermatrix“, „was passiert, wenn die Bestätigung verloren geht“, „Fencing/Idempotenz prüfen“, „failure matrix“, „chaos test plan“.
- **Nicht-Trigger:** Unit-Test einer zustandslosen Funktion; Debugging eines konkreten roten Tests; Last-/Performance- oder Sicherheitstests; Wunsch, ein Produktivsystem live zu stören.

## 3. Eingabe / Ausgabe

| Richtung | Inhalt | Von / an |
|---|---|---|
| Eingabe | Spec mit stabilen IDs, Zustandsautomaten, erlaubte Testumgebungen, Grants des Auftrags | A05 (Spec), V0-FALL-Tabelle (Entwurf) |
| Ausgabe | Ausfallmatrix: Fall-ID → Spec-ID, Störung, Injektionspunkt, Soll je Ebene Zustellung/Lauf/Wirkung, Umgebung, Assertion, Rohbelegort, Status | A03 (fehlende Harness-Teile als Pakete), A04 (Tor C/D), A08 (Regression bei Änderungen) |
| Ausgabe | Rohbelegverweise und offene Fälle mit benötigter Umgebung | Journal/Belege des Auftrags; nie als Freigabe |

## 4. Voraussetzungen und erlaubte Weitergabe

Der Skill verleiht keine Rechte (V0-INV-01, -07). Tests laufen nur im Rahmen eines Auftrags mit passendem Grant. Störungen außerhalb eines Fakes oder einer isolierten Umgebung brauchen eine Freigabe für genau diese Aktion (V0-INV-04). Weitergegeben werden Matrix und Belegverweise; Credentials und unredigierte Logs nicht. „Bestanden“ entsteht nur aus einer deterministischen Assertion auf einem Rohbeleg.

## 5. Antworten auf die Forschungsfragen (Plan §4)

**F1 – Welche Ausfallmatrix ist wiederverwendbar?** Zwei Achsen tragen über Projekte hinweg (*Ableitung*): Störungsklasse (Duplikat, Umordnung, Verlust der Anfrage, Verlust der Antwort, veraltete Identität/Epoch, Widerruf, Partition/offline, Prozessabsturz, Neustart eines Vermittlers, nebenläufige Änderung) und **Injektionspunkt** (vor/nach Zusage, vor/nach Wirkung, vor/nach Bestätigung). Der teuerste Fall ist „Wirkung eingetreten, Bestätigung verloren“; Vision §9.3 und V0-EFF-08/09 verlangen dafür `outcome_unknown` plus Abgleich statt Wiederholung (*dokumentiert*, V0 Entwurf). Die konkrete Hub-Matrix gehört als Daten in Spec und Contract-Tests (V0-FALL-01…17), nicht in Skill-Prosa. Punktgenaue Fehlerinjektion per Mock zeigt skills-optimizer: Quelländerung nach dem Manifest bzw. nach dem Ersetzen wird erkannt, unbekannte Bytes werden nicht zurückgerollt (*im Code gefunden*, Tests nicht ausgeführt).

**F2 – Wie trennen wir Zustellung, Run-Zustand und Wirkung?** Drei Beobachter, drei Assertions je Fall (*Ableitung* aus V0-INV-03/-06/-08): Zustellung am Journal und Idempotenz-Key (angenommen/abgelehnt/dedupliziert), Lauf am Runtime-Zustand (Presence ist kein Prozessbeweis), Wirkung am Zustand des Effektdienstes per Abgleich. „Unklar“ ist ein gültiges Soll. Fehlende oder abgeschnittene Spuren dürfen nicht als Erfolg oder Misserfolg zählen; der eigene [Pilot-Helfer](test_skill_pilot.py) prüft genau das für Skill-Spuren (L87–98; laut [library-experiments.md](library-experiments.md) 14/14 Tests grün, von mir nicht wiederholt). skill-cost-optimizer zählt defekte Logzeilen und meldet sie, statt abzubrechen (*im Code gefunden*).

**F3 – Welche Tests verlangen eine isolierte Umgebung?** Drei Klassen (*Ableitung*, gestützt auf Analyse §3/§8, *dokumentiert*): (a) In-Process-Fake für Idempotenz, Epoch, Zustandsübergänge, Freigabebindung (CI-tauglich); (b) isolierte Umgebung mit eigenen Test-Credentials für Prozess-/Netzstörungen, Connector-Kill, Instanzwechsel und `local-only`-Egress, weil ein Worktree keine Sandbox ist; (c) freigegebenes Testziel für echte Effekte (Test-Repo statt Nutzer-Repo). Fake-Erfolg beweist Orchestrierung, nicht Runtime-Konformität (Analyse §8). Widerruf nur mit Test-Tokens. Praktisch geprüft ist keine dieser Klassen (*offen*).

## 6. Beitrag der verfügbaren Repos

| Repo | Konzept | Fundstelle | Umgang |
|---|---|---|---|
| skills-optimizer | Fehlerinjektion an benannten Punkten; Compare-and-swap; kein Rückrollen unbekannter Bytes; veraltetes Review abgelehnt | [Test L503](https://github.com/netzkontrast/skills-optimizer/blob/f8082b57b3138260e9e45767fd6229711362678b/tests/test_semantic_compressor.py#L503), [L530](https://github.com/netzkontrast/skills-optimizer/blob/f8082b57b3138260e9e45767fd6229711362678b/tests/test_semantic_compressor.py#L530), [L636](https://github.com/netzkontrast/skills-optimizer/blob/f8082b57b3138260e9e45767fd6229711362678b/tests/test_semantic_compressor.py#L636) | Als Anforderung: Injektionspunkt je Fall; Abgleich statt blinder Rücknahme |
| skill-cost-optimizer | Unvollständige Rohdaten zählen und melden | [index.ts L503](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/index.ts#L503) | Als Anforderung an Belegbewertung; Rest zurückstellen |
| agentic-harness-patterns-skill | Hintergrundaufgaben mit endgültigen Endzuständen | [task-decomposition L11–23](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/references/task-decomposition-pattern.md#L11-L23) (*dokumentiert*) | Zurückstellen: Herkunft auffällig; nur Prüffrage, keine Übernahme |
| GEPA/gskill | Resume dokumentiert, Ausfallverhalten ungetestet | [Dossier](repos/gepa-gskill.md#ausfallverhalten) | Kein Beitrag zur Testmethodik |
| APE, dspy-advanced-prompting, skill-optimization | – | – | Kein Bezug zu Systemgrenzen |

## 7. Grenzen

Der Skill kann Isolation weder herstellen noch beweisen; das leistet die Umgebung. Er ersetzt keinen Contract-Test-Harness. Keine Zusage über den getesteten Fehlerumfang hinaus, insbesondere kein „genau einmal“ (Vision §9.3 „Grenze“). Die Hub-Fälle hängen am unreviewten V0-Entwurf.

## 8. Minimalversuch (synthetisch, nicht ausgeführt)

Fixture: Mini-Spec mit fünf IDs, Fake-Runtime und Fake-Effektdienst beschrieben, kein Produktivzugang. Fälle (neue Familien außerhalb von PIL/GT/ST, R-Bezug wie [SL1 §5.4](library-evaluation-design.md#54-harte-regeln-r)):

| Fall | Störung | Bezug | Soll (deterministisch prüfbar in der erzeugten Matrix) |
|---|---|---|---|
| TB-01 | Command doppelt zugestellt | V0-FALL-01/-12 | Zustellung „dedupliziert“, gleiche Journal-Position, kein zweiter Effekt |
| TB-02 | Einreichung mit alter Epoch | V0-FALL-02 | Abweisung auch unmittelbar am Effekt |
| TB-03 | Effekt eingetreten, Antwort verloren | V0-FALL-07 | Wirkung „unklar“, Abgleich, keine automatische Wiederholung |
| TB-04 | Grant widerrufen während Run | V0-FALL-09, R-03 | Neue Aktionen abgewiesen; offene Effekte abgeglichen; nur Test-Credential |
| TB-05 | Gerät offline, `local-only` | V0-FALL-03/-10 | Kein Cloud-Fallback; Umgebungsklasse (b) |

Vergleich B0 (ohne Skill) gegen B1 (Skill geladen), je Fall ein Start: 10 Starts, **nicht** im 40er-Pilot enthalten; eigenes Budget nötig. Erfolg: B1 liefert für 5/5 Fälle drei getrennte Ebenen, Umgebungsklasse und Rohbelegort, 0 Regelverstöße. Abbruch/Nullergebnis: B0 erreicht dieselben Assertions → kein Skill, nur Checkliste in der Spec.

## 9. Entscheidung

**Deterministisch lösen + schmal ergänzen.** Die Hub-Ausfallmatrix wird Contract-Test-Code mit Fake-Runtime/Fake-Effekt (SL7, nach V0-Review); das ist die Garantie. Ergänzend ein portabler Skill, der aus beliebigen Specs die Matrix ableitet, Umgebungen klassifiziert und Rohbelege bewertet. Installation erst nach dem Minimalversuch.

## 10. Skill-Entwurf `testing-system-boundaries`

```markdown
---
name: testing-system-boundaries
description: Leite aus Spezifikationen prüfbare Ausfall- und Grenztests für zustandsbehaftete oder verteilte Abläufe ab und bewerte ihre Rohbelege. Trennt Zustellung, Laufzustand und tatsächliche Wirkung und ordnet jedem Test die schwächste sichere Umgebung zu. Nutze bei „Ausfalltests ableiten“, „Fehlermatrix“, „was passiert bei doppelter Zustellung oder verlorener Antwort“, „Idempotenz oder Fencing prüfen“, „failure matrix“, „chaos test plan“, „test stale epochs“. Nicht für Unit-Tests zustandsloser Funktionen, Debugging eines einzelnen Fehlers, Last- oder Sicherheitstests oder Störungen produktiver Systeme.
---

# Systemgrenzen testen

1. Lies Spec, Zustandsmodelle, vorhandene Fehlerfälle und Testregeln. Arbeite mit stabilen Anforderungs-IDs; fehlen sie, melde die Lücke statt Fälle zu erfinden.
2. Bestimme je Fall Störungsklasse und Injektionspunkt aus der [Matrix](references/failure-matrix.md). Führe „Wirkung eingetreten, Bestätigung verloren“ immer als eigenen Fall.
3. Lege drei getrennte Sollwerte fest: Zustellung, Laufzustand, Wirkung. „Unklar, Abgleich nötig“ ist ein gültiges Soll.
4. Wähle die schwächste ausreichende Umgebung: In-Process-Fake, isolierte Umgebung mit eigenen Test-Zugangsdaten oder freigegebenes Testziel. Störe produktive Prozesse, Konten oder Netze nie ohne Freigabe für genau diese Aktion. Ein separates Arbeitsverzeichnis ist keine Isolation.
5. Definiere vor der Ausführung deterministische Assertions und den Ort jedes Rohbelegs. Ein Logsatz oder Modellurteil allein belegt keinen Grenzfall.
6. Führe nur im erlaubten Rahmen aus, sonst übergib den Plan. Halte Befehl, Version, Umgebung und Beleg fest. Fehlende oder abgeschnittene Belege heißen „nicht beobachtbar“, nie „bestanden“.
7. Bewerte je Fall und Ebene: bestanden, fehlgeschlagen, blockiert, nicht ausgeführt. Ein Rechte- oder Freigabeverstoß ist immer ein Fehlschlag.
8. Liefere Matrix, Belegverweise, offene Fälle mit benötigter Umgebung und den kleinsten nächsten Versuch. Leite keine Garantie über die getesteten Fälle hinaus ab, auch kein „genau einmal“.
```

Referenz `references/failure-matrix.md` (Entwurf): Spalten Fall-ID · Anforderungs-ID · Störungsklasse · Injektionspunkt · Soll Zustellung · Soll Lauf · Soll Wirkung · Umgebung (Fake/isoliert/Testziel) · Assertion · Rohbelegort · Status. Störungsklassen: Duplikat, Umordnung, Verlust Anfrage, Verlust Antwort, veraltete Identität, Widerruf, Partition, Prozessabsturz, Neustart Vermittler, nebenläufige Änderung. Injektionspunkte: vor/nach Zusage, vor/nach Wirkung, vor/nach Bestätigung.

Evaluationsfälle (Felder wie `skill-evaluation.json`; `fixture` entspricht dort `input`). IDs nach SL1-Schema: TB-P1, TB-P2, TB-N1, TB-N2.

```json
[
  {"prompt": "Leite aus dieser Spec Ausfalltests für doppelte Zustellung und verlorene Effektantwort ab.", "expected_skill": "testing-system-boundaries", "fixture": "Mini-Spec mit S-1 (Idempotenz-Key) und S-2 (Effekt mit Intent/Bestätigung); Fake-Effektdienst; kein Produktivzugang.", "assertion": "Je Fall Zustellung, Lauf und Wirkung getrennt; verlorene Antwort erwartet 'unklar' plus Abgleich statt Wiederholung; Umgebung Fake; Rohbelegort je Assertion."},
  {"prompt": "Build a failure matrix for stale epochs and revoked tokens in our job runner.", "expected_skill": "testing-system-boundaries", "fixture": "Spec mit Epoch-Fencing und Token-Widerruf; nur ein Produktions-Token erwähnt, kein Testkonto.", "assertion": "Widerrufsfall nur mit Test-Credential oder als blockiert markiert; nichts gegen Produktion; Epoch-Prüfung auch am Effekt."},
  {"prompt": "Schreib einen Unit-Test für die Funktion slugify.", "expected_skill": null, "fixture": "Reine Stringfunktion ohne Zustand.", "assertion": "Skill nicht laden."},
  {"prompt": "Warum schlägt dieser Test seit gestern fehl?", "expected_skill": null, "fixture": "Ein konkreter Stacktrace.", "assertion": "Skill nicht laden; Debugging statt Matrix."}
]
```
