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

SL0/SL1 im [Library-Research-Plan](library-research-plan.md) beginnen und die verbleibenden offenen Entscheidungen gezielt bearbeiten. Die Spec-Vorbereitung nutzt die folgenden bestehenden Versuche: Die kleinen Versuche aus der
Web-Gegenprüfung (§8: Grilling-Auswahl, Grilling-Verhalten, Kompression im Vergleich) passen als erste Fälle in
Stufe 2. Nicht ausgeführte Versuche aus den Dossiers, die die Planung beeinflussen:

- Tests von SO laufen lassen.
- Echte Tokenzählung für die SO-Benchmarks.
- Hold-out-Test für SOPT.
- Build und Start von CPM.
- `cargo test` für C2P.
