@AGENTS.md

## Claude Code

- Code-Erkundung nicht an Explore-Subagents abgeben: Sie starten ohne diese Datei und kennen
  die CodeGraph-Regeln nicht. Stattdessen `codegraph_explore` direkt aufrufen.
- Den CodeGraph-MCP-Server mit `alwaysLoad: true` eintragen (macht `codegraph install`),
  damit `codegraph_explore` nicht hinter der Tool-Suche verschwindet.
- Fügt `codegraph install` einen eigenen Block (`<!-- CODEGRAPH_START -->`) in diese Datei ein,
  ihn mit dem CodeGraph-Abschnitt in AGENTS.md zusammenführen statt doppelt stehen zu lassen.
