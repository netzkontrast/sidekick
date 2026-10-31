# Portierungsplan: das Beste aus jedem Repo

> Stand 31.10.2026 · Owner-Auftrag im Chat: „Think again about all repos and what to pick to port and create a new and improved plan (I want you to pick something incredible from each repo)“.
> Grundlage: vier getrennte Research-Sessions, die Dossiers **und** Code am Dossier-Commit gelesen und kleine lokale Versuche ohne Netz, Installation und Modell ausgeführt haben; ausgewählt und bewertet von der ausführenden Session. Alle zwölf Repos stehen unverändert am Dossier-Commit ([Abgleich](repo-skill-abgleich-2026-10-31.md)).
> Status der Pakete führt nur der [Library-Research-Plan](library-research-plan.md) (§8.1). Clean-Room gilt unverändert: übernommen werden Mechanismen in eigenen Worten, kein Fremdcode; prompt-engineering-skill ist eigenes Material des Owners.

## 1. Die Idee hinter der Auswahl

Nach SL0–SL7 und E3 ist die Suite brauchbar, aber ihr Fortschritt hängt an **Modellurteilen** und an **Regeln, die nur als Anweisung gelten**. Genau dort setzen die zwölf Highlights an:

1. **Urteile werden prüfbare Belege** (APE, SO, SOPT, DSPy, SCO, RD): Was heute ein Modell bewertet, prüft künftig ein Skript, wo immer das möglich ist.
2. **Regeln werden erzwungen statt empfohlen** (AHP, C2P, CPM): Clean-Room, Rechte und Interview-Zustände liegen in Werkzeugen und Profilen, nicht nur im Text.
3. **grilling wird billiger und gründlicher** (PES, PA, CPM, Deep Research): an der gemessenen Schwäche, den Kosten, nicht an den bereits belastbaren Zustandsregeln.
4. **Sidekicks Kern bekommt zwei Muster** (MP, PA): Arbeit geht bei Budgetende nicht verloren, und Ergebnisse ohne Code werden blind rückwärts abgenommen.

Mehrere Picks haben ihren Wert in dieser Session schon gezeigt (§3).

## 2. Ein Highlight je Repo

| Repo | Highlight | Mechanismus in einem Satz | Was es bei uns löst | Weg | Aufwand |
|---|---|---|---|---|---|
| automatic_prompt_engineer | **Gegenkriterium und Nulllauf** | Ein Urteil gilt nur konjunktiv je Stichprobe (z. B. wahr *und* informativ), und jede Prüfung wird gegen einen Agenten gemessen, der nichts tut | „31 von 31“ war überzeichnet: Untätigkeit bestand 20 davon; künftig zählt nur, was trennt, und jeder Kandidat braucht eine Negativkontrolle | neu | S |
| skills-optimizer | **Belegpflichtige Gutachten** | Der Gutachter liefert wörtliche Belege, ein Skript findet sie in Ausgabe bzw. Quelle wieder, sonst ist das Urteil ungültig | Niemand prüfte die Zitate unserer Bewerter; jetzt prüfbar | neu (Prototyp vorhanden) | S |
| skill-optimization | **Gepflanzte Erwartungsbefunde mit 1:1-Zuordnung** | Fälle tragen erwartete Befunde mit Ort und Gewicht; Treffer werden höchstens einmal zugeordnet, nicht erwartete Fundstellen gelten als Überberichtung | Faktkriterien werden stilblind und deterministisch – genau dort, wo die Verblindung schwach war; erfundene Commits und Zeilen fallen auf | neu, nur Konzept (Code ausgeschlossen) | S |
| dspy-advanced-prompting | **Ausgabevertrag mit inhaltlich geprüften Pflichtblöcken** | Ausgabe bleibt Markdown, enthält aber markierte Pflichtblöcke, die ein Prüfer fail-closed ausliest und **inhaltlich** prüft (Pfad am SHA vorhanden, Evidenzstufe aus fester Liste) | Von 114 Rubrikkriterien prüfen heute nur 12 deterministisch, keines den Inhalt | neu, ohne DSPy | M |
| skill-cost-optimizer | **Kostenbilanz je Kontextklasse × Turns** | Tokens werden nach Klassen (System, Dateien, Tool-Ergebnisse, Verlauf) und je Turn bilanziert; Dauergeladenes kostet Größe × Nachrichten | Erklärt den Faktor 2,3 aus M4 (Cache × Turns, kaum Output) und macht Kosten je erfülltem Kriterium (K7.7) berechenbar | neu | S–M |
| recursive-decomposition-skill | **Abdeckungsnachweis über ein Segmentregister** | Suchraum einmal aufzählen, Befunde auf Segmente beziehen, vor der Synthese Abdeckung prüfen: „X von Y, nicht gelesen: …“ | „Abwesenheit nur mit Suchumfang“ wird prüfbar; die deterministische Hälfte von K-2 | neu (Verwerfung K4.3 betraf Subagenten, nicht die Prüfung) | S/M |
| prompt-engineering-skill (eigenes Material) | **Einstiegsweiche nach Ausgangslage** | Drei Einstiege (vager Wunsch, vorhandenes Artefakt, konkreter Fehler) mit je kurzem Ablauf; bei vorhandenem Artefakt nur das Nötige | grillings größte gemessene Schwäche: jede Fortsetzung liest alles wie eine Neuanlage (11–16 Turns, 0,18–0,30 USD) | direkt übernehmen | S–M |
| prompt-architect | **Rückwärtsabgleich (RCoT)** | Aus dem fertigen Ergebnis allein die Bedingungen rekonstruieren und Abweichungen als übersehen, angenommen oder anders verstanden einordnen | Für grilling vor der Zusammenfassung (übersehene Folgefragen, Empfehlung als Antwort); für Sidekicks Tor eine blinde Abnahme ohne Code | neu formulieren | S |
| claude-prompts-mcp | **Schreiben über ein Werkzeug mit Schema, Index als Projektion** | Das Modell übergibt Daten, das Werkzeug erzeugt kanonische Dateien atomar und den Index daraus | grilling liest und editiert heute jede Fragedatei einzeln; Zustandsregeln wandern von der Anweisung in Code; Vorstufe des Kern-Kommandos | neu | M |
| code2prompt | **Kontextpaket als Datensatz – aber fail-closed** | Erst Auswahl und Datensatz (Dateien, Hashes, Tokens), dann Darstellung; bei uns mit Allowlist, Abbruch bei ungültigem Muster und verbotenen Pfaden | Clean-Room wird technisch: Implementierungs-, Familien- und Bewerter-Sessions bekommen nur ein geprüftes Paket | neu (code2prompt selbst versagt offen) | M |
| agentic-harness-patterns (nur öffentliche Doku) | **Rechteprofil je Lauf mit Kanarienfall** | Jeder Lauf erhält ein deklariertes Profil (Werkzeuge, Wurzeln, MCP, Netz), umgesetzt über CLI-Schalter, Permission-Regeln und Hook; aktiv gilt es erst, wenn ein Kanarienzugriff in der Spur als verweigert erscheint | „Skills empfehlen, der Harness erzwingt“ (K8.1/K8.2) wird wirksam; schließt das CodeGraph-Leck zu fremdem Code | aus öffentlicher Doku neu; AHP-Text ausgeschlossen | M |
| meta-prompting | **Budget-Vorwarnung mit Reparaturgrenze, Zähler aus dem Journal** | Kurz vor dem Limit fordert die Schleife Abschluss oder Übergabe; Reparaturen dürfen höchstens die Hälfte des Budgets verbrauchen; der Zähler wird aus dem Verlauf abgeleitet | Heute endet ein erschöpftes Budget als `failed` (V0-AUF-12) und die Arbeit ist verloren; künftig Teil-Einreichung oder Übergabe nach resuming-work | neu | M |

### Belege (Auswahl, am Dossier-Commit)

- APE: `experiments/evaluation/TruthfulQA/fine_tuned_gpt_eval.py` L36–50, L120–151; Bandit-Auswahl `automatic_prompt_engineer/evaluation/bandits.py` L10–32 (*im Code gefunden*).
- SO: `semantic_compressor.py` L541–629 (Bindung L561–573, Wiederfund L595–628); 28/28 Tests grün (*praktisch nachgewiesen*).
- SOPT: `src/evaluator.py` L96–194, L251–287 (*im Code gefunden*; Code ausgeschlossen, nur das Konzept).
- DSPy: `src/techniques/structured_output.py` L75–221; lokaler Stub zeigt, dass reine Präsenzprüfung Unsinn als gültig durchlässt (*praktisch nachgewiesen*) – deshalb bei uns inhaltlich.
- SCO: `SKILL.md` L175–188, L626 (*dokumentiert*); Statistikfelder `index.ts` L72–90 (*im Code gefunden*).
- RD: `references/rlm-strategies.md` L161–177; `SKILL.md` L142–151 (*dokumentiert*).
- PES: `prompt-engineering/SKILL.md` L12–24, L126–134 (*dokumentiert*, eigenes Material).
- PA: `references/frameworks/rcot.md` L3–67 (*dokumentiert*, Wirkung ungemessen).
- CPM: `server/src/mcp-tools/prompt-management-tools.ts` L159–323, L801–912; `server/src/prompts/promptUtils.ts` L308–416 (*im Code gefunden*).
- C2P: `session.rs` L123–213, `path.rs` L44–173; fail-open in `filter.rs` L44–46, L85 (*im Code gefunden*).
- AHP: nur öffentliche Quellen S11/S12 und `claude --help` 2.1.316 (`--restricted`, `--strict-mcp-config`, `--disallowedTools`, `--include-hook-events`; „settings … that fail validation are silently ignored“).
- MP: `Math/infer/inference.py` L151, L392–419 (*im Code gefunden*; im Repo selbst nicht aktiviert).

## 3. Was diese Session schon gezeigt hat

| Highlight | Nachweis heute | Folge |
|---|---|---|
| SO Belegpflicht | [Zitatprüfung](e3/zitatpruefung-2026-10-31.md): 101/101 Belege der K-MELDEN-Testentscheidung wörtlich; M4 nur 66/83 | K-MELDEN gestärkt, M4 schwächer belegt |
| APE Nulllauf | Untätigkeit besteht 20 von 31 grilling-Prüfungen; D8 hat keine trennende Prüfung ([Korrektur](grilling-runde/dev-ergebnis.md)) | Prüfungen werden als trennend oder erhaltend markiert |
| SOPT Erwartungsbefunde | Regex auf Fakt + Fundstellen-Datei: 16/16 Urteile wie der Bewerter, 0/60 Fehltreffer über Kreuz | trägt Faktkriterien ohne Bewerter |
| SCO Kostenbilanz | M4: Cache-Erzeugung ×3,38, Cache-Lesen ×2,34, Output nur ×1,30, Turns 24 → 34 | grilling-Kandidat zielt auf Turns |
| AHP/C2P Erzwingen | `eval prepare` lässt `CLAUDE.local.md` und `.mcp.json` als Falldatei durch; CodeGraph-Index unter `/home/user` liefert fremden Code in jede Session | P0-Fix; Profil mit `--strict-mcp-config` |
| Korrektur M4 | T2-B1-r1 hat grilling per Datei-Read geladen; „kein Skill, Streuung“ war falsch | Auswahlschwäche nicht belegt; K-AUSWAHL-T2 hinfällig |

## 4. Pakete und Reihenfolge

Reihenfolge nach Hebel: erst die Messung belastbar machen (sonst messen wir alles Weitere schlecht), dann Belege, dann grilling, dann Erzwingen, dann Kern-Spec. Jedes Paket: Spec zuerst (neue IDs nach Konvention), dann Code und Tests.

| Paket | Inhalt | Repo | Abnahme | Läufe |
|---|---|---|---|---|
| **P0** | Konfigurationsschutz in `eval prepare` vervollständigen (`CLAUDE.local.md`, `.mcp.json`, Groß-/Kleinschreibung) | AHP/C2P-Befund | Falldatei mit diesen Namen → `config_overwrite`; Tests | 0 |
| **P1** | `eval judge check`: Belege je Kriterium mit `beleg_art` (zitat, abwesenheit, datei), Wiederfund in Ausgabe/Fixture, nicht auffindbar → `unklar`; Prototyp `e3/verify_quotes.py` ablösen | SO | erfundenes Zitat fällt durch; alle bisherigen Bewertungen rückgeprüft | 0 |
| **P2** | Nulllauf-Trennschärfe: jede deterministische Prüfung gegen einen Nulllauf markieren; `gegen_kriterium` und Negativkontroll-Familie je Kandidat; konjunktive Schwelle | APE | Bericht zeigt trennende vs. erhaltende Prüfungen; ab E3-Runde 3 Pflicht | 0 |
| **P3** | `erwartete_befunde` in `fall.json` (Token-Gruppen, Fundstellen-Datei, Gewicht) mit 1:1-Zuordnung; Überberichtung: jede genannte `pfad:zeile` und jeder Commit wird in der Fixture nachgeschlagen | SOPT | M3-Faktkriterien ohne Bewerter; erfundene Fundstelle wird erkannt | 0 |
| **P4** | `eval normalize` behält Usage je Turn und Größen je Ereignisklasse; `eval report` zeigt B1−B0 je Klasse und Kosten je erfülltem Kriterium | SCO | M4-Faktor erklärt; Summe = Gesamt | 0 |
| **P5** | `cite-check`: Dateien am Commit gegen belegte Segmente und gültige Zeilenbereiche; „X von Y, nicht gelesen: …“ | RD | falscher SHA, Bereich hinter Dateiende, unbelegte Datei werden gemeldet | 0 |
| **P6** | Ausgabevertrag für researching-repositories: Pflichtblöcke „Befunde“ und „Eingebettete Anweisungen: keine \| Liste“; Prüfer fail-closed und inhaltlich (nutzt P3/P5) | DSPy | RR-K03/K04/K10 deterministisch; Mutationsfälle scheitern; danach E3-Kandidat | ~14 |
| **P7** | grilling-Kandidat **K-LADESTUFEN**: Weiche Neuanlage vs. Fortsetzung; Fortsetzung liest Themenindex, betroffene Fragedateien und eine kompakte Zustandstabelle statt `workflow.md` | PES | weniger Turns/USD bei unveränderten trennenden Prüfungen, R-01/R-05 | ~14 |
| **P8** | grilling-Kandidat **K-RUECKWAERTS**: Rückwärtsabgleich vor der Zusammenfassung | PA | Fallenfall: nie gestellte Entscheidung wird `open`, Empfehlungsfrage bleibt nicht `answered` | ~14 |
| **P9** | `questions`-CLI: anlegen, stellen, beantworten, vertagen, „nächste fragbare“; Index als Projektion, atomares Schreiben; optional, ohne sie gilt der heutige Ablauf | CPM | Zustandsinvarianten als Tests; grilling-Läufe mit CLI günstiger bei gleichen Prüfungen | ~14 |
| **P10** | Rechteprofil je Lauf (Werkzeuge, Wurzeln, MCP, Netz) in `eval prepare` plus Kanarienfall; Startrezept für Clean-Room-Sessions | AHP | Kanarienzugriffe (fremder Pfad, WebFetch, MCP) in der Spur verweigert; 0 Zugriffe außerhalb | ~3 |
| **P11** | `context-pack`: Allowlist-Eingabe (Übergabe §3 als Datei), Codepoint-Sortierung, Hashes, fail-closed bei ungültigem Muster, fehlender Datei oder verbotenem Präfix | C2P | zwei Läufe = gleicher Paket-Hash; Tippfehler bricht ab statt „alles“ | 0 |
| **P12** | Kern-Spec: Budget-Vorwarnung, Zustand „teilweise eingereicht“ (nie automatisch abgenommen), Zähler aus dem Journal; Rückwärtsabnahme am Tor | MP, PA | Spec-Review; Contract-Fälle mit simulierter Uhr | 0 |

**Laufbudget:** P0–P5, P11, P12 brauchen keine Modellläufe. P6–P9 je etwa 14 Starts als E3-Runde. Mit dem Vorteilsfilter aus APE (Kandidat geht nur bei Vorteil in select weiter; Abbruch, sobald die Schwelle unerreichbar ist) hätte E3-Runde 1 bei gleichen Entscheidungen 10 von 28 Starts gespart; er wird ab Runde 3 vorab registriert.

**E3-Runde 2 (K-BELEG, K-WEGE):** abgeschlossen, beide verworfen ([Ergebnis](e3/runde-2/E3-2-ergebnis-2026-10-31.md)); die Bewertung nutzte bereits die Zitatprüfung (37/37). Folgerung für P2: B1-Vorlauf in Select als Trennschärfe-Vorprüfung. Die Deep Research zu Intent Capture, Interviewtechnik und Tree of Thoughts ist [ausgewertet](grilling-runde/deep-research/auswertung-2026-10-31.md): Sie liefert den zusätzlichen grilling-Kandidaten K-AUFTEILUNG (Fragenwahl nach Aufteilung der plausiblen Antworten) und begründet, warum keine explizite ToT-Baumsuche übernommen wird.

## 5. Was sich gegenüber dem bisherigen Plan ändert

- **Neu geöffnet** (mit Grund, je als einzelner gemessener Vorschlag nach Synthese F1 Z. 185):
  - K2.2 „Weiche“: verworfen war ein Technik-Katalog, nicht eine Weiche innerhalb eines Skills; der Kostenbefund liefert jetzt den Anlass (P7).
  - K2.3 „Maschinenprüfbarkeit“: der damalige Grund (kein Katalog nötig) betrifft Ausgabeverträge nicht (P6).
  - K4.3 „Zerlegung“: ausgeklammert war der Subagenten-Modus, nicht die Abdeckungsprüfung (P5).
  - K4.1/K4.2 „Kontext-Builder“: zurückgestellt „ohne Library-Bezug“; der Schutz der Library-Implementierung ist selbst Library-Sache (P11).
- **Bleibt verworfen:** Technik-Katalog, Modell-Routing und Degradation (SCO), Prompt-Templating, Hot-Reload.
- **Messregeln ab sofort:** Bewerter liefern wörtliche Belege, die vor der Entblindung geprüft werden; jede neue Familie bekommt eine Negativkontrolle; deterministische Prüfungen werden gegen einen Nulllauf markiert.

## 6. Entscheidungen des Owners (beantwortet 31.10.2026, [Runde](../../docs/fragen/skill-library/rounds/R-20261031-port-runde1.md))

1. Reihenfolge und Umfang P0–P12: **ok**; unabhängige Pakete laufen parallel.
2. Laufbudget für P6–P10: **ja**, bis ~60 Starts in vorab registrierten Runden zu je etwa 14.
3. P9 (`questions`-CLI): **ja, mit Rechten**. Freigegeben wird nur `node tools/skill-library/cli.js questions …` (Messläufe per `--allowedTools`, Projekt per Permission-Regel); keine allgemeine Bash-Freigabe.
4. P12 (V0-Spec des Kerns): **ok**, als eigener PR zur Owner-Review.

## 7. Grenzen

- Die Highlights sind ausgewählt, nicht gemessen; ihre Wirkung ist bis zu den Paketen *offen*. Nur P1 (Prototyp) und die Befunde in §3 sind schon *praktisch nachgewiesen*.
- Belege in §2 stammen aus den Research-Sessions; Zeilenangaben gelten am Dossier-Commit.
- Die CLI-Schalter für P10 sind nur aus `claude --help` bekannt und in keinem Lauf geprüft.
