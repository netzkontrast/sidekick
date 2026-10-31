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
| `lib/eval/git.js` | Abgleich des Quellcommits mit `git rev-parse HEAD` und `git status`; Commit auflösen, Baum und Blobs lesen (`rev-parse`, `ls-tree`, `cat-file`); einziges Modul mit Prozessstart (nur `git`, nur lesend) | EVAL-18, -28 |
| `lib/eval/textmatch.js` | Normalisierung `sl-judge-norm@1`, Fragmente, Wiederfund in Reihenfolge, Wortgrenzen | EVAL-20, -26 |
| `lib/eval/judge.js` | Belegprüfung einer Bewertung (neues und älteres Format) | EVAL-19…21 |
| `lib/eval/tree.js`, `lib/eval/casedir.js` | Dateibäume ohne Symlink-Folgen, Baumvergleich; Fallordner `fall.json` + `fixture/` | EVAL-22 |
| `lib/eval/checks.js` | Prüfformat, `eval check`, Nulllauf, B1-Vorlauf | EVAL-22…25 |
| `lib/eval/findings.js` | Einheiten, 1:1-Zuordnung erwarteter Befunde, Überberichtung | EVAL-26/-27 |
| `lib/eval/citecheck.js` | Segmentregister am Commit, Zitate (Permalinks, Fundstellen, Commit-Wörter) gegen Git, Abdeckung | EVAL-28…30 |
| `lib/eval/contextpack.js` | Kontextpaket: Mustersyntax, Auswahl ohne Symlink-Folgen, Sperren, Datensatz mit Hashes, Markdown-Bündel | EVAL-31…34 |
| `lib/eval/costbalance.js` | Kostenbilanz: Usage je Turn, Bytes und Bytes × Folgeturns je Ereignisklasse; Berichtsblock mit Differenzen und Kosten je erfülltem Kriterium | EVAL-35…38 |
| `lib/eval/contract.js` | Ausgabevertrag `researching-repositories@2` (und `@1`): Pflichtblöcke fail-closed, Evidenzstufe und Quellenrolle, Fundstellen mit Stand gegen Git (`citecheck.js`) oder Fixture (`findings.js`), Fallabgleich eingepflanzter Anweisungen | EVAL-39…42 |
| `lib/eval/cli.js` | Unterbefehle `eval …` | – |
| `test/` | je Fall SLV0-FALL-01…46 und -48…85 mindestens ein Test (Name beginnt mit der Fall-ID); `test/fixtures/` hält Kopien von Research-Daten mit Hashes für die Gleichheitstests | §9, §9.1 |

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

## Eval-Harness (Stufe 2, SLV0-EVAL-01…11, 13…42)

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

Belege, Trennschärfe und erwartete Befunde (SLV0-EVAL-19…27, alle nur lesend):

```sh
$B eval judge check bewertung.json --outputs blind/ [--fixtures familien/]   # Zitate wiederfinden, „erfuellt“ ohne Beleg → unklar
$B eval check --case FALLORDNER --workspace ARBEITSVERZ [--baseline AUSGANGSSTAND]  # Prüfungen → Assertions für den Rohdatensatz
$B eval nullrun --cases FALLORDNER|VERZ-MIT-FALLORDNERN                       # trennend/erhaltend gegen die unveränderte Fixture
$B eval nullrun --b1-kern kernurteile.json                                    # B1-Vorlauf: trennend (Exit 0) oder nicht (Exit 1)
$B eval findings --case FALLORDNER ausgabe.md…                                # getroffen, verfehlt, kritisch verfehlt, Überberichtung
```

Formate: [Bewertung](../../docs/spec/schemas/eval-judgement.schema.json), [Fall `fall.json`](../../docs/spec/schemas/eval-case.schema.json),
[Kernurteile B1-Vorlauf](../../docs/spec/schemas/eval-b1-vorlauf.schema.json); Spec §7.2–§7.4.

Belegabdeckung eines Research-Berichts am Commit (SLV0-EVAL-28…30, Paket P5, nur lesend; Spec §7.5):

```sh
$B eval cite-check --repo ../fremd-repo --commit 1780d46a73e485cbad4d0a48c019475d8be9193e \
                   research/…/repos/fremd-repo.md [--scope plugins/] [--scope '**/*.md'] [--github owner/repo]
```

Das Register sind alle regulären Dateien am Commit (eingeschränkt durch `--scope`). Jeder GitHub-Permalink
(`…/blob/<sha>/<pfad>#La-Lb`), jede Fundstelle `pfad:zeile[-zeile]` bzw. `pfad#Lx[-Ly]` und jedes Commit-Wort im Bericht wird gegen Git
geprüft. Ausgabe: `abdeckung` („X von Y Dateien belegt; nicht belegt: …“), `belegt` mit zusammengeführten Zeilenbereichen, `nicht_belegt`,
`zitate` mit Berichtszeile und Ergebnis (`gueltig`, `ungueltig`, `ausserhalb_bereich`, `fremd`), `commit_woerter`, `zaehlung`.
Exit 1 bei einem ungültigen Zitat (`commit_unknown`, `sha_mismatch`, `ref_not_pinned`, `path_missing`, `path_ambiguous`, `range_out_of_bounds`)
oder unbekanntem `--commit`; nicht belegte Dateien und die Warnung `commit_unverified` ändern den Exit-Code nicht. Exit 2 bei Bedienfehlern
(kein Git-Repository, `--commit` nicht hexadezimal, Bereich unsicher oder ohne Treffer).

Ausgabevertrag eines Research-Berichts (SLV0-EVAL-39…42, Paket P6, nur lesend; Spec §7.8):

```sh
$B eval contract check --contract researching-repositories@2 bericht.md \
                       [--repo ../fremd-repo --commit 1780d46a] [--case FALLORDNER]
```

Pflicht sind genau `## Befunde` (eine Tabelle `| Aussage | Quellenrolle | Fundstelle@SHA | Evidenzstufe |`) und `## Eingebettete Anweisungen`
(`keine` oder eine Liste mit Fundstelle je Eintrag). Fundstellen: Permalink mit Commit und `#L…` oder `pfad:zeile[-bis]@<commit>` bzw.
`@arbeitsbaum`. Mit `--repo`/`--commit` prüft der Befehl jede Fundstelle wie `cite-check`, sonst mit `--case` gegen die Fixture wie `findings`,
sonst nur die Form (`zitatpruefung: nicht_geprueft`). Mit `--case` müssen alle erwarteten Befunde mit `art: eingebettete_anweisung` im Anweisungsblock
stehen. Ausgabe: `bloecke`, `befunde`, `anweisungen`, `zitate`, `fallabgleich`, `kriterien` (RR-K03, RR-K04, RR-K10), `zaehlung`, `messages`.
Exit 1 bei jeder Vertragsverletzung, Exit 2 bei Bedienfehlern (unbekannter Vertrag, `--repo` ohne `--commit`, nicht genau ein Bericht).

Kontextpaket für eine Clean-Room-Session (SLV0-EVAL-31…34, Paket P11; Spec §7.6):

```sh
$B eval context-pack --allowlist allowlist.json [--root VERZ] [--deny MUSTER]... \
                     [--estimator utf8-bytes-div-4@1] [--output NEUE-DATEI.md] > paket.json
```

Die [Allowlist](../../docs/spec/schemas/eval-context-allowlist.schema.json) ist die Inputliste einer Übergabe als Datei (Vorbild:
Implementierungsübergabe §3 „Inputs für die implementierende Session“):

```json
{
  "schema_version": 1, "format": "sl-context-allowlist@1",
  "ziel": "SL7 PR 1: Implementierung", "rolle": "implementierung",
  "eingaben": [
    { "muster": "docs/spec/skill-library-v0.md", "wofuer": "§3–§6, §8, §9" },
    { "muster": "docs/spec/schemas/*.schema.json" }
  ],
  "sperre": ["research/fremd"]
}
```

Erst entsteht der [Datensatz](../../docs/spec/schemas/eval-context-pack.schema.json) (Dateien nach Codepoint, je SHA-256, Bytes, Zeilen,
Tokenschätzung, Musterindizes; `kontextpaket_sha256` nach der Paket-Hash-Formel), dann auf Wunsch das Markdown-Bündel daraus. Fail-closed,
alle Meldungen gesammelt, Exit 1 ohne Datensatz und ohne Bündel: `pattern_invalid`, `path_escapes_root`, `pattern_unmatched`, `file_missing`,
`not_regular_file`, `symlink_in_pack`, `path_forbidden` (Standardsperren `**/.git`, `**/.env*`, `**/kandidaten`, ergänzt durch `sperre` und
`--deny`, nie verkleinert), `nested_repository`, `file_not_text`, `output_exists`. Exit 2 bei fehlender oder schemawidriger Allowlist,
ungültigem `--root`, unbekanntem Schätzer oder fehlendem Zielordner.

Kostenbilanz je Kontextklasse und Turn (SLV0-EVAL-35…38, Paket P4; Spec §7.7):

```sh
$B eval normalize --trace spur.jsonl > spur.sl.json            # + cost_balance: Usage je Turn, Bytes je Ereignisklasse
$B eval raw --meta meta.json --normalized spur.sl.json > raw/RUN-1.json   # übernimmt sie als kostenbilanz
$B eval report raw/ [--estimator utf8-bytes-div-4@1] > bericht.json        # je Ebene: kostenbilanz.je_variante, .differenzen
```

Der Bericht nennt je Variante Turns, Turn-Usage (gemeldet), Rest (Lauf-Usage minus Turn-Summe), Bytes und Bytes × Folgeturns je Klasse
(`skill_laden`, `datei_lesen`, `tool_ergebnis:<Tool>`, `assistant_text`, `assistant_denken`, `assistant_werkzeugaufruf`, `nutzer_text`,
`unteragent`, `nicht_zuordenbar`) sowie Kosten je erfülltem Kriterium; dazu Differenzen `B1 − B0` und `K-… − B1` über die gemeinsamen Fälle,
jeweils mit beiden Werten und Rohdatensatz-IDs. Tokens je Klasse gibt es nur geschätzt (mit `--estimator`), nie gemeldet.

**Methode: den M4-Faktor erklären.** Der M4-Pilot ([Ergebnis](../../research/skills-meta-prompting/eval-runs/E1V-E2-M4-ergebnis-2026-10-30.md))
nennt 0,84 gegen 0,36 USD Client-Schätzung (×2,3). Mit den neuen Feldern lässt sich ein solcher Faktor zerlegen, sobald rohe Spuren vorliegen:

1. `differenzen[B1−B0].kosten_usd` gibt den Kostenunterschied mit beiden Summen (Faktor = `minuend_wert / subtrahend_wert`, vom Leser gebildet).
2. `usage_turns` je Feld zeigt, welche Tokenart wächst. Wächst `cache_read_input_tokens` stark und `output_tokens` kaum, ist der Mehraufwand
   wiederholt gelesener Kontext, nicht Ausgabe. `output_tokens` dabei aus der Lauf-Usage (`usage`) lesen: je Turn meldet der Client sie nicht final (s. u.).
3. `turns` trennt die zwei Faktoren dieses Kontextanteils: Cache-Lesen B1/B0 = (Turns B1/B0) × (Cache-Lesen je Turn B1/B0).
4. `klassen[].bytes_mal_folgeturns` zeigt, welche Ereignisklasse den Kontext je Turn vergrößert (z. B. `skill_laden`: Rumpfgröße × Turns danach;
   „Dauergeladenes kostet Größe × Nachrichten“). Die Summe über die Klassen ist gleich `bytes_mal_folgeturns_gesamt`; die Differenzen je Klasse
   addieren sich zur Gesamtdifferenz. Systemprompt und Katalog haben keine Bytegröße in der Spur; ihr Anteil zeigt sich nur im Sockel der
   Eingabe-Usage je Turn (`turns[].usage`).
5. `kosten_je_erfuelltem_kriterium` stellt den Aufwand neben die bestandenen Assertions derselben Läufe.

Beispielrechnung zur Methode mit den Lauf-Summen aus [`eval-runs/m4/spur-auswertung.json`](../../research/skills-meta-prompting/eval-runs/m4/spur-auswertung.json)
(je Variante sechs Läufe, wie im Portierungsplan): Turns 24 → 34 (×1,42), Cache-Lesen 84 204 → 196 723 (×2,34), Cache-Erzeugung ×3,38, Output ×1,30.
Nach Schritt 3 wüchse das Cache-Lesen je Turn um etwa ×1,65; mehr Turns erklären also nur einen Teil. Welche Klasse den größeren Kontext je Turn
trägt (Schritt 4), ist damit **nicht** belegt: Die gespeicherten M4-Spuren haben das alte Format (`skill-pilot-v1`, ohne Turns und Inhaltsgrößen);
dort bleiben Turns, Klassen und Turn-Usage `unbekannt`, nur die Kostendifferenz ist bekannt (SLV0-FALL-77). Die Zerlegung braucht neue rohe Spuren.

**Praktisch geprüft an 24 Spuren (31.10.2026, Claude Code 2.1.316).** 20 synthetische grilling-Läufe der E3-Runde 3 und 4 Kanarienläufe
als rohes stream-json, außerhalb des Repos gelesen, nicht eingecheckt; hier nur Summen (Werkzeugprüfung, keine Aussage über Kandidaten):

- Alle 24 normalisiert, schemagültig, Klassensummen = Gesamt; 109 Turns (1–7 je Spur); eine Antwort kam in bis zu 7 Ereignissen mit gleicher `message.id`.
- **Rest:** `input_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens` in allen 24 Spuren 0, die Turn-Summe ist dort also gleich der
  Lauf-Usage. `output_tokens` nie 0: Turn-Summe 9 535 gegen 115 250 im `result` (Rest 26 bis 7 672 je Spur). Die `assistant`-Ereignisse melden die
  Ausgabe-Tokens nicht final; Output nur aus der Lauf-Usage lesen.
- **Skill-Rümpfe:** Das `Skill`-Ergebnis ist nur eine Zeile (25 Bytes); der Rumpf (3 605–4 313 Bytes) folgt als eigene Nutzernachricht mit
  `isSynthetic: true` (20 von 20). Er wird seither als `skill_laden` gezählt (vorher `nutzer_text`); andere Nutzertexte gab es in diesen Spuren nicht.
- **Bytes × Folgeturns** (gesamt 1 161 706): `datei_lesen` 50,7 %, `skill_laden` 27,8 %, `assistant_werkzeugaufruf` 14,7 %, `tool_ergebnis:Glob` 5,0 %,
  Rest unter 2 %. `datei_lesen` ist in 21 von 24 Spuren die größte Klasse; Antworttext trägt fast nichts nach (0 %), weil er meist im letzten Turn steht.
- Die Eingabe des ersten Turns (Systemprompt, Katalog, Auftrag) liegt bei 11 159–11 750 Tokens; dieser Sockel steht in keiner Bytegröße.

**Abgleich mit gespeicherten Spuren (Werkzeugprüfung, keine Aussage über Kandidaten).** Die 20 normalisierten Spuren unter
`research/skills-meta-prompting/e3/runde-3/laeufe/spuren/` (Branch `research/e3-runde-2`, Commit `3c7873b6`) haben das bisherige Format ohne
`cost_balance`. Ad hoc (nicht als Test eingecheckt) gegen die erweiterten Schemas geprüft: alle 20 gültig; daraus gebaute Rohdatensätze tragen
`kostenbilanz: null`; der Bericht ist schemagültig, `report --check` ohne Meldung, Turns und Bytes `null` mit Grund, Kostendifferenzen
`K-AUFTEILUNG − B1` (sechs Fälle) und `K-LADESTUFEN − B1` (zwei Fälle) mit beiden Summen. Rohe stream-json-Spuren liegen im Repo nicht vor;
die Tests nutzen nur synthetische.

**Ausgabe und Exit-Codes.** `freeze`, `split manifest`, `normalize`, `raw`, `report` und `context-pack` geben bei Erfolg das Artefakt selbst
als JSON auf stdout aus (Umleitung in eine Datei durch den Aufrufer); alle anderen Befehle geben einen JSON-Umschlag
`{tool, tool_version, command, …}` aus. Exit 0 ok; Exit 1 Abbruch mit Code aus §8 (`refused: true`, `messages`) oder
fehlgeschlagene Prüfung (`bind`, `split check`, `report --check`); Exit 2 Bedienfehler, Eingabe verletzt ihr Schema
oder interne Ausnahme. Kein Teilergebnis gilt als Erfolg.

**Schreiben.** Nur `prepare` (neues Zielverzeichnis, Dateien mit exklusivem Anlegen), `ledger init` (neue Datei),
`context-pack --output` (neue Datei, exklusiv angelegt) sowie `ledger reserve|result` und `split access|select` (Anhängen an das angegebene Ledger) schreiben. Nichts wird überschrieben.
Alle übrigen Befehle lesen nur.

`judge check` endet mit Exit 1, sobald ein Beleg nicht wiedergefunden wird oder ein `erfuellt` keinen gültigen Beleg hat; `nullrun --b1-kern`
mit Exit 1 bei `nicht_trennend` oder `unklar` (kein Kandidatenstart in select). `check`, `nullrun --cases` und `findings` liefern Messwerte mit Exit 0;
Warnungen (`evidence_unquoted`, `no_discriminating_check`) ändern den Exit-Code nie.

**Schemas** (JSON Schema 2020-12, geprüft mit `lib/schema.js`):
[Snapshot](../../docs/spec/schemas/eval-snapshot.schema.json),
[Ledger-Eintrag](../../docs/spec/schemas/eval-ledger.schema.json),
[Split-Manifest](../../docs/spec/schemas/eval-split-manifest.schema.json),
[normalisierte Spur](../../docs/spec/schemas/eval-normalized-trace.schema.json),
[Rohdatensatz](../../docs/spec/schemas/eval-raw-record.schema.json),
[Bericht](../../docs/spec/schemas/eval-report.schema.json),
[Rubrik](../../docs/spec/schemas/eval-rubric.schema.json),
[Bewertung](../../docs/spec/schemas/eval-judgement.schema.json),
[Fall](../../docs/spec/schemas/eval-case.schema.json),
[Kernurteile B1-Vorlauf](../../docs/spec/schemas/eval-b1-vorlauf.schema.json),
[Allowlist](../../docs/spec/schemas/eval-context-allowlist.schema.json),
[Kontextpaket](../../docs/spec/schemas/eval-context-pack.schema.json).
Der Schemaprüfer kennt dafür zusätzlich `maximum`, `minItems`, `maxItems` und `propertyNames`.

### Verhältnis zum Research-Helfer

[`skill_pilot.py`](../../research/skills-meta-prompting/skill_pilot.py) bleibt unverändert als Referenz stehen. Gleichheitstests
rufen ihn nur lesend auf (`python3 -I -B`; ohne Python übersprungen):

- `freeze` erzeugt dasselbe Objekt wie `skill_pilot.freeze`; aus den Dateien von `skill-pilot-baseline-v2.json` entsteht
  genau diese Datei wieder (Paketsatz-Hash `4ad5b6db…2473967`).
- `bind` liefert dieselben Dateien wie `variant_files` und denselben Kandidatenhash wie `digest(canonical(...))`.
- `normalize` stimmt auf den Positivlistenfeldern mit `normalize_trace` überein (synthetische Spuren). Alle gespeicherten
  `*.normalized.json` unter `eval-runs/` lassen sich importieren und reproduzieren ihre Positivlistenfelder.

Zwei weitere Research-Prüfer liegen nur auf dem Branch `research/e3-runde-2` und bleiben dort Referenz; ihre Daten sind mit Hashes als
`test/fixtures/*.json` kopiert (Commit `a2afd98b`, Pfade wie im Branch; der Test prüft die Hashes vor der Nutzung):

- `e3/verify_quotes.py` (Zitatprüfung): `judge check` reproduziert dessen Fragmentzählung auf den vier gespeicherten Bewertungen
  (E3 Runde 1 Test 101/101, Regression 25/25, Select 49/55, M4 66/83; SLV0-FALL-51). Zwei gewollte Abweichungen:
  (1) Ein Beleg, dessen Innenzitate kein Fragment mit 12 Zeichen ergeben (etwa nur ein zitierter Name), wird als Ganzes geprüft statt `ohne_beleg`
  (Test +1 Fragment, M4 +2: 102/102 und 66/85); der Prototyp hätte das K-MELDEN-Urteil `Y695`/3 sonst fälschlich ohne Beleg gelassen.
  (2) Die verlangte Reihenfolge: drei Belege setzen Fragmente in umgekehrter Reihenfolge zusammen (Test `Y613`/3, Regression `Y752`/1,
  M4 `X896`/1); in Reihenfolge sind es 101/102, 24/25, 49/55, 65/85.
  Neu ist die Urteilsfolge: Von den `erfuellt`-Urteilen werden `unklar` – Test 7 von 70 (6 Abwesenheitsaussagen „fehlt (…)“ ohne Suchbegriff,
  1 Reihenfolge), Regression 1 von 16, Select 4 von 34, M4 15 von 49.
- `grilling-runde/check_case.py` (Dateiprüfungen): `nullrun` ergibt auf den acht Dev-Fällen dieselben Ergebnisse je Prüfung wie der Prototyp mit
  leerer Änderungsmenge: 31 Prüfungen, 20 erhaltend, 11 trennend, nur D8 ohne trennende Prüfung (SLV0-FALL-54).

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
- **Vorbereiten:** Konfigurationsschutz ohne Groß-/Kleinschreibung: an der Wurzel `.claude/`, `.agents/`, `.mcp.json`; `AGENTS.md`, `CLAUDE.md` und `CLAUDE.local.md` in jedem Verzeichnis, weil der Client verschachtelte Regeldateien nachlädt (SLV0-FALL-47). Alles wird vor dem
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
- **Git:** `git --no-optional-locks -c core.fsmonitor=false -C <root> rev-parse|status` (für `cite-check` zusätzlich `ls-tree|cat-file`); die Ausgabe nennt höchstens fünf
  unsaubere Pfade. Der Importtest erlaubt `node:child_process` nur in `lib/eval/git.js` und dort nur `execFileSync('git', …)`.

### Auslegungen zu Belegen, Trennschärfe und Befunden (SLV0-EVAL-19…27)

- **Bewertungsformat:** Eine Datei mit `schema_version` folgt streng dem Schema (Exit 2 bei Verstoß); ohne `schema_version` gilt sie als ältere
  Bewertung (`format: aeltere-bewertung`). `beleg` darf eine Liste sein; jedes Zitat muss für sich vollständig gefunden werden, zwischen Zitaten gilt
  keine Reihenfolge. Zitate ohne Fragment ≥ 12 Zeichen werden übergangen; bleibt keines übrig, ist das Kriterium `ohne_beleg`.
- **Urteilsfolge:** Nur `erfuellt` wird herabgestuft (→ `unklar`). Ein nicht gefundener Beleg bei `nicht_erfuellt` oder `unklar` wird als
  `evidence_not_found` gemeldet, der Status bleibt (Spec O-11). `kern: true` an einem Kriterium liefert `kern_geprueft` je Ausgabe; ältere Bewertungen
  markieren den Kern nicht. `erfuellt_laut_bewertung` und `kern_erfuellt_laut_bewertung` sind die Angaben des Bewerters, ungeprüft.
- **Fixtures:** `--fixtures VERZ` sucht `VERZ/<fall>/fixture/`. Ein `fixture`-Zitat muss vollständig in einer Datei stehen; die Fundstelle wird genannt.
  Steht ein `zitat` nur in der Fixture, ist es `nicht_gefunden` mit Hinweis `nur_in_fixture`. Fehlt die Ausgabedatei `<code>.md`, ist das Exit 2.
- **Abwesenheit:** Teilzeichenkette ohne Groß-/Kleinschreibung nach Normalisierung, ohne Wortgrenzen (strenger als ein Wortvergleich).
- **Prüfformat:** Eine Prüfung mit `file` neben einer Regel ohne Datei (`absent_anywhere`, `*_under`) ist Exit 2. Prüf-IDs ohne `id` heißen
  `<case_id>-P01`, `-P02`, … Der Ausgangsstand von `eval check` ist ohne `--baseline` die Fixture; für Arbeitsverzeichnisse aus `eval prepare` ist
  `--baseline` mit einer unberührten Kopie des vorbereiteten Versuchs nötig, sonst zählen Paket- und Adapterdateien als hinzugefügt.
  Anders als `git status` sieht der Baumvergleich auch ignorierte Dateien. `.git/` wird überall übersprungen; `absent_anywhere` überspringt zusätzlich `.claude/`.
- **Nulllauf:** Fälle ohne `checks` stehen unter `faelle_ohne_pruefung` und erhalten keinen Hinweis. Im Bericht gilt eine Assertion-ID als markiert,
  sobald ein Rohdatensatz des Falls sie markiert; nur `trennend` gegen `erhaltend` ist ein Widerspruch (Exit 2).
- **Rollen:** `eval check` vergibt `kern`/`gegen`, wenn die Prüf-ID gleich `kern_kriterium` bzw. `gegen_kriterium` ist; sonst setzt der Aufrufer
  `rolle` in den Metadaten. Der konjunktive Block steht in jedem Assertions-Block (je Variante, Fall, Familie, Wiederholung).
- **B1-Vorlauf:** `unklar` ist weder erfüllt noch verfehlt; verfehlt B1 keinen Fall und ist ein Urteil `unklar`, ist das Ergebnis `unklar` (Exit 1).
  Der Befehl prüft nicht, ob die Fälle wirklich select-Fälle sind oder die Urteile verblindet entstanden; das sichert das Verfahren (SL4 §4).
- **Einheiten und Token:** Codeblöcke werden nicht gesondert behandelt. Token und `fundstelle_datei` werden als ganzes Wort gesucht (kein Buchstabe
  oder keine Ziffer davor oder dahinter, soweit das Token dort selbst einen hat); `fundstelle_datei` passt auch über den Dateinamen allein.
- **Überberichtung:** Nur Pfade mit Dateiendung; Pfadende ab Segmentgrenze (`retry.py` passt auf `vendor/x/retry.py`); bei mehreren passenden
  Dateien genügt eine mit genügend Zeilen. Commits nur in Kleinschreibung; bekannt sind Hex-Wörter (7–40 Zeichen) aus den Fixture-Dateien.

### Auslegungen zur Belegabdeckung (SLV0-EVAL-28…30)

- **Belegt statt gelesen:** Der Portierungsplan spricht von „X von Y, nicht gelesen“. Das Werkzeug sieht nur den Bericht, also zählt es
  belegte Dateien; ob eine nicht belegte Datei gelesen wurde, bleibt offen. Segmente sind Dateien; Zeilenbereiche werden je Datei
  zusammengeführt ausgegeben, aber nicht in feste Abschnitte zerlegt.
- **Commit:** `--commit` nur als 7–40 Hex-Zeichen (keine Ref-Namen wie `HEAD`, damit der Bericht an einen festen Stand gebunden bleibt);
  Abkürzungen werden über `rev-parse` aufgelöst, mehrdeutige gelten als unbekannt. Ein Permalink mit anderem, aber bekanntem Commit ist
  `sha_mismatch`; Fundstellen ohne URL beziehen sich immer auf `--commit`.
- **Fundstellen:** gleiche Erkennung wie die Überberichtung (`findings.js`, Pfad mit Dateiendung); genauer Pfad vor Pfadende; passt das Pfadende
  auf mehrere Dateien, ist das `path_ambiguous` (anders als in `findings`, wo eine passende Datei genügt). Der Linktext eines Permalinks wird,
  wenn er selbst wie `pfad:zeile` aussieht, zusätzlich als Fundstelle gezählt.
- **Permalinks:** nur `github.com/…/blob/…`; Anker `#L…` mit optionaler Spalte `C…`; ein anderer Anker (z. B. eine Überschrift) macht den Link zu
  keinem Zitat. Ohne `--github` werden alle Permalinks gegen `--repo` geprüft, also auch solche auf andere Repos (dann meist `commit_unknown`).
- **Register:** Git-Modus `100644`/`100755`; Symlinks und Submodule gehören nicht dazu, ein Zitat darauf ist `path_missing`. Ein Glob-Bereich
  mit `/` am Ende trifft alles unterhalb der passenden Ordner. Zeilenzahl wie §7.4 über `git cat-file blob`, nur für zitierte Dateien.
- **Commit-Wörter:** unbekannte Hex-Wörter sind nur eine Warnung (`commit_unverified`), weil ein Hex-Wort auch ein gekürzter Inhaltshash sein kann.

### Auslegungen zum Kontextpaket (SLV0-EVAL-31…34)

- **Unter `eval`:** Der Befehl dient den Sessions des Eval-Verfahrens (Implementierung, Familienautor, Bewerter) und teilt dessen
  Abbruchform (`refused`, Codes aus §8, Exit 1/2), das Nie-Überschreiben von `prepare` und die Artefaktausgabe auf stdout. Die Befehle
  ohne `eval` prüfen dagegen Pakete unter `.agents/skills/`. Die IDs setzen daher SLV0-EVAL fort.
- **„Übergabe §3“** ist die Inputliste der Implementierungsübergabe (Spalten *Input*, *Wofür*); `resuming-work` liefert dazu das
  „aktuelle Kontextpaket“ mit Ziel. Die Allowlist führt `ziel`, `rolle` und `eingaben[].wofuer` als Daten; Abschnittsangaben bleiben Lesehinweis,
  ausgewählt werden ganze Dateien.
- **Muster vs. Bedienfehler:** Mustersyntax prüft das Werkzeug, nicht das Schema, damit jeder Tippfehler ein Code mit Exit 1 ist; das Schema
  verlangt nur nichtleere Zeichenketten. Ein Pfad-Muster muss eine Datei sein; Verzeichnisse nur über `verz/**`. Muster nur aus Platzhaltern
  (`**`, `*/*`) sind unzulässig, weil sie praktisch „alles“ bedeuten.
- **Sperren** gelten auch für übergeordnete Ordner und ohne Beachtung der Groß- und Kleinschreibung (`Kandidaten/` ist gesperrt); ein Pfad-Muster auf
  einen gesperrten Pfad wird nicht einmal per `lstat` angefasst. Glob-Treffer unter einem gesperrten Ordner werden je Ordner zusammengefasst.
- **Fremde Repositories** erkennt das Werkzeug an einem `.git`-Eintrag in einem Unterordner (`nested_repository`), nicht am Inhalt.
- **Text:** Nur UTF-8 ohne NUL-Byte (`file_not_text`), damit Bündel und Datensatz dieselben Bytes beschreiben; BOM und CRLF bleiben erlaubt und
  unverändert. Tokens nur mit `--estimator` (SLV0-TOK-04), sonst `unbekannt`; der Paket-Hash hängt nicht vom Schätzer ab.
- **Wurzel und Ausgabe:** Der Datensatz nennt weder Wurzel noch Bündelpfad (SLV0-INV-03); `allowlist.sha256` bindet ihn an die Allowlist-Bytes.

### Auslegungen zur Kostenbilanz (SLV0-EVAL-35…38)

- **Turn:** gleiche `message.id` der Hauptsitzung; Usage vom letzten Ereignis des Turns (der Client wiederholt die Usage je Inhaltsblock).
  Ereignisse mit `parent_tool_use_id` sind keine Turns; ihre Usage steht nur im Rest, ihre Blöcke in `unteragent` mit 0 Folgeturns.
- **Rest statt Abgleich:** An 24 Spuren (Claude Code 2.1.316) ist der Rest für die Eingabefelder 0, für `output_tokens` nicht (Spec O-15). Darum wird
  nichts erzwungen: Der Rest ist vorzeichenbehaftet und zeigt jede Abweichung. Die Invariante gilt exakt für Bytes; für Tokens gilt
  Turn-Summe + Rest = Gesamt, sobald beide bekannt sind.
- **Skill-Rumpf als Nachricht:** Text eines `user`-Ereignisses mit `isSynthetic: true` zwischen einem erfolgreichen `Skill`-Ergebnis und dem nächsten
  `assistant`-Ereignis zählt als `skill_laden`; nach einem fehlgeschlagenen Aufruf oder ohne `Skill`-Ergebnis bleibt er `nutzer_text`.
- **Bytes:** UTF-8-Länge der Nutzlast, nicht des JSON-Ereignisses; Werkzeugaufrufe als JSON ihrer Eingabe. Nicht erkannte Blöcke zählen mit
  ihrem ganzen JSON in `nicht_zuordenbar`, damit die Summe vollständig bleibt.
- **Folgeturns** sind eine Obergrenze der Dauerlast: Der Client kann Denkblöcke oder alte Ergebnisse in späteren Eingaben kürzen; das ist in
  der Spur nicht sichtbar.
- **Differenzen** nur über Fälle mit Läufen beider Seiten; ungleiche Laufzahlen je Seite werden nicht ausgeglichen (beide ID-Listen stehen dabei).
  Ein Lauf ohne Bilanz macht Turns, Bytes und Rest seiner Seite unbekannt; die Kosten kommen aus der Lauf-Usage und bleiben bekannt.
- **Kosten je erfülltem Kriterium:** erfüllt = bestandene Assertion ohne `r_regel` (deterministisch und Rubrik zusammen), Nenner der Zählung sind alle
  Assertions ohne `r_regel`; R-Assertions zählen nie. Ohne bestandene Assertion oder mit einem Lauf ohne Kostenschätzung `unbekannt`.
- **Format:** `normalizer` bleibt `sl-eval-normalize@1`, die neuen Felder sind optional (frühere Spuren, Rohdatensätze und Berichte bleiben gültig).

### Auslegungen zum Ausgabevertrag (SLV0-EVAL-39…42)

- **Form aus dem Skill, nicht neu erfunden:** Die Tabelle übernimmt die Zeile „Aussage | Quellenrolle | Fundstelle@SHA | Evidenzstufe“ aus
  `researching-repositories/references/report.md`, die Quellenrollen aus Schritt 3 des Skills, die Evidenzstufen aus Schritt 4 und der Dossier-Vorlage.
  Tabelle statt Liste, weil die Vorlage sie schon so führt und Spalten ohne Schlüsselwortsuche gelesen werden können.
- **Stand je Fundstelle:** RR-K03 verlangt Commit „oder Stand“. Eval-Arbeitsverzeichnisse haben keinen Git-Stand, darum gibt es `@arbeitsbaum`;
  gegen `--commit` ist das `ref_not_pinned`, gegen eine Fixture gültig. Der Stand hängt an jeder Fundstelle (Spaltenname `Fundstelle@SHA`), nicht
  einmal im Kopf, damit eine Zeile allein prüfbar bleibt. Nur Zeilen belegen eine Codeaussage; „Stelle“ als Symbol (`#send`) wird nicht erkannt.
- **Codeaussage:** Rolle `Code` oder Stufe `im Code gefunden`. Die Verträglichkeit Stufe ↔ Rolle (dokumentiert nur mit Herstellerbehauptung oder
  Spezifikation usw.) macht einen Teil von RR-K05 mechanisch, ohne ihn zu ersetzen: ob die Aussage wirklich im Code steht, prüft weiter ein Bewerter.
- **Varianten sind Fehler:** `### Befunde`, `## Befunde:` oder eine Zeile „Eingebettete Anweisungen: keine“ sind nie ein Block, auch nicht neben dem
  richtigen. Unterüberschriften wie `### Befunde zu X` sind keine Variante (normalisiert ≠ Blockname), stehen sie aber in einem Block, ist er `block_malformed`.
- **Doppelt heißt ungeprüft:** Bei `block_duplicate` prüft das Werkzeug keinen der Blöcke, statt einen zu wählen.
- **Fundstellen-Spalte streng, Anweisungseinträge frei:** In der Tabelle darf nur stehen, was eine Fundstelle ist; in Listeneinträgen ist Text
  erlaubt, aber `pfad:zeile` ohne Stand ist auch dort ein Fehler. Links: Ziel zählt, Linktext nicht.
- **Prüfmodus:** `--repo` hat Vorrang vor der Fixture eines `--case`; ohne beides wird nur die Form geprüft und RR-K03 bleibt `nicht_geprueft`
  (Exit 0 möglich). Die Fixture-Prüfung nutzt die Regeln der Überberichtung (Pfadende genügt, Commit muss im Fixture-Text stehen), meldet aber Fehler.
- **Vertragsversion:** `researching-repositories@2` erlaubt die Quellenrolle `—` (nur U+2014) bei Evidenzstufe `offen`; bei jeder anderen Stufe
  bleibt sie `source_role_unknown`, `-`/`–` nie. `@1` bleibt mit alter Bedeutung prüfbar, damit E3-4-Ergebnisse reproduzierbar sind; neue Kandidaten nutzen `@2`.
- **Kriterien nur im Block:** `kriterien` sagt, ob die Vertragsblöcke RR-K03/-K04/-K10 erfüllen. Die Rubrik `researching-repositories@1` bleibt
  bei Prüfart `rubrik` (sie ist an den Pakethash gebunden; eine deterministische Fassung braucht eine neue Rubrikversion mit einem Skill, der den
  Vertrag anweist). Deshalb erzeugt der Befehl keine Assertions für `eval raw`.

**Abdeckung der Rubrik `researching-repositories@1`:** deterministisch prüfbar werden mit Vertrag RR-K03 (Fundstelle und Stand je Codeaussage im
Block, inhaltlich gegen Git oder Fixture), RR-K04 (Evidenzstufe aus der festen Liste je Befundzeile) und RR-K10 (eingepflanzte Anweisung mit Fundstelle
gemeldet, mit `--case`). Teilweise berührt: RR-K05 (Stufe ↔ Rolle) und RR-K06 (ein Commit-Stand, den Git nicht kennt oder der nicht `--commit` ist,
fällt auf). Unverändert Bewerter: RR-K05 inhaltlich, RR-K07, RR-K08, RR-K09, RR-K11…K15.

## Nicht umgesetzt

- Kostenbilanz: Systemprompt und Skill-Katalog haben keine eigene Klasse (keine Bytegröße in der Spur); die Skill-Ladeform ist nur für Claude Code
  2.1.316 geprüft, Unteragenten an echten Spuren gar nicht (Spec O-15). Kein Preismodell: Kosten nur als Client-Schätzung,
  keine Umrechnung von Tokens in USD. Keine Faktoren oder Anteile im Bericht; Quotienten bildet der Leser.
- Keine Bewertung: Weder Harness noch Rubrik urteilen; Bewerter-Session, Modellfixierung und menschliche Stichprobe (SL1 §7)
  bleiben außerhalb des Werkzeugs (Spec O-10).
- Keine Versionshistorie von Rubriken: Ob eine Kriterienänderung eine neue `rubrik_version` bekam, prüft das Werkzeug nicht
  (es sieht nur den aktuellen Stand); das sichert die Review der Rubrik-PR.
- `faelle` in Rubriken und `allowed_skills`/`expected_skill` der Falldateien werden nicht gegeneinander abgeglichen.
- Ein Rohdatensatz kennt seine `trial_id` nicht als eigenes Feld; der Ledger-Abgleich nutzt die Namensregel von `prepare`.
  Mehrere Rohdatensätze zum selben `attempt_id` werden nicht erkannt; der Bericht lehnt nur doppelte `run_id` ab.
- `freeze --verify-git` prüft nur den Arbeitsbaum gegen HEAD; ein Einfrieren direkt aus einem Commit (`git show`) gibt es nicht.
- Baseline-Läufe (EVAL-12) bleiben keine Werkzeugfunktion.
- Belegprüfung: Paarurteile (`paare`) und ihre Begründungen werden nicht geprüft; kein Abgleich der Bewerterangaben `erfuellt`/`kern_erfuellt` mit
  den Kriterien; keine Unicode-Normalisierung (NFC) über die genannten Zeichen hinaus.
- Trennschärfe: Negativkontroll-Familie je Kandidat und die Pflicht zur Markierung ab E3-Runde 3 sind Verfahren, keine Werkzeugfunktion (Spec O-12).
  `eval raw` übernimmt `trennschaerfe` und `rolle` nur aus den Metadaten (z. B. aus `eval check`), prüft sie aber nicht gegen einen Nulllauf.
  Der B1-Vorlauf erzeugt keine Ledger-Einträge und sperrt keine Kandidatenstarts technisch.
- Überberichtung (`eval findings`) prüft weiter gegen den Fixture-Text, nicht gegen einen Git-Stand; gegen Git prüft `eval cite-check` (Spec O-13, teilweise gelöst).
- `cite-check` hat keine Schwelle und keinen Schalter, der nicht belegte Dateien zum Fehler macht; ob eine Abdeckung genügt, entscheidet das Verfahren.
  Andere Hosts als GitHub, relative Markdown-Links mit Zeilenanker und Zitate auf Ordner (`tree/`) werden nicht erkannt.
- Ausgabevertrag (Spec O-16): nur `researching-repositories@1` und `@2`; geprüft werden nur die beiden Blöcke, nicht der übrige Bericht; eine gültige
  Fundstelle belegt Existenz, nicht Inhalt; kein Skill weist den Vertrag bisher an (E3-Kandidat folgt getrennt); die vorhandenen Injektionsfälle
  tragen noch kein `art: eingebettete_anweisung`. Fundstellen ohne Dateiendung und Symbolangaben werden nicht erkannt.
- Kontextpaket (Spec O-14): keine Bindung der Allowlist an einen Commit, kein Abgleich erwarteter Dateihashes aus der Übergabe, keine
  Abschnittsauswahl innerhalb einer Datei, keine Angleichung von NFC/NFD in Dateinamen, keine Größenobergrenze. Das Paket erzwingt nicht,
  dass eine Session nur es sieht; das ist Sache des Rechteprofils (P12).
