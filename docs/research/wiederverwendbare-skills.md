# Wiederverwendbare Skills

Drei eigenständig verwendbare Skills, ohne Projekt-, Provider-, Tool- oder Ablagebindung.
Kanonische Quelle: `.agents/skills/<name>/`; Claude Code erreicht dieselben Ordner über
relative Symlinks unter `.claude/skills/`. Für andere Projekte den vollständigen
kanonischen Skill-Ordner in deren unterstützten Skill-Pfad übernehmen.

## Laden und Kosten

Die kurze Beschreibung nennt Zweck, deutsche/englische Auslöser und Ausschlüsse.
Der Skill-Rumpf lädt erst bei Auswahl, genau eine optionale Referenz bei fehlender Vorlage.
Keine automatische Kette zwischen Skills, Hooks, Tool-Vorabfreigaben oder Subagents.
Codex-Metadaten erlauben implizite Auswahl ausdrücklich; Claude nutzt die normale
modellseitige Auswahl. Discovery hängt von Client, Version, Vertrauens-/Admin-Einstellungen
und verfügbarer Metadatenkapazität ab. Automatisches Laden ist keine Garantie.
Nicht alle Cloud-/Chat-Oberflächen lesen Repo-Skills. Dort den Ordner separat
über den jeweiligen unterstützten Installationsweg bereitstellen.
Symlinks müssen als solche ausgecheckt sein; andernfalls die Ordner für den Client
bereitstellen, ohne getrennt gepflegte Kopien einzuführen.

## Qualität

Trigger- und Verhaltensfälle: [skill-evaluation.json](skill-evaluation.json).
In einer frischen Session ohne expliziten Skill-Aufruf jeden Prompt mit nur den
angegebenen Eingaben ausführen. Auswahl und Ergebnis gegen die Assertions prüfen.
Negativfälle sollen keinen dieser drei Skills laden. Ergebnis, Client-/Modellversion,
Skill-Commit und Aufwand festhalten; für einen Vergleich dieselben Aufgaben ohne
Skills wiederholen. Fixtures sind geplante Verhaltenstests, kein Ausführungsnachweis.

Statisch geprüft werden Frontmatter, Referenzziele, Symlinks, Größenbudgets und
Projektunabhängigkeit. Echte automatische Auswahl in Claude/Codex bleibt bis zu einem
Client-Lauf unbestätigt. Größen sind Zeichen/Wörter, keine gemessenen Modell-Tokens.

## Quellen

Eigenständig formuliert nach den recherchierten Prinzipien: kleine überprüfbare
Pakete, Belege vor Erfolgsaussagen, bedarfsweise Referenzen. Kein Fremdcode übernommen.
Format: https://agentskills.io/specification
Claude-Discovery/Symlinks: https://code.claude.com/docs/en/skills
Codex-Metadaten sind optional und liegen getrennt vom portablen SKILL.md-Frontmatter.
