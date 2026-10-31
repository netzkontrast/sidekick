# AGENTS.md – sidekick (Agent Hub)

Regeln für Coding-Agents (Claude Code, Codex, Cursor, Copilot u. a.) in diesem Repo.
Produktüberblick: [README.md](README.md). Hier steht nur, was sich nicht aus dem Repo selbst ergibt.

## Projektstand

- Phase 0 (Recherche, Entscheidungstore A–D, dann Spec). Das Repo enthält Planungsdokumente und isolierte Research-Hilfsprogramme, noch keine Produktlaufzeit.
  Maßgeblich: [docs/spec/v0-ziel-und-vertraege.md](docs/spec/v0-ziel-und-vertraege.md) für bestätigte Ziele,
  Verträge und den ersten Ablauf `research-report`; [docs/analyse-und-uebernahmeplan.md](docs/analyse-und-uebernahmeplan.md)
  für Vorgehen und Entscheidungstore. `code-change` bleibt Tor-A-Testauftrag und Nordstern.
- Recherche-Zeit auf P0-Fragen konzentrieren (Analyse §5, §9); keine Feature-Listen für P1/P2 vor dem MVP.
- Spec-driven: Verhaltensänderungen beginnen in der Spec unter `docs/`, erst danach folgt Code.
- Sprache von Doku, Specs und PR-Beschreibungen: Deutsch. Code, Bezeichner und Commit-Messages: Englisch.

## Befehle

Skill-Library-Werkzeuge (Node 22, keine Dependencies, kein Install; aus dem Repo-Wurzelverzeichnis):

- Tests: `node --test "tools/skill-library/test/*.test.js"`
- Validator: `node tools/skill-library/cli.js validate --scope project` (Exit 0 = keine Fehler)
- V0-Schemas und Beispiele: `node --test tools/skill-library/test/v0-contracts.test.js` (Datenform, keine Produktlaufzeit)
- Einzeltest: `node --test tools/skill-library/test/eval-ledger.test.js` (Testnamen beginnen mit der Fall-ID)
- Eval-Harness: `node tools/skill-library/cli.js eval <freeze|verify|bind|prepare|ledger|split|normalize|raw|report|rubric|judge|check|nullrun|findings|cite-check|context-pack|contract> …`;
  startet nie einen Client. Schreibend sind nur `prepare`, `ledger init|reserve|result`, `split access|select` und `context-pack --output`,
  und zwar nur in ausdrücklich angegebene Pfade, ohne zu überschreiben.
- Belege einer Bewertung prüfen: `node tools/skill-library/cli.js eval judge check BEWERTUNG.json --outputs BLIND-VERZ [--fixtures FAMILIEN-VERZ]`
  (Exit 1, wenn ein Zitat nicht wiedergefunden wird oder ein „erfuellt“ ohne Beleg bleibt). Einzeltest: `node --test tools/skill-library/test/eval-judge.test.js`
- Nulllauf-Trennschärfe: `node tools/skill-library/cli.js eval nullrun --cases FALLORDNER-VERZ`; B1-Vorlauf in select:
  `… eval nullrun --b1-kern KERNURTEILE.json` (Exit 1 = kein Kandidatenstart). Prüfungen gegen ein Arbeitsverzeichnis:
  `… eval check --case FALLORDNER --workspace VERZ [--baseline VERZ]`. Erwartete Befunde und Überberichtung: `… eval findings --case FALLORDNER AUSGABE.md…`.
  Einzeltests: `node --test tools/skill-library/test/eval-nullrun.test.js` (ebenso `eval-trennschaerfe`, `eval-findings`).
- Belegabdeckung eines Berichts am Commit: `node tools/skill-library/cli.js eval cite-check --repo REPO-VERZ --commit SHA BERICHT.md [--scope PRAEFIX|GLOB]… [--github OWNER/REPO]`
  („X von Y Dateien belegt; nicht belegt: …“; Exit 1 bei falschem SHA, Bereich hinter dem Dateiende oder fehlender Datei). Einzeltest: `node --test tools/skill-library/test/eval-citecheck.test.js`
- Kontextpaket für eine Clean-Room-Session: `node tools/skill-library/cli.js eval context-pack --allowlist ALLOWLIST.json [--root VERZ] [--deny MUSTER]… [--estimator utf8-bytes-div-4@1] [--output NEUE-DATEI.md]`
  (Datensatz mit Dateihashes auf stdout; Exit 1 ohne Paket bei ungültigem Muster, leerem Treffer, fehlender Datei, Symlink oder gesperrtem Pfad wie `kandidaten/`). Einzeltest: `node --test tools/skill-library/test/eval-contextpack.test.js`
- Kostenbilanz je Kontextklasse und Turn: `node tools/skill-library/cli.js eval report RAW-VERZ [--estimator utf8-bytes-div-4@1]`
  (Block `kostenbilanz` je Ebene: Turns, Turn-Usage, Rest, Bytes × Folgeturns je Klasse, B1−B0, Kosten je erfülltem Kriterium). Einzeltest: `node --test tools/skill-library/test/eval-costbalance.test.js`
- Rubriken prüfen: `node tools/skill-library/cli.js eval rubric check` (alle Dateien unter `docs/research/rubriken/`
  gegen die aktuellen Paket-Hashes; Exit 1 z. B. bei `rubric_stale`). Einzeltest: `node --test tools/skill-library/test/eval-rubric.test.js`
- Snapshot mit Git-Abgleich: `node tools/skill-library/cli.js eval freeze --source-commit "$(git rev-parse HEAD)" --verify-git`
  (nur lesend; der einzige Prozess, den der Harness startet, ist `git`).
- Research-Helfer-Tests: `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s research/skills-meta-prompting -p test_skill_pilot.py -v`
- Fragen-Ablage (grilling, optional): `node tools/skill-library/cli.js questions <check|status|next|add|ask|answer|…> --root docs/fragen --topic THEMA`;
  `check` liest nur. Spec: [questions-cli-v0](docs/spec/questions-cli-v0.md); Einzeltests `node --test tools/skill-library/test/questions-*.test.js`.

Details: [tools/skill-library/README.md](tools/skill-library/README.md). Ab Phase 1 (TypeScript/Next.js)
stehen hier Install, Dev, Build, Einzeltest, Typecheck und Lint mit exakten Flags.

## Konventionen

- `research_notes/` und `reports/` sind lokale Arbeitsordner (gitignored).
  Fertige Recherchen werden nach `docs/research/` übernommen.
- `docs/vision.md` bleibt als Ausgangsvision unverändert. Wo die Analyse (§3) sie korrigiert
  oder ein Protokoll in `docs/entscheidungen/` etwas entschieden hat, gilt das vor der Vision.
- Offene Entscheidungen nicht stillschweigend festlegen, sondern im passenden Protokoll unter
  `docs/entscheidungen/` festhalten (Status `offen` → `in Prüfung` → `entschieden`).
- Repo-Dossiers nach `docs/research/dossiers/_vorlage.md` anlegen, immer mit Commit-SHA.
  Aussagen als *dokumentiert*, *im Code gefunden*, *praktisch nachgewiesen* oder *offen* kennzeichnen.
  Ein README-Satz allein ist nie ein Nachweis für Zuverlässigkeit.
- Clean-Room: Fremd-Repos untersuchen, aber in Specs nur beobachtbares Verhalten und eigene
  Anforderungen beschreiben. Keinen Fremdcode kopieren; Ausnahmen nur nach Entscheidung und mit
  Eintrag in `docs/herkunftsregister.md`.

## Arbeit mit dem Research-Ordner

Einstieg ist [research/README.md](research/README.md), danach
[research/agent-hub/README.md](research/agent-hub/README.md) und
[operations/PLAN.md](research/agent-hub/operations/PLAN.md) lesen.
Dort stehen laufende Untersuchungen, Prioritäten und der nächste Schritt.

| Pfad unter `research/agent-hub/` | Zweck |
|---|---|
| `operations/PLAN.md` | Durchführung, Backlog und Entscheidungstore A–D |
| `repos/<repo>.md` | Laufende Repo-Dossiers, Befunde, Quellen und offene Prüfungen |
| `experiments/north-star.md` | Gemeinsamer Nordstern-Ablauf und Ausfalltests |
| `decisions/README.md` | Einstieg in die Bewertung von Entscheidungs- und Übernahmekandidaten |

### Ablauf einer Untersuchung

1. Analyse und Produktziel unter `docs/` sowie die relevanten bestehenden Dossiers lesen.
2. Einen offenen P0-Punkt aus dem Arbeitsplan bearbeiten; keine parallelen Backlogs für dasselbe Thema anlegen.
3. Offizielle Quellen bevorzugen und untersuchten Commit, Datum sowie genaue Fundstellen erfassen.
   Codebefunde mit Permalinks auf die tatsächlich gelesene Commit-Fassung belegen.
4. Beobachtung und Schlussfolgerung trennen. Evidenz als *dokumentiert*, *im Code gefunden*,
   *praktisch nachgewiesen* oder *offen* kennzeichnen; keine Tests oder Garantien aus README-Aussagen ableiten.
5. Experimente mit Versionen, Voraussetzungen, Befehlen, erwartetem und tatsächlichem Ergebnis
   sowie Einschränkungen unter `experiments/` dokumentieren. Nicht ausgeführte Tests bleiben offen.
6. Dossier und Backlog aktualisieren; bei verändertem Gesamtstand auch den Research-Einstieg.
   Einen konkreten nächsten Schritt und mögliche Blockaden hinterlassen.

### Verhältnis zur bestehenden Dokumentation

`research/agent-hub/` dient der laufenden Organisation und Durchführung; die bestehende
Zielablage für fertige Recherchen bleibt `docs/research/`. Bei Übernahme eines fertigen
Befunds dort die Vorlage verwenden und im laufenden Dossier auf die kanonische Fassung verweisen,
statt widersprüchliche Kopien zu pflegen. Verbindliche Architekturentscheidungen bleiben
unter `docs/entscheidungen/`, Herkunft und bewusste Übernahmen unter `docs/herkunftsregister.md`.
Das Research-Entscheidungsregister verweist darauf; es ersetzt diese Ablagen nicht.

### Übernahme und Validierung

Für Kandidaten unterscheiden: integrieren, Dependency nutzen, Verhalten neu implementieren,
lizenziert übernehmen oder zurückstellen. Quelle, Commit/Version, Lizenz/Notices und
Update-Aufwand erfassen. Die bestehenden Clean-Room-Regeln gelten auch für Research.

Paperclip und OpenHands anhand desselben Nordstern-Auftrags vergleichen. Besonders prüfen:
Claims/Fencing, aktionsgebundene Freigaben, Credential-Grenzen, Wiederverbindung versus
Prozess-Wiederaufnahme und Abgleich unklarer Effekte. Worktrees sind keine Rechte-Sandbox.

Vor Abschluss relative Links und Konsistenz zwischen Dossier und Backlog prüfen.
Keine Secrets oder unbearbeiteten sensiblen Logs einchecken. Im PR neue Befunde,
verbleibende Unsicherheiten und tatsächlich ausgeführte Prüfungen benennen.

## Wiederverwendbare Skills

Passende Abläufe bedarfsweise aus `.agents/skills/` laden: `researching-repositories`
für Repo-/Machbarkeitsrecherche, `planning-work-packages` für mehrstufige Planung,
`reviewing-decision-gates` für Entscheidungsreife, `specifying-behavior` für Verhaltens-Specs mit IDs und Fällen,
`resuming-work` für Übergaben und Wiederaufnahme, `testing-system-boundaries` für Ausfallmatrizen,
`evaluating-changes` für Vergleiche gegen eine eingefrorene Baseline.
`grilling` für entscheidungsrelevante Rückfragen mit AskUser-Tools; Ablage: [docs/fragen/](docs/fragen/README.md).
`using-codegraph` immer, sobald es um vorhandenen Code geht (siehe Abschnitt CodeGraph).
Nur den passenden Skill lesen,
Referenzen nur bei fehlender Projektvorlage. Lokale Vorgaben und Ablagen bleiben maßgeblich.
Laufende Skill-Library-Recherche und Priorität: [Library-Research-Plan](research/skills-meta-prompting/library-research-plan.md).

## Code-Navigation mit CodeGraph

Das Repo ist für [CodeGraph](https://github.com/colbymchenry/codegraph) eingerichtet.
Der Ordner `.codegraph/` existiert immer, weil seine `.gitignore` eingecheckt ist.
Er sagt also nichts darüber, ob ein Index vorhanden ist.

**Ablauf:** Skill [`using-codegraph`](.agents/skills/using-codegraph/SKILL.md) mit Befehlsübersicht und Grenzen.

**Wann:** Wenn der Index nicht leer ist (`codegraph status` zeigt `Files` > 0), nutze CodeGraph
vor grep/Read, um Code zu verstehen oder zu finden. Das gilt für Fragen wie „wie funktioniert X“,
„wer ruft Y auf“, „was bricht, wenn ich Z ändere“, und ebenso vor jeder Änderung an Code.
Grund: Eine Abfrage liefert Quelltext, Aufrufpfade und Wirkungsradius auf einmal, wofür sonst
viele grep/Read-Runden nötig wären.

**Wie:**
- MCP-Tool, falls verfügbar: `codegraph_explore` mit Symbolnamen, Dateinamen oder einer Frage.
  Ist es nur als verzögertes Tool gelistet, lade es zuerst über die Tool-Suche.
- Shell, funktioniert immer: `codegraph explore "<Symbole oder Frage>"`.
- Vor dem Ändern eines Symbols: `codegraph impact <Symbol>`.
- Nach Änderungen die betroffenen Tests finden:
  `git diff --name-only HEAD | codegraph affected --stdin --quiet`.
- Gezielt nach Symbolnamen fragen statt dieselbe breite Frage zu wiederholen.
  Die gelieferte Quelle gilt als gelesen; nicht erneut per Read öffnen oder per grep prüfen.

**Stattdessen grep/Read verwenden:**
- für Markdown, Doku und Konfiguration (wird nicht indexiert),
- für exakte Strings, Fehlermeldungen und Log-Texte,
- für vollständige Umbenennungen; Kommentare und Strings findet nur grep,
- für Dateien, die CodeGraph als veraltet markiert,
- wenn `explore` „nothing indexed“ oder keine Treffer meldet.

**Nicht:** `codegraph init` oder `codegraph index` selbst ausführen; ob indexiert wird, entscheidet
der Mensch. Erlaubt ist `codegraph sync`, wenn der Index sichtbar veraltet ist.

## Grenzen

- Immer: Änderungen über Branch und Pull Request.
- Erst fragen: neue Abhängigkeiten, Umbau der Doku-/Spec-Struktur, Löschen von Doku.
- Nie: Secrets oder `.env`-Dateien committen; Außenwirkungen (Push auf `main`, Merge,
  Veröffentlichung) ohne ausdrücklichen Auftrag.

## Git & PR

- Commit-Messages auf Englisch, im Imperativ, mit kurzer Begründung im Body.
- PR-Beschreibung auf Deutsch: was sich ändert und warum; offene Punkte benennen.
