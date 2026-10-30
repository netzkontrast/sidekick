# Dossier: dspy-advanced-prompting

> Vorlage für diese Recherche, abgeleitet aus [docs/research/dossiers/_vorlage.md](../../../docs/research/dossiers/_vorlage.md).
> Belegstatus je Aussage: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*.
> Clean-Room: Hier steht beobachtbares Verhalten und unsere Schlussfolgerung, kein übersetzter Fremdcode
> und keine wörtlich übernommenen Prompts.

| Feld | Wert |
|---|---|
| Fork (gelesen) | https://github.com/netzkontrast/dspy-advanced-prompting |
| Upstream (laut Doku) | `evalops/dspy-advanced-prompting` (vorher `haasonsaas`), [README L72](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/README.md#L72); Techniken „inspiriert“ von Startups (Parahelp, Jazzberry), [README L177–181](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/README.md#L177-L181); kein Paper |
| Commit-SHA | `facc1ad8db77006fd371ba228ea0dfaf5701f478` |
| Letzter Commit | 2026-04-11 („Update org references from haasonsaas to evalops (#1)“), 12 Commits gesamt |
| Lizenz | MIT, „Copyright (c) 2025 Jonathan Haas“ |
| Art | Beispiel-/Lehrbibliothek auf Basis von DSPy (Python) |
| Geprüft am / von | 2026-10-30 / Claude Code (Codelektüre, lokaler Offline-Prüflauf mit DSPy-Stub) |

## Zweck

Sammlung von elf Prompting-Techniken als DSPy-Module (Signaturen + `dspy.Module`) mit Beispielen,
Notebooks und einem eigenen Evaluations-Framework; gedacht als Anschauungsmaterial
(*dokumentiert*, [README L3–66](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/README.md#L3-L66)).
DSPys eigentliche Optimierer (Teleprompter, `compile`) werden **nicht** verwendet; eine Suche danach blieb
ohne Treffer (*im Code gefunden*).

## Kernkonzepte

| Konzept | Beobachtung (eigene Worte) | Evidenz | Fundstelle |
|---|---|---|---|
| Signatur als Prompt-Vertrag | Jede Technik definiert typisierte Ein-/Ausgabefelder mit Kurzbeschreibung; ein Modul kombiniert Signatur + Strategie (Chain-of-Thought). Strukturierte Ergebnisse werden zusätzlich mit Pydantic validiert. | *im Code gefunden* | [meta_prompting.py L15–60](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/techniques/meta_prompting.py#L15-L60) |
| „Manager-Style“-Prompt aus Konfiguration | Rollenbeschreibung als ausführliches Onboarding-Dokument, gerendert aus einem Konfig-Objekt (Rolle, Verantwortungen, Kennzahlen, Werkzeuge, Befugnisse, Eskalation, Grenzen, Musterbeispiele) per Jinja-Template. | *im Code gefunden* | [manager_style.py L14–40](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/prompts/manager_style.py#L14-L40), [L193–210](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/prompts/manager_style.py#L193-L210) |
| Meta-Prompt-Schleife Analyse → Optimierung | Ein Modul lässt das LLM einen Prompt bewerten (JSON mit Klarheit, Spezifität, Lücken), dann umschreiben; dazu ein Debug-Schritt (erwartet vs. tatsächlich) und Selbstkritik-Schleife bis Fixpunkt. | *im Code gefunden* | [meta_prompting.py L73–147](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/techniques/meta_prompting.py#L73-L147), [L268–324](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/techniques/meta_prompting.py#L268-L324) |
| „Evolution“ von Prompts | Population aus zufälligen Textmutationen (feste String-Ersetzungen/Anhänge) und zeilenweiser Kreuzung, Selektion per übergebener Fitnessfunktion. | *im Code gefunden* | [meta_prompting.py L196–265](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/techniques/meta_prompting.py#L196-L265) |
| Aufgabenplanung mit Abhängigkeiten | Plan aus Teilaufgaben mit IDs, Status und Abhängigkeiten; Ausführung nur, wenn Vorgänger erledigt; blockierte Pläne brechen ab; rekursive Zerlegung mit Tiefenlimit. | *im Code gefunden* | [task_planning.py L152–218](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/techniques/task_planning.py#L152-L218), [L271–309](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/techniques/task_planning.py#L271-L309) |
| Prompt-Folding | Ein Prompt erzeugt Unter-Prompts, rekursiv bis „atomar“ (Heuristik: Wortzahl/Schlüsselwörter) oder Tiefenlimit; Strategien rekursiv/parallel/Pipeline – „parallel“ läuft tatsächlich sequenziell. | *im Code gefunden* | [prompt_folding.py L113–161](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/techniques/prompt_folding.py#L113-L161) |
| Personas / Multi-Persona | Rollenobjekte mit Ton, Expertise, Grenzen; „Orchestrator“ fragt mehrere Personas nacheinander und gibt ein Dict zurück – **ohne** Synthese- oder Dirigentenschritt. | *im Code gefunden* | [role_prompting.py L25–93](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/techniques/role_prompting.py#L25-L93), [L286–311](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/techniques/role_prompting.py#L286-L311) |
| Strukturierte Ausgabe mit Validator | Ausgabeschema (Sektionen, Pflichtfelder) für XML/Markdown/JSON/Hybrid und nachgelagerte Validierung. | *im Code gefunden* | [structured_output.py L24–222](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/techniques/structured_output.py#L24-L222) |
| Escape Hatches | Unsicherheit wird über Phrasenlisten im Antworttext erkannt und auf feste Konfidenzwerte abgebildet; darunter Degradationsantwort. | *im Code gefunden* | [escape_hatches.py L79–96](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/techniques/escape_hatches.py#L79-L96) |
| Few-Shot nach Qualitätsstufen | Beispiele mit Stufe (challenging/gold/…); Auswahl nach Stufe und Anzahl, nicht nach Ähnlichkeit zur Eingabe. | *im Code gefunden* | [few_shot.py L78–95](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/techniques/few_shot.py#L78-L95) |
| Testfälle als Hauptartefakt | Testsuite mit Falltypen (Edge, Robustheit …), Kriterien (exakt, enthält-alle, Ähnlichkeit, eigene Funktion), A/B-Vergleich und Regressionslauf gegen Baseline-Datei. | *im Code gefunden* | [evaluation_framework.py L178–268](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/evaluations/evaluation_framework.py#L178-L268), [L403–445](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/evaluations/evaluation_framework.py#L403-L445) |

## Artefakte und Formate

- Python-Module unter `src/techniques`, `src/prompts`, `src/evaluations`; Prompts als Python-Strings und ein
  Jinja-Template; Konfiguration über `.env` (OpenAI-Key, optional weitere Anbieter); vier Notebooks.
- Keine CLI außer `main.py`-Demo, keine Skill-/MCP-Schnittstelle (*im Code gefunden*).

## Messung und Evaluation

- **Optimierer liefert den Ausgangsprompt zurück** (*praktisch nachgewiesen*): Die iterative Optimierung setzt
  allen Beispielen eine feste Qualität von 8,0, ohne den Prompt auszuführen; da der Mittelwert nie steigt,
  bleibt der beste Prompt der initiale ([meta_prompting.py L149–193](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/techniques/meta_prompting.py#L149-L193)).
  Offline-Lauf mit DSPy-Stub (kein Netz): 3 Analyse- + 3 Optimierungsaufrufe, Ergebnis = Eingabeprompt, Konfidenz fix 0,8.
- Destillation: „Genauigkeit“ von Lehrer/Schüler ist fest einprogrammiert (0,95/0,88, im Code als simuliert markiert)
  ([model_distillation.py L257–288](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/techniques/model_distillation.py#L257-L288), *im Code gefunden*).
- „Semantische Ähnlichkeit“ ist Wort-Jaccard; Recall ist strukturell fast immer 1, da „bestanden“ und
  „Score < 0,5“ sich bei den Kriterien kaum überschneiden; der t-Test teilt bei deterministischen Läufen durch 0
  ([evaluation_framework.py L204–256](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/evaluations/evaluation_framework.py#L204-L256), *im Code gefunden*, nicht ausgeführt).
- „FULLY VALIDATED“ ([README L89–98](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/README.md#L89-L98)) beruht auf Strukturchecks und Schlüsselwort-Treffern in
  Antworten ([validate_with_real_api.py L71–74](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/validate_with_real_api.py#L71-L74)); Kosten nur per Zeichen/4 geschätzt. Keine pytest-Suite.

## Grenzen und Risiken

- README-Beispiel ruft `FewShotLearner(examples)` ohne die im Konstruktor verlangte Schablone auf
  ([README L193](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/README.md#L193) vs. [few_shot.py L71](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/src/techniques/few_shot.py#L71)) – würde fehlschlagen (*im Code gefunden*).
- „Genetische Algorithmen“, „adaptive Auswahl“, „Halluzinationsverhinderung“ sind Heuristiken auf Stringebene;
  die README-Formulierungen ([L33–51](https://github.com/netzkontrast/dspy-advanced-prompting/blob/facc1ad8db77006fd371ba228ea0dfaf5701f478/README.md#L33-L51)) überzeichnen den Code.
- Herkunft der „Startup-Techniken“ nur als Danksagung, ohne Quelle; ob Prompt-Inhalte übernommen wurden, ist *offen*.
- Abhängigkeit `dspy-ai>=2.4` ungepinnt; Kostenaufrufe gegen OpenAI für alle echten Läufe.

## Clean-Room-Relevanz

- **C1:** Prompts als *Signaturen* modellieren: benannte, typisierte Ein-/Ausgabefelder plus Strategie
  (direkt, CoT), Ausgaben schema-validiert; Prompt-Text wird aus der Signatur erzeugt, nicht frei getippt.
- **C2:** Rollen-/Onboarding-Prompts aus strukturierter Konfiguration rendern (Rolle, Ziele, Kennzahlen,
  Werkzeuge, Befugnisse, Eskalation, Grenzen, Beispiele) – als Skill-Frontmatter oder Datenmodell.
- **C3:** Jeder Optimierer muss Kandidaten *tatsächlich ausführen* und gegen eine Testsuite messen; gewählt wird
  nur bei gemessener Verbesserung, mit Protokoll (Gegenbeispiel: L149–193).
- **C4:** Testsuite als erstklassiges Artefakt (Falltypen, Kriterien, Baseline, Regression, A/B mit korrekter
  Statistik und Varianzschutz); Kennzahlen nie simulieren.
- **C5:** Planer/Folding mit Abhängigkeitsgraph, Statusmodell, Tiefenlimit und echtem Parallelmodus;
  Mehr-Experten-Befragung nur mit explizitem Synthese-/Dirigentenschritt.
- Nicht übernommen: Phrasenlisten-Unsicherheit, String-Mutationen als „Evolution“, simulierte Metriken.
  Kategorie: **Verhalten neu implementieren**; für C1 ggf. **DSPy als Dependency** prüfen (eigene Entscheidung, `docs/entscheidungen/`).

## Offene Punkte

- DSPy selbst (Signaturen, Teleprompter wie MIPRO/COPRO) als eigenes Dossier untersuchen – dieses Repo belegt
  DSPys Optimierer nicht.
- Notebooks (`technique_comparison.ipynb`) auf gespeicherte Ausgaben/Messwerte prüfen.
- Escape-Hatch-Beispiel aus dem README (Konfidenz 0,15) gegen die Konfidenzabbildung im Code abgleichen.
