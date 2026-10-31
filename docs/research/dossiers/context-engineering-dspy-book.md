# Dossier: context-engineering-dspy-book

> Nach [Vorlage](_vorlage.md). Belegstatus je Aussage: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*.
> Clean-Room: Hier stehen beobachtbares Verhalten, Verfahren und unsere Bewertung. Es wurde kein Code, kein Prompt, keine Fallformulierung und kein Datensatz übernommen.

| Feld | Wert |
|---|---|
| URL | [netzkontrast/context-engineering-dspy-book](https://github.com/netzkontrast/context-engineering-dspy-book) (Fork des Begleitcodes zu „Context Engineering with DSPy“, O’Reilly) |
| Commit-SHA | [`92d97caf59d8d09b14d9cfe89d12fce3b9efc38c`](https://github.com/netzkontrast/context-engineering-dspy-book/tree/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c) |
| Release / Datum | keine Tags; Merge von PR #13 („book-parity-audit“) vom 08.10.2026; gepinnt `dspy==3.3.0`, `gepa==0.1.1`. Fassung 1 dieses Dossiers beruhte auf `a633241` (14.09.2026, 771 Dateien) |
| Lizenz(en), Notices, Assets | Code: MIT, „Copyright (c) 2025 Mike Taylor“ ([`LICENSE`](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/LICENSE)). Buchtext nicht im Repo. Datensätze gemischt lizenziert (siehe unten). |
| Priorität / Tor | Skill-Library und Eval-Harness (SL-Pakete); keine P0-Hub-Entscheidung |
| Geprüft am / von | 31.10.2026 · Fassung 1: Explorer-Agent am alten Stand. Fassung 2: Claude Code am neuen Stand – Dateibaum (346 Dateien, 58 Notebooks), Kapitel-6-Ergebnisse, `BOOK_NOTES.md`, `data/README.md`, AGENTS.md-Notebook und alle unten zitierten Zeilen nachgeprüft; der Planungsabgleich in [#33](../../../research/skills-meta-prompting/dspy-book-integration-plan.md) las denselben Stand |

## Kurzfassung

Elf Kapitel Notebooks zu DSPy: Signaturen, Module, Metriken, Optimizer, Agents, Produktion und – in Kapitel 11 – die Optimierung von Coding-Agent-Texten (SKILL.md, AGENTS.md, SOUL.md). Für sidekick zählt weniger DSPy selbst als das **Messverfahren**: eingefrorene, paargruppierte Splits, ein Freigabetor für den Testsatz, ein Kostendeckel in Dollar und gepaarte Statistik (Kapitel 6), dazu die Kalibrierung eines LLM-Judges an menschlichen Urteilen (Kapitel 5) und ein Fallformat für AGENTS.md-Anti-Muster (Kapitel 11).

Der Code ist Python mit rund 31 direkten Abhängigkeiten. sidekicks Werkzeuge sind Node ohne Abhängigkeiten. Übernommen werden deshalb Verfahren als eigene Anforderungen, keine Bibliothek.

## Startanleitung

Laut [`README.md`](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/README.md): Python 3.12–3.14, `uv sync`, API-Keys in `.env`, `scripts/check_setup.py` prüft die Umgebung ohne Key-Werte auszugeben (*dokumentiert*). Kapitel 6 läuft per Default ohne API-Aufrufe aus gespeicherten Ergebnissen; Live-Läufe nur mit `CHAPTER06_RUN_LIVE=1` (*dokumentiert*). Nichts davon wurde ausgeführt (*offen*).

## Öffentliche Verträge

Keine im Sinn einer API. Relevant sind die Verfahren und Formate:

| Verfahren | Fundstelle | Beobachtung | Status |
|---|---|---|---|
| Eingefrorener Datensatz | [`chapter06/optimizer_runtime.py` L121](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter06/optimizer_runtime.py#L121) | Laden prüft SHA-256 und Zeilenzahl gegen ein Manifest und lehnt Paare ab, die über Splits verteilt sind | *im Code gefunden* |
| Freigabetor Testsatz | [`chapter06/CHAPTER_RESULTS.md` L3](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter06/CHAPTER_RESULTS.md#L3) | Auswahl nur auf Validierung; der gesperrte Test wird erst nach dem Einfrieren freigegeben | *dokumentiert* |
| Kostendeckel | [`guardrails.py` L52–L81](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter06/experiments/gepa_expanded/guardrails.py#L52-L81) | Ledger in Dollar mit Obergrenze; vor jedem Aufruf wird die geplante Ausgabe gegen Rest und Reserve geprüft | *im Code gefunden* |
| Fehlerklassen, Redaktion | [`guardrails.py` L217, L242](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter06/experiments/gepa_expanded/guardrails.py#L217) | API-Fehler werden klassifiziert; Secret-Muster vor dem Schreiben entfernt | *im Code gefunden* |
| Gepaarte Statistik | [`analysis.py` L50, L90](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter06/experiments/gepa_expanded/analysis.py#L50) | exakter McNemar-Test über diskordante Paare; Bootstrap-Konfidenzintervall mit dem Paar als Ziehungseinheit | *im Code gefunden* |
| Judge-Kalibrierung | `chapter05/human-then-llm-judge.ipynb` | Mensch urteilt mit Begründung, daraus wird ein Judge trainiert und auf einem Holdout gegen die menschlichen Urteile gemessen; Ziel 80–90 % Übereinstimmung | *dokumentiert* |
| Gewichtete Rubrik | `chapter05/rubric-and-multipredictor.ipynb` | mehrere Dimensionen 1–5, normalisiert und gewichtet; Feedback je Pipeline-Schritt | *dokumentiert* |
| Paarvergleich mit Positionswechsel | `chapter11/landing-page-skill-optimizer.ipynb` | Judges vergleichen Kandidat und Referenz mit zufälliger A/B-Reihenfolge; deterministische Prüfungen zählen 50 %, zwei Judges je 25 % | *dokumentiert* |
| AGENTS.md-Fallformat | `chapter11/test-agents-md.ipynb`, Zellen 4–9 | je Fall Aufgabe, gesuchtes Anti-Muster und Erkennungsmerkmal; ein Agent arbeitet mit der Kandidaten-AGENTS.md, ein Judge urteilt binär | *dokumentiert* |
| Kontextverdichtung | `chapter08/history-mem0-rlm.ipynb` | letzte N Turns wörtlich, ältere zusammengefasst; Ziele, Beschränkungen, offene Punkte und Korrekturen bleiben erhalten, bei Konflikt gilt das Neueste, nichts wird erfunden | *dokumentiert* |
| Trajektorien-Prüfung | `chapter09/financial-analyst.ipynb` | Judge sucht unbelegte Zwischenwerte („Context Poisoning“) und Abdriften; die Endzahl prüft eine deterministische Toleranzprüfung | *dokumentiert* |

### Ergebnisse von Kapitel 6

[`CHAPTER_RESULTS.md`](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter06/CHAPTER_RESULTS.md) (Tabelle 6-1 des Buches) meldet für einen KI-Text-Detektor auf 80 gesperrten Testzeilen: Baseline 53,75 % (43/80), GEPA 80,00 % (64/80, +26,25 pp, 0,58 $ Optimierungskosten), KNNFewShot 72,50 %, Ensemble 70,00 %, MIPROv2 66,25 %, COPRO 56,25 % (45/80, +2,5 pp) und SIMBA 47,50 % (−6,25 pp, als einziger schlechter als die Baseline). Am alten Stand `a633241` stand COPRO bei 50 % und die Kosten von COPRO und MIPROv2 waren Untergrenzen; der neue Stand führt beide mit vollständigen Kosten (0,82 $ bzw. 0,85 $). Alles *dokumentiert*; die Zähler für Baseline, GEPA, COPRO und SIMBA hat #33 aus den gespeicherten Vorhersagen nachgezählt.

Einschränkung, die das Repo selbst nennt: Der Testsatz ist **bewusst schwer für die Baseline gewählt** ([`chapter06/README.md` L65](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter06/README.md#L65); Offenlegung in [`dataset.py` L388](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter06/experiments/gepa_expanded/dataset.py#L388)). Jeder Uplift ist damit nach oben verzerrt. Lehre für sidekick: Wie eine Testmenge ausgewählt wurde, gehört in den Bericht (SLV0-EVAL-47).

### Schwäche von Kapitel 11

`test-agents-md.ipynb` misst nach der Optimierung auf denselben 20 Fällen, auf denen optimiert wurde (Zelle 14); es gibt keinen Holdout. Am neuen Stand läuft der Compile mit 80 Metrikaufrufen (Zelle 13); am alten Stand war er auf 3 begrenzt und der volle Lauf auskommentiert. Gespeicherte Ergebnisse und Unsicherheitsangaben fehlen weiterhin (*im Code gefunden*). Das Verfahren ist brauchbar, ein Nachweis fehlt.

Neu am Stand `92d97ca`: Das Landing-Page-Notebook bringt seine Gold-Seiten und ein Beispiel-SKILL.md mit (`chapter11/assets/`); Kapitel 5 enthält 50 illustrative Judge-Labels (`judge_labels_sample.csv`), die laut #33 keine dokumentierten menschlichen Gutachten sind; Kapitel 7 hat ein Notebook zu `Flex`; `BOOK_NOTES.md` erklärt Abweichungen zwischen gedruckten Listings und ausführbaren Zellen.

## Persistenz

Ergebnisse, Prompts, Programme, Vorhersagen, Ledger und Hashes liegen als Dateien unter `chapter06/results/` (213 Dateien am neuen Stand; am alten 643 plus `optimized_programs/`) (*im Code gefunden*). Keine Datenbank.

## Credential-Fluss

API-Keys aus `.env`; `check_setup.py` meldet nur, ob ein Key gesetzt ist (*im Code gefunden*). `redact()` entfernt Secret-Muster vor dem Schreiben von Artefakten.

## Sicherheitsgrenzen

Keine Rechte- oder Freigabemodelle. Der MCP-Server in Kapitel 8 ist ein Demo-Tool; die Injection-Erkennung in Kapitel 9 sind sechs reguläre Ausdrücke plus ein LLM-Detektor. Beides taugt als Testmaterial, nicht als Schutz (*dokumentiert*).

## Ausfallverhalten

| Fall | Beobachtung | Belegstatus |
|---|---|---|
| Budget erschöpft | Ledger wirft vor dem Aufruf einen Budgetfehler | *im Code gefunden* |
| API-Fehler | Klassifikation in Fehlerklassen | *im Code gefunden* |
| Unparsbare Modellantwort | bleibt als falsch im Nenner (`status: parse_error`), wird nicht verworfen ([CHAPTER_RESULTS L27](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/chapter06/CHAPTER_RESULTS.md#L27)) | *dokumentiert* |
| Netzwerk, Neustart, Doppelzustellung | nicht behandelt (Notebook-Kontext) | *offen* |

## Tests

Keine eigenen Läufe. Das Repo hat Tests für Setup, Kapitel 6, 9 und 10; sie wurden nicht ausgeführt.

## Bewertung für den Hub

**Gesamtkategorie:** Verhalten neu implementieren (Messverfahren) · Rest als Wissensbasis dokumentieren oder zurückstellen. Keine Dependency im Harness. Ein isolierter Python-Versuch mit DSPy/GEPA bleibt eine Owner-Entscheidung mit Budget.

**Was sidekick übernimmt (als eigene Anforderung, Arbeitspaket AP3):**

1. Kostendeckel in Dollar je Lauf neben dem vorhandenen Start-Ledger, mit Reserve; Prüfung vor dem Start.
2. Gepaarte Statistik im Bericht: exakter McNemar-Test und Bootstrap-Intervall mit der Familie als Ziehungseinheit. Der Harness rechnet bisher Kosten (`eval report`), aber keine Unsicherheit (geprüft: keine Fundstelle in `tools/skill-library/lib/`).
3. Positionswechsel bei Paarvergleichen eines Judges.
4. Offenlegung, wie die Testmenge ausgewählt wurde.

**Weitere Verwertung:**

- AP4: eine eigene Fallfamilie zu AGENTS.md-Anti-Mustern, neu formuliert, mit Holdout über `eval split` und Trennschärfe über `eval nullrun`.
- Judge-Kalibrierung an menschlichen Urteilen mit Mindestzahl an Labels und zufallsbereinigtem Maß als Kandidat für den Skill `evaluating-changes`.
- AP5: Verdichtungsregeln und Trajektorien-Prüfung als Anforderungen an Kontextpakete und Übergaben.

**Bewusst nicht übernommen:** Mem0 und automatische Zusammenfassungen als Wissen (widerspricht „Agent-Aussagen werden erst nach Prüfung Wissen“); Optimizer als automatische Schreiber von Skills (laut [Lernschleife](../../../research/skills-meta-prompting/library-learning.md) nur vorschlagend).

## Zuordnung (11 von 11 Kapiteln plus Rahmen, Stand `92d97ca`, 346 Dateien)

| Bereich | Dateien | Inhalt | Nutzen | Entscheidung | Ziel in sidekick |
|---|---:|---|---|---|---|
| `chapter01` | 1 | Signatur statt Roh-Prompt | gering | Wissensbasis | dieses Dokument |
| `chapter02` | 1 | DSPy-Tour bis Router und RLM | gering | Wissensbasis | – |
| `chapter03` | 3 | acht Schritte; erst Judge, dann Programm optimieren; Kopie des 20-Zeilen-Datensatzes | mittel | Wissensbasis | Hinweis für Judge-Kalibrierung |
| `chapter04` | 5 | Fehleranalyse, HF/Kaggle-Daten, PII, Synthese | mittel | Wissensbasis; Muster „Fehlerfälle annotieren“ | Lernschleife, D1 (#33) |
| `chapter05` | 6 | Metriken, Judge-Kalibrierung mit 50 illustrativen Labels, gewichtete Rubrik | hoch | Verhalten neu spezifizieren | SLV0-EVAL-43 ff., Skill-Kandidat `evaluating-changes` |
| `chapter06` Notebooks | 13 | zwölf Optimizer plus Experiment | hoch | Wissensbasis (Ergebnisse oben) | – |
| `chapter06` Laufzeit, Experiment, Tests | 30 | Runtime, Guardrails, Analyse, Datensatzsperre, Ergebnisblöcke, Tests | hoch | Verhalten neu spezifizieren | SLV0-EVAL-43…46 (gemergt, #34) |
| `chapter06/results` | 213 | Ergebnisartefakte | gering | zurückstellen | – |
| `chapter07` | 11 | Module, Adapter, Multimodal, `Flex` | gering | zurückstellen | – |
| `chapter08` | 8 | ReAct, Framework-Vergleich, MCP, RAG, History/Mem0/RLM | mittel | Verdichtungsregeln neu spezifizieren, Rest zurückstellen | AP5 |
| `chapter09` | 12 | sieben Use Cases; Injection-Erkennung, Trajektorien-Judge | mittel | Trajektorien-Prüfung neu spezifizieren; Injection-Muster nur als eigene Testfälle | AP5 |
| `chapter10` | 7 | MLflow, FastAPI, Gradio | gering | zurückstellen | – |
| `chapter11` Notebooks | 5 | Skill-, Bild-CLI-, AGENTS.md-, SOUL.md-Optimierung, Skill-Discovery | hoch | Experiment nachbauen (AGENTS.md); Rest Wissensbasis | AP4, D3 (#33) |
| `chapter11` Assets und Seiten | 6 | Gold-Landingpages, Beispiel-SKILL.md | gering | nicht übernehmen (Fremdtext) | – |
| `data` | 7 | KI-vs-Mensch-Texte, Split-Manifeste, `README.md` mit Herkunft | gering | zurückstellen; nur das Manifest-Muster | – |
| `docs` | 1 | Register duplizierter Symbole | gering | Wissensbasis | – |
| `scripts`, `tests` | 8 | Setup-Prüfung ohne Key-Ausgabe, Buchabgleich, Notebook-Hygiene | gering | Wissensbasis | – |
| Wurzel (`AGENTS.md`, `BOOK_NOTES.md`, `README.md`, `pyproject.toml`, `uv.lock`, …) | 9 | Setup, Modellregel, Abweichungen zum Druck | gering | Wissensbasis | – |

Die frühere Datei `chapter11/assets/compacted-dspy-docs.md` (Herkunft ungeklärt) gibt es am neuen Stand nicht mehr.

Die AGENTS.md des Repos verlangt, die aus dem gedruckten Buch übernommenen Modellnamen in Listings nie zu „korrigieren“; für eigene Läufe dürfen Leser andere Modelle wählen ([`AGENTS.md`](https://github.com/netzkontrast/context-engineering-dspy-book/blob/92d97caf59d8d09b14d9cfe89d12fce3b9efc38c/AGENTS.md)). Bei einem Nachbau bleiben Modellnamen deshalb so, wie sie im Quellmaterial stehen.

## Datensätze und Lizenzen

| Datei | Herkunft | Entscheidung |
|---|---|---|
| `data/ai_vs_human.csv`, `ai_vs_human200.csv` | keine Angabe | nicht übernehmen |
| `data/ai_vs_human_chapter06*.csv` | Auszüge aus Doku-Seiten mit je Zeile URL und Lizenz (BSD-3, Apache-2.0, MIT, CC BY 4.0, PSF, darunter 66 Zeilen CC BY-SA 3.0 aus Wikipedia) plus KI-Umschreibungen | nicht übernehmen (ShareAlike und Nutzungsbedingungen der Generierung *offen*) |
| Split-Manifeste | eigene Arbeit des Repos | nur das Muster (Hash, Seed, Paargruppen) |

## Offene Punkte

1. Ob die Erläuterungstexte in den Notebooks unter MIT stehen oder dem Buch-Urheberrecht unterliegen, ist ungeklärt; deshalb nichts wörtlich übernehmen.
2. Herkunft der Regeln im SOUL.md-Notebook ungeklärt (`compacted-dspy-docs.md` ist am neuen Stand entfernt).
3. Zahlen aus Kapitel 6 sind nicht nachgerechnet; ein Live-Lauf bräuchte Budget und API-Zugang.
4. Für Judge-Kalibrierung braucht sidekick eine Mindestzahl Labels und ein zufallsbereinigtes Übereinstimmungsmaß; das Buch liefert dafür nur 80/20 auf wenigen Beispielen.
5. Ein Python-Versuch mit DSPy/GEPA unter `research/` ist eine eigene Owner-Entscheidung (neue Abhängigkeiten, Budget).
6. Verhältnis zu den vorhandenen Dossiers [GEPA/gskill](../../../research/skills-meta-prompting/repos/gepa-gskill.md) und [dspy-advanced-prompting](../../../research/skills-meta-prompting/repos/dspy-advanced-prompting.md): diese beschreiben die Bibliotheken, dieses Dossier das Messverfahren im Buch.
