# Skill-Library V0 – Paketvertrag, Validator, Token-Zählung, Eval-Harness

> Version 0.1 · 30.10.2026 · **Entwurf zur Review**, kein Implementierungsbeginn vor Merge dieser Spec (`AGENTS.md`: Spec-driven).
> Ergänzt [V0 – Ziel und Verträge](v0-ziel-und-vertraege.md) und übernimmt deren Konventionen ([README](README.md)): stabile IDs, JSON Schema 2020-12, nur synthetische Beispiele, Fallmatrix als spätere Contract-Tests.
> Reichweite nach Owner-Antwort [A-20261030-sl-reichweite](../fragen/skill-library/questions/Q-20261030-sl-reichweite.md): **Stufen 0–2** (Paketvertrag, Validator, Token-Zählung, Eval-Harness mit Baseline).
> Aktivierung nur durch den Owner am Hash ([A-20261030-sl-aktivierung](../fragen/skill-library/questions/Q-20261030-sl-aktivierung.md)); Feedback nur synthetisch oder freigegeben ([A-20261030-sl-feedbackdaten](../fragen/skill-library/questions/Q-20261030-sl-feedbackdaten.md)).
> Implementierungsauftrag: [library-implementation-handover.md](../../research/skills-meta-prompting/library-implementation-handover.md).

**Belege, keine Garantien.** Die Anforderungen stützen sich auf die Research-Ergebnisse SL1–SL5 des
[Library-Research-Plans](../../research/skills-meta-prompting/library-research-plan.md). Dort Gemessenes ist ein Diagnosehinweis
aus wenigen Läufen mit einem Client und einem Modell ([C0/E1-Ergebnis](../../research/skills-meta-prompting/eval-runs/C0-E1-ergebnis-2026-10-30.md)).
Ein gültiges Paket ist weder gefunden noch ausgewählt noch gut ausgeführt. Diese Spec sagt nichts über Ergebnisqualität, Tokenersparnis oder Lernerfolg.

## 1. Ziel und Umfang

Die Skill-Library ist eine Kernfähigkeit von Sidekick (Plan §1). Bevor Auswahl, Komposition oder Lernen gebaut werden, muss jede
spätere Stufe messbar sein. Diese Spec legt dafür das deterministische Fundament fest:

| Stufe ([Clean-Room-Plan](../../research/skills-meta-prompting/clean-room-plan.md)) | Inhalt | Anforderungen |
|---|---|---|
| 0 | Paketvertrag, Registry-Datensatz, Inhaltshash | SLV0-PKG |
| 1 | Validator und Token-Zählung | SLV0-VAL, SLV0-TOK |
| 2 | Eval-Harness: Einfrieren, Hash, Startzähler, Splitzugriff, Normalisierung, Berichte nur aus Rohdaten | SLV0-EVAL |

**Nicht in dieser Spec (Abgrenzung, §10):** Aktivierung durch Code, Laden oder Auswählen von Skills zur Laufzeit, Komposition und Ketten
(Stufe 3/6), Änderungspipeline (Stufe 4), Optimierer (Stufe 5), Qualitätsurteile, Modell- oder Netzwerkaufrufe in Validator, Hash und Token-Zählung.

## 2. Begriffe

V0-Begriffe (Auftrag, Journal, Freigabe, Datenklasse) gelten unverändert. Neu:

| Begriff | Bedeutung |
|---|---|
| **Paket** | Ein Skill-Ordner unter `.agents/skills/<name>/` im portablen Agent-Skills-Format: `SKILL.md`, optional `references/` und `agents/openai.yaml`. |
| **Projektkonfiguration** | Ablagen, ID-Schemata, Statusquelle eines Projekts. Steht in `AGENTS.md`, nie im Paket (SL3 §2, Schicht L3). |
| **Client-Adapter** | Zugang eines Clients zum Paket, z. B. Symlink `.claude/skills/<name>` oder `agents/openai.yaml`. |
| **Registry-Datensatz** | Laufzeitdaten zu einem Paket, die das Format nicht vorsieht (Version, Hash, Ein-/Ausgaben, Status). Liegt neben dem Paket und ändert dessen Hash nicht ([Schema](schemas/skill-package.schema.json)). |
| **Inhaltshash** | SHA-256-Identität eines Pakets nach Hash-Profil (§4.3). Die Identität ist der Hash; die Version ist ein Label. |
| **Paketsatz-Hash** | Hash über alle Pakete einer Library (§4.3). Bindet Baselines. |
| **Prüfmeldung** | Ergebnis einer Validator-Regel: Code (§8), Schweregrad `error` oder `warning`, Pfad, Zeile, Regel-ID. |
| **Tokenzahl** | Zahl mit Quelle `gemeldet`, `geschaetzt` oder `unbekannt` und benannter Methode (§6). |
| **Snapshot** | Eingefrorene Kopie aller Paketdateien mit Einzelhashes, Paketsatz-Hash und Quellcommit; Grundlage einer Baseline. |
| **Kandidat** | Datensatz aus Ersetzungen gegenüber genau einem Snapshot, mit genau einer Dimension (SL4 §4). Kein Paket, nie aktiv. |
| **Versuch** | Geplante Konfiguration aus Fall × Variante (`B0`, `B1`, Kandidat) in einem frischen Arbeitsverzeichnis. |
| **Start** | Ein Aufruf des Clients für einen Versuch. Fehlstarts und Wiederholungen sind Starts. |
| **Split** | `dev`, `select`, `test` oder `regression`, zugeordnet je Ursprungsfamilie (SL1 §5.5). |
| **Rohdatensatz** | Ein JSON-Datensatz je Start (SL1 §8). Einzige Quelle für Berichte. |

## 3. Invarianten

| ID | Invariante | Herkunft |
|---|---|---|
| SLV0-INV-01 | Kein Werkzeug dieser Spec aktiviert, genehmigt oder zieht ein Paket zurück. `status: approved` entsteht nur durch Owner-Merge am Hash; Werkzeuge lesen den Status, schreiben ihn nie. | Owner-Antwort Aktivierung, SL4 §5, V0-INV-07 |
| SLV0-INV-02 | Identität ist der Inhaltshash. Gleiche `skill_id` und Version mit verschiedenem Hash ist ein Fehler, nie eine stille Überschreibung. | SL3 §2, SL3-R03 |
| SLV0-INV-03 | Gleiche Eingabebytes ergeben gleiche Ausgaben: Hash, Prüfmeldungen (sortiert), Tokenzahlen bei gleicher Methode. Zeitstempel, Dateireihenfolge und Arbeitsverzeichnis beeinflussen kein Ergebnis. | K5.7, SL1 §8 |
| SLV0-INV-04 | Validator, Hash und Token-Zählung arbeiten ohne Netz und ohne Modell. Eval-Werkzeuge starten selbst keinen Client. | K1.4, Owner-Vorgabe Live-Budget |
| SLV0-INV-05 | „Unbekannt“ ist nie 0, leer oder `false`. Fehlende Tokenwerte, Usage, Kataloge oder Aktivierungsnachweise werden als `unbekannt` bzw. `null` mit Grund geführt. | K7.6, Pilot-Normalisierer |
| SLV0-INV-06 | Kein Werkzeug gibt ein Qualitätsurteil, einen Score oder eine Empfehlung zur Aktivierung aus. | SL1 §2, Plan §7 |
| SLV0-INV-07 | Kein Werkzeug lädt oder ruft einen Skill auf, folgt `relations` oder erzeugt Folgeschritte (keine Kaskaden). | Plan §1, SL3 §3 |
| SLV0-INV-08 | Werkzeuge ändern keine Datei unter `.agents/skills/` und keine Client-Adapter. | SL4 Invariante L1 |
| SLV0-INV-09 | Berichte entstehen nur aus gespeicherten Rohdatensätzen; jede Zahl ist auf Rohdatensatz-IDs rückführbar. | K5.5, SL1 §8 |
| SLV0-INV-10 | Fixtures, Fälle und Rohdaten im Repo sind synthetisch oder ausdrücklich freigegeben; keine Secrets, keine persönlichen Rohsessions. | Owner-Antwort Feedbackdaten, V0-INV-09/-11 |
| SLV0-INV-11 | Format-gültig, entdeckt, ausgewählt und gut ausgeführt sind vier getrennte Tatsachen (M0–M4). Ein Werkzeug meldet nur die Ebene, die es tatsächlich prüft. | SL1 §2, K1.5, Primärquellen F1 |

## 4. Paketvertrag (SLV0-PKG)

### 4.1 Paketordner

| ID | Anforderung |
|---|---|
| SLV0-PKG-01 | Ein Paket ist ein Ordner `.agents/skills/<name>/`. Zulässige Einträge in V0: `SKILL.md` (Pflicht), `references/` mit UTF-8-Textdateien, `agents/openai.yaml`. Alles andere (z. B. `scripts/`, `assets/`, Binärdateien) ist in V0 unzulässig. *Eigene Vorgabe*, strenger als das Format; ausführbare Inhalte brauchen eine eigene Spec. |
| SLV0-PKG-02 | `SKILL.md` beginnt mit YAML-Frontmatter zwischen zwei Zeilen `---`. Zulässige Felder laut Agent-Skills-Format (P1, *dokumentiert*, [Primärquellenprüfung](../research/skill-library-primaerquellen-2026-10-30.md)): `name`, `description` (Pflicht), `license`, `compatibility`, `metadata`, `allowed-tools` (optional). Andere Felder sind unzulässig; Version und Status gehören in den Registry-Datensatz. Feldliste vor Implementierung gegen P1 am Commit `69ef37e9` gegenprüfen (Handover AK-02). |
| SLV0-PKG-03 | `name`: 1–64 Zeichen, nur `a-z`, `0-9` und `-`, kein `-` am Anfang oder Ende, kein `--`, gleich dem Ordnernamen. |
| SLV0-PKG-04 | `description`: 1–1024 Unicode-Codepoints nach Entfernen führender/folgender Leerzeichen; enthält Auslöser und Nicht-Auslöser. Sie ist die einzige Auswahlgrundlage, die der Client vor Aktivierung sieht (SL0 §2.2). Ob sie gut auswählt, prüft nur M2, nie der Validator. |
| SLV0-PKG-05 | Paketinhalte sind projektneutral: keine festen Projektpfade oder Projektnamen; diese kommen aus der Projektkonfiguration (SL-A01, SL3 §2). Deterministisch prüfbar nur gegen eine konfigurierte Liste (SLV0-VAL-11). |
| SLV0-PKG-06 | `agents/openai.yaml` ist ein Client-Adapter. V0 prüft nur Format (Kodierung, Zeilenenden), nicht den Inhalt; generierte Adapter (K1.1) folgen später. |

### 4.2 Registry-Datensatz

| ID | Anforderung |
|---|---|
| SLV0-PKG-10 | Je Paket gibt es höchstens einen Registry-Datensatz je Version nach [skill-package.schema.json](schemas/skill-package.schema.json); Beispiel: [skill-paket-demo.json](beispiele/skill-paket-demo.json). Felder aus SL3 §2: `skill_id`, `version`, `content_hash`, `package_path`, `inputs`, `outputs`, `requires_capabilities`, `effects_requested`, `relations`, `provenance`, `test_refs`, `status`, `status_evidence`. |
| SLV0-PKG-11 | `skill_id` ist stabil, gleich `name` und wird nie umbenannt. Eine Umbenennung ist ein neues Paket. |
| SLV0-PKG-12 | `status ∈ {candidate, approved, withdrawn}`. `approved` und `withdrawn` verlangen `status_evidence` mit Merge-Commit und `decided_by: owner`. Der Datensatz beschreibt den Status, er bewirkt ihn nicht (SLV0-INV-01). |
| SLV0-PKG-13 | `effects_requested` ist ein Antrag, kein Recht; der Harness gleicht ihn später mit Grants ab (SL3-R08, V0-INV-01). `relations` sind Daten; V0 wertet sie nicht aus (SLV0-INV-07). |
| SLV0-PKG-14 | `inputs`/`outputs` nennen Artefakttypen mit Major-Typversion (SL3 §4). V0 prüft nur die Form; Typkompatibilität ist Stufe 3 (SL3-R04, offen O-3). |
| SLV0-PKG-15 | Ort und Dateiform der Registry sind offen (O-2). Bis zur Entscheidung werden für die acht Skills keine Registry-Dateien eingecheckt; Werkzeuge prüfen übergebene Datensätze. |

### 4.3 Inhaltshash (Hash-Profil `sl-hash-v0`, Vorschlag zu O-1)

| ID | Anforderung |
|---|---|
| SLV0-PKG-20 | Dateimenge: alle regulären Dateien im Paketordner, rekursiv, einschließlich `agents/openai.yaml`. Ein Paket mit Symlink, versteckter Datei oder unzulässigem Eintrag erhält **keinen** Hash (Fehler statt Teilhash). |
| SLV0-PKG-21 | Dateihash: SHA-256 über die unveränderten Bytes, klein geschriebene Hexadezimalzahl. Keine Zeilenend- oder Unicode-Normalisierung; CRLF und BOM sind Validatorfehler, damit Hash und Gültigkeit nicht auseinanderlaufen. |
| SLV0-PKG-22 | Inhaltshash eines Pakets: SHA-256 über die UTF-8-Bytes der kanonischen JSON-Darstellung des Objekts `{<relativer Pfad>: <Dateihash>}`. Pfade relativ zum Paketordner mit `/`. Kanonisches JSON: Schlüssel aufsteigend nach Codepoint sortiert, keine Leerzeichen (Trenner `,` und `:`), Nicht-ASCII-Zeichen unescaped. Pfade sind ASCII (SLV0-VAL-08), daher sprachunabhängig reproduzierbar. |
| SLV0-PKG-23 | Paketsatz-Hash: gleiche Formel über `{<Repo-relativer Pfad .agents/skills/...>: <Dateihash>}` aller Pakete. Das entspricht der Methode des Research-Helfers (`freeze`); am Commit `06869bc6` ergibt sie `4ad5b6db…2473967` und damit den Hash der Baseline B1 ([skill-pilot-baseline-v2.json](../../research/skills-meta-prompting/skill-pilot-baseline-v2.json); lokal nachgerechnet, Golden-Wert SLV0-FALL-23). |
| SLV0-PKG-24 | Der Registry-Datensatz nennt `content_hash.algorithm`, `content_hash.profile` und `content_hash.value`. Ein anderes Profil ist ein anderer Hash; Hashes verschiedener Profile werden nie verglichen. |

## 5. Validator (SLV0-VAL)

Der Validator prüft M0 (Format), nicht Discovery, Auswahl oder Verhalten. Zwei Bereiche: **Paket** (portabel, nur der Paketordner)
und **Projekt** (zusätzlich Client-Adapter und Projektkonfiguration).

| ID | Regel | Schweregrad | Code (§8) |
|---|---|---|---|
| SLV0-VAL-01 | Frontmatter vorhanden und geschlossen | error | `frontmatter_missing` |
| SLV0-VAL-02 | Frontmatter liegt in der unterstützten YAML-Teilmenge: `schluessel: skalar` je Zeile, Skalare ungequotet oder in `"`/`'`, `metadata` als eine Ebene `schluessel: skalar` mit zwei Leerzeichen Einrückung. Anker, Tags, Blockskalare, Flusslisten, Mehrfachschlüssel → Fehler statt Teilparse. *Eigene Vorgabe* bis O-5 | error | `frontmatter_unsupported` |
| SLV0-VAL-03 | Nur Felder aus SLV0-PKG-02 | error | `field_unknown` |
| SLV0-VAL-04 | `name` nach SLV0-PKG-03; gleich Ordnername | error | `name_invalid`, `name_folder_mismatch` |
| SLV0-VAL-05 | `description` nach SLV0-PKG-04; `compatibility` höchstens 500 Zeichen (P1) | error | `description_missing`, `description_too_long`, `field_too_long` |
| SLV0-VAL-06 | Relative Markdown-Links `[..](ziel)` und Codeverweise auf `references/…` in `SKILL.md` und `references/*.md` lösen auf eine Datei im selben Paket auf. Absolute Pfade, `..`-Ausbruch und `\` sind Fehler. URLs mit Schema (`https:` usw.) werden nicht verfolgt | error | `reference_missing`, `reference_escapes_package`, `absolute_path` |
| SLV0-VAL-07 | Anker `#…` eines Links: Ziel-Überschrift nach Slug-Regel (Kleinschreibung, Zeichen außer Buchstaben, Ziffern, Leerzeichen und `-` entfernen, Leerzeichen → `-`) vorhanden. Slug-Regeln sind clientabhängig, daher nur Warnung | warning | `anchor_unresolved` |
| SLV0-VAL-08 | Portabilität: Pfadsegmente nur `[A-Za-z0-9._-]`, keine Kollision bei Groß-/Kleinschreibung, keine versteckten Dateien (Name beginnt mit `.`), kein Ausführungsbit, nur zulässige Einträge (SLV0-PKG-01) | error | `path_not_portable`, `case_collision`, `hidden_file`, `executable_content`, `entry_unsupported` |
| SLV0-VAL-09 | Symlinks: kein Symlink im Paket, gleich wohin er zeigt. Die Prüfung folgt Symlinks nicht und terminiert auch bei Schleifen | error | `symlink_in_package` |
| SLV0-VAL-10 | Kodierung: UTF-8 ohne BOM, Zeilenenden LF | error | `encoding_invalid`, `bom_present`, `line_endings_crlf` |
| SLV0-VAL-11 | Projektneutralität: Treffer aus einer übergebenen Liste projektspezifischer Zeichenketten im Paket, mit Zeile. Ohne Liste keine Prüfung und kein Treffer | warning | `project_binding_suspected` |
| SLV0-VAL-12 | Referenzdatei unter `references/` wird von keiner Paketdatei verlinkt | warning | `reference_unused` |
| SLV0-VAL-13 | Größenbudgets (*Vorschlag*, O-6): `SKILL.md` ≤ 500 Zeilen (P1-Empfehlung), ≤ 8 192 Bytes; je Referenzdatei ≤ 16 384 Bytes; Paket ≤ 65 536 Bytes. Gemessen in Bytes, Zeilen und Wörtern, nicht in Tokens | warning | `budget_exceeded` |
| SLV0-VAL-14 | Jede Datei > 1 MiB | error | `file_too_large` |
| SLV0-VAL-15 | Bereich Projekt: Für jedes Paket existiert `.claude/skills/<name>` als **relativer** Symlink, der innerhalb des Repos auf `.agents/skills/<name>` auflöst; keine Kopie, kein absoluter Link, kein Adapter ohne Paket. Der Symlink ist der dokumentierte Claude-Zugang (SL0 §2.2) und in C0 praktisch beobachtet | error | `adapter_missing`, `adapter_link_invalid`, `adapter_orphaned` |
| SLV0-VAL-16 | Registry-Datensatz (falls übergeben): schemakonform; `content_hash.value` gleich berechnetem Hash; keine zwei Datensätze gleicher `skill_id` und `version` mit verschiedenem Hash | error | `registry_invalid`, `hash_mismatch`, `version_hash_conflict` |
| SLV0-VAL-17 | Ausgabe: JSON mit Prüfmeldungen sortiert nach Pfad, Zeile, Code; Zählung nach Schweregrad; Inhaltshash je gültigem Paket; `checked_level: "M0"`. Exit-Code 0 ohne `error`, 1 mit mindestens einem `error`, 2 bei Bedienfehler oder interner Ausnahme. Warnungen ändern den Exit-Code nicht | – | – |

## 6. Token-Zählung (SLV0-TOK)

| ID | Anforderung |
|---|---|
| SLV0-TOK-01 | Jede Tokenzahl ist ein Datensatz `{wert, quelle, methode, bezug, beleg}`. `quelle ∈ {gemeldet, geschaetzt, unbekannt}`. Bei `unbekannt` ist `wert: null` und `methode: null`; sonst ist `methode` ein benannter Tokenizer bzw. Schätzer mit Version (K7.1, K7.6). |
| SLV0-TOK-02 | Gezählt wird je Ladestufe getrennt (SL3-R06): `katalog` (`name` + `description`), `rumpf` (`SKILL.md` ohne Frontmatter), je Referenzdatei, `paket` gesamt. Bytes, Zeilen und Wörter werden immer exakt daneben ausgegeben; sie sind keine Tokens. |
| SLV0-TOK-03 | `gemeldet` nur, wenn ein benannter Tokenizer oder ein Zähldienst für ein benanntes Modell den Wert liefert; `beleg` nennt Dienst, Modell und Zeitpunkt. Ein Zähldienst mit Netz oder Kosten ist nicht Teil von V0 (SLV0-INV-04, O-7). |
| SLV0-TOK-04 | `geschaetzt` nur mit ausdrücklich gewähltem, benanntem Schätzer (z. B. `utf8-bytes-div-4@1`). Ohne Wahl lautet jede Tokenzahl `unbekannt`. Schätzungen werden nie als gemeldet ausgegeben und mit gemeldeten Werten nicht verrechnet. |
| SLV0-TOK-05 | Summen erben die schwächste Quelle (`unbekannt` < `geschaetzt` < `gemeldet`); enthält eine Summe einen unbekannten Summanden, ist sie `unbekannt`. Summen mischen keine Methoden. |
| SLV0-TOK-06 | Run-Usage aus Client-Spuren (Input, Output, Cache-Lesen/-Schreiben) ist `gemeldet` für den **Lauf**, mit Spur-Hash als Beleg. Sie wird keinem einzelnen Skill zugeschrieben; Anteile je Skill bleiben `unbekannt` (C0: Usage-Felder praktisch beobachtet, nur je Lauf). |
| SLV0-TOK-07 | Budgetprüfungen auf Basis geschätzter Tokens erzeugen höchstens Warnungen. Kein Werkzeug behauptet eine Tokenersparnis; dafür braucht es gemessene Vorher-Nachher-Läufe (K7.5). |
| SLV0-TOK-08 | Vom Client gemeldete Kosten (`total_cost_usd`) heißen `kosten_client_schaetzung`; bei Abo-Abrechnung ist die tatsächliche Rechnung `unbekannt` (C0/E1-Ergebnis §1). |

## 7. Eval-Harness (SLV0-EVAL)

Der Harness bereitet Versuche vor, zählt Starts, bewacht Splits, normalisiert Spuren und baut Berichte aus Rohdaten.
Er startet keinen Client (SLV0-INV-04) und urteilt nicht über Qualität (SLV0-INV-06). Grundlage ist der vorhandene Research-Helfer
[`skill_pilot.py`](../../research/skills-meta-prompting/skill_pilot.py) (*im Code gefunden*, 14 Hilfsprogrammtests lokal bestanden); er ist Research, nicht Produkt.

| ID | Anforderung | Stand im Research-Helfer |
|---|---|---|
| SLV0-EVAL-01 | **Einfrieren:** Snapshot enthält je Datei Inhalt und Dateihash, Quellcommit und Paketsatz-Hash nach SLV0-PKG-23. Nur Pfade unter `.agents/skills/`. | vorhanden (`freeze`) |
| SLV0-EVAL-02 | **Prüfen:** Vor jeder Nutzung werden alle Dateihashes und der Paketsatz-Hash neu berechnet; Abweichung → `snapshot_hash_mismatch`, keine Weiterverarbeitung. | vorhanden (`verify_snapshot`) |
| SLV0-EVAL-03 | **Kandidatenbindung:** Kandidat nennt Baseline-Hash und genau eine Dimension; fremde Baseline, zweite Dimension, unbekannte Datei, nicht eindeutige oder fehlende Ersetzung → Ablehnung. Ein Beschreibungskandidat ändert genau die `description`-Zeile. | vorhanden (`variant_files`) |
| SLV0-EVAL-04 | **Vorbereiten:** Jeder Versuch erhält ein frisches Arbeitsverzeichnis; ein vorhandenes Ziel wird nie überschrieben. B0 enthält keine Paketdateien und keinen Adapter; alle Arme erhalten dieselbe Projektkonfiguration (gleicher Hash). Falldateien dürfen Konfiguration (`.claude/`, `.agents/`, `AGENTS.md`, `CLAUDE.md`) nicht überschreiben. | vorhanden (`prepare`) |
| SLV0-EVAL-05 | **Startzähler:** Jeder Start wird **vor** dem Start im Ledger reserviert (`reserved_before_start`); Fehlstarts zählen. Oberhalb des freigegebenen Limits wird abgelehnt. Eine vorhandene Sperre wird nicht überschrieben. Das Ledger ist append-only; ein Ergebnis wird als eigener Eintrag nachgetragen, nicht durch Umschreiben. Der Zähler ist ein Protokoll, keine systemweite Kostensperre. | teilweise (`record-start`; kein Ergebnisnachtrag) |
| SLV0-EVAL-06 | **Split-Manifest:** Vor dem ersten Kandidaten gibt es je Fall `case_id`, `family_id`, `split` und Fall-Hash. Eine Familie liegt in genau einem Split (`family_split_overlap`); `regression` ist keine Testmenge (SL1 §5.5). | fehlt |
| SLV0-EVAL-07 | **Splitzugriff nach Rolle:** Autor sieht nur `dev`; Auswerter `select`; `test` erst, nachdem die Auswahl mit Kandidatenhash protokolliert ist. Verstoß → `split_access_denied`, protokolliert. Nach einer Testnutzung ist der Split `verbraucht`; ein zweiter Kandidat auf demselben Test → `split_consumed` (SL4 §4). Die Zugriffsprüfung ist ein Protokoll im Werkzeug, kein Geheimnisschutz; öffentliche Fixtures sind nie Holdout. | fehlt |
| SLV0-EVAL-08 | **Normalisierung:** Aus einer Client-Spur werden nur Felder einer Positivliste übernommen: Status, sichtbarer Katalog, Tools, Plugins, Modell, Aktivierungsnachweise, Usage, Client-Kostenschätzung, Spur-Hash. Keine Denktexte, keine freien Modellausgaben. Ein beantragter Skill-Aufruf ohne erfolgreiche Antwort ist nicht bestätigt; fehlender Katalog ist `unbekannt`, nicht leer; eine leere oder fehlerhafte Spur ergibt keine negative Auswahl (`absence_is_proven: false`). Aktivierung per Datei-Lesen wird getrennt vom Skill-Werkzeug geführt (Primärquellen F1). | vorhanden (`normalize`); Positivliste implizit |
| SLV0-EVAL-09 | **Rohdatensatz:** je Start ein Datensatz mit den Feldern aus SL1 §8 (`run_id`, `case_id`, `family_id`, `repeat_id`, `attempt_id`, `split`, `ebene`, `variante`, Skill-Hashes, Client, Modell, `eval_version`, `rubrik_version`, `fall_hash`, Referenzen statt Inline-Kopien, `skill_aufrufe` mit `beobachtbar`, `assertions` mit Art und Bewerter, `usage` nach SLV0-TOK-06, Latenz, Fehler). | teilweise (normalisierte Spuren, kein Rohdatenschema) |
| SLV0-EVAL-10 | **Berichte nur aus Rohdaten:** Ein Bericht liest ausschließlich Rohdatensätze, nennt je Zahl Zähler, Nenner und die Rohdatensatz-IDs, trennt Ebenen M0–M5 und R und berichtet Familien und Wiederholungen getrennt. Eine Zahl ohne Rohdatenbezug → `report_without_raw`. Kein Score, keine Aktivierungsempfehlung (SLV0-INV-06). | fehlt |
| SLV0-EVAL-11 | **R-Verstöße** werden je Fall getrennt ausgewiesen und nie mit anderen Ergebnissen verrechnet (SL1 §7). | fehlt |
| SLV0-EVAL-12 | **Baseline-Lauf (Stufe 2):** Der Harness kann eine eingefrorene Baseline mit gespeicherten Rohdaten belegen. Die Läufe selbst sind keine Werkzeugfunktion; sie brauchen Owner-Budget und einen geprüften Client (C0). | Teilbeleg: E1-Auswahl, 12 Starts |

## 8. Fehlerfälle

Codes sind stabile Bezeichner (Englisch, wie Code). Jeder Fehler nennt Pfad und, wo sinnvoll, Zeile.

| Gruppe | Codes | Reaktion |
|---|---|---|
| Format | `frontmatter_missing`, `frontmatter_unsupported`, `field_unknown`, `field_too_long`, `name_invalid`, `name_folder_mismatch`, `description_missing`, `description_too_long` | Paket ungültig; kein Inhaltshash |
| Referenzen | `reference_missing`, `reference_escapes_package`, `absolute_path` · Warnungen `anchor_unresolved`, `reference_unused` | Fehler: Paket ungültig |
| Portabilität | `path_not_portable`, `case_collision`, `hidden_file`, `executable_content`, `entry_unsupported`, `symlink_in_package`, `encoding_invalid`, `bom_present`, `line_endings_crlf`, `file_too_large` | Paket ungültig; kein Inhaltshash |
| Budget, Projekt | Warnungen `budget_exceeded`, `project_binding_suspected` | Exit-Code unverändert |
| Adapter | `adapter_missing`, `adapter_link_invalid`, `adapter_orphaned` | nur Bereich Projekt |
| Registry | `registry_invalid`, `hash_mismatch`, `version_hash_conflict` | Datensatz ungültig; nichts wird korrigiert |
| Eval | `snapshot_hash_mismatch`, `candidate_baseline_mismatch`, `candidate_multi_dimension`, `replacement_not_unique`, `workspace_exists`, `config_overwrite`, `budget_exhausted`, `ledger_locked`, `family_split_overlap`, `split_access_denied`, `split_consumed`, `trace_invalid`, `report_without_raw` | Vorgang abgebrochen, kein Teilergebnis gilt als Erfolg |

Kein Fehler wird still zu einer Warnung herabgestuft, und kein Werkzeug „repariert“ Eingaben (SLV0-INV-08).

## 9. Fallmatrix (SLV0-FALL)

Jeder Fall ist ein späterer Contract-Test mit synthetischen Eingaben, außer -01 und -23 (gelesener Repo-Stand). Erwartungen sind deterministisch.
„Exit“ meint SLV0-VAL-17.

| ID | Fall | Erwartung | Deckt |
|---|---|---|---|
| SLV0-FALL-01 | Die acht Skills und `.claude/skills/` am Ausgangscommit `06869bc6`, Bereich Projekt, ohne Projektliste | 0 Fehler, 0 Warnungen, Exit 0, acht Inhaltshashes (Ad-hoc-Vorprüfung, kein Validatorbeleg) | VAL-01…17 |
| SLV0-FALL-02 | `name: grill` im Ordner `grilling` | `name_folder_mismatch`, Exit 1, kein Hash | VAL-04 |
| SLV0-FALL-03 | `name` mit Großbuchstaben, `--`, führendem `-`, 65 Zeichen (je ein Paket) | je `name_invalid` | VAL-04 |
| SLV0-FALL-04 | `description` leer; 1024 Codepoints; 1025 Codepoints (mit Umlauten) | `description_missing`; gültig; `description_too_long` | VAL-05 |
| SLV0-FALL-05 | Frontmatter fehlt; nur öffnendes `---` | `frontmatter_missing` | VAL-01 |
| SLV0-FALL-06 | Frontmatter mit Blockskalar `description: \|`, Anker `&a`, Flussliste `[a, b]` | je `frontmatter_unsupported`, kein Teilparse | VAL-02 |
| SLV0-FALL-07 | Zusatzfeld `version: 2` | `field_unknown` | VAL-03, PKG-02 |
| SLV0-FALL-08 | Link auf `references/fehlt.md` | `reference_missing` mit Zeile | VAL-06 |
| SLV0-FALL-09 | Links `../anderer/SKILL.md`, `/etc/hosts`, `references\a.md` | `reference_escapes_package`, `absolute_path`, `path_not_portable` | VAL-06, VAL-08 |
| SLV0-FALL-10 | Link mit Anker `#ohne-rückkanal` auf vorhandene Überschrift „Ohne Rückkanal“; zweiter Link mit Anker ohne Überschrift; Link `https://example.invalid` | erster gültig, zweiter `anchor_unresolved` (warning), URL nicht verfolgt; Exit 0 | VAL-07 |
| SLV0-FALL-11 | Symlink `references/a.md → /etc/passwd`; Ordner-Symlink auf sich selbst | je `symlink_in_package`; Prüfung terminiert; kein Hash | VAL-09, PKG-20 |
| SLV0-FALL-12 | `.claude/skills/x` fehlt; ist absoluter Link; ist Kopie; zeigt auf `.agents/skills/y`; Adapter ohne Paket | `adapter_missing`, `adapter_link_invalid` (3×), `adapter_orphaned`; im Bereich Paket keine dieser Meldungen | VAL-15 |
| SLV0-FALL-13 | Datei mit CRLF; mit BOM; mit ungültiger UTF-8-Folge | `line_endings_crlf`, `bom_present`, `encoding_invalid` | VAL-10, PKG-21 |
| SLV0-FALL-14 | `scripts/run.sh`; `assets/x.png`; `.DS_Store`; Ausführungsbit an `SKILL.md` | `entry_unsupported` (2×), `hidden_file`, `executable_content` | VAL-08, PKG-01 |
| SLV0-FALL-15 | `references/A.md` und `references/a.md`; Dateiname `ü.md` | `case_collision`, `path_not_portable` | VAL-08 |
| SLV0-FALL-16 | `SKILL.md` mit 600 Zeilen; Paket 70 000 Bytes | je `budget_exceeded` (warning), Exit 0, Hash wird gebildet | VAL-13 |
| SLV0-FALL-17 | Datei mit 1 MiB + 1 Byte | `file_too_large`, kein Hash | VAL-14 |
| SLV0-FALL-18 | Projektliste `["docs/fragen/"]`, Paket enthält `docs/fragen/` in Zeile 7; ohne Liste | `project_binding_suspected` Zeile 7 (warning); ohne Liste keine Meldung | VAL-11, PKG-05 |
| SLV0-FALL-19 | `references/alt.md` ohne eingehenden Link | `reference_unused` (warning) | VAL-12 |
| SLV0-FALL-20 | Ausgabe zweimal erzeugt, Dateien in anderer Reihenfolge angelegt, andere mtime, anderes Arbeitsverzeichnis | byte-identisches JSON und gleicher Hash | INV-03, PKG-22, VAL-17 |
| SLV0-FALL-21 | Ein Byte in `agents/openai.yaml` eines von zwei Paketen geändert | Hash dieses Pakets und Paketsatz-Hash ändern sich; anderes Paket unverändert | PKG-20, PKG-22/-23 |
| SLV0-FALL-22 | Paket mit nur `SKILL.md` (Inhalt synthetisch, im Test festgelegt) | Hash gleich dem im Test hinterlegten, unabhängig nachgerechneten Wert | PKG-22 |
| SLV0-FALL-23 | Paketsatz-Hash über die Dateien von `skill-pilot-baseline-v2.json` | `4ad5b6dbae228982fe3ba7df6552d9e7029af0fc0c972dde09ad9406f2473967` | PKG-23, EVAL-01 |
| SLV0-FALL-24 | Registry-Datensatz mit falschem Hash; zwei Datensätze `x@1.0.0` mit verschiedenem Hash; `status: approved` ohne `status_evidence` | `hash_mismatch`; `version_hash_conflict`; `registry_invalid` | VAL-16, PKG-12, INV-02 |
| SLV0-FALL-25 | Jeder Befehl gegen ein Testrepo; Paketsatz-Hash und Adapterziele vorher/nachher | unverändert; kein Befehl schreibt `status` | INV-01, INV-08 |
| SLV0-FALL-26 | Token-Zählung ohne gewählten Schätzer | alle Tokenwerte `null`/`unbekannt`; Bytes, Zeilen, Wörter vorhanden | TOK-01/-02/-04 |
| SLV0-FALL-27 | Schätzer `utf8-bytes-div-4@1` gewählt; Summe aus geschätzt und unbekannt | Werte `geschaetzt` mit Methode; Summe `unbekannt` | TOK-04/-05 |
| SLV0-FALL-28 | Normalisierte Spur mit Usage | Lauf-Usage `gemeldet` mit Spur-Hash; je Skill `unbekannt` | TOK-06 |
| SLV0-FALL-29 | Budget nur mit geschätzten Tokens überschritten | höchstens Warnung, Exit 0 | TOK-07 |
| SLV0-FALL-30 | Snapshot-Inhalt nach dem Einfrieren geändert | `snapshot_hash_mismatch` | EVAL-02 |
| SLV0-FALL-31 | Kandidat mit fremder Baseline; zwei Dimensionen; nicht eindeutige Ersetzung; Beschreibungskandidat ändert Rumpf | je Ablehnung mit Code | EVAL-03 |
| SLV0-FALL-32 | Vorbereiten in vorhandenes Verzeichnis; Fall überschreibt `AGENTS.md`; B0-Arm | `workspace_exists`; `config_overwrite`; B0 ohne Paket und Adapter, Konfigurations-Hash gleich B1 | EVAL-04 |
| SLV0-FALL-33 | Start 41 bei Limit 40; Fehlstart; vorhandene Sperre | `budget_exhausted`; Fehlstart zählt; `ledger_locked`, Sperre bleibt | EVAL-05 |
| SLV0-FALL-34 | Familie in `dev` und `test`; Test-Zugriff vor protokollierter Auswahl; zweiter Kandidat auf verbrauchtem Test | `family_split_overlap`; `split_access_denied`; `split_consumed` | EVAL-06/-07 |
| SLV0-FALL-35 | Spur ohne `init`-Katalog; Skill-Aufruf ohne erfolgreiche Antwort; leere Spur; Spur mit Denktext | Katalog `unbekannt`; `confirmed` nicht `true`; keine negative Auswahl; Denktext nicht in der Ausgabe | EVAL-08, INV-05 |
| SLV0-FALL-36 | Bericht soll eine Zahl ohne Rohdatensatz-ID ausgeben | `report_without_raw`; Bericht enthält kein Score- oder Empfehlungsfeld | EVAL-10, INV-06/-09 |
| SLV0-FALL-37 | Fall mit R-Verstoß und sonst bestandenen Assertions | R-Verstoß getrennt ausgewiesen, nicht verrechnet | EVAL-11 |

## 10. Abgrenzung

- **Keine Aktivierung durch Code.** Aktivieren heißt im Repo: Owner mergt einen PR am geprüften Hash (SL4 §5). Werkzeuge liefern Belege, keine Freigaben.
- **Keine Kaskaden.** Werkzeuge rufen keine Skills auf und werten `relations` nicht aus. Komposition, Run-Manifest und Resolver (SL3-R01…R10) sind Stufe 3/6.
- **Keine Qualitätsurteile.** M3/M4 brauchen Rubrik und unabhängige Bewertung (SL1 §7); kein Werkzeug dieser Spec bewertet.
- **Kein Laufzeit-Loader**, keine Auswahl, keine Offline-Synchronisation, keine Änderungspipeline, kein Optimierer, keine Adaptergenerierung, keine UI.
- **Keine neue Dependency** ohne Owner-Freigabe (`AGENTS.md`); deshalb YAML-Teilmenge (SLV0-VAL-02) und kein Tokenizer-Dienst in V0.

## 11. Schemas

| Schema | Inhalt | Beispiel |
|---|---|---|
| [skill-package.schema.json](schemas/skill-package.schema.json) | Registry-Datensatz eines Pakets (SLV0-PKG-10…24) | [skill-paket-demo.json](beispiele/skill-paket-demo.json) |
| [eval-snapshot.schema.json](schemas/eval-snapshot.schema.json) | Snapshot (SLV0-EVAL-01/-02), Form des Research-Helfers | [skill-pilot-baseline-v2.json](../../research/skills-meta-prompting/skill-pilot-baseline-v2.json) |
| [eval-ledger.schema.json](schemas/eval-ledger.schema.json) | Eine Ledger-Zeile: Kopf, Reservierung, Ergebnis, Splitzugriff, Auswahl (SLV0-EVAL-05/-07) | Tests unter `tools/skill-library/test/` |
| [eval-split-manifest.schema.json](schemas/eval-split-manifest.schema.json) | Split-Manifest (SLV0-EVAL-06) | Tests |
| [eval-normalized-trace.schema.json](schemas/eval-normalized-trace.schema.json) | Normalisierte Spur, Positivliste (SLV0-EVAL-08) | Tests |
| [eval-raw-record.schema.json](schemas/eval-raw-record.schema.json) | Rohdatensatz je Start (SLV0-EVAL-09, SL1 §8) | Tests |
| [eval-report.schema.json](schemas/eval-report.schema.json) | Bericht nur aus Rohdaten, ohne Score- und Empfehlungsfeld (SLV0-EVAL-10/-11) | Tests |

Die Eval-Schemas kamen mit dem Eval-Harness-PR (Handover §7); Umsetzung und Auslegungen: [tools/skill-library/README.md](../../tools/skill-library/README.md).
Feldnamen folgen SL3 (Englisch, wie Code); V0 verwendet deutsche Feldnamen. Die Vereinheitlichung ist offen (O-8).

## 12. Offene Punkte

| ID | Punkt | Vorschlag / Wohin |
|---|---|---|
| O-1 | Hash-Kanonisierung (SL3 O-1): zählt `agents/openai.yaml` mit; Normalisierung | Profil `sl-hash-v0` (§4.3) als Vorschlag; Entscheidung mit Review dieser Spec. Generierte Adapter (K1.1) später ggf. neues Profil |
| O-2 | Registry-Ort und -Form (SL3 O-2): Datei je Skill, Library-Manifest oder `metadata`-Feld im Frontmatter | offen; bis dahin keine eingecheckten Registry-Dateien (SLV0-PKG-15) |
| O-3 | Typversionierung der Artefakte (SL3 O-3) | Stufe 3 |
| O-4 | Sprache und Ort der Library-Werkzeuge gegenüber Phase 1 (TypeScript/Next.js) | [Q-20261030-sl-code-sprache](../fragen/skill-library/questions/Q-20261030-sl-code-sprache.md), Owner |
| O-5 | YAML-Teilmenge selbst parsen oder Parser-Dependency | in O-4 enthalten; bis dahin Teilmenge |
| O-6 | Größenbudgets (SLV0-VAL-13) | Vorschlagswerte; nach erster Messreihe mit Tokenizer anpassen |
| O-7 | Quelle für `gemeldet` je Skill (Tokenizer oder Zähldienst mit Schlüssel und Kosten) | eigene Owner-Entscheidung; bis dahin `geschaetzt`/`unbekannt` |
| O-8 | Feldsprache der Schemas (SL3 Englisch vs. V0 Deutsch) | bei Review dieser Spec festlegen |
| O-9 | Wer unabhängige Test-Familien schreibt und verwahrt (SL4 §10) | vor E3; betrifft SLV0-EVAL-07 |

## 13. Rückverfolgung

| Anforderung | Herkunft |
|---|---|
| PKG-01…06 | K1.1, K1.2, Primärquellen P1/F1, SL0 §2.2, SL3 §2, SL-A01 |
| PKG-10…15 | SL3 §2, §8, O-2; SL4 §4/§5; Owner-Antwort Aktivierung |
| PKG-20…24 | SL3 O-1, SL1 §8, K6.2, Research-Helfer `freeze` |
| VAL-01…17 | K1.2, SL0 §2.2/§2.4, PA-R3, RD-R5, SCO-R3, C0-Befund Symlink-Discovery |
| TOK-01…08 | K7.1, K7.3, K7.5, K7.6, SL3 §7, C0 Usage-Felder |
| EVAL-01…12 | K5.1, K5.3, K5.5, K5.7, SL1 §5.5/§7/§8/§9, SL4 §4, Research-Helfer, C0/E1-Ergebnis |
| INV-01…11 | V0-INV-01/-07/-09/-11, SL3, SL4, Plan §1/§7 |

Nächster Schritt: Review dieser Spec zusammen mit dem Handover; Owner beantwortet O-4. Danach erster Implementierungs-PR nach Handover.
