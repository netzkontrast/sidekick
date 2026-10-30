# SL-A08 – evaluating-changes

> ID **SL-A08** · Stand 30.10.2026 · Bereichsrecherche SL2 im [Library-Research-Plan](library-research-plan.md) · **Entwurf zur Review**.
> Gelesene Stände: Sidekick `e87cd30` (dieser Branch: [SL1](library-evaluation-design.md), [Skill-Pilot](library-experiments.md), [Primärquellenprüfung](../../docs/research/skill-library-primaerquellen-2026-10-30.md)); V0-Spec nur als Entwurf `2c4733e0`; Fremd-Repos an den SHAs aus [README](README.md#untersuchte-repositories), lokal auf dieselben SHAs geprüft; GEPA nur über das [Dossier](repos/gepa-gskill.md) (`02ea4152`).
> Evidenz: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*; *Ableitung* = eigene Schlussfolgerung. In dieser Arbeit wurde kein Modell, kein Fremdcode und kein Test ausgeführt. Es gibt keinen Baseline-Score.

## 1. Nutzerfall

Eine konkrete Änderung liegt vor: neue Skill-Beschreibung, geänderte Instruktion, Auswahlregel, Prompt oder Agent-Konfiguration. Jemand will wissen, ob sie gegenüber einer eingefrorenen Baseline besser ist, und zwar mit getrennten Ebenen, ohne Testleck, mit Gesamtaufwand und einer Rücknahmeempfehlung. Im Hub ist das der Check vor dem Aktivierungstor (Kern §5); die Aktivierung selbst bleibt beim Owner am Hash.

## 2. Trigger / Nicht-Trigger

- **Trigger:** „Ist die neue Variante besser?“, „Kandidat gegen Baseline vergleichen“, „Eval-Ergebnisse auswerten“, „A/B-Test für den Skill“, „compare candidate against baseline“, „did this prompt change help“.
- **Nicht-Trigger:** Kandidaten erzeugen oder optimieren (Optimierer-Adapter, SL4); Code-Review; allgemeine Statistikfrage; Freigabe/Merge einer Änderung (A04 + Owner).

## 3. Eingabe / Ausgabe

| Richtung | Inhalt | Von / an |
|---|---|---|
| Eingabe | Baseline- und Kandidatenhash, Hypothese, genau eine geänderte Dimension; vorab eingefrorene Fälle mit `family_id`/Split; Rubrikversion; Messrahmen (Client, Modell, Budget); Rohdatensätze nach SL1 §8 | Kandidatenerzeuger, Harness, [`skill-pilot-*.json`](library-experiments.md#eingefrorene-artefakte) |
| Ausgabe | Vergleichsbericht je Ebene (M0–M5, R) mit Zähler/Nenner, Familien, Wiederholungen, Unsicherheit, Aufwand mit Quelle; Empfehlung *verwerfen* / *mit neuen Fällen weiter prüfen* / *zur Aktivierung vorlegen*; Rücknahmeplan | A04 (Entscheidungsreife), Owner (Aktivierung am Hash), A09 (Befund als Erinnerungskandidat) |
| Ausgabe | Liste neu benötigter unabhängiger Fälle | A05/A07 bzw. Fallpflege |

## 4. Voraussetzungen und erlaubte Weitergabe

Der Skill bewertet; er aktiviert, merged oder ändert Rubrik und Fälle nie (Plan §7, Owner-Antwort [Aktivierung](../../docs/fragen/skill-library/questions/Q-20261030-sl-aktivierung.md)). Modellstarts nur im autorisierten Budget ([Live-Läufe](../../docs/fragen/skill-library/questions/Q-20261030-sl-live-laeufe.md)). Der Bewerter erhält Testdaten erst nach der Kandidatenwahl; der Kandidatengenerator nie. Rohdaten nur synthetisch oder freigegebene Repo-Artefakte ([Feedbackdaten](../../docs/fragen/skill-library/questions/Q-20261030-sl-feedbackdaten.md)).

## 5. Antworten auf die Forschungsfragen (Plan §4)

**F1 – Discovery, Auswahl, Verhalten und Komposition getrennt messen.** Die Ebenen M0–M5 und R aus [SL1 §2](library-evaluation-design.md#2-messebenen) tragen; Auswahl nur aus Läufen ohne expliziten Aufruf, Verhalten aus Läufen mit geladenem Skill, Komposition je Übergabe. Die Agent-Skills-Leitfäden trennen Trigger- und Outputqualität ebenso (*dokumentiert*, P2). Der eigene Spur-Normalisierer unterscheidet beantragten Skill-Aufruf, bestätigte Aktivierung und Datei-Lesen ([Tests L100–134](test_skill_pilot.py); laut [library-experiments.md](library-experiments.md) ausgeführt, von mir nicht wiederholt). Ob die reale CLI das beobachtbar macht, ist *offen* (C0 blockiert).

**F2 – Testlecks und Optimierung auf den Judge verhindern.** Gegenbeispiele *im Code gefunden*: skill-optimization bewertet Baseline und Kandidat auf denselben drei Trainingsfällen und ändert zugleich das Modul (Predict → ChainOfThought), also zwei Variablen; `simple_ape` nutzt denselben Datensatz für Erzeugung und Bewertung, das APE-Experimentskript trennt dagegen; dspy-advanced-prompting setzt eine feste Qualität und führt Kandidaten nie aus. Daraus (*Ableitung*, deckungsgleich mit SL1 §5.5 und WEB-R4/R5): Split nach Ursprungsfamilie vor jeder Variante; Test einmal je Runde, danach verbraucht; Pflichtregressionen getrennt vom Holdout; Kandidat muss tatsächlich laufen; kritische Punkte deterministisch prüfen; Judge-Version und Rubrik vor dem Schlusstest einfrieren, menschliche Stichprobe (SL1 §7), Autor bewertet nicht allein. GEPA nutzt Validierungsdaten zur Auswahl (*dokumentiert*, P4); sie sind danach kein Test.

**F3 – Gesamtaufwand rechnen.** Kosten je akzeptiertem Ergebnis über den ganzen Auftrag (K7.7): gemeldete Usage inkl. Cache, Fehlversuche, Nacharbeit, Judge- und Optimierungsläufe, Längenzuwachs des Skills. Gemeldet/geschätzt/unbekannt getrennt (K7.6). Gegenbeispiele: Ersparnis aus angenommenem Aufgabenmix (skill-cost-optimizer, *im Code gefunden*), Wörter statt Tokens (skills-optimizer, *dokumentiert*), „optimierter“ Skill länger als die Basis (skill-optimization, 97 → 151 Zeilen). Amortisation nur mit ausdrücklich genannter Nutzungsannahme. Praktisch gemessen ist nichts (*offen*).

## 6. Beitrag der verfügbaren Repos

| Repo | Konzept | Fundstelle | Umgang |
|---|---|---|---|
| skills-optimizer | Deterministische Gates getrennt vom hashgebundenen semantischen Urteil; fail-closed Endzustände | [Skript L510–525](https://github.com/netzkontrast/skills-optimizer/blob/f8082b57b3138260e9e45767fd6229711362678b/.claude/skills/semantic-compressor/scripts/semantic_compressor.py#L510), [L541–629](https://github.com/netzkontrast/skills-optimizer/blob/f8082b57b3138260e9e45767fd6229711362678b/.claude/skills/semantic-compressor/scripts/semantic_compressor.py#L541), [SKILL.md L204–217](https://github.com/netzkontrast/skills-optimizer/blob/f8082b57b3138260e9e45767fd6229711362678b/.claude/skills/semantic-compressor/SKILL.md#L204) | Als Anforderung (Bericht an Baseline-/Kandidatenhash binden) |
| skill-optimization | Testleck und zwei geänderte Variablen | [optimize_qwen.py L45–56](https://github.com/netzkontrast/skill-optimization/blob/6fec081ed78a5bcd518d6562ec7452e54ff47aba/scripts/optimize_qwen.py#L45), [L79](https://github.com/netzkontrast/skill-optimization/blob/6fec081ed78a5bcd518d6562ec7452e54ff47aba/scripts/optimize_qwen.py#L79), [L110](https://github.com/netzkontrast/skill-optimization/blob/6fec081ed78a5bcd518d6562ec7452e54ff47aba/scripts/optimize_qwen.py#L110), [L141](https://github.com/netzkontrast/skill-optimization/blob/6fec081ed78a5bcd518d6562ec7452e54ff47aba/scripts/optimize_qwen.py#L141) | Als Negativfall in Evaluationsfällen; Code zurückstellen (Lizenz unklar) |
| automatic_prompt_engineer | Getrennte Erzeugungs-/Bewertungs-/Testdaten; budgetierte Auswahl (UCB) | [run_instruction_induction.py L17–26](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/experiments/run_instruction_induction.py#L17-L26), [ape.py L56](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/automatic_prompt_engineer/ape.py#L56), [bandits.py L10–32](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/automatic_prompt_engineer/evaluation/bandits.py#L10-L32) | Splitregel als Anforderung; Bandit für den Optimierer-Adapter (SL4), nicht im Skill |
| dspy-advanced-prompting | A/B mit Wiederholungen; aber simulierte Qualität | [compare_prompts L403](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/evaluations/evaluation_framework.py#L403), [meta_prompting.py L149–193](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/techniques/meta_prompting.py#L149-L193) | Wiederholungen ja; Statistik ohne Varianzschutz nicht übernehmen |
| skill-cost-optimizer | Ersparnis aus Annahmen statt Messung | [model-pricing.md L76–100](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/references/model-pricing.md#L76) | Als Negativregel (K7.5) |
| GEPA/gskill | Train/Val getrennt an den Optimierer | [Dossier](repos/gepa-gskill.md#öffentliche-verträge) | Späterer Adapter; Val ≠ Test |
| agentic-harness-patterns-skill | – | – | Kein Beitrag |

## 7. Grenzen

Ein Skill kann Lecks nicht verhindern, wenn der Harness Testdaten zugänglich macht; Zugriffstrennung und Hash-Bindung sind deterministisch. Ohne Läufe entstehen keine Zahlen. Kleine Stichproben (Pilot: 40 Starts) liefern nur deskriptive Hinweise (SL1 §7, Primärquellen F5/F6). Der Skill bewertet auch seine eigene Wirkung nicht unabhängig.

## 8. Minimalversuch (synthetisch, nicht ausgeführt)

Der Versuch prüft das **Bewertungsverhalten**, nicht K-DESC selbst. Fixture: synthetische, als solche gekennzeichnete Rohdatensätze im SL1-§8-Format zu einem Vergleich B1 gegen K-DESC auf PIL-Familien, mit je einer eingebauten Falle:

| Fall | Falle | Soll |
|---|---|---|
| EV-01 | Kandidat ändert Beschreibung **und** Rumpf | „nicht vergleichbar“, zweite Variable benannt |
| EV-02 | Eine Test-Familie war im Entwurf sichtbar | Leck gemeldet, Test als verbraucht, neue Familien gefordert |
| EV-03 | Judge-Score steigt, R-01 (Timeout ≠ Zustimmung) verletzt | Regelverstoß blockiert, keine Aktivierungsempfehlung |
| EV-04 | Usage fehlt bei 3 von 8 Läufen | Aufwand teils „unbekannt“, keine Ersparnisbehauptung |

B0 (ohne Skill) gegen B1, je Fall ein Start: 8 Starts, außerhalb des 40er-Pilots; eigenes Budget nötig. Assertions deterministisch über Schlüsselwörter **und** Struktur des Berichts (Empfehlungsfeld, Statusfelder). Erfolg: B1 erkennt 4/4 Fallen, 0 Aktivierungsempfehlungen. Abbruch/Nullergebnis: B0 erkennt dieselben Fallen → kein Skill, Prüfregeln nur im Harness.

## 9. Entscheidung

**Ergänzen + deterministisch lösen.** Deterministisch in SL7: Baseline einfrieren und hashen (vorhanden im Research-Helfer), Kandidat an Baseline binden, Startzähler, Splitzugriff nach Rolle, Bericht nur aus Rohdatensätzen. Der Skill ergänzt die Urteilsteile, die Code nicht leistet: Vergleichbarkeit prüfen, Unsicherheit ehrlich formulieren, Aufwand zusammenführen, Empfehlung mit Rücknahmepfad.

## 10. Skill-Entwurf `evaluating-changes`

```markdown
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
```

Referenz `references/comparison-report.md` (Entwurf): Kopf mit Baseline-/Kandidatenhash, geänderter Dimension, Hypothese, Eval-/Rubrikversion, Client/Modell. Je Ebene: k/n, Familien, Wiederholungen, nicht beobachtbar. Harte Regeln: Verstöße mit Fall-ID. Aufwand: Werte mit Quelle (gemeldet/geschätzt/unbekannt). Leck- und Vergleichbarkeitsprüfung. Empfehlung, Rücknahmepfad, benötigte neue Fälle.

Evaluationsfälle (Felder wie `skill-evaluation.json`; `fixture` entspricht dort `input`). IDs: ECH-P1, ECH-P2, ECH-N1, ECH-N2.

```json
[
  {"prompt": "Ist die neue Skill-Beschreibung besser als die alte? Hier sind die Ergebnisse.", "expected_skill": "evaluating-changes", "fixture": "Synthetische Rohdaten: Kandidat ändert Beschreibung und Rumpf; 6 Fälle, 2 Testfamilien waren beim Entwurf sichtbar.", "assertion": "Zwei Variablen und Testleck gemeldet; kein Gewinner erklärt; Empfehlung: mit neuen Familien weiter prüfen."},
  {"prompt": "Compare this prompt candidate against the frozen baseline and tell me if we should ship it.", "expected_skill": "evaluating-changes", "fixture": "Synthetische Rohdaten: Judge-Score des Kandidaten höher; Pflichtregression 'Timeout ist keine Zustimmung' verletzt; Usage fehlt bei 3 von 8 Läufen.", "assertion": "Regelverstoß blockiert; Kosten teils unbekannt; keine Aktivierung oder Merge, Empfehlung verwerfen oder korrigieren."},
  {"prompt": "Erzeuge fünf bessere Varianten dieses Prompts.", "expected_skill": null, "fixture": "Ein Prompt ohne Eval-Daten.", "assertion": "Skill nicht laden; Kandidatenerzeugung ist kein Vergleich."},
  {"prompt": "Was ist ein Konfidenzintervall?", "expected_skill": null, "fixture": "Allgemeine Wissensfrage.", "assertion": "Skill nicht laden."}
]
```
