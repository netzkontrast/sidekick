# Dossier: automatic_prompt_engineer

> Vorlage für diese Recherche, abgeleitet aus [docs/research/dossiers/_vorlage.md](../../../docs/research/dossiers/_vorlage.md).
> Belegstatus je Aussage: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*.
> Clean-Room: Hier steht beobachtbares Verhalten und unsere Schlussfolgerung, kein übersetzter Fremdcode
> und keine wörtlich übernommenen Prompts.

| Feld | Wert |
|---|---|
| Fork (gelesen) | https://github.com/netzkontrast/automatic_prompt_engineer |
| Upstream (laut Doku) | `keirp/automatic_prompt_engineer`; Code zum Paper „Large Language Models Are Human-Level Prompt Engineers“, Zhou et al., [arXiv:2211.01910](https://arxiv.org/abs/2211.01910) ([README L1–9](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/README.md#L1-L9)) |
| Commit-SHA | `5f8058c041ba271599539069f594f93f92278a1e` |
| Letzter Commit | 2022-11-05 („Create LICENSE.md“) – seit drei Jahren unverändert |
| Lizenz | MIT, „Copyright (c) 2022 keirp“; gebündelte Fremddaten (Instruction Induction, TruthfulQA) ohne eigene Lizenzhinweise |
| Art | Optimierer (Python-Bibliothek) + Forschungscode |
| Geprüft am / von | 2026-10-30 / Claude Code (Dokumenten- und Codelektüre, lokaler Offline-Prüflauf) |

## Zweck

APE behandelt eine Instruktion als „Programm“: Ein LLM schlägt aus Ein-/Ausgabe-Beispielen viele
Kandidaten-Instruktionen vor, ein zweites bewertet sie auf Daten, die beste wird ausgewählt. Zielgruppe
sind Forschende/Entwickler, die Zero-Shot-Instruktionen datengetrieben finden wollen
(*dokumentiert*, [README L14–25](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/README.md#L14-L25)).

## Kernkonzepte

| Konzept | Beobachtung (eigene Worte) | Evidenz | Fundstelle |
|---|---|---|---|
| Generieren → Deduplizieren → Bewerten → Sortieren | Hauptablauf: Kandidaten erzeugen, exakte Dubletten entfernen, mit gewählter Methode bewerten, Ergebnisobjekt plus Ausführungsfunktion für die Siegerinstruktion zurückgeben. | *im Code gefunden* | [ape.py L105–158](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/automatic_prompt_engineer/ape.py#L105-L158) |
| Instruktions-Induktion aus Demos | Mehrere Unterstichproben der Trainingsbeispiele werden je in eine Generierungsschablone gesteckt; pro Anfrage werden viele Fortsetzungen bei hoher Temperatur gezogen (Default 5 × 50). | *im Code gefunden* | [generate.py L20–42](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/automatic_prompt_engineer/generate.py#L20-L42), [default.yaml L1–14](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/automatic_prompt_engineer/configs/default.yaml#L1-L14) |
| Drei Schablonentypen mit Tokens | Generierungs-, Bewertungs- und Demo-Schablone mit festen Platzhaltern (Lücke für den zu erzeugenden Text, Prompt, Input, Output, Demo-Block). „Forward“-Modus: Lücke am Ende; „Insert“-Modus: Bewertungsschablone wird durch Tausch des Prompt-Platzhalters zur Generierungsschablone (Lücke mitten im Text). | *im Code gefunden* | [template.py L1–76](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/automatic_prompt_engineer/template.py#L1-L76), [ape.py L5–14](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/automatic_prompt_engineer/ape.py#L5-L14) |
| Scoring per Log-Likelihood | Bewertet wird, wie wahrscheinlich das Modell die Soll-Ausgabe unter der Instruktion findet (Echo + Logprobs der Ausgabe-Tokens); Aggregation wahlweise Mittel, Median, IQM usw. | *im Code gefunden* | [likelihood.py L33–65](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/automatic_prompt_engineer/evaluation/likelihood.py#L33-L65), [L91–107](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/automatic_prompt_engineer/evaluation/likelihood.py#L91-L107), [llm.py L191–203](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/automatic_prompt_engineer/llm.py#L191-L203) |
| Scoring per Ausführungsgenauigkeit | Alternative: Instruktion auf zurückgehaltenen Beispielen ausführen und mit aufgabenspezifischer Metrik (Exact Match, F1, Enthält, Mengen-Gleichheit) gegen Gold vergleichen. | *im Code gefunden* | [exec_accuracy.py L16–58](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/experiments/evaluation/instruction_induction/exec_accuracy.py#L16-L58), [utility.py L9](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/experiments/evaluation/instruction_induction/utility.py#L9) |
| Budgetierte Auswahl (UCB-Bandit) | Statt alle Kandidaten voll zu bewerten: in Runden die Kandidaten mit höchster Obergrenze (Mittel + Explorationsterm) auf kleinen Stichproben bewerten; Bewertungsmethode ist austauschbar (auch eigene Funktion). | *im Code gefunden* | [bandits.py L10–32](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/automatic_prompt_engineer/evaluation/bandits.py#L10-L32), [L151–165](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/automatic_prompt_engineer/evaluation/bandits.py#L151-L165), [evaluate.py L7](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/automatic_prompt_engineer/evaluate.py#L7) |
| Kostenschätzung vor dem Lauf | Grobe Kostenvorhersage (Zeichen/4 als Token, feste Preistabelle) und optionale Bestätigung vor teuren Aufrufen. | *im Code gefunden* | [ape.py L193](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/automatic_prompt_engineer/ape.py#L193), [llm.py L63–68](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/automatic_prompt_engineer/llm.py#L63-L68), [llm.py L331–351](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/automatic_prompt_engineer/llm.py#L331-L351) |
| Datentrennung im Experiment | Experiment-Skript teilt Induktionsdaten in Generierungs- und Bewertungsteil und prüft die Sieger danach separat auf Testdaten. | *im Code gefunden* | [run_instruction_induction.py L17–26](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/experiments/run_instruction_induction.py#L17-L26), [L77–90](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/experiments/run_instruction_induction.py#L77-L90) |

## Artefakte und Formate

- Python-Paket mit zwei Einstiegen: `find_prompts` (volle YAML-Konfiguration, verschachtelt überschreibbar)
  und `simple_ape` (Defaults) (*im Code gefunden*). Konfiguration in YAML: `generation`, `evaluation`, `demo`,
  je mit Modellname und Sampling-Parametern ([bandits.yaml L15–19](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/automatic_prompt_engineer/configs/bandits.yaml#L15-L19)).
- Ergebnisobjekte mit einheitlicher Schnittstelle `sorted()` / `in_place()`; Ausgabe als Textliste „Score: Prompt“.
- Keine CLI/MCP; Experimente per `fire`-Skripte; Unit-Tests unter `tests/` (teilweise API-abhängig).

## Messung und Evaluation

- „Menschliches Niveau auf 21/24 Aufgaben“ ist *dokumentiert* ([README L21–23](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/README.md#L21-L23)); im Repo liegen keine Ergebnislogs → *offen*.
- Offline-Prüflauf (*praktisch nachgewiesen*, ohne `openai`, mit Stubs für `tqdm`/`evaluate`): Schablonen-Umwandlung
  Bewertung→Generierung funktioniert, eine Generierungsschablone ohne Lücke wird abgewiesen, Demo-Block wird
  mit Trenner zusammengesetzt. UCB auf 20 simulierten Kandidaten (wahre Güte 0,1–0,9, 30 Runden à 5) konzentrierte
  das Budget auf die besten Arme (105–115 Stichproben vs. 10 für die schwächsten); 4 der Top-5 nach Score waren
  tatsächlich beste Arme. Kein Lauf gegen ein echtes LLM.

## Grenzen und Risiken

- Modelle und API veraltet: Defaults `text-davinci-002`, alte Completions-Schnittstelle; Likelihood-Scoring
  braucht Echo-Logprobs über den Prompt, die moderne Chat-APIs meist nicht liefern (*im Code gefunden*, Verfügbarkeit *offen*).
- Kostenschätzer leitet die Preisstufe aus dem Modellnamen-Fragment ab; für heutige Modellnamen fällt er auf
  eine Tabelle ohne passenden Schlüssel zurück und würde abbrechen (*im Code gefunden*, nicht ausgeführt).
- `simple_ape` nutzt dieselben Daten für Generierung, Bewertung und Demos ([ape.py L56](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/automatic_prompt_engineer/ape.py#L56)) – Überanpassungsrisiko; nur das Experiment-Skript trennt sauber.
- Das im Paper beschriebene iterative Nachsampeln (Monte-Carlo-Suche um gute Kandidaten) fand sich im Code nicht (*offen*).
- Dubletten-Entfernung nur exakt; semantisch gleiche Instruktionen verbrauchen weiter Budget.
- Herkunft: Instruction-Induction-Daten (deren [Daten-README L1–14](https://github.com/netzkontrast/automatic_prompt_engineer/blob/5f8058c041ba271599539069f594f93f92278a1e/experiments/data/instruction_induction/README.md#L1-L14) spricht von „our … prompt“, Quelle vermutlich Honovich et al., nicht genannt) und TruthfulQA liegen ohne Quellen-/Lizenzangabe bei (*offen*).

## Clean-Room-Relevanz

- **B1:** Ein Instruktions-Optimierer muss Kandidaten aus Beispielen *induzieren* (mehrere Stichproben, mehrere
  Samples) und Generierung, Bewertung und Endtest auf getrennten Datensplits ausführen (Split erzwungen, nicht optional).
- **B2:** Bewertung ist eine austauschbare Schnittstelle (Kandidaten × Daten → Scorematrix) mit mindestens
  Ausführungsgenauigkeit + pluggable Metrik; Likelihood nur, wenn das Backend Logprobs liefert.
- **B3:** Auswahl unter Budget per Bandit-Strategie (z. B. UCB) mit konfigurierbarem Explorationsparameter,
  Rundenzahl und Stichprobengröße; Ergebnis enthält Score *und* Stichprobenzahl je Kandidat.
- **B4:** Vor jedem Optimierungslauf Kosten-/Tokenvoranschlag mit Freigabe-Schwelle, Preistabelle extern konfigurierbar.
- **B5:** Schablonen mit benannten, validierten Slots (Lücke genau einmal, Pflicht-Platzhalter geprüft).
- Nicht übernommen: Davinci-spezifischer Client, Insert-Modus (abhängig von Suffix-API). Kategorie:
  **Verhalten neu implementieren** (Algorithmus ist klein und paperbasiert; MIT würde Übernahme erlauben, Code ist aber veraltet).

## Offene Punkte

- Paper-Abschnitt zur iterativen Suche gegen Code abgleichen; Ergebnis im Dossier nachtragen.
- Unit-Tests (`tests/test_template.py`, `test_bandits.py`) in einer venv mit `numpy`/`tqdm` ausführen (ohne API-Key).
- Prüfen, welche heutigen Backends Logprobs für vorgegebene Ausgaben liefern (Voraussetzung für B2-Likelihood).
