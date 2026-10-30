# Dossier: skill-optimization

> Vorlage für diese Recherche, abgeleitet aus [docs/research/dossiers/_vorlage.md](../../../docs/research/dossiers/_vorlage.md).
> Belegstatus je Aussage: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*.
> Clean-Room: Hier steht beobachtbares Verhalten und unsere Schlussfolgerung, kein übersetzter Fremdcode
> und keine wörtlich übernommenen Prompts.

| Feld | Wert |
|---|---|
| Fork (gelesen) | https://github.com/netzkontrast/skill-optimization |
| Upstream (laut Doku) | https://github.com/instavm/skill-optimization ([blog_post.md L80](B/docs/blog_post.md#L80)); Commit-Autor „mkagenius“ |
| Commit-SHA | `6fec081ed78a5bcd518d6562ec7452e54ff47aba` |
| Letzter Commit | 2025-12-28, „Update optimization results explanation“ |
| Lizenz | MIT, **Copyright-Zeile ist der Platzhalter „2024 [Your Name]“** ([LICENSE L3](B/LICENSE#L3)) |
| Art | Forschungscode / Experiment (Python, DSPy) |
| Geprüft am / von | 2026-10-30 / Claude Code (Dokumenten- und Codelektüre, kein Code ausgeführt) |

Permalink-Basis: `B = https://github.com/netzkontrast/skill-optimization/blob/6fec081ed78a5bcd518d6562ec7452e54ff47aba`

## Zweck

Das Repo ist ein Experiment. Es soll zeigen, dass sich ein Skill.md (Beispiel: Code-Review auf Sicherheitslücken) mit DSPy-Optimierern
(BootstrapFewShot, MIPROv2) anhand von Trainingsbeispielen und einer Metrik verbessern lässt. Die Ergebnisse sollen modellabhängig sein
(*dokumentiert*, [README L1–5](B/README.md#L1)).

## Kernkonzepte

| Konzept | Beobachtung (eigene Worte) | Evidenz | Fundstelle |
|---|---|---|---|
| Skill als Signatur | Der Skill wird als typisierte Ein-/Ausgabe-Signatur modelliert (Code + Sprache → kritische/hohe Befunde). Die Umwandlung geschieht **von Hand**. | *im Code gefunden*, *dokumentiert* | [optimize_qwen.py L62–67](B/scripts/optimize_qwen.py#L62), [blog_post.md L355–361](B/docs/blog_post.md#L355) |
| Gelabelte Trainingsdaten | Zehn handgeschriebene, absichtlich verwundbare Codebeispiele mit erwarteten Befunden (Titel, Schweregrad, Ort, Kategorie). | *im Code gefunden* | [training_data.json](B/data/training_data.json#L1), [examples/](B/examples) |
| Metrik als Optimierungsziel | Gewichtete Summe aus Erkennung (F1 über **Anzahlen**), Schweregrad, Erklärungs- und Fix-Qualität (Keyword- und Längenheuristiken) und einem Malus für Überberichtung. | *im Code gefunden* | [improved_evaluator.py L33–40](B/src/improved_evaluator.py#L33), [L67–118](B/src/improved_evaluator.py#L67) |
| Alternative Metrik mit Matching | Eine ältere Metrik ordnet vorhergesagte und erwartete Befunde über Wortüberlappung, Kategorie und Ort zu. Sie wird im Qwen-Lauf nicht verwendet. | *im Code gefunden* | [evaluator.py L159–194](B/src/evaluator.py#L159) |
| Few-Shot-Auswahl durch Optimierer | BootstrapFewShot wählt Demonstrationen aus, die die Metrik bestehen. Der „optimierte Skill“ ist damit vor allem eine Beispielauswahl. | *im Code gefunden* | [optimize_qwen.py L113–122](B/scripts/optimize_qwen.py#L113) |
| Rückführung in Markdown | Der Export in Skill.md ist ein Stub (Überschriften plus Demos). `skills/code-review-optimized.md` ist laut Doku **von Hand** geschrieben. | *im Code gefunden*, *dokumentiert* | [models.py L167–191](B/src/models.py#L167), [blog_post.md L345–349](B/docs/blog_post.md#L345) |
| Modellspezifische Varianten | These: Schwächere Modelle profitieren mehr. Daraus folgt die Idee, Skills pro Zielmodell neu zu optimieren. | *dokumentiert* (nicht belastbar belegt, s. u.) | [OPTIMIZATION_RESULTS.md L10–14](B/docs/OPTIMIZATION_RESULTS.md#L10) |

## Artefakte und Formate

- Drei Skill-Varianten: Basis mit 97 Zeilen, „optimized“ mit 151 Zeilen, „modular“ mit 150 Zeilen. Die optimierte Fassung ist **länger**, was mehr Tokens pro Aufruf bedeutet (*im Code gefunden*, [skills/](B/skills)).
- Daten: `training_data.json` (10 Fälle), `test_cases.json` (3 Fälle, Dateien `example_1–3`, die ebenso im Training stehen) und `validation_data.json` (Snippets).
- Skripte für Ollama/Qwen und Azure/GPT-4o. Abhängigkeiten: `dspy-ai>=2.4.0`, `openai`, `python-dotenv` ([requirements.txt](B/requirements.txt)).
- Ergebnisse speichert das Skript als `results/qwen_bootstrap_<ts>.json` ([optimize_qwen.py L187–198](B/scripts/optimize_qwen.py#L187)). Im Repo liegt **keine** solche Datei, nur `.gitkeep` und ein Beispielbericht.

## Messung und Evaluation

- **Qwen-Lauf (+12,5 %):** Baseline und optimierte Fassung werden auf **denselben drei Beispielen** bewertet, auf denen auch optimiert wurde
  (`trainset` = erste drei Trainingsfälle, Code auf 1500 Zeichen gekürzt). Es gibt also keinen Hold-out und damit Datenleck
  (*im Code gefunden*, [optimize_qwen.py L45–56](B/scripts/optimize_qwen.py#L45), [L82](B/scripts/optimize_qwen.py#L82), [L141](B/scripts/optimize_qwen.py#L141)).
  Zusätzlich vergleicht der Lauf `Predict` (Baseline) mit `ChainOfThought` (optimiert). Die Verbesserung lässt sich also nicht von der Few-Shot-Auswahl trennen ([L79](B/scripts/optimize_qwen.py#L79), [L110](B/scripts/optimize_qwen.py#L110)).
- „+12,5 %“ sind Prozentpunkte (42,5 → 55,1). Gemessen wurde mit n = 3, einem Lauf, Temperatur 0,3 und ohne Streuungsangabe ([README L26–29](B/README.md#L26)).
- **GPT-4o (40,6 → 38,8):** Die README nennt das „0 %“. Tatsächlich ist es eine Verschlechterung ([README L62–67](B/README.md#L62)). Die Doku nennt die These
  trotzdem „bestätigt“ ([OPTIMIZATION_RESULTS.md L12–14](B/docs/OPTIMIZATION_RESULTS.md#L12)).
- **Die Metrik bewertet die Form, nicht die Richtigkeit:** Die Erkennung zählt nur Zeilen ab 15 Zeichen pro Ausgabefeld gegen die erwartete *Anzahl*.
  Ob der Inhalt stimmt, wird nicht geprüft. Der Schweregrad startet mit 0,5 Punkten, auch ohne Befund. Erklärungs- und Fix-Qualität belohnen
  Länge und Wörter wie „use“, „should“ oder „can“ ([improved_evaluator.py L129–227](B/src/improved_evaluator.py#L129)). Die Metrik ist damit leicht
  durch Formulierung zu manipulieren (*im Code gefunden*).
- `results/sample_comparison_report.md` nennt andere Zahlen (64 → 87 %, Precision/Recall). Seine Quelle lässt sich nicht nachvollziehen ([L1–20](B/results/sample_comparison_report.md#L1)).
  Gespeicherte Rohergebnisse fehlen, die Zahlen sind *nicht reproduzierbar belegt*.

## Grenzen und Risiken

- Lizenz-Platzhalter: Wer der Urheber ist, bleibt rechtlich unklar (Commit-Autor „mkagenius“, Upstream-Organisation „instavm“). Vor jeder Übernahme von Code oder Daten
  muss das geklärt werden.
- Abhängig von DSPy-API-Ständen: `dspy.OpenAI` und `dspy.LM` stammen aus unterschiedlichen Generationen. Ob es mit aktuellem DSPy läuft, ist *offen*.
- Die Trainingsdaten sind klein, selbstgemacht und mit dem Testset identisch. Laut Autor lassen sie sich nicht automatisch erzeugen ([blog_post.md L263–283](B/docs/blog_post.md#L263)).
- Externe API-Kosten (Azure) und Netzwerkzugriff fallen an. Lokal wird Ollama auf `localhost:11434` angesprochen.

## Clean-Room-Relevanz

Anforderungen für den eigenen Rewrite (als Konzept, nicht als Code):
- **R1:** Skill-Optimierung braucht ein explizites Eval-Set mit **getrennten** Train-, Dev- und Test-Splits. Ergebnisse auf Trainingsdaten gelten nicht als Nachweis.
- **R2:** Metriken prüfen inhaltliche Treffer, etwa durch Zuordnung erwarteter Befunde oder Rubrik-Bewertung durch ein zweites Modell. Reine Längen- oder Keyword-Heuristiken sind nur Nebensignale.
- **R3:** Jede Optimierungsrunde speichert Rohergebnisse (Modell, Version, Seed/Temperatur, n, Einzelwerte) maschinenlesbar. Berichte werden nur daraus erzeugt.
- **R4:** Optimierungsergebnisse (ausgewählte Few-Shot-Beispiele, Instruktionsänderungen) fließen als Kandidat in den Skill zurück, mit denselben
  Gates wie bei der Kompression (Inventar, Review, Apply). Längenzuwachs wird als Kostenfaktor ausgewiesen.
- **R5:** Varianten pro Zielmodell sind erlaubt, aber nur mit Vergleich gegen eine Baseline desselben Modulaufbaus.
- Nicht übernehmen: Code, Daten (Lizenz unklar), die Metrik selbst.
- Kategorie: **Verhalten neu implementieren** (Konzept). DSPy kann bei Bedarf als **Dependency** geprüft werden. Code: **zurückstellen**.

## Offene Punkte

- Lizenz klären: Upstream `instavm/skill-optimization` auf korrigierte LICENSE prüfen. Sonst nur Ideen nutzen.
- Versuch V1: Den Qwen-Lauf mit getrenntem Testset (Fälle 4–10) und mehreren Seeds wiederholen und Baseline und Optimierung mit gleichem Modul (beide CoT) vergleichen.
- Versuch V2: Die Metrik mit absichtlich falschen, aber wortreichen Ausgaben testen, um die Manipulierbarkeit zu quantifizieren.
- Versuch V3: Den Token-Mehraufwand von `code-review-optimized.md` gegenüber der Basis messen und dem Qualitätsgewinn gegenüberstellen.
