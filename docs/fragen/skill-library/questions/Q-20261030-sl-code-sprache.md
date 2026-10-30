---
id: Q-20261030-sl-code-sprache
status: open
needs_review: false
depends_on: []
---
# In welcher Sprache und an welchem Ort entstehen die Library-Werkzeuge der ersten Version?
Version: 1
Erstellt: 2026-10-30
Art: decision
Priorität: blocking
Kontext / Quelle: [Spec Skill-Library V0](../../../spec/skill-library-v0.md) O-4/O-5; [Implementierungsübergabe](../../../../research/skills-meta-prompting/library-implementation-handover.md) §8; `AGENTS.md` „Befehle“: Phase 1 TypeScript/Next.js für den Hub; vorhandener Research-Helfer [`skill_pilot.py`](../../../../research/skills-meta-prompting/skill_pilot.py) in Python-Standardbibliothek.
Anlass: Der erste Implementierungs-PR (Validator, Hash, Token-Zählung) braucht Sprache, Ort und Testbefehl. `AGENTS.md` sieht TypeScript/Next.js für den Hub vor, regelt aber nicht ausdrücklich Entwicklerwerkzeuge vor Phase 1. Der Frontmatter-Parser ist entweder eine eigene YAML-Teilmenge oder eine neue Dependency; neue Dependencies brauchen Owner-Freigabe.
Auswirkung / blockierte Arbeit: Beginn des ersten Implementierungs-PRs; Eintrag unter „Befehle“ in `AGENTS.md`; spätere Übernahme in den Hub.
Fragestellung: Dürfen die Library-Werkzeuge der ersten Version von der Phase-1-Sprache abweichen, und wenn nicht, mit welchen Dependencies?
Optionen und Folgen: A: TypeScript auf Node in eigenem Paketordner (z. B. `packages/skill-library/`); passt zu Phase 1, braucht `typescript` als devDependency (neue Dependency) und legt Paketstruktur vor Tor-Entscheidungen fest. B: JavaScript (ESM) auf Node ohne Dependencies (`node:crypto`, `node:test`, JSDoc-Typen), Ort z. B. `tools/skill-library/`; gleiche Laufzeit wie Phase 1, keine neue Dependency, später ohne Verhaltensänderung nach TypeScript portierbar; YAML-Teilmenge selbst geparst. C: Python-Standardbibliothek wie der Research-Helfer, Ort z. B. `tools/skill-library/`; direkte Wiederverwendung, keine Dependency, aber zweite Sprache neben Phase 1 und spätere Neuimplementierung im Hub wahrscheinlich.
Empfehlung + sachlicher Grund: B; gleiche Laufzeit wie Phase 1 ohne neue Dependency, und der Golden-Hash SLV0-FALL-23 prüft die Gleichheit mit der Python-Methode des Research-Helfers sprachübergreifend. Keine Entscheidung; die Empfehlung ist keine Antwort.
Benötigter Sachbeleg: keiner.

## Antworten
Noch keine. Empfehlung ist keine Antwort.

## Verlauf
- 2026-10-30: Bei SL7 (Implementierungsübergabe) aus Spec O-4/O-5 erfasst; noch nicht gestellt.
