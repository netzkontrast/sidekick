# Dossier: agentic-harness-patterns-skill

> Vorlage für diese Recherche, abgeleitet aus [docs/research/dossiers/_vorlage.md](../../../docs/research/dossiers/_vorlage.md).
> Belegstatus je Aussage: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*.
> Clean-Room: Hier steht beobachtbares Verhalten und unsere Schlussfolgerung, kein übersetzter Fremdcode
> und keine wörtlich übernommenen Prompts.

| Feld | Wert |
|---|---|
| Fork (gelesen) | https://github.com/netzkontrast/agentic-harness-patterns-skill (Branch `master`) |
| Upstream (laut Doku) | `keli-wen/agentic-harness-patterns-skill` ([README L98](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/README.md#L98)) |
| Commit-SHA | `17549f55b84a94b1ff647ae4711be600fe8ae12f` |
| Letzter Commit | 2026-04-03 („docs: soften PCA analogy …“) |
| Lizenz | MIT, Copyright-Zeile ohne Namen („Copyright (c) 2026“); Inhalt laut Autor aus Analyse des Claude-Code-Quelltexts abgeleitet (siehe Risiken) |
| Art | Skill (reine Markdown-Wissensbasis, EN + ZH) |
| Geprüft am / von | 2026-10-30 / Claude Code (Dokumentenlektüre; kein Code im Repo) |

## Zweck

Ein Agent-Skill, der Entwurfsmuster für den „Harness“ um ein Coding-Agent-LLM beschreibt: Speicher,
Skills, Tool-Rechte, Kontextbudget, Delegation, Hooks, Hintergrundaufgaben und Startsequenz. Zielgruppe
sind Entwickler eigener Agent-Laufzeiten, nicht Prompt-Engineering (*dokumentiert*,
[SKILL.md L14–21](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/SKILL.md#L14-L21)).

## Kernkonzepte

Alle Einträge sind *dokumentiert*: Das Repo enthält keinen ausführbaren Code, nur Beschreibungen.

| Konzept | Beobachtung (eigene Worte) | Evidenz | Fundstelle |
|---|---|---|---|
| Drei Speicherschichten | Kuratierte Instruktionen (hierarchisch, lokal gewinnt) getrennt von agentgeschriebenem Auto-Speicher (typisiert, mit gedeckeltem Index) und Extraktion am Sitzungsende; Speichern zweistufig: erst Themendatei, dann Index. Promotion zwischen Schichten nur mit Nutzerfreigabe. | *dokumentiert* | [SKILL.md L42–51](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/SKILL.md#L42-L51), [memory-persistence L11–39](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/references/memory-persistence-pattern.md#L11-L39) |
| Skill-Laufzeit mit Budget | Zweiphasig: billige Metadaten-Liste (pro Eintrag Zeichenlimit, gesamt ca. 1 % des Kontextfensters), Body erst bei Aktivierung; Ausführung inline oder isoliert in Sub-Agent; Deduplizierung über kanonischen Pfad statt Namen; Frontmatter als einzige Metadatenquelle. | *dokumentiert* | [SKILL.md L70–79](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/SKILL.md#L70-L79), [skill-runtime L13–33](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/references/skill-runtime-pattern.md#L13-L33) |
| Fail-closed Tool-Registry | Tools gelten standardmäßig als nicht nebenläufig und nicht read-only; Nebenläufigkeit wird pro Aufruf (Eingabe) entschieden, Batches werden in parallele/serielle Segmente zerlegt; stabile Sortierung für Prompt-Cache. | *dokumentiert* | [SKILL.md L96–105](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/SKILL.md#L96-L105), [tool-registry L11–23](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/references/tool-registry-pattern.md#L11-L23) |
| Ein Permission-Gate | Jeder Tool-Aufruf durch genau ein Gate; drei Ergebnisse (erlauben/fragen/verweigern); Regeln aus mehreren Quellen in fester Priorität; manche Rückfragen sind nicht per Auto-Modus umgehbar; konkurrierende Auflöser (Mensch, Hook, Klassifikator) per atomarem „Claim“ entschieden. | *dokumentiert* | [permission-gate L11–35](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/references/permission-gate-pattern.md#L11-L35) |
| Kontext als Budget | Vier Operationen: auswählen (Just-in-time, drei Offenlegungsstufen), zurückschreiben, komprimieren (Kürzung mit Wiederherstellungs-Hinweis, reaktive Kompaktierung, Snapshots kennzeichnen), isolieren. Memoisierte Kontextbauer mit expliziter Invalidierung am Änderungsort. | *dokumentiert* | [SKILL.md L124–133](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/SKILL.md#L124-L133), [compress L13–25](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/references/context-engineering/compress-pattern.md#L13-L25), [select L11–29](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/references/context-engineering/select-pattern.md#L11-L29) |
| Delegationsformen | Koordinator (Worker ohne geerbten Kontext, Koordinator muss synthetisieren), Fork (voller Kontext, nur eine Ebene), Swarm (flache Peer-Liste über gemeinsame Aufgabenliste); Tool-Set je Worker einschränken; Tiefe begrenzen. | *dokumentiert* | [SKILL.md L150–177](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/SKILL.md#L150-L177), [isolate L11–23](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/references/context-engineering/isolate-pattern.md#L11-L23) |
| Hooks und Vertrauen | Alle Hooks über einen Dispatch-Punkt; ist der Workspace nicht vertraut, laufen gar keine Hooks; Exit-Codes mit Semantik (ok / blockieren mit Rückmeldung an das Modell / nur warnen); Verweigern schlägt Fragen schlägt Erlauben. | *dokumentiert* | [hook-lifecycle L11–31](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/references/hook-lifecycle-pattern.md#L11-L31) |
| Hintergrundaufgaben | Typisierte IDs mit Präfix, strenge Zustandsmaschine mit endgültigen Endzuständen, Ausgabe auf Platte, zweiphasige Räumung erst nach Benachrichtigung des Elternprozesses. | *dokumentiert* | [task-decomposition L11–23](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/references/task-decomposition-pattern.md#L11-L23) |
| Bootstrap mit Vertrauensgrenze | Initialisierung in Abhängigkeitsreihenfolge, memoisiert; sicherheitsrelevante Teile (Secrets in Env, Telemetrie) erst nach Vertrauenszustimmung; Aufräum-Handler bei Init registrieren. | *dokumentiert* | [bootstrap L11–27](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/references/bootstrap-sequence-pattern.md#L11-L27) |

## Artefakte und Formate

- `SKILL.md` mit YAML-Frontmatter (`name`, `description`, `when_to_use`, `license`) plus `metadata.json`
  mit Version 1.0.0 und Quellenliste (*dokumentiert*). Die Referenzen behaupten selbst, Sidecar-Metadaten
  würden im Ziel-Runtime ignoriert ([skill-runtime L13](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/skills/agentic-harness-patterns/references/skill-runtime-pattern.md#L13)) – das Repo liefert trotzdem eins mit.
- Einheitliche Referenzstruktur: Problem → Goldene Regeln → Einsatz → Abwägungen → Muster → Fallstricke →
  „Claude Code Evidence“ (*dokumentiert*, [README L62](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/README.md#L62)).
- Installation über Vercel Skills CLI (`npx skills add`), nicht über Claude-Code-Plugin-Marketplace (*dokumentiert*).
- Prozessbericht zur Destillation mit mehreren Agenten, Dateisystem als Koordinationsmedium (*dokumentiert*,
  [distillation-harness-practice.md](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/docs/distillation-harness-practice.md#L21)).

## Messung und Evaluation

Keine. Behauptet werden drei Review-Runden gegen Quellcode ([README L84–88](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/README.md#L84-L88)); Prüfprotokolle,
Fundstellen oder Tests liegen nicht bei. Konkrete Zahlen (1 %-Budget, 250 Zeichen pro Eintrag) sind *dokumentiert*, nicht *praktisch nachgewiesen*.

## Grenzen und Risiken

- **Herkunft (auffällig):** Der Inhalt stammt laut Autor aus der Analyse des Claude-Code-Quelltexts „nach dem Leak“
  ([distillation L9](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/docs/distillation-harness-practice.md#L9), [README L171](https://github.com/netzkontrast/agentic-harness-patterns-skill/blob/17549f55b84a94b1ff647ae4711be600fe8ae12f/README.md#L171)).
  Das verlinkte öffentliche Repo `anthropics/claude-code` enthält nach unserem Kenntnisstand nicht den vollständigen
  Laufzeitquelltext (*offen*, nicht geprüft). Die MIT-Lizenz kann keine Rechte an Fremdmaterial einräumen; die
  „Claude Code Evidence“-Abschnitte beschreiben interne Implementierungsdetails.
- Copyright-Inhaber in `LICENSE` unbenannt.
- Reine Beschreibung: keine Referenzimplementierung, keine Tests, Aussagen nicht unabhängig überprüfbar.
- Spannungsfeld zu rekursiver Zerlegung: hier „Forks dürfen nicht forken“, im Dossier
  [recursive-decomposition-skill](recursive-decomposition-skill.md) wird mehrstufige Rekursion empfohlen.

## Clean-Room-Relevanz

Anforderungen für den Rewrite (eigene Formulierung, aus allgemein bekannten Harness-Prinzipien begründbar):

- R1: Jeder Tool-Aufruf läuft durch genau ein Freigabe-Gate mit den Ergebnissen erlauben/fragen/verweigern; Default fail-closed; Regelquellen mit dokumentierter Priorität; geschützte Pfade sind nie automatisch freigebbar.
- R2: Skills werden zweiphasig geladen (Metadaten-Katalog mit festem Token-Budget, Body erst bei Aktivierung); Ausführung wahlweise im Hauptkontext oder isoliert.
- R3: Kontext wird budgetiert: harte Kappung jedes variablen Blocks, Kürzungen immer mit Hinweis, wie die Vollfassung abrufbar ist; Snapshots als solche kennzeichnen.
- R4: Delegation mit begrenzter Tiefe, eingeschränktem Tool-Set pro Sub-Agent und selbsttragenden Aufträgen; Synthese bleibt beim Koordinator.
- R5: Speicher in getrennten Schichten (kuratiert vs. agentgeschrieben) mit begrenztem Index; Übernahme in kuratierte Regeln nur mit Freigabe.
- R6: Hooks nur in vertrautem Workspace, mit klarer Exit-Code-Semantik; Hintergrundaufgaben als Zustandsmaschine mit persistenter Ausgabe.

Bewusst nicht übernommen: konkrete Zahlen und Interna aus „Claude Code Evidence“ (Herkunft ungeklärt);
Muster nur als Anforderungen formulieren und an öffentlicher Doku bzw. eigenen Experimenten begründen.

Kategorie: **Verhalten neu implementieren** (Konzepte); Text **nicht** lizenziert übernehmen, bis die Herkunftsfrage geklärt ist.

## Offene Punkte

- Herkunftsrisiko im Entscheidungsprotokoll festhalten (Status `offen`); prüfen, welche Muster sich allein aus
  öffentlicher Anthropic-Doku (Hooks, Skills, Subagents, Permissions) belegen lassen.
- Abgleich Fork-Tiefe (hier max. 1) gegen rekursive Zerlegung (mehrstufig) in einer eigenen Spec-Entscheidung.
- Nicht ausgeführt: Installation über `npx skills add` (Auftrag: nichts installieren).
