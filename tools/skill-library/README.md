# Skill-Library-Werkzeuge (V0, Stufe 0/1)

Read-only-Kommandozeilenwerkzeug für die Pakete unter `.agents/skills/`. Vertrag:
[Spec Skill-Library V0](../../docs/spec/skill-library-v0.md) §3–§6, §8, §9;
Auftrag: [Implementierungsübergabe](../../research/skills-meta-prompting/library-implementation-handover.md) L1–L8.
JavaScript (ESM) auf Node 22 ohne Dependencies, nur `node:`-Module
([Owner-Antwort](../../docs/fragen/skill-library/questions/Q-20261030-sl-code-sprache.md)).

Das Werkzeug prüft M0 (Format). Es belegt weder Discovery noch Auswahl noch Verhalten, gibt keine
Scores oder Aktivierungsempfehlungen aus, schreibt keine Dateien, ändert keinen `status` und greift nicht aufs Netz zu.

## Befehle

Alle Befehle aus dem Repo-Wurzelverzeichnis:

```sh
node --test "tools/skill-library/test/*.test.js"            # Tests
node tools/skill-library/cli.js validate --scope project     # acht Skills + .claude/skills/
node tools/skill-library/cli.js validate --scope package .agents/skills/grilling
node tools/skill-library/cli.js hash                         # Inhaltshashes + Paketsatz-Hash
node tools/skill-library/cli.js hash --snapshot research/skills-meta-prompting/skill-pilot-baseline-v2.json
node tools/skill-library/cli.js tokens --scope project [--estimator utf8-bytes-div-4@1] [--token-budget N]
node tools/skill-library/cli.js tokens --trace NORMALISIERTE-SPUR.json
node tools/skill-library/cli.js registry-check DATENSATZ.json... [--root DIR] [--schema-only]
```

Optionen: `--root DIR` (Projektwurzel, Standard: Arbeitsverzeichnis), `--project-list DATEI`
(JSON-Liste projektspezifischer Zeichenketten für SLV0-VAL-11), `--schema DATEI` (Standard: `docs/spec/schemas/skill-package.schema.json`).

Ausgabe ist JSON auf stdout. Exit-Code 0 ohne `error`, 1 mit mindestens einem `error`, 2 bei Bedienfehler
oder interner Ausnahme; Warnungen ändern den Exit-Code nicht (SLV0-VAL-17).

## Aufbau

| Datei | Inhalt | Spec |
|---|---|---|
| `lib/core.js` | SHA-256, kanonisches JSON, Codepoint-Sortierung, UTF-8-Prüfung, Byte/Zeilen/Wörter | PKG-21/-22, INV-03 |
| `lib/frontmatter.js` | eigener Parser der YAML-Teilmenge | VAL-01/-02 |
| `lib/package.js` | Paket lesen ohne Symlinks zu folgen, Paketregeln, Inhaltshash | PKG-01…06, -20…22; VAL-01…14 |
| `lib/project.js` | `.agents/skills/` gesamt, Adapter `.claude/skills/`, Paketsatz-Hash | VAL-15, PKG-23 |
| `lib/schema.js`, `lib/registry.js` | handgeschriebene Prüfung genau der im Schema genutzten Schlüsselwörter; Hashvergleich; Versionskonflikt | VAL-16, PKG-10…15/-24 |
| `lib/tokens.js` | Tokenzahlen mit Quelle, Schätzer nur auf Schalter, Summenregel, Lauf-Usage aus Spur | TOK-01…08 |
| `cli.js` | Unterbefehle, JSON-Ausgabe, Exit-Codes | VAL-17 |
| `test/` | je Fall SLV0-FALL-01…29 mindestens ein Test (Name beginnt mit der Fall-ID) | §9 |

## Auslegungen, wo die Spec nichts festlegt

- Fehlt `SKILL.md`, meldet der Validator `frontmatter_missing` (kein eigener Code in §8).
- Leerzeilen im Frontmatter sind erlaubt; Kommentare, ` #` und `: ` in ungequoteten Skalaren gelten als nicht unterstützt.
  Doppelt gequotete Skalare kennen nur `\" \\ \/ \n \t \r \uXXXX`.
- Ein einzelnes CR (ohne LF) wird ebenfalls als `line_endings_crlf` gemeldet.
- Markdown-Links lösen relativ zur verlinkenden Datei auf, Codeverweise `` `references/…` `` relativ zum Paketordner.
  Code in Fenced-Blöcken wird nicht ausgewertet. Unterordner unter `references/` sind erlaubt.
- `entry_unsupported` wird je oberstem unzulässigem Eintrag einmal gemeldet; darunter wird nicht weiter berichtet.
- Adapterziele werden lexikalisch relativ zu `.claude/skills/` aufgelöst, ohne dem Link zu folgen.
- Im Bereich `package` beginnen Pfade mit dem Ordnernamen, im Bereich `project` sind sie repo-relativ;
  absolute Pfade erscheinen nie in der Ausgabe (INV-03).
- Registry: `format: date-time` wird als Assertion geprüft (RFC 3339). `skill_id` ungleich Ordner in `package_path`
  ist `registry_invalid` (PKG-11). Ein anderes Hash-Profil als `sl-hash-v0` wird nicht verglichen und als
  `registry_invalid` gemeldet (PKG-24). Fehlt das Paket oder ist es ungültig, meldet `registry-check` `hash_mismatch`.
- Token-Ladestufe `katalog` misst `name` + Zeilenumbruch + `description`; `rumpf` ist `SKILL.md` nach der schließenden
  `---`-Zeile; `paket` ist die Summe aller Dateien (Summenregel TOK-05). Schätzer `utf8-bytes-div-4@1` = aufgerundet Bytes/4.
- `tokens --token-budget N` warnt nur bei geschätzten Tokens (TOK-07); ohne Schätzer erfolgt keine Budgetaussage.

## Golden-Werte

- Paketsatz-Hash von `skill-pilot-baseline-v2.json`: `4ad5b6dbae228982fe3ba7df6552d9e7029af0fc0c972dde09ad9406f2473967` (SLV0-FALL-23).
- Inhaltshashes je Paket wie in Übergabe §9, nachgerechnet aus dem Snapshot (`test/repo.test.js`).
- SLV0-FALL-22: Erwartungswert mit Python `hashlib`/`json` (`sort_keys`, Trenner `,`/`:`, `ensure_ascii=False`) unabhängig berechnet.
