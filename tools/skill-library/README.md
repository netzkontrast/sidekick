# Skill-Library-Werkzeuge (V0, Stufe 0–2)

Kommandozeilenwerkzeug für die Pakete unter `.agents/skills/` und den Eval-Harness. Vertrag:
[Spec Skill-Library V0](../../docs/spec/skill-library-v0.md) §3–§9;
Auftrag: [Implementierungsübergabe](../../research/skills-meta-prompting/library-implementation-handover.md) L1–L8 und §7.
JavaScript (ESM) auf Node 22 ohne Dependencies, nur `node:`-Module
([Owner-Antwort](../../docs/fragen/skill-library/questions/Q-20261030-sl-code-sprache.md)).

`validate`, `hash`, `tokens` und `registry-check` prüfen M0 (Format). Sie belegen weder Discovery noch Auswahl noch
Verhalten, schreiben keine Dateien, ändern keinen `status` und greifen nicht aufs Netz zu. Der Eval-Harness (`eval …`,
Abschnitt unten) startet nie einen Client oder ein Modell und schreibt nur in ausdrücklich angegebene Pfade.
Kein Befehl gibt Scores oder Aktivierungsempfehlungen aus.

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
| `lib/eval/common.js` | Eval-Codes (§8) mit Regel-ID, Abbruch (`EvalRefusal`), Schemaprüfung gegen `docs/spec/schemas/eval-*.schema.json` | §8 |
| `lib/eval/snapshot.js` | Einfrieren aus Arbeitsbaum oder Quellform, Prüfen aller Hashes | EVAL-01/-02 |
| `lib/eval/candidate.js` | Kandidatenbindung: Baseline, genau eine Dimension, eindeutige Ersetzung | EVAL-03 |
| `lib/eval/prepare.js` | Versuchsverzeichnisse B0/B1/Kandidat, Konfigurationsschutz, nie überschreiben | EVAL-04 |
| `lib/eval/ledger.js` | append-only Ledger (JSON Lines) mit Sperrdatei, Startlimit, Ergebnisnachtrag | EVAL-05 |
| `lib/eval/split.js` | Split-Manifest, Familienüberlappung, Rollenzugriff, Auswahl, verbrauchter Test-Split | EVAL-06/-07 |
| `lib/eval/normalize.js` | Positivliste für Client-Spuren (JSONL oder skill-pilot-v1) | EVAL-08, INV-05 |
| `lib/eval/raw.js`, `lib/eval/report.js` | Rohdatensatz je Start; Bericht nur aus Rohdaten, R-Verstöße getrennt | EVAL-09…11, INV-06/-09 |
| `lib/eval/rubric.js` | Rubrik je Skill: Struktur, eindeutige IDs, Hashbindung, Bindung von Rohdatensätzen, Versionsmischung | EVAL-13…15 |
| `lib/eval/git.js` | Abgleich des Quellcommits mit `git rev-parse HEAD` und `git status`; einziges Modul mit Prozessstart (nur `git`) | EVAL-18 |
| `lib/eval/cli.js` | Unterbefehle `eval …` | – |
| `test/` | je Fall SLV0-FALL-01…46 mindestens ein Test (Name beginnt mit der Fall-ID) | §9 |

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

## Eval-Harness (Stufe 2, SLV0-EVAL-01…11, 13…18)

Der Harness bereitet Versuche vor, zählt Starts, bewacht Splits, normalisiert Spuren und baut Berichte aus Rohdaten.
Er startet keinen Client und kein Modell, nutzt kein Netz und urteilt nicht über Qualität. Baseline-Läufe (EVAL-12)
sind keine Werkzeugfunktion; sie brauchen Owner-Budget und einen geprüften Client.

```sh
B="node tools/skill-library/cli.js"   # aus dem Repo-Wurzelverzeichnis
$B eval freeze --source-commit "$(git rev-parse HEAD)" > snapshot.json          # Snapshot des Arbeitsbaums
$B eval freeze --source QUELLE.json > snapshot.json                              # Quellform des Research-Helfers
$B eval verify --snapshot snapshot.json                                          # alle Hashes neu berechnen
$B eval bind --snapshot snapshot.json --candidates kandidaten.json [--id K-DESC]
$B eval prepare --snapshot snapshot.json --cases faelle.json --project-config konfig.txt \
                --output NEUES-VERZ [--candidates kandidaten.json]
$B eval split manifest --cases faelle.json --manifest-id M-1 > manifest.json
$B eval split check --manifest manifest.json [--cases faelle.json]
$B eval ledger init --ledger ledger.jsonl --limit 40 [--manifest manifest.json]
$B eval ledger reserve --ledger ledger.jsonl --trial-id F-01--B1                 # VOR dem Start
$B eval ledger result --ledger ledger.jsonl --attempt-id 1 --outcome completed|failed_start|aborted|client_error \
                      [--trace-sha256 H] [--raw-id RUN-1]
$B eval ledger status --ledger ledger.jsonl
$B eval split access --ledger ledger.jsonl --manifest manifest.json --role author --split dev
$B eval split select --ledger ledger.jsonl --manifest manifest.json --role evaluator --candidate-sha256 H
$B eval split access --ledger ledger.jsonl --manifest manifest.json --role evaluator --split test --candidate-sha256 H
$B eval normalize --trace spur.jsonl > spur.sl.json                              # oder *.normalized.json (skill-pilot-v1)
$B eval raw --meta meta.json --normalized spur.sl.json > raw/RUN-1.json
$B eval report raw/ > bericht.json
$B eval report --check bericht.json raw/
```

Rubriken und Querprüfungen (SLV0-EVAL-13…18):

```sh
$B eval rubric check                                       # alle Rubriken unter docs/research/rubriken/ gegen den Arbeitsbaum
$B eval rubric check docs/research/rubriken/grilling.json --snapshot snapshot.json   # gegen einen geprüften Snapshot
$B eval raw --meta meta.json --normalized spur.sl.json --rubric docs/research/rubriken/grilling.json \
            --ledger ledger.jsonl > raw/RUN-1.json     # Rubrikversion übernehmen, Versuch gegen das Ledger abgleichen
$B eval report raw/ --rubric-version grilling@1 > bericht.json                    # Rubrikversion festhalten
$B eval prepare … --manifest manifest.json                # nur Fälle aus dem Split-Manifest mit gleichem Fall-Hash
$B eval freeze --source-commit "$(git rev-parse HEAD)" --verify-git > snapshot.json  # HEAD und sauberes .agents/skills/
```

**Ausgabe und Exit-Codes.** `freeze`, `split manifest`, `normalize`, `raw` und `report` geben bei Erfolg das Artefakt selbst
als JSON auf stdout aus (Umleitung in eine Datei durch den Aufrufer); alle anderen Befehle geben einen JSON-Umschlag
`{tool, tool_version, command, …}` aus. Exit 0 ok; Exit 1 Abbruch mit Code aus §8 (`refused: true`, `messages`) oder
fehlgeschlagene Prüfung (`bind`, `split check`, `report --check`); Exit 2 Bedienfehler, Eingabe verletzt ihr Schema
oder interne Ausnahme. Kein Teilergebnis gilt als Erfolg.

**Schreiben.** Nur `prepare` (neues Zielverzeichnis, Dateien mit exklusivem Anlegen), `ledger init` (neue Datei)
sowie `ledger reserve|result` und `split access|select` (Anhängen an das angegebene Ledger) schreiben. Nichts wird überschrieben.
Alle übrigen Befehle lesen nur.

**Schemas** (JSON Schema 2020-12, geprüft mit `lib/schema.js`):
[Snapshot](../../docs/spec/schemas/eval-snapshot.schema.json),
[Ledger-Eintrag](../../docs/spec/schemas/eval-ledger.schema.json),
[Split-Manifest](../../docs/spec/schemas/eval-split-manifest.schema.json),
[normalisierte Spur](../../docs/spec/schemas/eval-normalized-trace.schema.json),
[Rohdatensatz](../../docs/spec/schemas/eval-raw-record.schema.json),
[Bericht](../../docs/spec/schemas/eval-report.schema.json),
[Rubrik](../../docs/spec/schemas/eval-rubric.schema.json).
Der Schemaprüfer kennt dafür zusätzlich `maximum`, `minItems` und `propertyNames`.

### Verhältnis zum Research-Helfer

[`skill_pilot.py`](../../research/skills-meta-prompting/skill_pilot.py) bleibt unverändert als Referenz stehen. Gleichheitstests
rufen ihn nur lesend auf (`python3 -I -B`; ohne Python übersprungen):

- `freeze` erzeugt dasselbe Objekt wie `skill_pilot.freeze`; aus den Dateien von `skill-pilot-baseline-v2.json` entsteht
  genau diese Datei wieder (Paketsatz-Hash `4ad5b6db…2473967`).
- `bind` liefert dieselben Dateien wie `variant_files` und denselben Kandidatenhash wie `digest(canonical(...))`.
- `normalize` stimmt auf den Positivlistenfeldern mit `normalize_trace` überein (synthetische Spuren). Alle gespeicherten
  `*.normalized.json` unter `eval-runs/` lassen sich importieren und reproduzieren ihre Positivlistenfelder.

Bewusste Abweichungen vom Helfer: relative statt absolute Adapter-Symlinks (SLV0-VAL-15); `trials.json` nennt Arbeitsverzeichnisse
relativ; Projektkonfiguration kommt aus einer Datei statt aus einem festen Text; das Ledger ist JSON Lines statt einer
umgeschriebenen JSON-Datei; die Normalisierung übernimmt von Plugins nur `name`/`source` und von Usage nur die vier Tokenfelder.

### Auslegungen, wo die Spec nichts festlegt

- **Freeze** friert den Arbeitsbaum ein, nicht einen Git-Commit. Ohne `--verify-git` wird der Quellcommit nur angegeben;
  mit `--verify-git` muss er gleich dem vollständigen `git rev-parse HEAD` sein (ein abgekürzter Hash gilt als
  `source_commit_mismatch`), und `git status` darf unter `.agents/skills/` nichts melden, auch keine ungetrackten oder
  ignorierten Dateien (`worktree_dirty`). Fehlt Git oder das Repository, ist das Exit 2.
  Ungültige Pakete werden nicht eingefroren (Validatorfehler, Exit 1), weil sie keinen Hash erhalten (PKG-20).
- **Kandidaten:** Dimensionen wie im Helfer `description` und `project-binding`. Ein Beschreibungskandidat hat genau eine
  Ersetzung, die genau die ganze `description:`-Zeile im Frontmatter ersetzt; alles andere ist `candidate_multi_dimension`.
  Ein `project-binding`-Kandidat darf das Frontmatter nicht berühren (sonst ebenfalls zweite Dimension). Unbekannte Datei
  und fehlender oder mehrfacher Fundort sind `replacement_not_unique`. Unbekannte Dimension oder kaputter Datensatz: Exit 2.
- **Vorbereiten:** Konfigurationsschutz vergleicht das erste Pfadsegment ohne Groß-/Kleinschreibung. Alles wird vor dem
  ersten Schreiben geprüft; ein Abbruch hinterlässt kein Zielverzeichnis.
- **Ledger:** Das Limit steht im Kopf (`ledger init`, 1…40, Owner-Budget). Ein Ergebnis je Versuch; ein zweites ist Exit 2.
  Ein beschädigtes Ledger wird nicht repariert (Exit 2). Die Sperre `<ledger>.lock` wird bei `ledger_locked` nie entfernt.
- **Splits:** `author` liest `dev` und `regression`, `evaluator` liest `select` und `regression`; `test` nur `evaluator`
  nach `split select` mit demselben Kandidatenhash. Derselbe Kandidat darf `test` erneut lesen (Wiederholungen); ein
  anderer erhält `split_consumed`. Verweigerte Zugriffe werden im Ledger protokolliert. Split-Befehle verlangen ein bei
  `ledger init --manifest` gebundenes Manifest. Splits außerhalb von dev/select/test/regression (z. B. `diagnostic` in
  `skill-pilot-cases.json`) lehnt `split manifest` ab.
- **Normalisierung:** Eingabe ist eine rohe stream-json-Spur oder eine skill-pilot-v1-Datei (Import; `trace_sha256` bleibt
  der Hash der Rohspur). Eine leere Spur ist gültig, aber `incomplete_or_error`; ungültiges JSON, Nicht-Objekte oder
  ungültiges UTF-8 sind `trace_invalid`. `confirmed` ist `true` nur bei Antwort ohne Fehler, `false` bei Fehlerantwort,
  `null` ohne Antwort. Zeilentrenner sind LF, CRLF und CR (Python trennt zusätzlich an weiteren Unicode-Trennern).
- **Rohdatensatz:** Modell, Status, Katalog, Skill-Aufrufe, Usage und Spur-Hash kommen nur aus der normalisierten Spur;
  setzt die Metadatei eines dieser Felder, ist das Exit 2. `beobachtbar` ist `false`, wenn die Spur keine Aufrufereignisse
  zeigt. Assertions tragen `ergebnis` `bestanden|nicht_bestanden|unklar` und optional `r_regel`.
- **Bericht:** Nenner einer Zahl ist die Population (Läufe bzw. Assertions); `rohdatensatz_ids` nennt diese Population.
  R-Assertions zählen nie in den Ebenen-Assertions, sondern nur in `r_pruefungen`/`r_verstoesse`. `skill_aufrufe` zählt Läufe
  mit bestätigtem Aufruf, ohne zu sagen, ob der Aufruf richtig war. Feldsprache: Rohdatensatz und Bericht deutsch nach SL1 §8,
  Snapshot, Ledger, Manifest und normalisierte Spur englisch wie der Research-Helfer (O-8 bleibt offen).
- **Rubriken** (`docs/research/rubriken/<skill>.json`, je Skill `<skill>@1`): Kriterien aus dem `SKILL.md`-Rumpf abgeleitet;
  passende Kriterien aus `e1v-e2-plan.json` (D/R-Prüfungen) und `kern_kriterium` der E3-Familien sind übernommen und in
  `herkunft` genannt. Kriterien-IDs `<KÜRZEL>-Knn` (GR, RR, PW, DG, RW, SB, TB, EC) sind über alle Rubriken eindeutig, damit
  Assertion-IDs im Rohdatensatz eindeutig auf ein Kriterium zeigen. `faelle` verweist auf vorhandene Fall-IDs und wird nicht
  geprüft. Ein Paket ohne Rubrik ist kein Fehler; zwei Rubriken für einen Skill sind `rubric_invalid`. Der Dateiname muss
  `<skill>.json` lauten. Die Rubriken sind Entwurf bis zur Owner-Review (Spec O-10).
- **`rubric check`** ohne Dateiargument liest `docs/research/rubriken/` unter `--root`. Hashquelle ist der Arbeitsbaum
  (gültige Pakete, Adapter werden nicht geprüft) oder mit `--snapshot` der geprüfte Snapshot. Ungültiges JSON ist Exit 2;
  Schema- und Verweisfehler sind Meldungen (`rubric_invalid`, Exit 1), damit alle Rubriken in einem Lauf geprüft werden.
  Dateipfade erscheinen repo-relativ oder, außerhalb der Wurzel, nur mit Dateinamen.
- **`raw --rubric`:** Fehlt `rubrik_version` in den Metadaten oder ist sie `null`, kommt sie aus der Rubrik. Deterministische
  Assertions, die kein Kriterium sind (z. B. Harness-Prüfungen), bleiben erlaubt; Assertions der Art `rubrik` und R-Assertions
  müssen Kriterien sein. Die Hashbindung gilt nur für `B1`, weil Kandidaten den Skill absichtlich ändern und gegen die
  Baseline-Rubrik bewertet werden.
- **Rubrikversionen im Bericht:** Gruppiert wird nach dem Teil vor `@`; alle Versionen ohne die Form `<skill>@<n>`
  (z. B. `rubrik-e1v-e2-v1`) bilden eine gemeinsame Gruppe. Rohdatensätze ohne `rubrik_version` erscheinen nicht in
  `rubrik_versionen` und verletzen nichts. `--rubric-version` darf je Rubrik nur einmal stehen (sonst Exit 2); eine verlangte
  Version, die in den Rohdaten nicht vorkommt, ist kein Fehler. `report --check` meldet gemischte Versionen ebenfalls.
- **`raw --ledger`:** Das Ledger wird ohne Sperre nur gelesen. Die `trial_id` der Reservierung muss `<case_id>--<variante>`
  lauten, wie `prepare` sie bildet. Ohne Ergebniseintrag genügt die Reservierung; `outcome` wird nicht gegen `status` geprüft.
- **`prepare --manifest`:** Das Manifest wird wie bei `split check` geprüft (Schema, `family_split_overlap`). Alle Fälle werden
  vor dem Abbruch gesammelt. `trials.json` nennt `split_manifest_sha256`, und der `split` jedes Versuchs kommt aus dem Manifest.
- **Git:** `git --no-optional-locks -c core.fsmonitor=false -C <root> rev-parse|status`; die Ausgabe nennt höchstens fünf
  unsaubere Pfade. Der Importtest erlaubt `node:child_process` nur in `lib/eval/git.js` und dort nur `execFileSync('git', …)`.

## Nicht umgesetzt

- Keine Bewertung: Weder Harness noch Rubrik urteilen; Bewerter-Session, Modellfixierung und menschliche Stichprobe (SL1 §7)
  bleiben außerhalb des Werkzeugs (Spec O-10).
- Keine Versionshistorie von Rubriken: Ob eine Kriterienänderung eine neue `rubrik_version` bekam, prüft das Werkzeug nicht
  (es sieht nur den aktuellen Stand); das sichert die Review der Rubrik-PR.
- `faelle` in Rubriken und `allowed_skills`/`expected_skill` der Falldateien werden nicht gegeneinander abgeglichen.
- Ein Rohdatensatz kennt seine `trial_id` nicht als eigenes Feld; der Ledger-Abgleich nutzt die Namensregel von `prepare`.
  Mehrere Rohdatensätze zum selben `attempt_id` werden nicht erkannt; der Bericht lehnt nur doppelte `run_id` ab.
- `freeze --verify-git` prüft nur den Arbeitsbaum gegen HEAD; ein Einfrieren direkt aus einem Commit (`git show`) gibt es nicht.
- Baseline-Läufe (EVAL-12) bleiben keine Werkzeugfunktion.

## Fragen-CLI (`questions`, Paket P9)

Vertrag: [Spec Fragen-CLI V0](../../docs/spec/questions-cli-v0.md) (IDs `QCLI-…`). Die CLI schreibt die Interview-Ablage
von [grilling](../../.agents/skills/grilling/SKILL.md) (`docs/fragen/`) aus JSON-Nutzdaten, prüft dabei die Zustandsregeln
des Workflows und erzeugt genau das Markdown aus `records.md`. grilling arbeitet ohne CLI unverändert weiter; der Skilltext
nutzt sie (noch) nicht. Kein Netz, kein Modell, kein Prozessstart; geschrieben wird nur unter `--root`.

```sh
Q="node tools/skill-library/cli.js questions"   # aus dem Repo-Wurzelverzeichnis
$Q check  --root docs/fragen [--topic skill-library]      # Invarianten prüfen, nur lesend (Exit 1 bei Fehlern)
$Q status --root docs/fragen --topic skill-library        # Session, Zählung, je Frage Status und wirksame Antwort
$Q next   --root docs/fragen --topic skill-library        # fragbar / prüfpflichtig / blockiert / wartend / vertagt
$Q init   --root docs/fragen --topic thema --json '{"title":"Thema","goal":"…","editor":"…"}'
$Q add    --root docs/fragen --topic thema --json '{"id":"Q-20261031-x","title":"…?","kind":"decision",
            "priority":"blocking","context":"…","occasion":"…","impact":"…","options":"a) … b) …","recommendation":"a, weil …"}'
$Q ask    --root docs/fragen --topic thema --json '{"round_id":"R-20261031-chat1","channel":"chat",
            "delivery":"bestaetigt","questions":[{"id":"Q-20261031-x","version":1}]}'
$Q answer --root docs/fragen --topic thema --json '{"question_id":"Q-20261031-x","version":1,
            "round_id":"R-20261031-chat1","text":"…","source":{"by":"Owner","channel":"Chat"}}'
$Q correct|defer|supersede|revise|review --root … --topic … --json '…'   # Nutzdaten: Spec §4
$Q pause|resume|render --root docs/fragen --topic thema
$Q status --root docs/fragen --topic thema --set awaiting_confirmation --summary "…"
```

Gemeinsame Optionen: `--now ISO-8601` (Datum für `Erstellt`, Verlauf und erzeugte Antwort-IDs; Standard: jetzt, UTC).
Nutzdaten per `--json`, `--file` oder stdin (nur Pipe oder Datei, z. B. Heredoc). Ausgabe JSON; Exit 0 ok, 1 Verweigerung mit
Code (`refused: true`, `messages`), 2 Bedienfehler. Eine Verweigerung schreibt nichts.

**Rechte.** `.claude/settings.json` erlaubt im Projekt genau eine Regel: `Bash(node tools/skill-library/cli.js questions:*)`
(Owner-Freigabe A-20261031-p9-questions-cli; `:*` ist laut Claude-Code-Doku gleichbedeutend mit ` *` am Ende). Messläufe setzen
dieselbe Regel zusätzlich zu ihrem bisherigen Werkzeugprofil und keine allgemeine Bash-Freigabe:

```sh
claude -p "<Auftrag>" --allowedTools "Bash(node tools/skill-library/cli.js questions:*)" …   # … = übriges Laufprofil
```

Zusammengesetzte Befehle (`|`, `&&`, `;`) brauchen für jeden Teil eine eigene Erlaubnis; Nutzdaten deshalb als `--json '…'` im
selben Befehl übergeben (ein Apostroph im Text als `'\''`). `--file` setzt voraus, dass der Lauf die Datei schreiben darf.

**Aufbau.** `lib/questions/ids.js` (IDs, Themen, Datum), `secrets.js` (Heuristik), `record.js` (Fragedatei lesen und
zeilengenau ändern), `topic-index.js`, `round.js`, `store.js` (sichere Pfade, Laden, atomares Schreiben mit Rücknahme),
`model.js` (wirksame Antwort, Konflikte, Abhängigkeiten, `next`), `payload.js` (strenge Nutzdaten, Urheberprüfung),
`commands.js`, `check.js`, `cli.js`. Tests: `test/questions-*.test.js` (QCLI-FALL-01…44); die acht Dev-Fixtures der
grilling-Runde liegen unverändert in `test/fixtures/questions-grilling-dev.json` (Quelle `research/e3-runde-2` @ `83cbb7f8`).

### Auslegungen

- **Zusätzliche Befehle** `revise` (neue Frageversion) und `review` (Prüfbedarf mit Notiz aufheben): Ohne sie gäbe es keinen
  Weg zu Version 2 und keinen Ausweg aus `needs_review` außer Handarbeit. `status --set` setzt die übrigen Sessionzustände.
- **Prüfbedarf:** Konfliktantwort, `correct` (für alle transitiven Folgefragen, auch offene), `supersede` (ebenso) und `revise`
  einer Frage mit Antworten setzen `needs_review: true`. Aufgehoben wird er durch die erste Antwort auf die aktuelle Version,
  durch `correct` an der korrigierten Frage und durch `review`. Ein offener Konflikt lässt sich nur per `correct` auflösen.
  Offene oder vertagte prüfpflichtige Fragen sind nicht fragbar (`ask` verweigert, `next` listet sie unter `needs_review`).
- **Runden:** `channel: tool` schreibt `rounds/<R-ID>.md`, `channel: chat` eine Zeile `Chat-Runden:` im Index. `answer`
  verlangt eine bekannte Runde, die die Frage in genau dieser Version nennt (Rundendatei oder Chat-Zeile, auch von Hand
  geschrieben), und trägt den Antwortverweis dort nach. Eine Antwort auf eine Runde mit Zustellung `unbekannt` ist erlaubt
  (die Antwort belegt die Zustellung). `correct` braucht keine Runde (`Bezug: Version N, Korrektur ohne Runde`).
- **Urheber:** `source.by` darf kein Wort aus einer festen Liste enthalten (Agent, Claude, Modell, KI, Empfehlung, Default,
  Standard, Frist, Timeout, automatisch u. a., ganzes Wort). Antworttext gleich Empfehlungsfeld (ohne Anführungszeichen,
  Groß-/Kleinschreibung, Satzzeichen am Ende) wird abgelehnt. Beides sind Heuristiken: Die CLI kann eine Absicht nicht prüfen.
- **Secrets:** geprüft werden alle Strings jeder schreibenden Nutzlast, `check` prüft alle Dateien. Commit-SHAs in Permalinks
  zählen nicht; ein freistehender 40-stelliger Hexwert (auch ein vollständiger Commit-SHA) wird abgelehnt – Kurz-SHA verwenden.
- **Antwort-IDs:** ohne `answer_id` `A-<Datum aus --now>-<Suffix der Frage>`, bei Belegung `-2`, `-3` …; eindeutig je Thema.
- **Index:** `add` und `render` hängen fehlende Zeilen nach der letzten Tabellenzeile an (Kurzfrage `short` bzw. Titel);
  vorhandene Zeilen bleiben byte-gleich, auch wenn die Tabelle durch Leerzeilen geteilt ist. Nichts wird umsortiert.
- **Einzeilige Felder:** Zeilenumbrüche und Steuerzeichen in Nutzdaten werden abgelehnt (`field_invalid`); von Hand geschriebene
  Folgezeilen (z. B. Optionen als Liste) werden gelesen und bleiben erhalten.
- **Gleichzeitigkeit:** keine Sperrdatei; vor jedem Umbenennen wird der Inhalt mit dem gelesenen Stand verglichen
  (`concurrent_modification`), neue Dateien entstehen per Hardlink ohne Überschreiben.
- **`check`** liest alle Themenordner unter `--root`, die `index.md` oder `questions/` haben; andere Ordner werden übersprungen.

### Nicht umgesetzt

- Keine Änderung am grilling-Skilltext und keine Messläufe; ob grilling mit der CLI günstiger arbeitet, ist offen (Spec QO-1).
- Kein Löschen von Fragen, Antworten oder Runden, kein Zurücknehmen von `superseded`, keine Abhängigkeiten über Themen hinweg.
- Eine Runde mit Zustellung `unbekannt` lässt sich nicht nachträglich als bestätigt markieren (neue Runde oder Antwort genügt).
- Mehrzeilige Antworttexte werden nicht als Folgezeilen geschrieben, sondern abgelehnt.
- `revise` kann keine Kopffelder ergänzen, die in einer von Hand geschriebenen Datei fehlen.
