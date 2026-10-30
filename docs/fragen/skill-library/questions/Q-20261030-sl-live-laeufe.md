---
id: Q-20261030-sl-live-laeufe
status: answered
needs_review: false
depends_on: []
---
# Dürfen für E1–E3 headless Claude-Code-Läufe gestartet werden, und mit welchem Budget?
Version: 1
Erstellt: 2026-10-30
Art: decision
Priorität: blocking
Kontext / Quelle: [Library-Research-Plan](../../../../research/skills-meta-prompting/library-research-plan.md); Im Session-Container ist `claude` 2.1.314 verfügbar (geprüft per `claude --version`). Plan §1: externe/kostenpflichtige Läufe nur mit konkretem Versuch und Budget.
Anlass: Der Plan nennt diesen Punkt als offene Owner-Entscheidung (§10 Punkt 5).
Auswirkung / blockierte Arbeit: E1 (Auswahl), E2 (Komposition), E3 (Lernschritt) bleiben ohne Läufe reine Protokolle; Live-Auswahl und Lernerfolg bleiben offen.
Fragestellung: Dürfen für E1–E3 headless Claude-Code-Läufe gestartet werden, und mit welchem Budget?
Optionen und Folgen: A: Ja, bis ca. 40 kurze `claude -p`-Läufe gesamt (E1 ~20, E2 ~6, E3 ~14), nur synthetische Eingaben, Usage wird protokolliert. B: Nur E1 (bis ca. 20 Läufe). C: Keine Live-Läufe; nur Fixtures und Protokolle.
Empfehlung + sachlicher Grund: A; nur mit echten Läufen gibt es Belege für Discovery, Auswahl und einen Lernschritt. Die Mengen sind klein und vorab begrenzt.
Benötigter Sachbeleg: keiner.

## Antworten
Antwort-ID: A-20261030-sl-live-laeufe
Zeit / beantwortet von / Quelle: 2026-10-30 ca. 17:19 UTC, Owner, AskUserQuestion in der Claude-Code-Session (keine eigene Message-ID)
Bezug: Version 1, Runde R-20261030-sl-runde1
Antwort: „Ja, bis ~40 Läufe (Empfohlen)“ – Option A. (wörtlich gewählte Option)
Ersetzt Antwort: keine
Folgen / Rückfragen: Umsetzung im [Library-Research-Plan](../../../../research/skills-meta-prompting/library-research-plan.md) und den SL-Ergebnissen.

## Verlauf
- 2026-10-30: Aus dem Library-Research-Plan erfasst.
- 2026-10-30: In R-20261030-sl-runde1 gestellt und beantwortet.
