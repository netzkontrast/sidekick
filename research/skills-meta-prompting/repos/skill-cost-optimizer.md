# Dossier: skill-cost-optimizer

> Vorlage für diese Recherche, abgeleitet aus [docs/research/dossiers/_vorlage.md](../../../docs/research/dossiers/_vorlage.md).
> Belegstatus je Aussage: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*.
> Clean-Room: Hier steht beobachtbares Verhalten und unsere Schlussfolgerung, kein übersetzter Fremdcode
> und keine wörtlich übernommenen Prompts.

| Feld | Wert |
|---|---|
| Fork (gelesen) | https://github.com/netzkontrast/skill-cost-optimizer |
| Upstream (laut Doku) | https://github.com/fullstackcrew-alpha/skill-cost-optimizer (README-Badge), Registry-Eintrag `clawhub.ai/s/cost-optimizer` |
| Commit-SHA | `6c75e0eaec6a5a2866799f1ea7bd7100457fe682` |
| Letzter Commit | 2026-03-23, „remove scripts/ — keep skill as pure markdown“ |
| Lizenz | MIT, Copyright 2026 FullStackCrew; Frontmatter nennt Autor „OpenClaw Community“ |
| Art | Skill (OpenClaw / Claude Code) + TypeScript-Hilfsbibliothek + Beispielkonfiguration |
| Geprüft am / von | 2026-10-30 / Claude Code (Dokumenten- und Codelektüre, kein Code ausgeführt) |

## Zweck

Ein Skill mit acht Unterbefehlen (route, compress, heartbeat, report, config, slim, screenshot, loops). Er soll die Token-Kosten
von Agent-Sitzungen „um 60–80 %“ senken, über Modellwahl, Kontextkompression, kleinere Dauer-Kontextdateien und seltenere Heartbeats
(*dokumentiert*, [SKILL.md L1–40](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/SKILL.md#L1)).

## Kernkonzepte

| Konzept | Beobachtung (eigene Worte) | Evidenz | Fundstelle |
|---|---|---|---|
| Prioritätsstufen-Routing | Fünf Stufen P0–P4 mit je Zielmodell und Fallback. Die Stufe ergibt sich aus der Anzahl der Keyword-Treffer pro Stufe. Bei Gleichstand gewinnt die billigere Stufe. Ein Komplexitätswert hebt die Stufe an. | *im Code gefunden* | [index.ts L247–314](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/index.ts#L247), [L220–235](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/index.ts#L220) |
| Kontextgröße als Routing-Signal | Ab mehr als 100k Kontext-Tokens wird mindestens P3 gewählt. | *im Code gefunden* | [index.ts L359–367](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/index.ts#L359) |
| Degradationskette | Bei 429/503, Timeout oder Budget-Schwelle wird eine Stufe billiger gewählt und die Entscheidung protokolliert. | *dokumentiert* (nur Prompt und Konfiguration) | [SKILL.md L116–124](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/SKILL.md#L116), [openclaw.json L75–83](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/openclaw.json#L75) |
| Kostenmodell | Preistabelle in USD pro 1M Input/Output. „Blended“-Preis mit Annahme Input:Output = 4:1. Ersparnis wird gegenüber Opus berechnet, mit pauschal 5000 Tokens pro Aufruf. | *im Code gefunden* | [index.ts L156–182](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/index.ts#L156), [L373–378](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/index.ts#L373), [model-pricing.md L70–71](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/references/model-pricing.md#L70) |
| Token-Schätzung ohne Tokenizer | Zeichenbasierte Heuristik: CJK 1,5 Tokens pro Zeichen, sonst 3,5–4 Zeichen pro Token je nach Code-Anteil. Die Bash-Variante in `/cost-slim` rechnet pauschal mit Zeichen/4. Die beiden Schätzungen widersprechen sich. | *im Code gefunden* | [index.ts L325–345](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/index.ts#L325), [SKILL.md L604–608](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/SKILL.md#L604) |
| Gestaffelte Kontextkompression | Die letzten 5 Runden bleiben vollständig. Ältere Runden, Tool-Ergebnisse und Dateiinhalte werden zu Ein-Satz-Zusammenfassungen, Pfaden und Entscheidungen. Ergebnis ist eine Snapshot-Datei. | *dokumentiert*, teils *im Code gefunden* | [SKILL.md L166–215](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/SKILL.md#L166), [index.ts L404–485](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/index.ts#L404) |
| Budgets für Dauer-Kontext | Feste Token-Budgets für Dateien, die bei jeder Nachricht geladen werden (z. B. SOUL.md < 1000, gesamt < 5600). Details wandern in bei Bedarf geladene Referenzdateien (Progressive Disclosure). | *dokumentiert* | [SKILL.md L622–631](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/SKILL.md#L622), [context-slimming.md L44](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/references/context-slimming.md#L44) |
| Sichere Konfig-Anwendung | Diff-Vorschau, ausdrückliche Bestätigung, Backup mit Zeitstempel. Schlägt das Backup fehl, wird nicht geschrieben. Schlägt das Schreiben fehl, wird die Konfiguration auf stdout ausgegeben. | *dokumentiert* (nur Prompt) | [SKILL.md L493–534](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/SKILL.md#L493), [L553–573](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/SKILL.md#L553) |
| Fehlertolerantes Usage-Log | JSONL wird zeilenweise geparst, defekte Zeilen werden gezählt und gemeldet statt abzubrechen. | *im Code gefunden* | [index.ts L503](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/index.ts#L503) |

## Artefakte und Formate

- `SKILL.md` (856 Zeilen, größtenteils chinesisch) mit `allowed-tools: Bash, Read, Write, Edit, Grep, Glob, Agent` und OpenClaw-Metadaten
  ([SKILL.md L1–19](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/SKILL.md#L1)). Der Skill ist selbst groß und widerspricht damit dem eigenen Rat zur Kontextsparsamkeit.
- `index.ts` (907 Zeilen) exportiert nur Funktionen. Es gibt kein `package.json`, keinen Build und keinen Einstiegspunkt. SKILL.md verweist trotzdem auf diese
  Funktionen ([SKILL.md L540–549](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/SKILL.md#L540)). Der letzte Commit entfernte `scripts/` mit dem Ziel „pure markdown“. Wie das Modell `index.ts` ausführen soll, ist
  unklar. Wahrscheinlich dient die Datei nur als Spezifikation zum Lesen (*offen*).
- `openclaw.json`: Beispielkonfiguration (Routing-Regeln, Heartbeat, Kontextlimits, Budgets). Ob OpenClaw diese Schlüssel auswertet, ist *offen*.
- `references/`: Preistabelle (Stand 2026-03-20), Routing-Regeln, Leitfaden zum Verschlanken.

## Messung und Evaluation

- Es gibt keine Tests, keine Benchmarks und keine gespeicherten Messungen. Die Ersparnis von „60–80 %“ stammt aus einem **angenommenen Aufgabenmix**
  (z. B. 20 % Heartbeat, 30 % einfach …) mal Listenpreis. Das ist eine Rechnung, keine Messung. Das eigene Szenario ergibt sogar 84,3 % bzw. 96,7 %
  ([model-pricing.md L76–100](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/references/model-pricing.md#L76)).
- Qualitätsverlust durch billigere Modelle wird nicht gemessen. Es gibt nur einen Warnhinweis zum aggressive-Preset ([L101](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/references/model-pricing.md#L101)).
- Die Preise (z. B. Haiku 4.5 mit 0,80/4,00 USD, Opus 4.6 mit 15/75 USD) wurden nicht gegen offizielle Preislisten geprüft. Wahrscheinlich sind sie veraltet oder falsch (*offen*).

## Grenzen und Risiken

- **Routing ist nur eine Empfehlung:** Ein Skill innerhalb einer laufenden Sitzung kann deren Modell nicht wechseln. Echtes Routing bräuchte eine
  Harness- oder Proxy-Ebene. „Smart routing“ ist im Repo eine Ausgabe in Markdown (*im Code gefunden*: `routeModel` liefert nur ein Objekt, [index.ts L353](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/index.ts#L353)).
- Keyword-Abgleich per Teilstring ([index.ts L256](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/index.ts#L256)) erzeugt Fehltreffer, etwa „ls“ in „tools“ oder „test“ in „latest“.
- Konfiguration und Prompt widersprechen sich. In der JSON-Datei verlangt P4 Komplexität ≥ 9 **und** einen Kontext ≥ 100k ([openclaw.json L62–71](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/openclaw.json#L62)), im Prompt genügt eines davon.
- `compressContext` nimmt einen Parameter `budget` entgegen, benutzt ihn aber nie ([index.ts L404–407](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/index.ts#L404)). Die Kompression ist nicht budgetgesteuert.
- `/cost-slim` schreibt SOUL.md, AGENTS.md und MEMORY.md um und löscht Einträge, die älter als zwei Wochen sind. Dagegen schützen nur Bestätigung und `.bak`-Datei. Es gibt kein Inventar der
  Pflichtinhalte und keinen atomaren Write ([SKILL.md L633–698](https://github.com/netzkontrast/skill-cost-optimizer/blob/6c75e0eaec6a5a2866799f1ea7bd7100457fe682/SKILL.md#L633)).
- Weitreichende Werkzeugrechte (Bash, Write, Agent) für einen Skill, der vor allem berät.
- Herkunftsangaben uneinheitlich: Copyright FullStackCrew, Frontmatter „OpenClaw Community“, Commits von einer Einzelperson.

## Clean-Room-Relevanz

Anforderungen für den eigenen Rewrite:
- **R1:** Kosten werden mit echten Token-Zählungen pro Aufruf erfasst (Input, Output, Cache) und mit versionierter Preistabelle samt Quelle und Datum
  bewertet. Heuristische Schätzungen sind als solche gekennzeichnet.
- **R2:** Die Modellwahl ist eine Richtlinie auf Harness-Ebene (Aufgabentyp, Kontextgröße, Budget), mit Fallback-Kette und protokollierter
  Begründung. Sie gehört nicht als Empfehlung in einen Skill. Jede Herabstufung wird gegen ein Qualitäts-Eval geprüft.
- **R3:** Für Dauer-Kontext und Skills gelten feste Token-Budgets mit Progressive Disclosure (Kerninstruktion klein, Details als nachladbare
  Referenzen). Budgetverletzungen werden gemeldet.
- **R4:** Kontextkompression schützt definierte Klassen (letzte N Runden, System-Kontext, offene Aufgaben, Entscheidungen) und wird tatsächlich vom Budget
  gesteuert.
- **R5:** Ersparnisbehauptungen basieren nur auf gemessenen Vorher-/Nachher-Läufen derselben Aufgabe, nie auf angenommenen Aufgabenmischungen.
- Nicht übernehmen: Keyword-Listen, Preistabelle, Prompt-Texte, OpenClaw-Konfigurationsformat.
- Kategorie: **Verhalten neu implementieren** (nur Konzepte). Der Code ist für eine Übernahme ungeeignet.

## Offene Punkte

- Versuch V1: Die Preise in `model-pricing.md` gegen die offiziellen Preisseiten von Anthropic, Google und DeepSeek mit Datum abgleichen.
- Versuch V2: `estimateTokens` mit echter Token-Zählung an deutschem, englischem, chinesischem und Code-Text vergleichen.
- Versuch V3: `classifyTask` auf einem kleinen, gelabelten Prompt-Set auswerten, um die Fehlklassifikationen durch Teilstring-Treffer zu messen.
- Prüfen, ob OpenClaw die Schlüssel `model_routing` und `heartbeat` aus `openclaw.json` tatsächlich auswertet (OpenClaw-Doku und Schema).
