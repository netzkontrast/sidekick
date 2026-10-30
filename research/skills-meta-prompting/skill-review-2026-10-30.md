# Unabhängiges Review der Skill-Änderungen (SL2) – 30.10.2026

> Geprüft: `git diff origin/main...HEAD` auf Branch `research/learnable-skill-library` bei `d9b29caa` (Basis `origin/main` `38333a4`), Pfade `.agents/skills`, `.claude/skills`, `docs/research/skill-evaluation.json`, `docs/research/grilling-evaluation.json`, `AGENTS.md`.
> Kontext gelesen: AGENTS.md, Library-Research-Plan §1/§6/§7/§8, library-evaluation-design §3, library-inventory §2.2, library-learning (L1), alle `area-*.md` §10/§11, `docs/fragen/skill-library/questions/Q-20261030-sl-aktivierung.md`.
> Keine Modell-/CLI-Läufe. Alle Befunde stammen aus statischer Prüfung (Python/grep). Wirkung und Auswahl sind damit **offen**.

## Gesamturteil

Format und Portabilität sind sauber. Die Skilltexte entsprechen wörtlich den Entwürfen bzw. Änderungsvorschlägen der area-Dokumente; Rechte werden nirgends ausdrücklich verliehen.
Aber: Die vier neuen Skills sind per Symlink und `allow_implicit_invocation: true` **aktiv**, obwohl ihre eigenen area-Dokumente das an unerfüllte Bedingungen knüpfen. Nach der Owner-Antwort gilt dazu „Aktivierung nur durch Owner am Hash“. Außerdem widersprechen mehrere Fixtures sich selbst.
**Urteil: Änderung nötig. 1 blockierender Punkt, 9 „sollte“-Punkte, 4 optionale.**

## Deterministische Prüfungen (ausgeführt)

| Prüfung | Ergebnis |
|---|---|
| `name` = Ordner, Muster `[a-z0-9]+(-[a-z0-9]+)*`, ≤ 64 | 8/8 OK |
| Frontmatter nur `name`, `description` | 8/8 OK |
| `description` ≤ 1024 Zeichen | 8/8 OK (264–342 alt; 598–640 neu) |
| Referenzlinks im Rumpf existieren | 8/8 OK |
| Symlink `.claude/skills/<n>` → `.agents/skills/<n>` | 8/8 OK |
| `agents/openai.yaml` parst (PyYAML), `default_prompt` nennt `$<name>` | 8/8 OK |
| grep `sidekick|docs/fragen|docs/entscheidungen|research/agent-hub|Paperclip|OpenHands|Hub` in allen Skill-Dateien (GT-L1) | 0 Treffer |
| Rumpf-Wörter (`split()`) | eval 227, grilling **466** (vorher 343), planning 235, research 258, resuming 227, gates 268, spec 254, testing 186 |
| Neue SKILL.md = Entwurf im area-Dokument | 4/4 identisch |
| Fixture-IDs eindeutig (49 + 28, keine Überschneidung) | OK |
| `source`-Pfade existieren | Nein bei `…area-*.md §11` (Abschnitt im Pfadstring) |

## Bewertung je Skill

| Skill | Urteil | Begründung |
|---|---|---|
| grilling | sollte | Inhalt durch area-grilling §11 gedeckt; Projektneutralität erreicht. Rumpf 466 Wörter > Ziel ≲ 400. |
| researching-repositories | OK | Gedeckt durch §11; Beschreibung bewusst unverändert (Plan §8). Fixtures RR-05 fehlerhaft (siehe unten). |
| planning-work-packages | OK | Gedeckt durch §11. Fixture PW-07 widerspricht sich (siehe unten). |
| reviewing-decision-gates | OK | Gedeckt durch §11. Trennung Empfehlung/Entscheidung/Befugnis klar. Familie bei DG-02 vermutlich falsch. |
| specifying-behavior | **blockierend** | area §10: „Aktivierung erst nach Review der Spec-Konvention aus PR #8“. PR #8 ist nicht gemergt, Inventar A05 sagt „nach Merge von #8“. Der Skill ist trotzdem aktiv. |
| resuming-work | **blockierend** + sollte | area §11 überschreibt den Entwurf mit „nicht aktiv, nicht geprüft“. Schritt 4 kann eine Freigabe implizit wiederbeleben, Schritt 8 eine Skill-Kaskade auslösen. |
| testing-system-boundaries | **blockierend** + optional | area §9: „Installation erst nach dem Minimalversuch“, und der Minimalversuch ist nicht ausgeführt. Die Beschreibung schließt Störungen produktiver Systeme aus, der Rumpf erlaubt sie mit Freigabe. |
| evaluating-changes | **blockierend** | Keine Aktivierungsbedingung im area-Dokument. Für das Gesamtpaket gilt aber Q-20261030-sl-aktivierung („nur Owner am Hash“) und library-learning L1. |

Der blockierende Punkt ist für alle vier neuen Skills derselbe (B1).

## Korrekturvorschläge

**B1 (blockierend): Aktivierung ohne Owner-Freigabe am Hash.** Merge = Aktivierung, denn Symlink und `allow_implicit_invocation: true` lassen den Client die Skills implizit wählen. Zwei Wege, der Owner entscheidet:
- a) `.agents/skills/{specifying-behavior,resuming-work,testing-system-boundaries,evaluating-changes}/agents/openai.yaml`: `allow_implicit_invocation: true` → `false`. Die vier Symlinks `.claude/skills/<n>` bis zur Freigabe entfernen. In `AGENTS.md` die vier Namen nur als „Kandidaten, nicht aktiv“ führen.
- b) Im PR ausdrücklich die Owner-Freigabe je Tree-Hash einholen (`evaluating-changes 1fccb850b3dc`, `resuming-work 23c36f024e7c`, `specifying-behavior 4311108893b4`, `testing-system-boundaries 0bd57dc77a9d`). Dann die Überschriften in den area-Dokumenten anpassen: `area-resuming-work.md` / `area-specifying-behavior.md` §11 „(nicht aktiv, nicht geprüft)“ → „(aktiviert am Hash … durch Owner, Wirkung ungemessen)“. In `area-specifying-behavior.md` §10 und `area-testing-system-boundaries.md` §9 die Bedingung als bewusst übersteuert vermerken.

**S1 (sollte): Baseline B1 festhalten.** Die Änderungen an A01–A04 waren als „Kandidat gegen B1, nicht aktiv“ vorgeschlagen und bündeln je Skill mehrere Dimensionen. Sie stehen jetzt direkt im aktiven Bestand. `library-evaluation-design.md` §3, Zeile B1: „Die vier Skills am eingefrorenen Commit, unverändert“ → „Die vier Skills am Commit `38333a4` (origin/main vor SL2), Tree-Hashes je Skill; SL2-Stand ist Kandidat K-SL2 mit mehreren Dimensionen, nur als Paket gegen B1 vergleichbar“.

**S2 (sollte): `resuming-work/SKILL.md` Schritt 4.** „gebundene Freigaben gelten nur, wenn Aktion, Inhalt und Stand noch übereinstimmen.“ → „Freigaben gelten nur aus ihrer Originalquelle und nur, wenn Aktion, Inhalt und Stand dort noch übereinstimmen; die Übergabe belegt sie nicht.“

**S3 (sollte): `resuming-work/SKILL.md` Schritt 8.** „den nächsten Schritt mit dem dafür passenden Ablauf“ → „den nächsten Schritt; nenne den passenden Ablauf, lade ihn aber nicht selbst“. So entsteht keine implizite Kaskade (Plan §1).

**S4 (sollte): `grilling/SKILL.md` kürzen auf ≲ 400 Wörter.** Den Zusatz zu Schritt 5 („Ist im Lauf kein Mensch erreichbar …“) und die drei Zusatzsätze in Schritt 6 („Ändert sich eine gestellte Frage …“ bis „… nie als Antwort gespeichert.“) ersetzen durch: „Ohne erreichbaren Menschen, bei geänderten Fragen, Doppelantworten oder Fristablauf: Regeln in [Workflow](references/workflow.md) anwenden; nie warten, nie eine Antwort annehmen.“ Die Versions- und Fristregel dafür in `references/workflow.md` unter „Zustände“ ergänzen; dort fehlen sie bisher.

**S5 (sollte): Fixtures widersprechen sich selbst.**
- `skill-evaluation.json` RR-05: `"expected_skill": "researching-repositories"` → `"reviewing-decision-gates"`, dazu `"allowed_skills": ["reviewing-decision-gates"]`.
- PW-07: `"expected_skill": "planning-work-packages"` → `null`, dazu `"allowed_skills": [null]`, `"family_id": "ST-09"`. Die Assertion lautet „kein neuer Plan“.
- ST-07/08/09: `"Keinen dieser drei Skills laden."` → `"Keinen Skill laden."` (der Bestand umfasst jetzt acht Skills).

**S6 (sollte): Konkurrenz- und Familienfelder maschinenlesbar machen**, wie in `grilling-evaluation.json` mit `allowed_skills`.
- PW-05 und GT-10: `"family_id": "plan-unclear-priority"` und `"allowed_skills": ["grilling","planning-work-packages"]`.
- RW-N1 (Prompt identisch mit GT-04): `"family_id": "GT-04"`, `"allowed_skills": ["grilling"]`.
- SB-N2: `"allowed_skills": ["planning-work-packages"]`.
- DG-01 (gleiches Szenario wie ST-06): `"family_id": "ST-06"`.
- DG-02: Familie „(gate-must-vs-score)“ → „(gate-stale-recommendation)“.

**S7 (sollte): RR-01…08 und PW-01…08 sind nicht lauffähig.** `input` lautet „siehe Quelle, §9 bzw. Tabelle“, die Prompts lauten „Skill-Auftrag wie §9“ oder „Hub-Auftrag wie §9“. Vor jedem Lauf gehören synthetische Prompt- und Input-Texte aus area-*.md §9 in die Datei, und `status` bleibt bis dahin `not_run`. `source` trennen: `"…area-planning-work-packages.md §11"` → `"source": "…area-planning-work-packages.md", "section": "§11"`.

**S8 (sollte): Konkurrenzfälle der neuen Trigger fehlen.**
- specifying-behavior wirbt mit „welche Fehlerfälle muss das abdecken“, testing-system-boundaries mit „Ausfalltests ableiten“ und „Fehlermatrix“. Neu: `SB-TB1` „Welche Ausfalltests braucht die Spec S-1 bei doppelter Zustellung?“ → `testing-system-boundaries`, `allowed_skills` dazu.
- evaluating-changes und reviewing-decision-gates: EC-P2 („should we ship it“) ist zugleich ein Go/No-go-Trigger. Neu: `EC-DG1` „Sollen wir Kandidat K aktivieren? Der Vergleichsbericht liegt vor.“ → `reviewing-decision-gates`, `allowed_skills: ["reviewing-decision-gates"]`.

**S9 (sollte): ID-Schema in den area-Dokumenten angleichen.** `area-testing-system-boundaries.md` „IDs …: SBT-P1, SBT-P2, SBT-N1, SBT-N2“ → „TB-P1, TB-P2, TB-N1, TB-N2“. `area-evaluating-changes.md` „ECH-P1 … ECH-N2“ → „EC-P1 … EC-N2“.

**Optional**
- O1 `testing-system-boundaries` description: „oder Störungen produktiver Systeme“ → „oder Störungen produktiver Systeme ohne Freigabe für genau diese Aktion“ (gleicht die Beschreibung an Schritt 4 an).
- O2 Katalogkosten: Die vier neuen Beschreibungen haben zusammen etwa 2 450 Zeichen, mehr als die vier alten zusammen (rund 1 150). Den Effekt auf das Katalogbudget (K1.3) in C0 messen, nicht schätzen.
- O3 Für `grilling` einen Negativfall zur Spec ergänzen: „Klär mit mir die offenen Präferenzen zur Import-Spec“ → `grilling`, nicht `specifying-behavior`.
- O4 `AGENTS.md`: Der neue Satz „Laufende Skill-Library-Recherche und Priorität: …“ ist ein reiner Verweis. Das ist in Ordnung, weil Plan §1 Priorität nur im Plan führt. „und Priorität“ könnte entfallen, um keine zweite Prioritätsquelle anzudeuten.

## Nur mit Läufen prüfbar (offen)

- M1/M2: Werden die acht Skills im eingesetzten Client gefunden, und gewinnen bei Konkurrenzfällen die richtigen (GT-07/10, PW-05/07, RW-N1, SB-N2, S8)?
- M3: Hält grilling im Headless-Lauf (B12h) wirklich `waiting_user` ohne Default? Erzeugt resuming-work keine zweite Statusdatei (RW-02)?
- M4: Ist die SL2-Fassung von A01–A04 besser als B1? Ohne S1 ist das nicht mehr sauber messbar.
- Lädt ein Skill trotz S3 im Lauf einen Folge-Skill (Kaskade)? Das ist nur in Transkripten sichtbar.
- Kontextbudget mit acht Beschreibungen (O2), gemessen mit der tatsächlichen Clientversion.
