# Dossier: code2prompt

> Vorlage für diese Recherche, abgeleitet aus [docs/research/dossiers/_vorlage.md](../../../docs/research/dossiers/_vorlage.md).
> Belegstatus je Aussage: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*.
> Clean-Room: Hier steht beobachtbares Verhalten und unsere Schlussfolgerung, kein übersetzter Fremdcode
> und keine wörtlich übernommenen Prompts.

| Feld | Wert |
|---|---|
| Fork (gelesen) | https://github.com/netzkontrast/code2prompt |
| Upstream (laut Doku) | `mufeedvh/code2prompt` ([Cargo.toml L16](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/Cargo.toml#L16)); MCP-Server in separatem Repo `odancona/code2prompt-mcp` |
| Commit-SHA | `a520658371751f32fb58b918fbd81cbf0177382d` |
| Letzter Commit | 2025-07-21 (Merge PR #183) |
| Lizenz | MIT, „Copyright (c) 2024 Mufeed VH“; Crates, Python-Paket und `website/package.json` ebenfalls MIT |
| Art | CLI + Bibliothek (Rust-Workspace `crates/`), Python-SDK (PyO3), Website |
| Geprüft am / von | 2026-10-30 / Claude Code (Code- und Dokumentenlektüre via CodeGraph/grep; nichts gebaut oder ausgeführt) |

## Zweck

Wandelt ein Verzeichnis in einen einzigen LLM-Prompt um: Dateien filtern, Verzeichnisbaum und Inhalte über
ein Handlebars-Template rendern, Tokens zählen, Ergebnis in Zwischenablage/Datei/stdout ausgeben (*dokumentiert*,
[Cargo.toml L8](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/Cargo.toml#L8)).

## Kernkonzepte

| Konzept | Beobachtung (eigene Worte) | Evidenz | Fundstelle |
|---|---|---|---|
| Zustandslose Konfiguration + Session | Ein klonbares Konfigurationsobjekt (Builder) trägt alle Optionen; eine Session hält die geladenen Daten (Baum, Dateien, Git-Infos) und rendert. Kern ist frei von Ausgabe/Interaktion. | *im Code gefunden* | [configuration.rs L12–108](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/src/configuration.rs#L12-L108), [session.rs L145–148](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/src/session.rs#L145-L148) |
| Include/Exclude mit Konfliktregel | Zwei Glob-Mengen; Muster ohne Pfadtrenner werden auf beliebige Tiefe erweitert; trifft beides, entscheidet ein Prioritätsschalter; ohne Include-Muster gilt „alles außer Exclude“. Ungültige Muster werden nur geloggt. | *im Code gefunden* | [filter.rs L21–51](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/src/filter.rs#L21-L51), [filter.rs L70–98](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/src/filter.rs#L70-L98) |
| Traversierung mit Ignore-Regeln | Verzeichnislauf respektiert standardmäßig `.gitignore` und versteckte Dateien (abschaltbar), Symlinks optional. Baum kann vollständig oder nur gefiltert ausgegeben werden. Leere und nicht-UTF-8-Dateien (Ersatzzeichen nach verlustbehafteter Dekodierung) werden übersprungen – faktisch die Binärerkennung. | *im Code gefunden* | [path.rs L44–76](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/src/path.rs#L44-L76), [path.rs L96–109](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/src/path.rs#L96-L109) |
| Dateidatensatz | Pro Datei: Pfad (relativ/absolut), Endung, Inhalt (optional mit Zeilennummern, optional in Codefence), Metadaten, optional Token-Zahl und Änderungszeit für Sortierung. | *im Code gefunden* | [path.rs L110–150](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/src/path.rs#L110-L150), [path.rs L213](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/src/path.rs#L213) |
| Template-Daten und Nutzervariablen | Template sieht Wurzelname, Baum, Dateiliste, Git-Diff (Index/HEAD), Diff und Log zwischen zwei Branches plus frei definierbare Variablen. Fehlende Variablen erkennt die CLI per Muster und fragt sie interaktiv ab. | *im Code gefunden* | [session.rs L123–145](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/src/session.rs#L123-L145), [template.rs L40–47](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/src/template.rs#L40-L47), [main.rs L390](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt/src/main.rs#L390) |
| Ausgabeformate | Markdown (Default) und XML über eingebaute Templates; JSON ist ein Umschlag um das XML-Rendering mit Token-Zahl, Modellhinweis und Dateiliste. Eigene Templates ersetzen das eingebaute. | *im Code gefunden* | [template.rs L107–131](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/src/template.rs#L107-L131), [session.rs L150–203](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/src/session.rs#L150-L203) |
| Token-Zählung | Nur OpenAI-BPE-Kodierungen (o200k, cl100k Default, p50k, p50k_edit, r50k/gpt2) mit gecachten Tokenizern; gezählt wird das fertige Rendering, pro Datei optional der Rohinhalt. | *im Code gefunden* | [tokenizer.rs L36–81](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/src/tokenizer.rs#L36-L81), [tokenizer.rs L100–125](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/src/tokenizer.rs#L100-L125) |
| Token-Map | CLI zeigt die Token-Verteilung nach Dateien/Ordnern wie ein Plattenbelegungs-Tool, mit Zeilen- und Prozent-Schwelle. | *im Code gefunden* | [token_map.rs L58](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt/src/token_map.rs#L58), [args.rs L105–114](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt/src/args.rs#L105-L114) |
| Aufgaben-Templates | 14 mitgelieferte Templates für Aufgaben (Commit-Message, PR, Bugs, Security, Refactoring, CTF u. a.) – Meta-Prompting als „Codebasis + Arbeitsauftrag in einem Dokument“. | *im Code gefunden* | [templates/](https://github.com/netzkontrast/code2prompt/tree/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/templates) |

## Artefakte und Formate

- CLI-Optionen u. a. Include/Exclude, Ausgabeformat, eigenes Template, Tokenizer, Diff/Log, Zeilennummern, Sortierung,
  Token-Map ([args.rs L14–114](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt/src/args.rs#L14-L114)) (*im Code gefunden*).
- Zwischenablage mit Hintergrund-Daemon unter Linux ([clipboard.rs L39–75](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt/src/clipboard.rs#L39-L75)).
- Python-SDK als PyO3-Bindung über dieselbe Session (*im Code gefunden*, [python.rs L11–18](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-python/src/python.rs#L11-L18)).
- MCP-Server nur *dokumentiert*, Code liegt nicht in diesem Repo ([llms-install.md L1–24](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/llms-install.md#L1-L24)).

## Messung und Evaluation

Unit- und Integrationstests für Filter, Pfade, Sortierung, Templates, Git und Zwischenablage; CI führt `cargo test` aus
([ci.yml L19–20](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/.github/workflows/ci.yml#L19-L20)) (*im Code gefunden*; lokal nicht ausgeführt → *offen*).
Keine Messung der Prompt-Qualität oder der Wirkung der Aufgaben-Templates. „Codebasen jeder Größe“ und „schnell“ sind Behauptungen.

## Grenzen und Risiken

- **Keine Budgetsteuerung:** Kein Token-Limit, keine Kürzung, kein Chunking – die Zählung informiert nur. „Jede Größe“ heißt praktisch: ein Prompt beliebiger Länge.
- **Tokenizer nicht modellneutral:** Nur OpenAI-Kodierungen; für Claude u. a. nur Näherung. CLI-Hilfe nennt o200k nicht, obwohl unterstützt ([args.rs L46–48](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt/src/args.rs#L46-L48)).
- **Kein Escaping:** Handlebars-Escaping ist abgeschaltet ([template.rs L22](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/src/template.rs#L22)); Dateiinhalte können XML-Tags des Templates schließen bzw. Anweisungen einschleusen (Prompt-Injection aus dem Repo; *offen*, nicht getestet).
- **Keine Secret-Filterung:** Nur `.gitignore`/Hidden-Regeln schützen; `.env` u. ä. werden bei `--hidden`/`--no-ignore` mitgerendert (*im Code gefunden*, kein Secret-Scan vorhanden).
- Glob-Eigenheiten: Klammer-Expansion nur, wenn das erste Muster `/{` enthält ([filter.rs L24](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/crates/code2prompt-core/src/filter.rs#L24)); einzeln gewählte Root-Dateien ohne Trenner werden zu `**/`-Mustern und können gleichnamige Dateien in Unterordnern mitnehmen (*im Code gefunden*, Wirkung *offen*).
- `llms-install.md` nennt fälschlich „Repomix MCP server“ und einen Platzhalter-Link ([L3, L9](https://github.com/netzkontrast/code2prompt/blob/a520658371751f32fb58b918fbd81cbf0177382d/llms-install.md#L3)) – Doku-Kopierfehler.
- Lizenz unauffällig (MIT durchgängig). Aufgaben-Templates sind Prompt-Texte unter MIT; trotzdem nicht wörtlich übernehmen (Clean-Room).

## Clean-Room-Relevanz

Anforderungen für den Rewrite:

- R1: Kontextaufbereitung aus einem Verzeichnis mit Include/Exclude-Globs, dokumentierter Konfliktregel, Respekt vor `.gitignore`, Binär-/Leerdatei-Ausschluss und deterministischer Sortierung.
- R2: Ergebnis als strukturierter Datensatz (Baum + Dateiliste mit Pfad, Sprache, Inhalt, Tokens) vor dem Rendern, damit dieselben Daten in Markdown/XML/JSON oder in Chunks für rekursive Zerlegung fließen.
- R3: Token-Zählung über eine austauschbare Tokenizer-Schnittstelle je Zielmodell, mit Budget, Kürzung samt Hinweis und Verteilungsansicht (Token-Map) zur Filterplanung.
- R4: Templates mit deklarierten Variablen; fehlende Werte werden vor dem Rendern erkannt; Inhalte werden für das Zielformat sicher gekapselt (Escaping/Delimiter), Dateiinhalte gelten als Daten, nicht Anweisungen.
- R5: Git-Kontext (Arbeitsstand-Diff, Diff/Log zwischen Refs) als optionale Quellen; Secret-Ausschluss standardmäßig aktiv.

Bewusst nicht übernommen: Rust-Code, Template-Texte, Zwischenablage-Daemon (UI-Detail).

Kategorie: **Verhalten neu implementieren**; alternativ **als Dependency nutzen** (MIT, CLI/Python-SDK) für frühe Experimente.

## Offene Punkte

- `cargo test` bzw. ein Release-Binary in einer Sandbox ausführen, um Filter-Konflikte, Klammer-Expansion und Escaping praktisch zu prüfen (nicht ausgeführt: Build zu teuer).
- Abgleich mit Repomix o. ä. Werkzeugen (Kompression, Secret-Scan), bevor R1–R5 in die Spec gehen.
- MCP-Server `odancona/code2prompt-mcp` separat sichten, falls Tool-Schnittstelle relevant wird.
