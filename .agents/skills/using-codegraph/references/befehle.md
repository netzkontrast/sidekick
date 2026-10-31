# CodeGraph: Befehle und Grenzen

Stand: CodeGraph 1.6.2 (installiert), Doku am Commit `2008e2f` von [colbymchenry/codegraph](https://github.com/colbymchenry/codegraph), gelesen am 31.10.2026.
CodeGraph parst den Code mit tree-sitter bzw. einem Rust-Kern in eine SQLite-Datenbank (`.codegraph/codegraph.db`): Symbole, Aufrufe, Importe, Vererbung.

## MCP-Werkzeuge

| Werkzeug | Zweck | Standard |
|---|---|---|
| `codegraph_explore` | Frage oder Namen → Quelltext mit Zeilennummern, Aufrufpfade, Wirkungsradius; `projectPath` für andere Projekte, `maxFiles` begrenzt den Umfang | sichtbar |
| `codegraph_node`, `codegraph_search`, `codegraph_callers`, `codegraph_callees`, `codegraph_impact`, `codegraph_files`, `codegraph_status` | Einzelabfragen | verborgen; einschalten mit `CODEGRAPH_MCP_TOOLS=explore,node,impact,…` |

Für Claude Code den Server mit `alwaysLoad: true` eintragen (macht `codegraph install`), sonst steckt `codegraph_explore` hinter der Tool-Suche.

## Shell

| Befehl | Zweck |
|---|---|
| `codegraph explore "<Namen oder Frage>" [-p PFAD] [--max-files N]` | wie `codegraph_explore` |
| `codegraph node NAME` · `codegraph node -f DATEI [--offset N --limit M] [--symbols-only]` | ein Symbol mit Aufrufern und Aufgerufenen · eine Datei mit Zeilen und Abhängigen |
| `codegraph query SUCHE [-k KIND] [-l N] [-j]` | Symbole suchen |
| `codegraph context "<Aufgabe>" [-n N] [--no-code]` | Kontext für eine Aufgabe zusammenstellen |
| `codegraph callers SYMBOL` · `callees SYMBOL` | Aufrufer · Aufgerufene |
| `codegraph impact SYMBOL [-f DATEI] [-d TIEFE]` | Was eine Änderung betrifft |
| `codegraph affected [DATEIEN] [--stdin] [-f GLOB] [-q]` | Tests, die von geänderten Dateien abhängen |
| `codegraph files [--filter VERZ] [--format tree\|flat\|grouped]` | Dateistruktur aus dem Index |
| `codegraph status [-p PFAD]` | Index, Statistik, ausstehende Synchronisation |
| `codegraph sync` | inkrementell nachziehen (erlaubt) |
| `codegraph init` · `codegraph index` | Index anlegen bzw. neu bauen: **nur der Mensch** entscheidet |

Neuere Versionen kennen laut Doku zusätzlich `implementations` und `cycles`; 1.6.2 noch nicht.

## Frische des Index

- Ein Daemon beobachtet das Dateisystem und synchronisiert nach einer Pause (Standard 2000 ms, `CODEGRAPH_WATCH_DEBOUNCE_MS`).
- Antworten mit ⚠️ nennen Dateien, deren Änderung noch nicht im Index ist.
- Kanten für Callbacks und Ereignisse werden seltener neu berechnet (`CODEGRAPH_SYNTH_MIN_INTERVAL_MS`) und können nachhinken.
- Nur ein schreibender Prozess je Index; ein zweiter bricht mit Sperrfehler ab (`codegraph unlock` nur bei verwaister Sperre).

## Konfiguration

`codegraph.json` im Projekt: `exclude`, `include` (Gitignoriertes zurückholen), `extensions` (eigene Endungen einer Sprache zuordnen), `deprioritize`.
Standardmäßig übersprungen: `.gitignore`-Pfade, `node_modules`, `dist`, `target`, Dateien über 1 MB. Telemetrie aus: `CODEGRAPH_TELEMETRY=0`.

## Grenzen

- Statische Analyse: Reflexion, Dependency Injection, Konventions-Einstiegspunkte und manche dynamische Aufrufe fehlen. Die Doku nennt eine Abdeckung der dateiübergreifenden Kanten von etwa 74 % bis 100 %, je nach Sprache.
- Markdown und Doku werden nicht als Code indexiert.
- Benchmarks der Doku stammen vom Hersteller (*dokumentiert*, nicht von uns gemessen).
