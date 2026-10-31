@AGENTS.md

## Claude Code

- **Code immer zuerst über CodeGraph.** Wann immer es um vorhandenen Code geht (verstehen, finden, Fehler suchen,
  ändern, fremde Repos untersuchen), ist `codegraph_explore` der erste Schritt; Ablauf im Skill
  [`using-codegraph`](.agents/skills/using-codegraph/SKILL.md). grep/Read erst danach und nur für die dort genannten Fälle.
- Code-Erkundung nicht an Explore-Subagents abgeben: Sie starten ohne diese Datei und kennen
  die CodeGraph-Regeln nicht. Stattdessen `codegraph_explore` direkt aufrufen.
- Den CodeGraph-MCP-Server mit `alwaysLoad: true` eintragen (macht `codegraph install`),
  damit `codegraph_explore` nicht hinter der Tool-Suche verschwindet.
- Fügt `codegraph install` einen eigenen Block (`<!-- CODEGRAPH_START -->`) in diese Datei ein,
  ihn mit dem CodeGraph-Abschnitt in AGENTS.md zusammenführen statt doppelt stehen zu lassen.
