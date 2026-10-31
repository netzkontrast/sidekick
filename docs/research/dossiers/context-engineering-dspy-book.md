# Dossier: context-engineering-dspy-book

> Nach [Vorlage](_vorlage.md). Belegstatus je Aussage: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*.
> Clean-Room: Hier stehen beobachtbares Verhalten, Verfahren und unsere Bewertung. Es wurde kein Code, kein Prompt, keine Fallformulierung und kein Datensatz übernommen.

| Feld | Wert |
|---|---|
| URL | [netzkontrast/context-engineering-dspy-book](https://github.com/netzkontrast/context-engineering-dspy-book) (Fork des Begleitcodes zu „Context Engineering with DSPy“, O’Reilly) |
| Commit-SHA | [`a633241b242ab777e9b5693f05ca1544e5f4b9fe`](https://github.com/netzkontrast/context-engineering-dspy-book/tree/a633241b242ab777e9b5693f05ca1544e5f4b9fe) |
| Release / Datum | keine Tags; Merge von PR #12 am 14.09.2026; gepinnt `dspy==3.3.0`, `gepa==0.1.1` |
| Lizenz(en), Notices, Assets | Code: MIT, „Copyright (c) 2025 Mike Taylor“ ([`LICENSE`](https://github.com/netzkontrast/context-engineering-dspy-book/blob/a633241b242ab777e9b5693f05ca1544e5f4b9fe/LICENSE)). Buchtext nicht im Repo. Datensätze gemischt lizenziert (siehe unten). |
| Priorität / Tor | Skill-Library und Eval-Harness (SL-Pakete); keine P0-Hub-Entscheidung |
| Geprüft am / von | 31.10.2026 · Explorer-Agent (Struktur aller 771 Dateien, Volltext Kap. 5, 6, 8, 11) und Claude Code (Stichproben der unten zitierten Stellen) |

## Kurzfassung

Elf Kapitel Notebooks zu DSPy: Signaturen, Module, Metriken, Optimizer, Agents, Produktion und – in Kapitel 11 – die Optimierung von Coding-Agent-Texten (SKILL.md, AGENTS.md, SOUL.md). Für sidekick zählt weniger DSPy selbst als das **Messverfahren**: eingefrorene, paargruppierte Splits, ein Freigabetor für den Testsatz, ein Kostendeckel in Dollar und gepaarte Statistik (Kapitel 6), dazu die Kalibrierung eines LLM-Judges an menschlichen Urteilen (Kapitel 5) und ein Fallformat für AGENTS.md-Anti-Muster (Kapitel 11).

Der Code ist Python mit rund 31 direkten Abhängigkeiten. sidekicks Werkzeuge sind Node ohne Abhängigkeiten. Übernommen werden deshalb Verfahren als eigene Anforderungen, keine Bibliothek.

## Startanleitung

Laut [`README.md`](https://github.com/netzkontrast/context-engineering-dspy-book/blob/a633241b242ab777e9b5693f05ca1544e5f4b9fe/README.md): Python 3.12–3.14, `uv sync`, API-Keys in `.env`, `scripts/check_setup.py` prüft die Umgebung ohne Key-Werte auszugeben (*dokumentiert*). Kapitel 6 läuft per Default ohne API-Aufrufe aus gespeicherten Ergebnissen; Live-Läufe nur mit `CHAPTER06_RUN_LIVE=1` (*dokumentiert*). Nichts davon wurde ausgeführt (*offen*).

## Öffentliche Verträge

Keine im Sinn einer API. Relevant sind die Verfahren und Formate:

| Verfahren | Fundstelle | Beobachtung | Status |
|---|---|---|---|
| Eingefrorener Datensatz | [`chapter06/optimizer_runtime.py` L104](https://github.com/netzkontrast/context-engineering-dspy-book/blob/a633241b242ab777e9b5693f05ca1544e5f4b9fe/chapter06/optimizer_runtime.py#L104) | Laden prüft SHA-256 und Zeilenzahl gegen ein Manifest und lehnt Paare ab, die über Splits verteilt sind | *im Code gefunden* |
| Freigabetor Testsatz | [`chapter06/CHAPTER_RESULTS.md` L3](https://github.com/netzkontrast/context-engineering-dspy-book/blob/a633241b242ab777e9b5693f05ca1544e5f4b9fe/chapter06/CHAPTER_RESULTS.md#L3) | Auswahl nur auf Validierung; der gesperrte Test wird erst nach dem Einfrieren freigegeben | *dokumentiert* |
| Kostendeckel | [`guardrails.py` L52–L81](https://github.com/netzkontrast/context-engineering-dspy-book/blob/a633241b242ab777e9b5693f05ca1544e5f4b9fe/chapter06/experiments/gepa_expanded/guardrails.py#L52-L81) | Ledger in Dollar mit Obergrenze; vor jedem Aufruf wird die geplante Ausgabe gegen Rest und Reserve geprüft | *im Code gefunden* |
| Fehlerklassen, Redaktion | [`guardrails.py` L217, L242](https://github.com/netzkontrast/context-engineering-dspy-book/blob/a633241b242ab777e9b5693f05ca1544e5f4b9fe/chapter06/experiments/gepa_expanded/guardrails.py#L217) | API-Fehler werden klassifiziert; Secret-Muster vor dem Schreiben entfernt | *im Code gefunden* |
| Gepaarte Statistik | [`analysis.py` L50, L90](https://github.com/netzkontrast/context-engineering-dspy-book/blob/a633241b242ab777e9b5693f05ca1544e5f4b9fe/chapter06/experiments/gepa_expanded/analysis.py#L50) | exakter McNemar-Test über diskordante Paare; Bootstrap-Konfidenzintervall mit dem Paar als Ziehungseinheit | *im Code gefunden* |
| Judge-Kalibrierung | `chapter05/human-then-llm-judge.ipynb` | Mensch urteilt mit Begründung, daraus wird ein Judge trainiert und auf einem Holdout gegen die menschlichen Urteile gemessen; Ziel 80–90 % Übereinstimmung | *dokumentiert* |
| Gewichtete Rubrik | `chapter05/rubric-and-multipredictor.ipynb` | mehrere Dimensionen 1–5, normalisiert und gewichtet; Feedback je Pipeline-Schritt | *dokumentiert* |
| Paarvergleich mit Positionswechsel | `chapter11/landing-page-skill-optimizer.ipynb` | Judges vergleichen Kandidat und Referenz mit zufälliger A/B-Reihenfolge; deterministische Prüfungen zählen 50 %, zwei Judges je 25 % | *dokumentiert* |
| AGENTS.md-Fallformat | `chapter11/test-agents-md.ipynb`, Zellen 4–9 | je Fall Aufgabe, gesuchtes Anti-Muster und Erkennungsmerkmal; ein Agent arbeitet mit der Kandidaten-AGENTS.md, ein Judge urteilt binär | *dokumentiert* |
| Kontextverdichtung | `chapter08/history-mem0-rlm.ipynb` | letzte N Turns wörtlich, ältere zusammengefasst; Ziele, Beschränkungen, offene Punkte und Korrekturen bleiben erhalten, bei Konflikt gilt das Neueste, nichts wird erfunden | *dokumentiert* |
| Trajektorien-Prüfung | `chapter09/financial-analyst.ipynb` | Judge sucht unbelegte Zwischenwerte („Context Poisoning“) und Abdriften; die Endzahl prüft eine deterministische Toleranzprüfung | *dokumentiert* |

### Ergebnisse von Kapitel 6

[`CHAPTER_RESULTS.md`](https://github.com/netzkontrast/context-engineering-dspy-book/blob/a633241b242ab777e9b5693f05ca1544e5f4b9fe/chapter06/CHAPTER_RESULTS.md) meldet für einen KI-Text-Detektor auf 80 gesperrten Testzeilen: Baseline 53,75 %, GEPA 80,00 % (+26,25 pp, 0,58 $ Optimierungskosten), KNNFewShot 72,50 %, Ensemble 70,00 %, MIPROv2 66,25 %, COPRO 50,00 % und SIMBA 47,50 % (beide schlechter als die Baseline). Kosten von COPRO und MIPROv2 sind Untergrenzen (L22). Alles *dokumentiert*, nicht nachgerechnet.

Einschränkung, die das Repo selbst nennt: Der Testsatz ist **bewusst gegen die Baseline vorselektiert** ([`chapter06/README.md` L30](https://github.com/netzkontrast/context-engineering-dspy-book/blob/a633241b242ab777e9b5693f05ca1544e5f4b9fe/chapter06/README.md#L30); Offenlegung in [`dataset.py` L388](https://github.com/netzkontrast/context-engineering-dspy-book/blob/a633241b242ab777e9b5693f05ca1544e5f4b9fe/chapter06/experiments/gepa_expanded/dataset.py#L388)). Jeder Uplift ist damit nach oben verzerrt. Lehre für sidekick: Wie eine Testmenge ausgewählt wurde, gehört in den Bericht.

### Schwäche von Kapitel 11

`test-agents-md.ipynb` misst nach der Optimierung auf denselben 20 Fällen, auf denen optimiert wurde (Zelle 14); es gibt keinen Holdout. Der ausführbare Lauf ist auf 3 Metrikaufrufe begrenzt und erwartet laut Text „little or no improvement“ (Zelle 11); der volle Lauf ist auskommentiert (Zelle 13). Gespeicherte Ergebnisse und Unsicherheitsangaben fehlen (*im Code gefunden*). Das Verfahren ist brauchbar, ein Nachweis fehlt.

## Persistenz

Ergebnisse, Prompts, Programme, Vorhersagen, Ledger und Hashes liegen als Dateien unter `chapter06/results/` (92 MB, 643 Dateien) und `chapter06/optimized_programs/` (*im Code gefunden*). Keine Datenbank.

## Credential-Fluss

API-Keys aus `.env`; `check_setup.py` meldet nur, ob ein Key gesetzt ist (*im Code gefunden*). `redact()` entfernt Secret-Muster vor dem Schreiben von Artefakten.

## Sicherheitsgrenzen

Keine Rechte- oder Freigabemodelle. Der MCP-Server in Kapitel 8 ist ein Demo-Tool; die Injection-Erkennung in Kapitel 9 sind sechs reguläre Ausdrücke plus ein LLM-Detektor. Beides taugt als Testmaterial, nicht als Schutz (*dokumentiert*).

## Ausfallverhalten

| Fall | Beobachtung | Belegstatus |
|---|---|---|
| Budget erschöpft | Ledger wirft vor dem Aufruf einen Budgetfehler | *im Code gefunden* |
| API-Fehler | Klassifikation in Fehlerklassen | *im Code gefunden* |
| Unparsbare Modellantwort | bleibt als falsch im Nenner (`status: parse_error`), wird nicht verworfen ([CHAPTER_RESULTS L25](https://github.com/netzkontrast/context-engineering-dspy-book/blob/a633241b242ab777e9b5693f05ca1544e5f4b9fe/chapter06/CHAPTER_RESULTS.md#L25)) | *dokumentiert* |
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

## Zuordnung (11 von 11 Kapiteln plus Rahmen)

| Bereich | Dateien | Inhalt | Nutzen | Entscheidung | Ziel in sidekick |
|---|---:|---|---|---|---|
| `chapter01` | 1 | Signatur statt Roh-Prompt | gering | Wissensbasis | dieses Dokument |
| `chapter02` | 1 | DSPy-Tour bis Router und RLM | gering | Wissensbasis | – |
| `chapter03` | 2 | acht Schritte; erst Judge, dann Programm optimieren | mittel | Wissensbasis | Hinweis für Judge-Kalibrierung |
| `chapter04` | 5 | Fehleranalyse, HF/Kaggle-Daten, PII, Synthese | mittel | Wissensbasis; Muster „Fehlerfälle annotieren“ | Lernschleife |
| `chapter05` | 5 | Metriken, Judge-Kalibrierung, gewichtete Rubrik | hoch | Verhalten neu spezifizieren | AP3, Skill-Kandidat `evaluating-changes` |
| `chapter06` Notebooks | 13 | zwölf Optimizer plus Experiment | hoch | Wissensbasis (Ergebnisse oben) | – |
| `chapter06` Laufzeit und Experiment | 29 | Runtime, Guardrails, Analyse, Datensatzsperre, Tests | hoch | Verhalten neu spezifizieren | AP3 |
| `chapter06/results`, `optimized_programs` | 655 | Ergebnisartefakte | gering | zurückstellen | – |
| `chapter07` | 10 | Module, Adapter, Multimodal | gering | zurückstellen | – |
| `chapter08` | 8 | ReAct, Framework-Vergleich, MCP, RAG, History/Mem0/RLM | mittel | Verdichtungsregeln neu spezifizieren, Rest zurückstellen | AP5 |
| `chapter09` | 10 | sieben Use Cases; Injection-Erkennung, Trajektorien-Judge | mittel | Trajektorien-Prüfung neu spezifizieren; Injection-Muster nur als eigene Testfälle | AP5 |
| `chapter10` | 7 | MLflow, FastAPI, Gradio | gering | zurückstellen | – |
| `chapter11` Notebooks | 5 | Skill-, Bild-CLI-, AGENTS.md-, SOUL.md-Optimierung, Skill-Discovery | hoch | Experiment nachbauen (AGENTS.md); Rest Wissensbasis | AP4 |
| `chapter11/assets/compacted-dspy-docs.md` | 1 | 163 KB DSPy-Doku-Digest, ohne Herkunft | gering | zurückstellen (Lizenz ungeklärt) | – |
| `data` | 6 | KI-vs-Mensch-Texte, Split-Manifeste | gering | zurückstellen; nur das Manifest-Muster | – |
| `docs` | 1 | Register duplizierter Symbole | gering | Wissensbasis | – |
| `scripts`, `tests` | 4 | Setup-Prüfung ohne Key-Ausgabe | gering | Wissensbasis | – |
| Wurzel (`AGENTS.md`, `README.md`, `pyproject.toml`, `uv.lock`, …) | 8 | Setup, Modellregel | gering | Wissensbasis | – |

Die AGENTS.md des Repos verlangt, vom Autor genannte Modellnamen nie zu „korrigieren“ ([`AGENTS.md`](https://github.com/netzkontrast/context-engineering-dspy-book/blob/a633241b242ab777e9b5693f05ca1544e5f4b9fe/AGENTS.md)). Bei einem Nachbau bleiben Modellnamen deshalb so, wie sie im Quellmaterial stehen.

## Datensätze und Lizenzen

| Datei | Herkunft | Entscheidung |
|---|---|---|
| `data/ai_vs_human.csv`, `ai_vs_human200.csv` | keine Angabe | nicht übernehmen |
| `data/ai_vs_human_chapter06*.csv` | Auszüge aus Doku-Seiten mit je Zeile URL und Lizenz (BSD-3, Apache-2.0, MIT, CC BY 4.0, PSF, darunter 66 Zeilen CC BY-SA 3.0 aus Wikipedia) plus KI-Umschreibungen | nicht übernehmen (ShareAlike und Nutzungsbedingungen der Generierung *offen*) |
| Split-Manifeste | eigene Arbeit des Repos | nur das Muster (Hash, Seed, Paargruppen) |

## Offene Punkte

1. Ob die Erläuterungstexte in den Notebooks unter MIT stehen oder dem Buch-Urheberrecht unterliegen, ist ungeklärt; deshalb nichts wörtlich übernehmen.
2. Herkunft von `compacted-dspy-docs.md` und der Regeln im SOUL.md-Notebook ungeklärt.
3. Zahlen aus Kapitel 6 sind nicht nachgerechnet; ein Live-Lauf bräuchte Budget und API-Zugang.
4. Für Judge-Kalibrierung braucht sidekick eine Mindestzahl Labels und ein zufallsbereinigtes Übereinstimmungsmaß; das Buch liefert dafür nur 80/20 auf wenigen Beispielen.
5. Ein Python-Versuch mit DSPy/GEPA unter `research/` ist eine eigene Owner-Entscheidung (neue Abhängigkeiten, Budget).
6. Verhältnis zu den vorhandenen Dossiers [GEPA/gskill](../../../research/skills-meta-prompting/repos/gepa-gskill.md) und [dspy-advanced-prompting](../../../research/skills-meta-prompting/repos/dspy-advanced-prompting.md): diese beschreiben die Bibliotheken, dieses Dossier das Messverfahren im Buch.
