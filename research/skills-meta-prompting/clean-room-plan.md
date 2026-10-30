# Clean-Room-Plan

Stand 2026-10-30. Dies ist ein **Vorschlag**, keine Entscheidung. Verbindliche Festlegungen gehören nach
`docs/entscheidungen/`, Übernahmen nach `docs/herkunftsregister.md`.

## Neuer Owner-Auftrag vom 30.10.2026

Die Skill-Library soll innerhalb Sidekicks eine Kernfähigkeit der Anwendung bilden und als aufeinander aufbauendes, lernbares Prompt-Framework untersucht werden. Die frühere Empfehlung eines separaten Repos unten ist dadurch ersetzt. Portable Skill-Pakete und austauschbare Adapter bleiben Ziel. Der [Library-Research-Plan](library-research-plan.md) ist jetzt die maßgebliche Ausführungs- und Statusplanung für SL0–SL7. Die Stufen 0–7 in diesem Dokument bleiben fachliche Referenz für K1–K8, kein zweiter aktiver Backlog. Die konkrete Laufzeitarchitektur und Dependencies sind weiterhin offen.

## Antwort auf die Forschungsfrage (Kurzfassung)

Die wesentlichen Aspekte der zwölf Repos lassen sich in einem eigenen System mit sieben Bausteinen abdecken.
Die Bausteine K1 bis K7 stehen in der [Synthese](synthese.md); K8 bleibt bei der Agent-Hub-Recherche.
Die Integration gelingt am besten über **ein gemeinsames Datenmodell** und **eine gemeinsame Änderungspipeline**.

1. Techniken, Prompts, Skills, Eval-Sets und Ergebnisse sind versionierte Datensätze und kein Freitext.
2. Jede Meta-Operation folgt demselben Weg: Kandidat erzeugen, prüfen, ausdrücklich anwenden (K6). Das gilt für
   Entwerfen, Optimieren, Komprimieren und das Ableiten einer Instruktion aus Beispielen.
3. Jede Behauptung über Qualität oder Kosten kommt aus der Evaluationsschicht (K5, K7). Ohne Messung gibt es
   keine Zahl.

Die [Web-Gegenprüfung](web-recherche-2026-10-30.md) stützt diese Reihenfolge: zuerst Auswahl und Wirkung der
vorhandenen Skills messen, Optimierung erst danach als budgetierten Vorschlagsprozess (WEB-R3, WEB-R4).

## Zielarchitektur (Skizze)

```text
              ┌────────────────────────── Skill-Paket (K1) ──────────────────────────┐
              │ SKILL.md + Referenzen + Katalogdaten · Validator · Adapter-Generator │
              └───────────────┬──────────────────────────────────────────┬───────────┘
                              │                                          │
  Technik-Katalog (K2) ──► Auswahl/Weiche ──► Signatur/Schablone ──► Registry + Sandbox-Templating (K3)
                              │                                          │
                              ▼                                          ▼
             Kontext-Builder + Zerlegung (K4)                 Ketten + Ausgabe-Gates (K3)
                              │                                          │
                              └──────────────┬───────────────────────────┘
                                             ▼
                      Evaluation: Splits, Metriken, Rohergebnisse (K5)
                                             │
                      Optimierer / Meta-Operationen erzeugen Kandidaten
                                             ▼
                Änderungspipeline: Inventar → Gates → Urteil → Apply/Restore (K6)
                                             │
                        Token-/Kostenkonto und Budgets über alles (K7)
```

## Reihenfolge (Vorschlag)

Die Reihenfolge richtet sich danach, wie viel Messbarkeit ein Baustein früh bringt. Jede Stufe hat ein eigenes,
prüfbares Ergebnis.

| Stufe | Inhalt | Prüfbares Ergebnis | Hängt ab von |
|---|---|---|---|
| 0 | Spec: Datenmodell und Skill-Format (K1.1, K2.1, K5.1) unter `docs/` | Review der Spec | – |
| 1 | Validator und Token-Zählung (K1.2, K7.1) | Validator prüft die vorhandenen Skills im Repo; Tokenzahlen statt Wortzahlen | 0 |
| 2 | Eval-Harness (K5.1–K5.3, K5.5, K5.7) mit kleinem eigenem Eval-Set; Discovery/Trigger getrennt von Verhalten (K1.5); Usage-Erfassung (K7.6) | Baseline-Lauf mit gespeicherten Rohergebnissen; erste Fälle: Auswahl und Verhalten des Grilling-Skills (PR #5) | 1 |
| 3 | Technik-Katalog und Auswahl (K2.1–K2.4), Startinhalt aus PES (eigenes Material) | Auswahl-Trefferquote auf dem Eval-Set | 2 |
| 4 | Änderungspipeline (K6) und erste Meta-Operation „kürzen“ | Kandidat besteht Inventar und Gates; Restore funktioniert | 1, 2 |
| 5 | Optimierer als Adapter (K5.4, K5.8): zuerst APE-artig mit Bandit, GEPA/DSPy als Alternativen; Kostenvoranschlag (K7.2), Kosten pro akzeptiertem Ergebnis (K7.7) | Verbesserung auf dem vorher abgetrennten Test-Split, nicht auf dem Training | 2, 4 |
| 6 | Registry, Sandbox-Templating, Ketten und Ausgabe-Gates (K3) | Ketten-Lauf mit echten Ausgabe-Prüfungen | 0 |
| 7 | Kontext-Builder und Zerlegung (K4) | Zerlegung mit vollständigem Segmentprotokoll und verifizierten Belegen | 1, 6 |

## Clean-Room-Verfahren

1. **Eingabe für die Implementierung** sind nur diese Synthese, die Spec aus Stufe 0 und die Anforderungs-IDs.
   Kein Fremdcode, keine Prompt-Texte und keine Template-Texte aus den Repos.
2. **Getrennte Rollen, soweit möglich.** Die Recherche-Agents haben die Quellen gelesen. Die Implementierung
   sollte in einer frischen Session laufen, die nur die Spec bekommt. Das ist kein personell getrenntes,
   juristisches Clean-Room-Verfahren; diese Grenze wird nicht überspielt.
3. **Eigenes Material:** `prompt-engineering-skill` gehört dem Owner. Die Accounts `kongyo2` und
   `netzkontrast` gehören laut Owner beide ihm. Die Inhalte dürfen direkt einfließen; die Herkunft wird im
   Commit vermerkt. Davor eine LICENSE-Datei ergänzen.
4. **Fremde Inhalte nur nach Entscheidung.** MIT würde eine lizenzierte Übernahme bei MP, APE, DSPY, PA, CPM, SO,
   SCO, RD und C2P erlauben, mit Notice und Eintrag im Herkunftsregister. Die Dossiers empfehlen das nirgends
   für Code; höchstens für Katalogdaten aus PA.
5. **Ausgeschlossen bis zur Klärung:**
   - AHP-Texte und -Zahlen: Der Inhalt ist laut Autor aus einem Leak des Claude-Code-Quelltexts abgeleitet.
   - SOPT-Code und -Daten: Die Copyright-Zeile ist nur ein Platzhalter.
   - Mitgelieferte Datensätze ohne Lizenzhinweis (MP, APE).
6. **Abhängigkeiten statt Neubau** sind möglich, brauchen aber jeweils eine eigene Entscheidung: DSPy (für K2.4
   und K5.4), code2prompt als CLI oder Python-SDK (für frühe K4-Experimente) und eine Tokenizer-Bibliothek
   (K7.1).

## Vorgaben und offene Entscheidungen

Der Owner hat den Ort der Library festgelegt. Die übrigen Fragen bleiben offen; der Entwurf legt ihre Antwort nicht fest.

| Frage | Optionen | Empfehlung und Grund |
|---|---|---|
| Wo lebt der Rewrite? | **Owner-Vorgabe, 30.10.2026:** innerhalb Sidekicks als Kernfähigkeit der Anwendung | Die frühere Empfehlung eines separaten Repos ist überholt. Eigenständige portable Pakete bleiben Ziel; konkrete Einbettung nach SL3 prüfen. |
| Laufzeit und Sprache? | TypeScript (passt zur sidekick-Planung) · Python (näher an DSPy und den Eval-Werkzeugen) | Offen. Hängt an der Entscheidung zu DSPy als Dependency. |
| DSPy als Dependency? | Ja für Signaturen und Optimierer · Nein, eigene schlanke Umsetzung | Erst nach Stufe 2 entscheiden, mit Messung. |
| Umfang der ersten Version? | Stufen 0–3 · 0–5 · alles | 0–4: Damit sind Messung, Auswahl und sichere Änderung früh abgedeckt. |
| Umgang mit AHP? | Konzepte aus öffentlicher Doku neu begründen · ganz weglassen | Nur Anforderungen, die sich aus öffentlicher Doku oder eigenen Experimenten begründen lassen. Für K8.1 und K8.4 ist das mit S11/S12 bereits erfüllt (WEB §6). |

## Nächster Schritt

Nur SL0/SL1 im [Library-Research-Plan](library-research-plan.md) bearbeiten und deren Bestandsaufnahme/Evaluationsdesign zur Review vorlegen. SL2–SL7 folgen erst nach diesem Review; verbleibende offene Entscheidungen gezielt bearbeiten. Die Spec-Vorbereitung nutzt die folgenden bestehenden Versuche: Die kleinen Versuche aus der
Web-Gegenprüfung (§8: Grilling-Auswahl, Grilling-Verhalten, Kompression im Vergleich) passen als erste Fälle in
Stufe 2. Nicht ausgeführte Versuche aus den Dossiers, die die Planung beeinflussen:

- Tests von SO laufen lassen.
- Echte Tokenzählung für die SO-Benchmarks.
- Hold-out-Test für SOPT.
- Build und Start von CPM.
- `cargo test` für C2P.

## Stand nach SL0–SL5

> Stand 30.10.2026 · SL6 im [Library-Research-Plan](library-research-plan.md). Status und nächste Schritte führt nur der Plan (§8); dieser Abschnitt hält Vorgaben, überholte Empfehlungen und den fachlichen Stufenplan fest.
> Zuordnung der Anforderungen und Empfehlung: [Synthese, Fortschreibung](synthese.md#fortschreibung-nach-sl0sl5-skill-library).

### Owner-Vorgaben

| Vorgabe | Quelle | Folge für diesen Plan |
|---|---|---|
| Die Library lebt in Sidekick und ist Kernfähigkeit der Anwendung; portable Pakete und austauschbare Adapter bleiben Ziel | [Plan §1](library-research-plan.md#1-was-jetzt-vorgegeben-ist) | Kein separates Repo. Recherche, Spec und Implementierung bleiben in diesem Repo; Clean-Room wird über Regeln gesichert ([Grundsatzentscheidungen](../../docs/entscheidungen/README.md#grundsatzentscheidungen-des-owners)) |
| Reichweite der ersten Version: Stufen 0–2 (Paketvertrag, Validator, Token-Zählung, Eval-Harness mit Baseline) | [Q-20261030-sl-reichweite](../../docs/fragen/skill-library/questions/Q-20261030-sl-reichweite.md) | Änderungspipeline, Komposition und Optimierer liegen außerhalb der ersten Version |
| Aktivierung nur durch den Owner am Kandidaten-Hash, im Repo per PR-Merge | [Q-20261030-sl-aktivierung](../../docs/fragen/skill-library/questions/Q-20261030-sl-aktivierung.md) | Kein eigener Apply-Befehl in V1; Merge ist Aktivierung, Revert ist Rücknahme ([SL4 §5](library-learning.md#5-aktivierung-und-rücknahme)) |
| Feedback nur aus synthetischen Fällen und freigegebenen Repo-Artefakten | [Q-20261030-sl-feedbackdaten](../../docs/fragen/skill-library/questions/Q-20261030-sl-feedbackdaten.md) | Keine Rohsessions in Git oder an Optimierungsdienste ([SL4 §3](library-learning.md#3-datenwege-für-feedbackfälle)) |
| Bis ~40 headless Läufe, nur synthetische Eingaben | [Q-20261030-sl-live-laeufe](../../docs/fragen/skill-library/questions/Q-20261030-sl-live-laeufe.md) | 14 verbraucht (C0, E1-Auswahl); E3 passt nicht in den Rest ohne Owner-Entscheidung ([SL4 §6](library-learning.md#6-budgets-und-e3-plan)) |
| Claude Code ist die erste Runtime | [Grundsatzentscheidungen](../../docs/entscheidungen/README.md#grundsatzentscheidungen-des-owners) | Erster Messclient; Ergebnisse gelten nur für ihn |

### Überholte Empfehlungen in diesem Dokument

| Stelle oben | Frühere Empfehlung | Jetzt |
|---|---|---|
| „Vorgaben und offene Entscheidungen“, Zeile Umfang | Erste Version Stufen 0–4 | Owner-Vorgabe 0–2 |
| Reihenfolge, Stufe 3 | Technik-Katalog und Auswahl (K2.1–K2.4) | Technik-Katalog für die Library verworfen; Auswahl misst M2 auf den Skills selbst. K2.4 lebt als typisierte Übergabeartefakte weiter (SL3 §4) |
| Reihenfolge, Stufe 6 | Registry, Sandbox-Templating, Hot-Reload, Ketten | Registry gehört zum Paketvertrag (Stufe 0, SL3 §2); Templating verworfen; Hot-Reload ersetzt durch Versionsbindung ohne stillen Wechsel (SL3-R02); Ketten → neue Stufe 4 |
| Reihenfolge, Stufe 5 | Optimierer zuerst APE-artig mit Bandit | Zuerst ein manueller Kandidat mit einer Dimension; Optimierer-Adapter erst, wenn dieser gemessen ist (SL4 §2.1, §10) |
| Reihenfolge, Stufe 2 | Erste Fälle: Grilling-Auswahl und -Verhalten (PR #5) | Ersetzt durch den Fallkatalog aus SL1 §5 und E1. C0 und E1-Auswahl sind gelaufen ([Ergebnis](eval-runs/C0-E1-ergebnis-2026-10-30.md)) |
| Zielarchitektur | Änderungspipeline mit eigenem Apply/Restore | In V1 übernimmt Git diese Rolle: PR-Merge am Hash, Revert, Hashgleichheit deterministisch geprüft (SL4 §5) |
| „Nächster Schritt“ | Nur SL0/SL1 bearbeiten | Erledigt; maßgeblich ist der nächste Schritt im Plan |

Weiter gültig: Clean-Room-Verfahren Punkte 1–6, die Ausschlüsse (AHP, SOPT, Datensätze ohne Lizenz) und die offenen Fragen zu Sprache und DSPy. C0 und E1 haben keinen Fremdcode und keine Fremdtexte verwendet, nur eigene Fixtures und die öffentliche CLI; ein Eintrag im Herkunftsregister ist dafür nicht nötig.

### Stufenplan, aktualisiert

Stufen 0–2 behalten ihre Bedeutung aus der Owner-Antwort. Ab Stufe 3 gilt die neue Reihenfolge; die Spalte „früher“ verweist auf die Tabelle oben.

| Stufe | Inhalt | Anforderungen | In der ersten Version | Vorarbeit vorhanden | früher |
|---|---|---|---|---|---|
| 0 | Spec: Paketvertrag mit Registry-Datensatz, Hash-Identität, Artefakttypen, Run-Manifest, Aktivierungsregel | K1.1, K3.1, K5.7, KL-01–KL-05, KL-11 | ja | Entwürfe SL3 §2–§5, SL4 §4–§5; Spec folgt in SL7 | 0, Teil von 6 |
| 1 | Validator, kanonischer Hash, Token-Zählung | K1.2, K7.1, KL-02 | ja | Ad-hoc-Prüfungen und Pilot-Helfer `skill_pilot.py` (Research, kein Produktcode) | 1 |
| 2 | Eval-Harness: Ebenen M0–M5/R, Capability-Check, Spurnormalisierung, Ledger, Splits mit Familien | K1.5, K5.1–K5.3, K5.5, K7.6, KL-07, KL-08, KL-13 | ja | C0/E1-Auswahl gelaufen; Rubriken je Skill fehlen | 2 |
| 3 | Kandidatenlebenszyklus mit `veraltet`, Pfadgrenze, Beobachtung und Rücknahme | K6.1–K6.6, KL-10, KL-12 | nein; bis dahin manuell per PR | SL4 §4–§5 | 4 |
| 4 | Explizite L2-Abläufe mit Übergabe- und Fehlerverträgen | K3.3, K3.4, KL-03–KL-06 | nein | SL3 §3–§10; E2 offen | 6 |
| 5 | Optimierer-Adapter (APE-artig, GEPA/DSPy) | K5.4, K5.8 | nein | SL4 §2.1 | 5 |
| 6 | Router oder Vorschlagsmodell (N0) | SL4 §2.4 | nein | Hub-Plan N0 | – |

Entfallen: früher Stufe 3 (Technik-Katalog, verworfen) und Stufe 7 (Kontext-Builder und Zerlegung; ohne Library-Bezug, bleibt fachliche Referenz). Die deterministischen Anteile der Bereiche (KL-14) gehören in die Stufen 1–3 bzw. in die Contract-Tests des Hub-Kerns.

### Keine doppelten Backlogs

Pakete, Status und nächste Schritte führt nur der [Library-Research-Plan](library-research-plan.md) (§8). Der [Hub-Plan](../agent-hub/operations/PLAN.md) verweist nur darauf. Die Tore unter `docs/entscheidungen/` erhalten nur Verweise auf Befunde, keine Library-Aufgaben. Diese Tabelle ist fachliche Reihenfolge, kein Backlog. Die nicht ausgeführten Dossier-Versuche aus dem Abschnitt „Nächster Schritt“ oben bleiben offen; für die Stufen 0–2 wird keiner davon gebraucht.
