# Dossier: skills-optimizer

> Vorlage für diese Recherche, abgeleitet aus [docs/research/dossiers/_vorlage.md](../../../docs/research/dossiers/_vorlage.md).
> Belegstatus je Aussage: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*.
> Clean-Room: Hier steht beobachtbares Verhalten und unsere Schlussfolgerung, kein übersetzter Fremdcode
> und keine wörtlich übernommenen Prompts.

| Feld | Wert |
|---|---|
| Fork (gelesen) | https://github.com/netzkontrast/skills-optimizer |
| Upstream (laut Doku) | https://github.com/claude-world/skills-optimizer (README-Badges, Installationsanleitung) |
| Commit-SHA | `f8082b57b3138260e9e45767fd6229711362678b` |
| Letzter Commit | 2026-07-19, „feat(skill): release semantic compressor v2.0.0“ |
| Lizenz | MIT, Copyright 2026 Claude World |
| Art | Skill (Claude Code) + Python-CLI als Kontrollskript |
| Geprüft am / von | 2026-10-30 / Claude Code (Dokumenten- und Codelektüre, kein Code ausgeführt) |

Permalink-Basis: `B = https://github.com/netzkontrast/skills-optimizer/blob/f8082b57b3138260e9e45767fd6229711362678b`

## Zweck

Ein nur manuell aufrufbarer Skill `semantic-compressor`, der Skill- und Agent-Markdown von Claude Code
kürzt, ohne Verhalten zu verändern. Das Modell schreibt Entwürfe und prüft sie semantisch, ein abhängigkeitsfreies
Python-Skript übernimmt alle deterministischen Prüfungen und Dateioperationen (*dokumentiert*,
[README L15–25](B/README.md#L15)).

## Kernkonzepte

| Konzept | Beobachtung (eigene Worte) | Evidenz | Fundstelle |
|---|---|---|---|
| Trennung Entwurf / Mutation | Scannen, Entwerfen, Prüfen, Benchmark und Restore-Vorschau verändern keine Quelle. Nur `apply` und `restore --apply` schreiben. | *dokumentiert* | [SKILL.md L20–35](B/.claude/skills/semantic-compressor/SKILL.md#L20) |
| Präservations-Inventar | An den Quell-Hash gebundenes JSON mit acht Literal-Kategorien (Trigger, Befehle, Tools, Formate, Pfade, Zahlen, Fehlertexte, Sicherheitsregeln), je Kategorie eine Bestätigung und mindestens ein benanntes Konzept. Status muss `complete` sein. | *im Code gefunden* | [semantic_compressor.py L49–58](B/.claude/skills/semantic-compressor/scripts/semantic_compressor.py#L49), [L442–507](B/.claude/skills/semantic-compressor/scripts/semantic_compressor.py#L442) |
| Literal-Invariante | Jedes Inventar-Literal muss im Original **und** im Kandidaten als Teilstring vorkommen. Fehlt es, scheitert die Prüfung. | *im Code gefunden* | [L510–525](B/.claude/skills/semantic-compressor/scripts/semantic_compressor.py#L510) |
| Frontmatter-Invariante | Alle Top-Level-Schlüssel bleiben erhalten. Nur `description` und `when_to_use` dürfen umformuliert werden. | *im Code gefunden* | [L59](B/.claude/skills/semantic-compressor/scripts/semantic_compressor.py#L59), [L383](B/.claude/skills/semantic-compressor/scripts/semantic_compressor.py#L383) |
| Unabhängiger semantischer Review | Ein frischer, nur lesender Subagent liefert ein Urteil mit SHA-Bindung an Quelle, Kandidat und Inventar. Je Konzept nennt er wörtliche Belegstellen, die das Skript in beiden Texten wiederfinden muss. | *im Code gefunden* (Bindung), *dokumentiert* (Unabhängigkeit) | [L541–629](B/.claude/skills/semantic-compressor/scripts/semantic_compressor.py#L541), [SKILL.md L129–156](B/.claude/skills/semantic-compressor/SKILL.md#L129) |
| Fail-closed-Ergebniszustände | Acht Endzustände (u. a. `NOT_COMPRESSIBLE`, `REVIEW_REQUIRED`). Misserfolge dürfen nicht als Erfolg formuliert werden. | *dokumentiert* | [SKILL.md L204–217](B/.claude/skills/semantic-compressor/SKILL.md#L204) |
| Iterationslimit | Höchstens drei Entwürfe je Datei. Wird nur das Verhältnisziel verfehlt, lautet das Ergebnis `NOT_COMPRESSIBLE`. | *dokumentiert* (nur Prompt, nicht im Skript erzwungen) | [SKILL.md L45–48](B/.claude/skills/semantic-compressor/SKILL.md#L45) |
| Atomarer Write + Backup | Schreibt in eine temporäre Datei, ruft fsync auf, ersetzt atomar und synchronisiert das Verzeichnis. Vorher entsteht ein exklusives Backup mit SHA-Prüfung und einem Manifest (`prepared` → `applied`). Vor dem Ersetzen prüft ein Compare-and-swap auf parallele Änderungen. Bei Fehlern erfolgt ein Rollback, der unbekannte Bytes nie überschreibt. | *im Code gefunden* | [L845–857](B/.claude/skills/semantic-compressor/scripts/semantic_compressor.py#L845), [L959–1021](B/.claude/skills/semantic-compressor/scripts/semantic_compressor.py#L959) |
| Hash-gebundener Restore | Restore geschieht nur über ein kanonisches Manifest, wenn die Hashes von aktueller Datei und Backup sowie der Dateimodus exakt passen. Andernfalls wird abgelehnt. Ohne `--apply` läuft nur ein Trockenlauf. | *im Code gefunden* | [L1042–1237](B/.claude/skills/semantic-compressor/scripts/semantic_compressor.py#L1042) |
| Idempotenz-Marker | Ein HTML-Kommentar mit Quell-Hash, Zeitstempel und Run-ID. Bereits markierte Dateien überspringt der Scan. | *im Code gefunden* | [L29–34](B/.claude/skills/semantic-compressor/scripts/semantic_compressor.py#L29), [L801](B/.claude/skills/semantic-compressor/scripts/semantic_compressor.py#L801) |
| Zielinhalt als untrusted data | Snippets, Hooks und Anweisungen aus der Zieldatei werden nie ausgeführt. Ein Eval-Fixture enthält dazu eine Prompt-Injection. | *dokumentiert*; Eval-Fall vorhanden, Ergebnis *offen* | [SKILL.md L41](B/.claude/skills/semantic-compressor/SKILL.md#L41), [evals.json](B/.claude/skills/semantic-compressor/evals/evals.json) |
| Negativ-Literale | Zu jedem Benchmark-Fall gibt es „verbotene“ Formulierungen, also erfundene Fähigkeiten, die im Kandidaten nicht auftauchen dürfen. Geprüft wird das nur im Projektvalidator, nicht im Skill-Workflow. | *im Code gefunden* | [validate_project.py L213–224](B/scripts/validate_project.py#L213), [cases.json](B/.claude/skills/semantic-compressor/samples/verification/cases.json) |

## Artefakte und Formate

- `SKILL.md` mit Frontmatter `disable-model-invocation: true` und `user-invocable: true` sowie Platzhaltern
  `${CLAUDE_SKILL_DIR}` und `${CLAUDE_PROJECT_DIR}` (*dokumentiert*, [SKILL.md L1–18](B/.claude/skills/semantic-compressor/SKILL.md#L1)).
- Python-CLI mit den Unterbefehlen discover, workspace, inventory, metrics, validate, apply, restore und benchmark. Ausgabe ist JSON, jeder Fehler endet mit Exit ≠ 0 (*im Code gefunden*, [L1504](B/.claude/skills/semantic-compressor/scripts/semantic_compressor.py#L1504)).
- Progressive Disclosure: Die Details stehen in `references/` (Inventar-Schema, Strategien, Beispiele). Laut SKILL.md werden sie
  erst in bestimmten Arbeitsschritten gelesen (*dokumentiert*, [SKILL.md L101–105](B/.claude/skills/semantic-compressor/SKILL.md#L101)).
- Acht Beispielpaare (verbose/compressed) mit Inventaren und gespeicherten Review-JSONs. Dazu kommen `benchmark-results.json` und `BENCHMARK-REPORT.md`.

## Messung und Evaluation

- **Was gemessen wird:** Gemessen werden Zeilen, Wörter, Zeichen und Bytes, keine Tokens. Ein Wort ist hier ein Treffer des Musters „keine Leerzeichen“
  (`\S+`) ([L213–219](B/.claude/skills/semantic-compressor/scripts/semantic_compressor.py#L213)). Der Bericht sagt
  das selbst ([BENCHMARK-REPORT.md L3](B/BENCHMARK-REPORT.md#L3)). Die Schlagzeile „7,06:1“ bezieht sich auf **Zeilen**. Das
  maßgebliche Wortverhältnis liegt bei 3,17:1 ([L9–10](B/BENCHMARK-REPORT.md#L9)) und wird von einer Datei mit 4,39:1 nach oben gezogen.
- **Abgleich der Ergebnisdateien** (durch Lesen und `wc`/`sha256sum`): Die SHA-256 aller acht komprimierten Samples stimmen
  mit `benchmark-results.json` überein, ebenso die Zeilenzahlen. `wc -w` weicht bei zwei Dateien ab (code-analyzer 484 statt 486,
  full-stack-generator-Original 6893 statt 7244). Wahrscheinliche Ursache ist die Unicode-Whitespace-Definition (Python-Regex gegenüber
  `wc` im C-Locale). Das zeigt, dass „Wörter“ implementierungsabhängig sind. *Im Code gefunden*. Ursache *offen*.
- **Semantik:** Die gespeicherten Reviews tragen Reviewer-Namen wie `benchmark-test-audit` und den Modus `independent-read-only`.
  Das Skript prüft nur Form und Bindung, nicht ob der Reviewer wirklich unabhängig war. Das räumt die README
  ein ([README L280–281](B/README.md#L280)). Semantische Gleichwertigkeit bleibt eine Modellbehauptung (*dokumentiert*).
- **Tests:** 21 Unittests für Pfade, Symlinks, Frontmatter, Inventar, Apply/Restore und Nebenläufigkeit, dazu CI
  ([tests/test_semantic_compressor.py](B/tests/test_semantic_compressor.py), [ci.yml](B/.github/workflows/ci.yml)). Ob sie grün durchlaufen, ist *offen* (nicht ausgeführt).

## Grenzen und Risiken

- Die Literalprüfung ist reine Teilstring-Präsenz. Sie erkennt keine Kontextverschiebung, etwa wenn eine Zahl jetzt zu einer anderen Regel gehört,
  und keine Negation. Das deckt nur der Modell-Review ab.
- Konzepte und Literale extrahiert das Modell selbst. Ein unvollständiges Inventar führt zu einem falschen PASS. Die Bestätigungsflags sind
  Selbstauskunft des Modells.
- Iterationslimit, Unabhängigkeit des Reviewers und Nicht-Ausführung von Zielinhalt sind nur Prompt-Regeln, das Skript erzwingt sie nicht.
- Kosten: zwei Modellrollen (Entwurf und Review) mit bis zu drei Durchläufen. Es gibt keine Token- oder Kostenmessung (*dokumentiert*, [README L279](B/README.md#L279)).
- Version 1.x warb laut CHANGELOG mit Token-Prozenten und „100 %“-Aussagen, die in v2 zurückgezogen wurden ([CHANGELOG.md](B/CHANGELOG.md)).

## Clean-Room-Relevanz

Anforderungen für den eigenen Rewrite:
- **R1:** Kompression oder Optimierung erzeugt immer nur einen Kandidaten. Die Quelle darf sich erst nach bestandenen Gates ändern, und nur durch einen expliziten Apply-Befehl.
- **R2:** Ein maschinenlesbares, quell-hash-gebundenes Präservations-Inventar (Literal-Kategorien plus benannte Konzepte) ist Pflicht-Input
  der Prüfung. Leere Kategorien gelten nur als geprüft, wenn das ausdrücklich bestätigt wurde.
- **R3:** Deterministische Gates (Frontmatter-Schlüssel, Literale, Mindestverhältnis) laufen getrennt vom semantischen Urteil.
  Das Urteil liegt in einem eigenen Kontext und ist mit Belegstellen an die Hashes von Quelle, Kandidat und Inventar gebunden.
- **R4:** Mutationen schreiben atomar (Temp-Datei, fsync, rename), legen vorher ein hash-verifiziertes Backup und Manifest an, prüfen per Compare-and-swap
  auf parallele Änderungen und erlauben einen Restore nur bei passenden Hashes.
- **R5:** Ergebniszustände sind explizit und fail-closed. Kompressionsmaße sind benannt (Wörter, Tokens nach Tokenizer X) und nie vermischt.
- Ergänzen gegenüber dem Original: Negativ-Literale im Laufzeit-Gate, Mehrfachvorkommen und Kontext von Literalen, echte Token-Zählung
  und eine verhaltensbasierte Evaluation statt reinem Textvergleich.
- Nicht übernehmen: die konkreten Prompt-Texte und das Inventar-Schema in wörtlicher Form, die Marker-Syntax, die Python-Implementierung.
- Kategorie: **Verhalten neu implementieren** (MIT würde eine lizenzierte Übernahme erlauben, ist aber für Konzepte nicht nötig).

## Offene Punkte

- Versuch V1: Unittests und `validate_project.py` in einer isolierten Umgebung ausführen und prüfen, ob sie grün sind
  (`python3 -m unittest discover -s tests`).
- Versuch V2: Die Abweichung der Wortzählung zwischen `\S+` und `wc -w` an `full-stack-generator.md` erklären, etwa durch geschützte Leerzeichen.
- Versuch V3: Echte Token-Zählung (Anthropic Token Count API) für alle acht Paare durchführen und mit dem Wortverhältnis vergleichen.
- Versuch V4: Verhaltensäquivalenz statt Textäquivalenz prüfen. Dafür identische Aufgaben mit Original- und komprimiertem Skill ausführen und die Ausgaben vergleichen.
- Versuch V5: Eval `safe-single-file-draft` mit Prompt-Injection-Fixture in Claude Code laufen lassen und prüfen, ob die Injection ignoriert wird.
