---
id: Q-20261031-p9-questions-cli
status: answered
needs_review: false
depends_on: []
---
# Wird P9 (`questions`-CLI) gebaut, und dürfen Läufe sie aufrufen?
Version: 1
Erstellt: 2026-10-31
Art: decision
Priorität: blocking
Kontext / Quelle: [Portierungsplan](../../../research/skills-meta-prompting/portierungsplan-2026-10-31.md) §4, §6
Anlass: Owner-Entscheidungen aus dem Portierungsplan §6.
Auswirkung / blockierte Arbeit: Umsetzung der Pakete P0–P12.
Fragestellung: P9 liegt außerhalb der V1-Stufen 0–2 und braucht in headless Läufen eine Freigabe für Bash oder ein MCP-Werkzeug.
Optionen und Folgen: Ja mit Rechten; ja ohne Rechte (nur interaktiv); nein.
Empfehlung + sachlicher Grund: Ja; die Rechte eng auf genau diesen Befehl begrenzen. Keine Entscheidung; die Empfehlung ist keine Antwort.
Benötigter Sachbeleg: keiner.

## Antworten
Antwort-ID: A-20261031-p9-questions-cli
Zeit / beantwortet von / Quelle: 2026-10-31, Owner, Chat-Nachricht in der Claude-Code-Session („1) Reihenfolge ok 2) ja 3) ja und vergib auch die rechte 4) ok“)
Bezug: Version 1, Runde R-20261031-port-runde1
Antwort: „ja und vergib auch die rechte“ (wörtlich, Punkt 3).
Ersetzt Antwort: keine
Konflikt mit: keiner
Folgen / Rückfragen: P9 wird gebaut. Rechte nur für `node tools/skill-library/cli.js questions …`: in Messläufen per `--allowedTools`, im Projekt per Permission-Regel in `.claude/settings.json`; keine allgemeine Bash-Freigabe.

## Verlauf
- 2026-10-31: Aus Portierungsplan §6 erfasst, im Chat gestellt (Abschlussbericht) und beantwortet.
