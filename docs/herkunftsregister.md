# Herkunfts- und Übernahmeregister

Jede fremde Software, die der Hub integriert, als Dependency nutzt oder deren Code übernommen wird, steht hier (siehe [Analyse §4 und §10](analyse-und-uebernahmeplan.md#4-was-portieren-hier-heißen-soll)).
Lizenzen, Assets und Notices werden am gewählten Commit inventarisiert. Dies ist eine technische Prozessdefinition, keine rechtliche Bewertung.

**Kategorien:** Integrieren · Als Dependency nutzen · Verhalten neu implementieren · Lizenziert übernehmen · Zurückstellen

| Quelle | Version/Commit | Lizenz | Kategorie | Eigener Vertrag / Schnittstelle | Update-Verantwortung | Entscheidung |
|---|---|---|---|---|---|---|
| [mattpocock/skills](https://github.com/mattpocock/skills/tree/a496f5513d4a4cf889bc48e189e579f4b0bdf6aa) | a496f5513d4a4cf889bc48e189e579f4b0bdf6aa | MIT, Copyright Matt Pocock 2026 | Verhalten neu implementieren | grilling + AskUser + versionierte Fragenablage | Maintainer des Skills | Eigenständige Neuformulierung; keine Fremdtexte kopiert |
| [skills-optimizer](https://github.com/netzkontrast/skills-optimizer/tree/f8082b57b3138260e9e45767fd6229711362678b) (Fork) | f8082b57b3138260e9e45767fd6229711362678b | MIT, Copyright 2026 Claude World (laut [Dossier](../research/skills-meta-prompting/repos/skills-optimizer.md)) | Verhalten neu implementieren | Idee „belegpflichtige Gutachten“ → `eval judge check` (SLV0-EVAL-19…21) | Maintainer der Skill-Library-Werkzeuge | Nur der Mechanismus aus dem Dossier; Fremdcode vom implementierenden Agenten nicht gelesen |
| [automatic_prompt_engineer](https://github.com/netzkontrast/automatic_prompt_engineer/tree/5f8058c041ba271599539069f594f93f92278a1e) (Fork) | 5f8058c041ba271599539069f594f93f92278a1e | MIT, Copyright (c) 2022 keirp (laut [Dossier](../research/skills-meta-prompting/repos/automatic_prompt_engineer.md)) | Verhalten neu implementieren | Ideen „konjunktives Gegenkriterium“ und „Nulllauf“ → `eval nullrun`, Bericht (SLV0-EVAL-22…25) | Maintainer der Skill-Library-Werkzeuge | Nur der Mechanismus aus dem Dossier; Fremdcode vom implementierenden Agenten nicht gelesen |
| [skill-optimization](https://github.com/netzkontrast/skill-optimization/tree/6fec081ed78a5bcd518d6562ec7452e54ff47aba) (Fork) | 6fec081ed78a5bcd518d6562ec7452e54ff47aba | MIT mit Platzhalter-Copyright (laut [Dossier](../research/skills-meta-prompting/repos/skill-optimization.md)) | Verhalten neu implementieren | Konzept „erwartete Befunde, 1:1-Zuordnung, Überberichtung“ → `eval findings` (SLV0-EVAL-26/-27) | Maintainer der Skill-Library-Werkzeuge | Nur das Konzept; deren Code ist ausgeschlossen und wurde nicht geöffnet |
| [afs-spec](https://github.com/netzkontrast/afs-spec/tree/ce254f6dcc5f524de1c868f6197de4c89dbba78b) (Fork) | ce254f6dcc5f524de1c868f6197de4c89dbba78b | Apache-2.0; kein Copyright-Inhaber und keine NOTICE im Repo ([Dossier](research/dossiers/afs-spec.md)) | Verhalten neu implementieren; Rest zurückgestellt | Runtime-Adaptervertrag (geplant `docs/spec/runtime-adapter-v0.md`), Job-Beobachtung, Grant-Bausteine | Maintainer der Specs | Nur Verhalten aus der Spec; kein Text und keine Vorlage kopiert (auch nicht `claude-code.yaml`). Quelle vom schreibenden Agenten gelesen |
| [context-engineering-dspy-book](https://github.com/netzkontrast/context-engineering-dspy-book/tree/a633241b242ab777e9b5693f05ca1544e5f4b9fe) (Fork) | a633241b242ab777e9b5693f05ca1544e5f4b9fe | MIT, Copyright (c) 2025 Mike Taylor; Datensätze gemischt, u. a. CC BY-SA 3.0 ([Dossier](research/dossiers/context-engineering-dspy-book.md)) | Verhalten neu implementieren; Daten zurückgestellt | Kostendeckel, gepaarte Statistik, Positionswechsel im Judge → Skill-Library-Eval; AGENTS.md-Fallfamilie | Maintainer der Skill-Library-Werkzeuge | Nur Verfahren; kein Python-Code, keine Prompts, Fälle oder Datensätze kopiert. Quelle vom schreibenden Agenten gelesen |

Code aus fremden Repos wird nur in der Kategorie *Lizenziert übernehmen* und nach separater Entscheidung kopiert; die Herkunft steht dann zusätzlich im Commit und am Code.

## Grilling: Quellenprüfung und Grenzen

Geprüft: `skills/productivity/grilling/SKILL.md`, `docs/productivity/grilling.md`,
`skills/engineering/grill-with-docs/SKILL.md`, `LICENSE` am oben genannten Commit.
[Abdeckung und Abweichungen](research/grilling-port.md). Die eigenständige
Verhaltensumsetzung ist keine personell getrennte juristische Clean-Room-Zertifizierung:
Der implementierende Agent hat die Quelle gelesen.
