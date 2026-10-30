# AGENTS.md – sidekick (Agent Hub)

Regeln für Coding-Agents (Claude Code, Codex, Cursor, Copilot u. a.) in diesem Repo.
Produktüberblick: [README.md](README.md). Hier steht nur, was sich nicht aus dem Repo selbst ergibt.

## Projektstand

- Phase 0 (Recherche, Entscheidungstore A–D, dann Spec). Das Repo enthält bisher nur Markdown.
  Maßgeblich: [docs/analyse-und-uebernahmeplan.md](docs/analyse-und-uebernahmeplan.md) für Vorgehen
  und Prioritäten, [docs/vision.md](docs/vision.md) für das Produktziel.
- Recherche-Zeit auf P0-Fragen konzentrieren (Analyse §5, §9); keine Feature-Listen für P1/P2 vor dem MVP.
- Spec-driven: Verhaltensänderungen beginnen in der Spec unter `docs/`, erst danach folgt Code.
- Sprache von Doku, Specs und PR-Beschreibungen: Deutsch. Code, Bezeichner und Commit-Messages: Englisch.

## Befehle

Noch keine. Ab Phase 1 (TypeScript/Next.js) stehen hier Install, Dev, Build, Einzeltest,
Typecheck und Lint mit exakten Flags.

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

## Code-Navigation mit CodeGraph

Das Repo ist für [CodeGraph](https://github.com/colbymchenry/codegraph) eingerichtet.
Der Ordner `.codegraph/` existiert immer, weil seine `.gitignore` eingecheckt ist.
Er sagt also nichts darüber, ob ein Index vorhanden ist.

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
