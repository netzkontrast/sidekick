# Dossier: recursive-decomposition-skill

> Vorlage für diese Recherche, abgeleitet aus [docs/research/dossiers/_vorlage.md](../../../docs/research/dossiers/_vorlage.md).
> Belegstatus je Aussage: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*.
> Clean-Room: Hier steht beobachtbares Verhalten und unsere Schlussfolgerung, kein übersetzter Fremdcode
> und keine wörtlich übernommenen Prompts.

| Feld | Wert |
|---|---|
| Fork (gelesen) | https://github.com/netzkontrast/recursive-decomposition-skill |
| Upstream (laut Doku) | `massimodeluisa/recursive-decomposition-skill` ([plugin.json L9](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/.claude-plugin/plugin.json#L9)); konzeptionell: Paper „Recursive Language Models“ (Zhang, Kraska, Khattab, arXiv:2512.24601) |
| Commit-SHA | `1780d46a73e485cbad4d0a48c019475d8be9193e` |
| Letzter Commit | 2026-01-25 („fix: correct skill structure and YAML frontmatter …“) |
| Lizenz | MIT, „Copyright (c) 2026 MDL“ (Massimo De Luisa) |
| Art | Skill, verpackt als Claude-Code-Plugin mit eigenem Marketplace |
| Geprüft am / von | 2026-10-30 / Claude Code (Dokumentenlektüre, lokale Plugin-Validierung) |

## Zweck

Ein Skill, der dem Agenten Arbeitsregeln für Aufgaben jenseits eines komfortablen Kontextumfangs gibt
(viele Dateien, sehr lange Dokumente): filtern, zerlegen, Sub-Agenten starten, aggregieren, verifizieren.
Er überträgt Ideen aus dem RLM-Paper auf Agenten-Werkzeuge (*dokumentiert*,
[SKILL.md L1–4](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/SKILL.md#L1-L4)).

## Kernkonzepte

Das Repo enthält keinen Code; alle Konzepte sind Verhaltensanweisungen an das Modell (*dokumentiert*).

| Konzept | Beobachtung (eigene Worte) | Evidenz | Fundstelle |
|---|---|---|---|
| Eingabe als Umgebung | Große Eingaben nicht in den Kontext laden, sondern als extern adressierbare Daten behandeln und über Werkzeuge (Suche, Zeilenbereiche) gezielt anfassen. Im Paper ist das eine REPL-Variable; hier werden daraus Datei- und Suchwerkzeuge. | *dokumentiert* | [SKILL.md L19–23](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/SKILL.md#L19-L23) |
| Schwellen für Zerlegung | Direkt bis ca. 30k Tokens bzw. Einzeldatei; Zerlegung ab ca. 10 Dateien oder 50k Tokens; Grauzone dazwischen. Erst Größe des Suchraums messen (Zeilen/Bytes), dann lesen. | *dokumentiert* | [SKILL.md L25–57](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/SKILL.md#L25-L57), [cost-analysis L5–25](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/references/cost-analysis.md#L5-L25) |
| Filtern vor Tiefenanalyse | Kandidaten per Muster/Glob/Regex mit Domänen-Schlüsselwörtern eingrenzen, nur die Teilmenge tief lesen. | *dokumentiert* | [SKILL.md L94–105](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/SKILL.md#L94-L105) |
| Chunking-Strategien | Gleichmäßig (Zeilen/Zeichen/natürliche Grenzen), semantisch (Klassen, Abschnitte) oder nach Schlüsselmerkmal; Listen über ca. 10 Elemente in Batches. | *dokumentiert* | [SKILL.md L107–115](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/SKILL.md#L107-L115) |
| Rekursive Sub-Aufrufe und Aggregation | Unabhängige Teilprobleme parallel an Sub-Agenten, Ergebnisse sammeln, deduplizieren, kategorisieren; ein- oder mehrstufig. Lange Ausgaben abschnittsweise erzeugen, zwischenspeichern, zusammensetzen. | *dokumentiert* | [SKILL.md L117–140](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/SKILL.md#L117-L140), [rlm-strategies L63–84](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/references/rlm-strategies.md#L63-L84) |
| Verifikation auf kleinem Fenster | Kandidatenantwort gegen gezielt nachgeladene Belegstellen erneut prüfen, um Qualitätsverlust in langen Kontexten („context rot“) abzufangen. | *dokumentiert* | [SKILL.md L142–151](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/SKILL.md#L142-L151), [rlm-strategies L86–96](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/references/rlm-strategies.md#L86-L96) |
| Fehlermodi | Endlose Rekursion (Tiefenlimit, schrumpfende Chunks), Doppelverarbeitung (Segmente verfolgen), Kontextverlust in Sub-Aufträgen, Widersprüche in der Synthese. | *dokumentiert* | [rlm-strategies L161–177](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/references/rlm-strategies.md#L161-L177) |
| Komplexitätsklassen | Aufgaben nach Aufwand im Verhältnis zur Eingabe einordnen (konstant/linear/quadratisch/logarithmisch), um Strategie und Kosten zu wählen. | *dokumentiert* | [rlm-strategies L123–143](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/references/rlm-strategies.md#L123-L143) |
| Phasenrezepte | Ausgearbeitete Abläufe für Codebase-Analyse (Filter → Batches → parallele Agenten → Aggregation → Report → Stichprobe) und Mehrdokument-Extraktion mit vorab definiertem Extraktionsschema. | *dokumentiert* | [codebase-analysis L8–85](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/references/codebase-analysis.md#L8-L85), [document-aggregation L37–95](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/references/document-aggregation.md#L37-L95) |

## Artefakte und Formate

- Plugin-Paketierung: `.claude-plugin/marketplace.json` (Katalog) → `plugins/<name>/.claude-plugin/plugin.json`
  (Manifest mit Version 1.0.1, Lizenz, Keywords) → `skills/<name>/SKILL.md` mit Frontmatter (`name`, `description`)
  und `references/` für Detailwissen (progressive Offenlegung) (*dokumentiert*, [marketplace.json](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/.claude-plugin/marketplace.json#L1)).
- Die Trigger-Phrasen stehen in der `description` – Auslösung erfolgt rein über Modell-Matching (*dokumentiert*).
- Struktur ist mit Claude Code 2.1.314 gültig: `claude plugin validate` auf Plugin und Marketplace jeweils
  „Validation passed“; Warnung: kein Icon; Hinweis: README ohne Ein-Schritt-Installationszeile (*praktisch nachgewiesen*, 2026-10-30).

## Messung und Evaluation

- Benchmark-Tabelle (z. B. Multi-hop QA 70 → 91 %) stammt laut Text aus dem Paper und misst RLM mit REPL, nicht diesen Skill
  ([rlm-strategies L179–186](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/references/rlm-strategies.md#L179-L186)). Für den Skill selbst: *offen*.
- „Real Test Results“ auf dem Anthropic Cookbook ([README L61–74](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/README.md#L61-L74)) ohne Vergleich, Protokoll oder Wiederholbarkeit – nur Behauptung.
- Kostenaussagen (Break-even, „90 % vorab filtern“) sind Faustregeln ohne Messung ([cost-analysis L43–99](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/references/cost-analysis.md#L43-L99)).

## Grenzen und Risiken

- Werkzeugnamen inkonsistent: neben Claude-Code-Begriffen (Task, Grep/Glob) tauchen `view_file`, `run_command` u. a. aus anderen Agenten auf
  ([SKILL.md L60–66](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/SKILL.md#L60-L66)). Portabilität unklar.
- „Claude Code Constraints“ (2.000 Zeilen, 50 KB, „Sweet Spot“ unter 30k Tokens) sind unbelegt
  ([rlm-strategies L114–121](https://github.com/netzkontrast/recursive-decomposition-skill/blob/1780d46a73e485cbad4d0a48c019475d8be9193e/plugins/recursive-decomposition/skills/recursive-decomposition/references/rlm-strategies.md#L114-L121)).
- Prompt-Skill ohne Durchsetzung: Tiefenlimits, Batchgrößen und Verifikation hängen allein vom Modellverhalten ab.
- „Safe YOLO Mode“ ermuntert zu weniger Rückfragen bei lesenden Schritten – Widerspruch zu fail-closed-Rechten, muss im Harness, nicht im Prompt entschieden werden.
- Mehrstufige Sub-Agenten widersprechen der Ein-Ebenen-Regel im Dossier [agentic-harness-patterns-skill](agentic-harness-patterns-skill.md).
- Lizenz unauffällig (MIT, benannter Autor); Paper-Inhalte nur paraphrasiert und zitiert.

## Clean-Room-Relevanz

Anforderungen für den Rewrite:

- R1: Für große Eingaben einen Zerlegungsmodus anbieten: Suchraum messen → filtern → in Chunks/Batches teilen → Sub-Aufgaben parallel → strukturierte Aggregation (Dedupe, Kategorien) → Verifikation gegen zitierte Belegstellen.
- R2: Die Schwellen (Tokens, Dateizahl, Batchgröße, max. Rekursionstiefe) sind konfigurierbare Harness-Parameter mit erzwungenem Limit, nicht nur Prompt-Text.
- R3: Sub-Aufgaben liefern ein vorher definiertes Ergebnisschema mit Fundstellen (Datei:Zeile), damit Aggregation maschinell und Verifikation gezielt möglich ist.
- R4: Bearbeitete Segmente werden protokolliert (keine Doppelverarbeitung, nachvollziehbare Abdeckung).
- R5: Skills/Plugins nach einem validierbaren Manifestformat (Katalog → Plugin → Skill mit Frontmatter + Referenzordner) paketieren und vor Veröffentlichung automatisch prüfen.

Bewusst nicht übernommen: Benchmarkzahlen als Produktversprechen; agent-spezifische Werkzeugnamen.

Kategorie: **Verhalten neu implementieren**; RLM-Paper als Primärquelle direkt lesen statt über diesen Skill.

## Offene Punkte

- RLM-Paper (arXiv:2512.24601) selbst sichten: Unterschied REPL-Variable vs. Sub-Agent-Ansatz bewerten.
- Nordstern-Experiment: gleiche Großaufgabe mit/ohne Skill, Abdeckung und Kosten messen (nicht ausgeführt, kostenpflichtig).
- Entscheidung zur zulässigen Rekursionstiefe zusammen mit dem Harness-Dossier treffen.
