# Skill-Library V0 – Paketvertrag, Validator, Token-Zählung, Eval-Harness

> Version 0.1 · 30.10.2026 · **Entwurf zur Review**, kein Implementierungsbeginn vor Merge dieser Spec (`AGENTS.md`: Spec-driven).
> Ergänzt [V0 – Ziel und Verträge](v0-ziel-und-vertraege.md) und übernimmt deren Konventionen ([README](README.md)): stabile IDs, JSON Schema 2020-12, nur synthetische Beispiele, Fallmatrix als spätere Contract-Tests.
> Reichweite nach Owner-Antwort [A-20261030-sl-reichweite](../fragen/skill-library/questions/Q-20261030-sl-reichweite.md): **Stufen 0–2** (Paketvertrag, Validator, Token-Zählung, Eval-Harness mit Baseline).
> Aktivierung nur durch den Owner am Hash ([A-20261030-sl-aktivierung](../fragen/skill-library/questions/Q-20261030-sl-aktivierung.md)); Feedback nur synthetisch oder freigegeben ([A-20261030-sl-feedbackdaten](../fragen/skill-library/questions/Q-20261030-sl-feedbackdaten.md)).
> Implementierungsauftrag: [library-implementation-handover.md](../../research/skills-meta-prompting/library-implementation-handover.md).
> Version 0.2 · 31.10.2026 · Ergänzung **SLV0-EVAL-13…18** (Rubrik je Skill nach K5.6, Querprüfungen Ledger/Manifest/Git) und Fälle **SLV0-FALL-38…46**; bestehende IDs unverändert.
> Version 0.3 · 31.10.2026 · Ergänzung **SLV0-EVAL-19…27** nach den Paketen P1–P3 des Portierungsplans (`research/skills-meta-prompting/portierungsplan-2026-10-31.md`, Research-Branch `research/e3-runde-2`, PR #20): belegpflichtige Bewertungen, Nulllauf-Trennschärfe mit Gegenkriterium und B1-Vorlauf, erwartete Befunde mit Überberichtung; Formate §7.2–§7.4, Fälle **SLV0-FALL-48…59** (§9.1). Bestehende IDs unverändert.
> Version 0.4 · 31.10.2026 · Ergänzung **SLV0-EVAL-28…30** nach Paket P5 des Portierungsplans (Abdeckungsnachweis über ein Segmentregister, Konzept aus recursive-decomposition-skill): `eval cite-check` prüft die Zitate eines Berichts gegen einen Git-Commit; Format §7.5, Fälle **SLV0-FALL-60…65** (§9.2); O-13 teilweise gelöst. Bestehende IDs unverändert.
> Version 0.5 · 31.10.2026 · Ergänzung **SLV0-EVAL-31…34** nach Paket P11 des Portierungsplans (Kontextpaket als Datensatz, Konzept aus code2prompt, bei uns fail-closed): `eval context-pack` wählt Dateien nur über eine Allowlist, bricht bei ungültigem Muster, leerem Treffer, fehlender Datei, Symlink, Ausbruch oder verbotenem Pfad ab und gibt einen Datensatz mit Hashes aus; Format §7.6, Fälle **SLV0-FALL-66…72** (§9.3), offener Punkt O-14. Bestehende IDs unverändert.
> Version 0.6 · 31.10.2026 · Ergänzung **SLV0-EVAL-35…38** nach Paket P4 des Portierungsplans (Kostenbilanz je Kontextklasse × Turns, Konzept aus skill-cost-optimizer): `eval normalize` behält Usage je Turn und Bytegrößen je Ereignisklasse, `eval raw` übernimmt sie, `eval report` zeigt Summen und Differenzen je Klasse sowie Kosten je erfülltem Kriterium; Format §7.7, Fälle **SLV0-FALL-73…77** (§9.4). Alle neuen Felder sind optional; bestehende IDs, Spuren, Rohdatensätze und Berichte bleiben gültig.

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
| SLV0-EVAL-13 | **Rubrik je Skill (K5.6):** Je Skill gibt es höchstens eine gültige Rubrikdatei `docs/research/rubriken/<skill>.json` nach [eval-rubric.schema.json](schemas/eval-rubric.schema.json) (§7.1). Sie nennt `skill`, `rubrik_version` der Form `<skill>@<n>`, `paket_hash` (Inhaltshash `sl-hash-v0` des Pakets) und Kriterien mit stabiler ID, Ebene (`M3`, `M4`, `R`), Prüfart (`deterministisch`, `rubrik`) und Formulierung. Je Fall-Typ nennt `kern` genau ein Kriterium dieses Typs. Kriterien beschreiben beobachtbares Verhalten aus dem `SKILL.md`-Rumpf, keine Stilfragen. Kriterien-IDs sind über alle Rubriken eindeutig. Schema- oder Verweisfehler → `rubric_invalid`; doppelte ID → `rubric_id_duplicate`. | teilweise (Kriterien je Lauf in `e1v-e2-plan.json`, `kern_kriterium` je E3-Fall) |
| SLV0-EVAL-14 | **Rubrikprüfung:** `eval rubric check` prüft jede Rubrik nach EVAL-13 und vergleicht `paket_hash` mit dem aktuellen Inhaltshash des Pakets im Arbeitsbaum oder in einem geprüften Snapshot (EVAL-02). Abweichung oder fehlendes bzw. ungültiges Paket → `rubric_stale`. Eine veraltete Rubrik wird nicht automatisch neu gebunden; jede Änderung an Kriterien oder Bindung ist eine neue `rubrik_version` in einem eigenen PR (library-learning §8). Liest nur. | fehlt |
| SLV0-EVAL-15 | **Rubrikversion in Rohdaten und Bericht:** `raw --rubric` übernimmt die `rubrik_version` der Rubrik; eine abweichende Angabe in den Metadaten, eine Assertion der Art `rubrik` oder mit `r_regel`, deren ID kein Kriterium der Rubrik ist, oder eine Assertion mit Kriteriums-ID, aber anderer Prüfart bzw. anderer `r_regel` → `rubric_mismatch`. Bei Variante `B1` muss der Inhaltshash des Rubrik-Skills im Datensatz gleich `paket_hash` sein, sonst `rubric_stale`; nennt `B1` den Skill nicht, `rubric_mismatch`. Kandidatenarme tragen absichtlich einen anderen Hash und werden nicht gebunden. Ein Bericht nennt alle Rubrikversionen mit Rohdatensatz-IDs und mischt nie zwei Versionen derselben Rubrik (gleicher Teil vor `@`; Versionen ohne diese Form gelten als eine Rubrik); ein Verstoß oder eine Abweichung von `report --rubric-version` → `rubric_version_mixed`, kein Bericht. | fehlt |
| SLV0-EVAL-16 | **Querprüfung Rohdatensatz ↔ Ledger:** Mit `raw --ledger` muss `attempt_id` im Ledger reserviert sein, und deren `trial_id` muss `<case_id>--<variante>` lauten (Benennung aus EVAL-04). Liegt ein Ergebnis vor, gilt: ein gesetzter `trace_sha256` ist gleich `spur_sha256`, nicht leere `raw_ids` enthalten `run_id`. Abweichung → `ledger_mismatch`. Das Ledger wird nur gelesen. | fehlt |
| SLV0-EVAL-17 | **Querprüfung Vorbereiten ↔ Split-Manifest:** Mit `prepare --manifest` wird das Manifest nach EVAL-06 geprüft; jeder Fall muss darin mit gleichem Fall-Hash stehen. Fall fehlt → `case_not_in_manifest`; Hash weicht ab → `case_hash_mismatch`. Alle Fälle werden vor dem ersten Schreiben geprüft; bei Ablehnung entsteht kein Zielverzeichnis. Der `split` jedes Versuchs kommt dann aus dem Manifest. | fehlt (`split check --cases` vergleicht nur nachträglich) |
| SLV0-EVAL-18 | **Quellcommit gegen Git:** `freeze --source-commit SHA --verify-git` prüft vor dem Einfrieren, dass `SHA` gleich der vollständigen Ausgabe von `git rev-parse HEAD` ist (sonst `source_commit_mismatch`) und dass unter `.agents/skills/` keine geänderte, ungetrackte oder ignorierte Datei liegt (sonst `worktree_dirty`). Die Prüfung liest nur (`git --no-optional-locks`); Git ist kein Client im Sinne von SLV0-INV-04. Nur ein Modul darf dafür einen Prozess starten, ausschließlich `git`. Ohne `--verify-git` wird Git nicht aufgerufen. | fehlt |
| SLV0-EVAL-19 | **Belegpflichtige Bewertung (Format):** Eine Bewertungsdatei nach [eval-judgement.schema.json](schemas/eval-judgement.schema.json) (§7.2) nennt je bewerteter Ausgabe (anonymer Code) und je Kriterium einen `status` (`erfuellt`, `nicht_erfuellt`, `unklar`) und genau eine Belegart `beleg_art`: `zitat` (wörtlicher Text aus der bewerteten Ausgabe), `fixture` (wörtlicher Text aus der Fixture des Falls), `abwesenheit` (ein `suchbegriff`, der in der Ausgabe nicht vorkommt) oder `fehlt`. Kommentar steht getrennt in `anmerkung` und wird nie als Beleg gelesen. | Prototyp `e3/verify_quotes.py` (Research-Branch), ohne Belegart |
| SLV0-EVAL-20 | **Wiederfund:** Ausgabe, Fixture-Dateien, Zitate und Suchbegriffe werden gleich normalisiert (§7.2): typografische Anführungszeichen werden zu `"` bzw. `'`, die Markdown-Zeichen `*` `` ` `` `\|` `_` `>` `#` zu Leerzeichen, jeder Leerraum zu einem Leerzeichen; Ränder entfallen. Auslassungen (`…`, `...`, `(...)`, `[...]`, `(…)`, `[…]`) teilen ein Zitat in Fragmente; es zählen nur Fragmente mit mindestens 12 Zeichen (Codepoints nach Normalisierung). Ein Zitat ist gefunden, wenn alle Fragmente **in dieser Reihenfolge** und ohne Überlappung im Text stehen; Groß- und Kleinschreibung zählen. Ein `fixture`-Zitat muss in einer einzigen Fixture-Datei stehen. Ein Suchbegriff belegt Abwesenheit nur, wenn er (mindestens 3 Zeichen nach Normalisierung) ohne Beachtung der Groß- und Kleinschreibung nirgends in der Ausgabe steht. | Prototyp: gleiche Normalisierung für `„“”`, Fragmente ohne Reihenfolge |
| SLV0-EVAL-21 | **Belegprüfung `eval judge check`:** prüft eine Bewertung gegen die bewerteten Ausgaben (`<code>.md`) und, falls angegeben, die Fixtures. Je Kriterium ist der Beleg `verifiziert`, `nicht_gefunden` oder `ohne_beleg` (Belegart `fehlt` oder kein Fragment mit 12 Zeichen). Ein `erfuellt` ohne verifizierten Beleg wird `unklar` (`evidence_missing` bzw. `evidence_not_found`); `nicht_erfuellt` und `unklar` bleiben, ein nicht gefundener Beleg wird trotzdem gemeldet. Die Zählung nennt Kriterien je Belegergebnis, angegebenen und geprüften Status, herabgestufte Urteile sowie Fragmente gesamt, gefunden (ohne Reihenfolge; Vergleichszahl zum Prototyp) und in Reihenfolge. Ältere Bewertungen ohne `schema_version` werden kompatibel gelesen (§7.2): Belege in Anführungszeichen gelten als `zitat`, andere als `zitat` mit Hinweis `evidence_unquoted`, leere oder mit „fehlt“ beginnende als `fehlt`. Exit 1 bei mindestens einem Fehlercode, sonst 0. Liest nur. | Prototyp zählt nur Fragmente; keine Folge für das Urteil |
| SLV0-EVAL-22 | **Fallordner und Prüfformat:** Ein Fall ist ein Ordner mit `fall.json` nach [eval-case.schema.json](schemas/eval-case.schema.json) und der Fixture unter `fixture/` (§7.3). `checks` sind deterministische Dateiprüfungen im Prüfformat des Research-Prüfers `check_case.py` (§7.3); jede Prüfung hat genau eine Regel, ihre ID ist `id` oder `<case_id>-P<nn>` (Position ab `01`). Änderungen ergeben sich aus dem Vergleich Ausgangsstand ↔ Arbeitsverzeichnis (hinzugefügt, geändert, gelöscht; `.git/` ausgenommen), nicht aus Git. `eval check` wertet die Prüfungen gegen ein Arbeitsverzeichnis aus (Ausgangsstand `--baseline`, sonst die Fixture) und gibt je Prüfung eine Assertion der Art `deterministisch` für den Rohdatensatz aus, mit Trennschärfe (EVAL-23) und Rolle (EVAL-24). Unbekannte oder mehrere Regeln, ungültiges Muster oder unsicherer Pfad → Exit 2. Liest nur. | `check_case.py` (Research-Branch); Änderungen dort per `git status` |
| SLV0-EVAL-23 | **Nulllauf-Trennschärfe:** `eval nullrun` wertet jede Prüfung eines Falls gegen die **unveränderte** Fixture aus (Ausgangsstand = Arbeitsverzeichnis = Fixture). Fällt der Nulllauf durch, ist die Prüfung `trennend`; besteht er, ist sie `erhaltend`: sie zeigt nur, dass nichts kaputtging, nicht dass etwas getan wurde. Ein Fall ohne trennende Prüfung erhält den Hinweis `no_discriminating_check`; sein Ergebnis beruht dann allein auf Bewertung. Der Hinweis ändert den Exit-Code nicht. Liest nur. | fehlt (Nulllauf von Hand: 20 von 31 Prüfungen erhaltend) |
| SLV0-EVAL-24 | **Trennschärfe, Kern und Gegenkriterium in Rohdaten und Bericht:** Eine deterministische Assertion darf `trennschaerfe` tragen (`trennend`, `erhaltend`; `null` = nicht gegen einen Nulllauf geprüft). Je Rohdatensatz trägt höchstens eine Assertion `rolle: kern` und höchstens eine `rolle: gegen`, nie eine R-Assertion. Ein Fall nennt neben `kern_kriterium` optional ein `gegen_kriterium` (nur zusammen mit dem Kern); nennt `eval check` eine Prüf-ID als Kern oder Gegenkriterium, erhält deren Assertion die Rolle. Der Bericht weist deterministische Assertions getrennt nach trennend, erhaltend und nicht geprüft aus. Sind alle deterministischen Assertions eines Falls markiert und ist keine trennend, meldet er `no_discriminating_check` für diesen Fall. Kern und Gegenkriterium werden **je Stichprobe konjunktiv** verrechnet: bestanden nur, wenn beide bestanden sind; nicht bestanden, wenn eines nicht bestanden ist; sonst unklar. Nenner sind die Rohdatensätze mit beiden Rollen, nie ein Produkt von Mittelwerten. Widersprüchliche Markierung derselben Assertion-ID in einem Fall → Exit 2. | fehlt |
| SLV0-EVAL-25 | **B1-Vorlauf in select (E3-Form der Nulllauf-Trennschärfe):** Vor jedem Kandidatenstart in select läuft nur B1 auf den select-Fällen des Kandidaten. B1 wird absolut und nur am Kernkriterium bewertet, mit anonymisierten Ausgaben: durch den deterministischen Prüfer des Falls, sonst durch eine getrennte Bewerter-Session mit Belegprüfung (EVAL-21). Erfüllt B1 den Kern in **allen** diesen Fällen, ist die select-Familienmenge `nicht_trennend`: kein Kandidatenstart in select; entweder schreibt eine getrennte Session eine trennende Familie, oder der Kandidat wird zurückgestellt („zurückgestellt, Familie nicht trennend“). Verfehlt B1 den Kern in mindestens einem Fall, ist sie `trennend`; der Kandidat läuft in select, und die B1-Läufe bilden die B1-Seite der Paare (kein zweiter B1-Start). `eval nullrun --b1-kern` bildet die Entscheidung aus den Kernurteilen nach [eval-b1-vorlauf.schema.json](schemas/eval-b1-vorlauf.schema.json): `trennend` mit den trennenden Fall-IDs (Exit 0); `nicht_trennend` mit `family_not_discriminating` (Exit 1); verfehlt B1 keinen Fall, ist aber mindestens ein Urteil `unklar`, `unklar` mit `core_verdict_unclear` (Exit 1). Liest nur und startet nichts. | Owner-Freigabe A-20261031-e3-b1-vorlauf (PR #20); Evidenz E3-Runde 2, Ergebnis §4–§5 |
| SLV0-EVAL-26 | **Erwartete Befunde mit 1:1-Zuordnung:** Ein Fall darf `erwartete_befunde` tragen: je Befund `id`, `token_gruppen` (Liste von Gruppen, je Gruppe Alternativen), optional `fundstelle_datei` und `gewicht` (`kritisch` oder `normal`, Standard `normal`). Die Ausgabe wird in Einheiten zerlegt (Absätze, Listenpunkte, Tabellenzeilen, Überschriften; §7.4). Ein Befund passt auf eine Einheit, wenn jede Gruppe mit mindestens einer Alternative als ganzes Wort vorkommt (normalisiert nach EVAL-20, ohne Groß- und Kleinschreibung; `*` am Ende einer Alternative erlaubt ein Präfix) und, falls angegeben, `fundstelle_datei` (Pfad oder Dateiname) in derselben Einheit steht. Zuordnung 1:1: jeder Befund höchstens einer Einheit, jede Einheit höchstens einem Befund. Die Zuordnung ist maximal; kritische Befunde werden zuerst zugeordnet, dann alle in Fall-Reihenfolge, Einheiten in Textreihenfolge. | fehlt (Konzept aus skill-optimization, nur Konzept) |
| SLV0-EVAL-27 | **Überberichtung und `eval findings`:** Jede in der Ausgabe genannte Fundstelle (`pfad:zeile`, `pfad:von-bis`, `pfad#Lx`, `pfad#Lx-Ly`) und jede Commit-ID (7–40 Hex-Zeichen mit mindestens einer Ziffer und einem Buchstaben) wird in der Fixture nachgeschlagen (§7.4). Gibt es keine Datei mit diesem Pfad oder Pfadende, liegt eine genannte Zeile in keiner passenden Datei zwischen 1 und dem Dateiende, oder steht der Commit in keiner Fixture-Datei (auch nicht als Präfix eines dort genannten Commits oder umgekehrt), ist das eine `ueberberichtung` mit Grund und Zeile der Ausgabe. `eval findings` berichtet je Ausgabe getroffene Befunde (mit Einheit und Zeile), verfehlte, kritisch verfehlte und Überberichtungen. Exit 0: das sind Messwerte, keine Ablehnung. Liest nur. | fehlt |
| SLV0-EVAL-28 | **Segmentregister am Commit:** Der Suchraum eines Berichts wird einmal aufgezählt: alle regulären Dateien (Git-Modus `100644` oder `100755`; keine Symlinks, keine Submodule) im Baum des angegebenen Commits, optional eingeschränkt durch Bereiche (`--scope`: Pfadpräfix oder Glob mit `*`, `**`, `?`; §7.5). Ein Segment ist eine Datei mit ihren Zeilen 1…n (Zeilenzählung wie §7.4). Der Commit wird als 7–40 Hex-Zeichen angegeben und über Git aufgelöst; nennt er keinen eindeutigen Commit → `commit_unknown`, kein Register (Exit 1). Ein Bereich, der keine Datei trifft, ein unsicherer Bereich, ein Verzeichnis ohne Git-Repository oder eine andere Commit-Schreibweise (z. B. `HEAD`) sind Bedienfehler (Exit 2). Gelesen wird nur über das Git-Modul aus SLV0-EVAL-18 mit den lesenden Unterbefehlen `rev-parse`, `ls-tree` und `cat-file`; Arbeitsbaum, Index und Refs bleiben unverändert. | fehlt (Konzept RD: Suchraum einmal aufzählen, bearbeitete Segmente protokollieren) |
| SLV0-EVAL-29 | **Zitate und ihre Gültigkeit:** Zitate eines Markdown-Berichts sind GitHub-Permalinks `https://github.com/<o>/<r>/blob/<ref>/<pfad>` mit optionalem Anker `#L<a>` oder `#L<a>-L<b>` und Fundstellen `pfad:zeile`, `pfad:von-bis`, `pfad#Lx`, `pfad#Lx-Ly` (Erkennung wie §7.4), die sich auf den angegebenen Commit beziehen. Ein Permalink, dessen `<ref>` keine Commit-ID aus 7–40 Hex-Zeichen ist → `ref_not_pinned`; dessen Commit Git nicht eindeutig kennt → `commit_unknown`; der einen anderen Commit als den angegebenen nennt → `sha_mismatch`. Ein Pfad, den es am Commit nicht als reguläre Datei gibt → `path_missing`; eine Fundstelle, die auf keinen Pfad genau, aber mit ihrem Pfadende auf mehrere Dateien passt → `path_ambiguous`; eine Zeile außerhalb von 1…n der Datei oder `bis` < `von` → `range_out_of_bounds`. Permalinks prüfen den Pfad genau, Fundstellen genau oder über das Pfadende ab einer Segmentgrenze. Mit `--github <o>/<r>` gelten Permalinks auf andere Repos als `fremd` und werden nicht geprüft. Jedes Hex-Wort im übrigen Text (Erkennung wie §7.4) wird in Git als Commit nachgeschlagen; unbekannt → Warnung `commit_unverified`, weil ein Hex-Wort auch ein anderer Hash sein kann. | fehlt (`eval findings` prüft nur gegen den Fixture-Text, O-13) |
| SLV0-EVAL-30 | **Abdeckung und `eval cite-check`:** Eine Registerdatei ist **belegt**, wenn mindestens ein gültiges Zitat sie nennt; ein gültiges Zitat auf eine Datei außerhalb der Bereiche zählt als `ausserhalb_bereich` und belegt nichts. Die Ausgabe nennt Commit, Bereiche, Registergröße Y, die belegten Dateien (X) mit zusammengeführten Zeilenbereichen und Zahl der belegten Zeilen, die vollständige Liste der nicht belegten Dateien, den Satz „X von Y Dateien belegt; nicht belegt: …“, jedes Zitat mit Berichtszeile und Ergebnis, die nachgeschlagenen Commit-Wörter sowie Zählungen. Exit 1, sobald ein Zitat ungültig ist (SLV0-EVAL-29, ohne die Warnung); nicht belegte Dateien sind ein Messwert und ändern den Exit-Code nicht. Das Werkzeug weiß nicht, was gelesen wurde, nur was belegt ist. Liest nur. | fehlt |
| SLV0-EVAL-31 | **Allowlist und Muster:** Ein Kontextpaket entsteht nur aus einer Allowlist-Datei nach [eval-context-allowlist.schema.json](schemas/eval-context-allowlist.schema.json) (§7.6): `ziel`, optional `rolle`, `eingaben` (mindestens ein Eintrag aus `muster` und optional `wofuer`) und optional `sperre`. Ein Muster ist ein Pfad oder ein Glob mit `*`, `?` und `**` relativ zur Wurzel (Syntax §7.6). Ein Muster mit unzulässiger Syntax (leer, leeres oder `.`-Segment, `/` am Ende, `**` nicht als ganzes Segment, Steuerzeichen, reservierte Zeichen `[ ] { } ! \`, nur Platzhalter) → `pattern_invalid`; ein absolutes Muster oder eines mit `..`-Segment → `path_escapes_root`. Diese Prüfung läuft vor jedem Dateizugriff; ist ein Muster ungültig, wird nichts ausgewählt. | fehlt (code2prompt: ungültige Muster werden übergangen, *im Konzept* fail-open) |
| SLV0-EVAL-32 | **Auswahl fail-closed:** Jedes Muster muss mindestens eine reguläre Datei treffen. Ein Pfad-Muster ohne Datei (auch bei abweichender Groß- und Kleinschreibung) → `file_missing`; ein Pfad-Muster auf ein Verzeichnis oder eine andere Nicht-Datei → `not_regular_file`; ein Glob ohne Treffer → `pattern_unmatched`. Ein Symlink im Pfad eines Treffers oder ein Symlink, den ein Glob trifft oder durchlaufen müsste → `symlink_in_pack`; Symlinks werden nie verfolgt. Liegt ein Treffer unter einem gesperrten Pfad (§7.6: Standardsperren `**/.git`, `**/.env*`, `**/kandidaten`, ergänzt durch `sperre` und `--deny`, nie verkleinert) → `path_forbidden`, ohne die Datei zu lesen; liegt er unter einem Unterordner mit eigenem `.git` (fremdes oder eingebettetes Repository) → `nested_repository`. Eine Datei, die kein UTF-8-Text ist (ungültige Folge oder NUL-Byte) → `file_not_text`. Alle Meldungen werden gesammelt; schon eine führt zu Exit 1 ohne Datensatz und ohne Darstellung. Es gibt weder ein leeres Paket noch ein Paket „alles“. | fehlt |
| SLV0-EVAL-33 | **Datensatz:** Bei Erfolg gibt `eval context-pack` den Datensatz nach [eval-context-pack.schema.json](schemas/eval-context-pack.schema.json) auf stdout aus: Hash der Allowlist-Datei, `ziel`, `rolle`, Muster mit Trefferzahl, wirksame Sperrliste, je Datei Pfad (relativ zur Wurzel, `/`), SHA-256 der unveränderten Bytes, Bytes, Zeilen, Tokenzahl nach SLV0-TOK-01/-04 (ohne `--estimator` `unbekannt`, sonst `geschaetzt` mit Methode) und die Indizes der Muster, die sie treffen; Dateien kommen je nur einmal vor und sind nach Codepoint sortiert. `kontextpaket_sha256` ist der Hash nach der Formel aus SLV0-PKG-22 über `{<Pfad>: <Dateihash>}`. Der Datensatz enthält keinen Zeitstempel und keinen absoluten Pfad; gleiche Eingabebytes ergeben einen byte-gleichen Datensatz (SLV0-INV-03). Die Tokenzahl ist eine Schätzung, kein Messwert (SLV0-TOK-07). | fehlt |
| SLV0-EVAL-34 | **Darstellung erst nach dem Datensatz:** Mit `--output DATEI` wird zusätzlich ein Markdown-Bündel nach §7.6 geschrieben, und zwar nur aus dem fertigen Datensatz und nur, wenn die Auswahl vollständig gelungen ist. Die Datei wird exklusiv neu angelegt; existiert der Pfad schon (auch als Symlink) → `output_exists`, nichts wird geschrieben oder überschrieben. Der Datensatz nennt dann Format, SHA-256 und Bytes des Bündels, nicht dessen Pfad. Außer dieser Datei schreibt der Befehl nichts; ohne `--output` liest er nur. | fehlt |
| SLV0-EVAL-35 | **Usage je Turn:** Die Normalisierung einer rohen Spur setzt zusätzlich `cost_balance` (§7.7). Ein Turn ist eine Modellantwort der Hauptsitzung: alle `assistant`-Ereignisse ohne `parent_tool_use_id` mit gleicher `message.id` (ohne `message.id` je Ereignis ein Turn), gezählt in der Reihenfolge des ersten Auftretens. Usage des Turns sind die vier Felder `input_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, `output_tokens` aus `message.usage` des **letzten** Ereignisses des Turns, so wie gemeldet; ein fehlendes Feld ist `null` (unbekannt, nie 0). Die Turn-Summe je Feld ist `null`, sobald ein Turn das Feld nicht meldet oder es keinen Turn gibt. Der Rest je Feld ist Gesamt-Usage der Spur (SLV0-EVAL-08) minus Turn-Summe, vorzeichenbehaftet, `null`, wenn eines davon unbekannt ist; er zeigt Usage, die keinem Turn der Hauptsitzung zugeordnet ist (z. B. Unteragenten) oder je Turn nicht final gemeldet wurde (`output_tokens` bei Claude Code 2.1.316, O-15). Beim Import aus `skill-pilot-v1` ist `cost_balance` `null`. | fehlt (nur Lauf-Usage, SLV0-TOK-06) |
| SLV0-EVAL-36 | **Größen je Ereignisklasse:** Jeder Inhaltsblock der `assistant`- und `user`-Ereignisse gehört zu genau einer Klasse (§7.7): `skill_laden`, `datei_lesen`, `tool_ergebnis:<Tool>`, `assistant_text`, `assistant_werkzeugaufruf`, `assistant_denken`, `nutzer_text`, `unteragent` oder `nicht_zuordenbar`. Je Klasse stehen Blockzahl, Bytes (UTF-8, exakt) und Bytes × Folgeturns (Zahl der späteren Turns der Hauptsitzung, deren Eingabe den Block enthält; „Dauergeladenes kostet Größe × Nachrichten“). **Invariante:** Die Summen über alle Klassen sind gleich `bytes_total` bzw. `bytes_x_later_turns_total`; was keiner benannten Klasse zugeordnet werden kann, steht in `nicht_zuordenbar`, nie in keiner Klasse. Ausgegeben werden nur Größen, nie Inhalte (SLV0-EVAL-08). Tokens je Klasse meldet kein Client; sie sind `unbekannt` oder nach SLV0-TOK-04 mit benanntem Schätzer `geschaetzt` und werden nie mit gemeldeter Usage verrechnet. | fehlt |
| SLV0-EVAL-37 | **Kostenbilanz in Rohdatensatz und Bericht:** `eval raw` übernimmt `cost_balance` als `kostenbilanz` (abgeleitet, nicht aus Metadaten; `null` ohne Bilanz). `eval report [--estimator NAME]` weist je Ebene und Variante aus: Läufe mit Bilanz, Turns, Turn-Usage nach SLV0-TOK-05, Rest, Bytes und Bytes × Folgeturns je Klasse und gesamt, Tokens je Klasse (geschätzt oder `unbekannt`). Differenzen gibt es für `B1` − `B0` und für jeden Kandidaten `K-…` − `B1`, nur über Fälle mit Läufen beider Varianten auf derselben Ebene; jede Differenz nennt Minuend, Subtrahend, beide Werte und die Rohdatensatz-IDs beider Seiten. Ein Lauf ohne Bilanz macht jeden Wert seiner Population `unbekannt` (`null` mit Grund), nie 0; innerhalb eines Laufs mit Bilanz ist eine fehlende Klasse 0 Bytes. Kein Quotient außer SLV0-EVAL-38, kein Score, keine Empfehlung. Ältere Rohdatensätze ohne das Feld bleiben gültig und gelten als ohne Bilanz. | fehlt |
| SLV0-EVAL-38 | **Kosten je erfülltem Kriterium:** je Ebene und Variante die Summe der `kosten_client_schaetzung` (SLV0-TOK-08) geteilt durch die Zahl der bestandenen Assertions ohne `r_regel` (deterministisch und Rubrik) aus den Rohdatensätzen. Der Wert ist `unbekannt`, wenn ein Lauf keine Kostenschätzung hat oder keine Assertion bestanden ist; Kosten, Zähler (bestanden) und Nenner (alle Assertions ohne `r_regel`) stehen mit Rohdatensatz-IDs daneben. R-Assertions zählen nie mit (SLV0-EVAL-11). | fehlt (K7.7 offen) |

### 7.1 Rubrikformat (SLV0-EVAL-13)

| Feld | Inhalt |
|---|---|
| `skill`, `rubrik_version` | Paketname; Version `<skill>@<n>`, `n` ab 1. Der Teil vor `@` ist gleich `skill`. |
| `paket_hash` | `{algorithm: sha256, profile: sl-hash-v0, value}`: der Inhaltshash, gegen den die Kriterien formuliert wurden. |
| `grundlage` | Woraus die Kriterien abgeleitet sind (Rumpf, übernommene Laufkriterien). |
| `kriterien[]` | `id` (`<KÜRZEL>-K<nn>`), `ebene` (`M3` Verhalten mit geladenem Skill, `M4` paarweiser Vergleich gegen den Vergleichsarm, `R` harte Regel), `pruefart` (`deterministisch` aus der Spur, `rubrik` durch Bewerter), `formulierung` (ein beobachtbarer Satz), `r_regel` (bei `R` die Regel `R-nn`, sonst `null`), `herkunft` (Rumpfschritt und übernommene Fall- oder Laufkriterien). |
| `fall_typen[]` | `id`, `beschreibung`, `kriterien` (IDs, die für diesen Typ bewertet werden), `kern` (genau eine dieser IDs: das Kriterium, ohne dessen Erfüllung der Fall nicht als bestanden gilt; Vorbild `kern_kriterium` in E3), `faelle` (Verweise auf vorhandene Fall-IDs, nur Daten). |

Rubriken bewerten nichts selbst und enthalten keine Schwellen oder Scores (SLV0-INV-06). Eine Rubrik ist kein Freigabebeleg: Ob die Kriterien
den Skill treffen, entscheidet die Owner-Review der Rubrik-PR (O-10).

### 7.2 Bewertungsformat und Belegprüfung (SLV0-EVAL-19…21)

Die Belegprüfung urteilt nicht über Qualität. Sie prüft nur, ob die Belege eines Bewerters dort stehen, wo er sie verortet, und nimmt
einem `erfuellt` ohne prüfbaren Beleg die Geltung (SLV0-INV-06).

| Feld | Inhalt |
|---|---|
| `schema_version`, `format` | `1` und `sl-eval-judgement@1`; ohne `schema_version` gilt die Datei als ältere Bewertung (unten). |
| `bewerter` | Wer bewertet hat, z. B. eine benannte, verblindete Bewerter-Session. |
| `ausgaben` | Objekt `{<code>: Ausgabe}`; der Code ist der anonyme Dateiname der Ausgabe ohne `.md` (`^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`). |
| Ausgabe | `fall` (sicherer relativer Pfad; Fixture unter `<fixtures>/<fall>/fixture/`), `kriterien[]`; optional `kern_erfuellt`, `erfuellt`, `r_verstoss`, `auffaelligkeiten` (Angaben des Bewerters, nicht geprüft). |
| Kriterium | `kriterium` (ID oder Formulierung), `status`, `beleg_art`; `beleg` (Text oder Liste von Texten, je Text ein Zitat) nur und dann Pflicht bei `zitat` und `fixture`; `suchbegriff` nur und dann Pflicht bei `abwesenheit`; optional `kern` (boolesch), `anmerkung` (wird nie geprüft). |
| `paare` | Paarurteile mit Begründung; nur Daten, nicht geprüft (O-11). |

**Normalisierung `sl-judge-norm@1`:** `„ “ ” « »` → `"`, `‚ ‘ ’` → `'`; `*`, `` ` ``, `|`, `_`, `>`, `#` → Leerzeichen; jede Folge von Leerraum → ein
Leerzeichen; führender und folgender Leerraum entfällt. Anführungs- und Leerzeichen an den Rändern eines Fragments werden vor dem Vergleich entfernt.

**Ältere Bewertungen** (ohne `schema_version`): `ausgaben` oder `faelle`; je Ausgabe `kriterien` oder `punkte`; je Kriterium `status` oder `urteil`,
Beleg aus `beleg` oder `zitat`, Bezeichnung aus `kriterium`, `punkt`, `nr` oder `id`. Ein leerer oder mit „fehlt“ beginnender Beleg ist `fehlt`.
Enthält der Beleg Teile in Anführungszeichen (`„…“`, `"…"`, `«…»`, `‚…‘`, je mindestens 6 Zeichen), ist jeder Teil ein `zitat` und der Text dazwischen
Kommentar. Das gilt nur, wenn mindestens ein Teil ein Fragment mit 12 Zeichen ergibt; sonst (keine oder nur kurze Teile, etwa ein zitierter Name)
ist der ganze Beleg ein `zitat`, und der Bericht nennt `evidence_unquoted`. Ein kurzes Innenzitat verdeckt so keinen wörtlich vorhandenen Beleg.

### 7.3 Fallordner und Prüfformat (SLV0-EVAL-22…24)

Ein Fallordner enthält `fall.json` und `fixture/`. Felder von `fall.json`: `id`, `prompt` (Pflicht); `family_id`, `split`, `rubrik`, `rubrik_kriterien`,
`kern_kriterium`, `gegen_kriterium` (nur mit `kern_kriterium`), `checks`, `erwartete_befunde`, `erwartung`, `erreichbar`, `quelle`. Andere Felder sind unzulässig.

Eine Prüfung ist ein Objekt mit optional `id` und genau einer Regel. Pfade sind relativ zum Arbeitsverzeichnis mit `/`. Dateien werden als UTF-8 gelesen
(ungültige Folgen werden ersetzt). Jede Regel mit `file` ist nicht bestanden, wenn die Datei fehlt.

| Regel | Felder | bestanden, wenn |
|---|---|---|
| `frontmatter` | `file`, `{schluessel: wert}` | Die Datei beginnt mit `---` und Zeilenumbruch; bis zur ersten folgenden Zeile, die mit `---` beginnt, gilt jede Zeile mit `:` als `schluessel: wert` (am ersten `:` getrennt, Ränder ohne Leerraum, kein Entquoten). Jeder genannte Schlüssel hat genau den Wert. |
| `frontmatter_in` | `file`, `{schluessel: [werte]}` | wie oben, der Wert liegt in der Liste |
| `contains` / `not_contains` | `file`, Text | die Datei enthält den Text wörtlich bzw. nicht (ohne Normalisierung) |
| `regex` | `file`, Muster | das Muster (ECMAScript-Syntax, ohne Flags; `\w` nur ASCII) trifft irgendwo in der Datei |
| `count_at_least` | `file`, `[Text, n]` | der Text kommt mindestens `n`-mal ohne Überlappung vor (`n` ≥ 1) |
| `absent_anywhere` | Text | keine Datei des Arbeitsverzeichnisses enthält den Text; Ordner `.git/` und `.claude/` (auf jeder Ebene) und Symlinks ausgenommen |
| `only_changed_under` | Präfix | jeder hinzugefügte, geänderte oder gelöschte Pfad beginnt mit dem Präfix |
| `no_new_files_under` | Präfix | kein hinzugefügter Pfad beginnt mit dem Präfix |
| `new_file_under` | Präfix, optional `contains_any` | mindestens ein hinzugefügter Pfad mit dem Präfix, dessen Inhalt einen der Texte enthält (ohne `contains_any`: irgendein hinzugefügter Pfad) |

Ausgangsstand und Arbeitsverzeichnis werden als Dateibäume verglichen: reguläre Dateien nach Bytes, Symlinks nach Ziel, ohne ihnen zu folgen.

**Trennschärfe:** Im Nulllauf ist das Arbeitsverzeichnis die unveränderte Fixture. `trennend` heißt, der Nulllauf fällt durch; `erhaltend`, er besteht.
**Rollen:** `kern` und `gegen` markieren die Assertions, die das Kernkriterium bzw. das Gegenkriterium eines Falls prüfen. Das Gegenkriterium schließt den
trivialen Weg zum Kern aus (z. B. „erfüllt den Kern, ohne die eigentliche Aufgabe zu erledigen“).

### 7.4 Erwartete Befunde und Überberichtung (SLV0-EVAL-26/-27)

| Feld | Inhalt |
|---|---|
| `id` | eindeutig im Fall (Muster wie Fall-IDs) |
| `token_gruppen` | Liste von Gruppen; jede Gruppe ist eine Liste von Alternativen (Text, mindestens ein Zeichen nach Normalisierung). Alle Gruppen müssen vorkommen. |
| `fundstelle_datei` | optional: relativer Pfad in der Fixture; die Einheit muss ihn oder seinen Dateinamen enthalten |
| `gewicht` | `kritisch` oder `normal` (Standard) |

**Einheiten:** Die Ausgabe wird zeilenweise gelesen. Eine Leerzeile beendet eine Einheit. Eine Zeile, die (nach Einrückung) mit einem Listenzeichen
(`-`, `*`, `+` oder Zahl mit `.` bzw. `)`, je gefolgt von Leerraum), mit `|` (Tabellenzeile) oder mit `#` (Überschrift) beginnt, eröffnet eine neue Einheit;
eine Überschrift ist eine Einheit für sich. Andere Zeilen setzen die laufende Einheit fort. Einheiten tragen Nummer und Startzeile.

**Wortgrenze:** Vor und nach einem Treffer steht kein Buchstabe und keine Ziffer; bei einer Alternative mit `*` am Ende entfällt die Grenze rechts.

**Fundstellen:** erkannt im unveränderten Ausgabetext, nachdem URLs (`schema://` bis zum nächsten Leerraum) ausgeblendet sind; der Pfad hat mindestens
eine Dateiendung, die mit einem Buchstaben beginnt, und steht nicht hinter `/`, `.`, `-` oder einem Wortzeichen (absolute Pfade werden daher nicht geprüft). Führende `./` entfallen. Passend sind Fixture-Dateien mit genau
diesem Pfad oder mit diesem Pfadende ab einer Segmentgrenze. Zeilen zählen ab 1; eine Datei hat so viele Zeilen wie Zeilenumbrüche, plus eine, wenn
sie nicht mit einem Zeilenumbruch endet. **Commit-IDs:** Wörter aus 7–40 Zeichen `0-9a-f` mit mindestens einer Ziffer und einem Buchstaben, nach Abzug
umgebender Satz- und Auszeichnungszeichen; bekannt ist ein Commit, wenn ein Hex-Wort aus 7–40 Zeichen in einer Fixture-Datei mit ihm beginnt oder er mit ihm.

### 7.5 Belegabdeckung am Commit (SLV0-EVAL-28…30)

`eval cite-check --repo VERZ --commit SHA BERICHT.md [--scope BEREICH]... [--github OWNER/REPO]`. Eingaben sind das untersuchte Repository
(ein Git-Repository, gelesen nur über Git), der Commit, auf den sich der Bericht bezieht, und genau ein Bericht als Markdown. Es gibt keine JSON-Eingabe.

| Eingabe | Regel |
|---|---|
| `--repo` | Verzeichnis eines Git-Repositorys (Arbeitsbaum oder bare); sein Pfad erscheint nicht in der Ausgabe |
| `--commit` | 7–40 Zeichen `0-9a-f`; wird mit `rev-parse` zu genau einem Commit aufgelöst. Die Ausgabe nennt den vollständigen Hash. |
| `--scope` | wiederholbar; relativer POSIX-Pfad ohne `..`, `\` und führendes `/`. Ohne `*` und `?` ein Präfix: der Pfad selbst oder alles darunter (ein `/` am Ende ist erlaubt). Mit `*` oder `?` ein Glob über den ganzen Pfad: `*` und `?` treffen kein `/`, `**` trifft beliebig viele Segmente (`**/` auch keines). Eine Datei gehört zum Register, wenn ein Bereich sie trifft; ohne `--scope` alle Dateien. Jeder Bereich muss mindestens eine Datei treffen. |
| `--github` | `<owner>/<repo>`; Vergleich ohne Groß- und Kleinschreibung. Ohne die Option werden alle GitHub-Permalinks gegen das angegebene Repository geprüft. |

**Permalinks:** `https://github.com/<owner>/<repo>/blob/<ref>/<pfad>`, optional `?…` und Anker `#L<a>[C<n>]` bzw. `#L<a>[C<n>]-L<b>[C<n>]`.
Der Pfad endet vor Leerraum, `)`, `]`, `>`, `"`, `'`, `` ` ``, `?` oder `#`; ohne Anker entfallen Satzzeichen `. , ; : !` am Ende; Prozentkodierung wird aufgelöst.
Ein Permalink ohne Anker belegt die ganze Datei. Links auf `tree/`, Links mit anderem Anker und andere Hosts sind keine Zitate.
**Fundstellen** werden im Text gesucht, nachdem alle URLs ausgeblendet sind; Erkennung und `./`-Präfix wie §7.4. Passt eine Fundstelle genau auf einen Pfad,
gilt dieser, sonst das Pfadende ab einer Segmentgrenze. **Commit-Wörter** wie §7.4, im Text ohne URLs; bekannt ist ein Wort, das Git zu einem Commit auflöst.

Gelesen wird `git ls-tree -r -z --full-tree <commit>` für das Register und `git cat-file blob <objekt>` nur für zitierte Dateien (Zeilenzahl).
Zeilenbereiche einer Datei werden zusammengeführt, wenn sie sich überlappen oder aneinandergrenzen. Pfade werden nach Codepoint sortiert ausgegeben (SLV0-INV-03).

### 7.6 Kontextpaket (SLV0-EVAL-31…34)

`eval context-pack --allowlist DATEI [--root VERZ] [--deny MUSTER]... [--estimator utf8-bytes-div-4@1] [--output NEUE-DATEI.md]`.
Zweck: Clean-Room-Sessions (Implementierung, Familienautor, Bewerter) erhalten nur ein geprüftes Paket, z. B. nie `kandidaten/` und nie ein fremdes Repository.
Erst entsteht die Auswahl als Datensatz, dann – falls verlangt – die Darstellung. Jede Unklarheit bricht ab; nichts wird übergangen.

**Allowlist-Datei** (`sl-context-allowlist@1`): die maschinenlesbare Form einer Inputliste, wie sie eine Übergabe für die implementierende Session führt
(Vorbild: Implementierungsübergabe §3 „Inputs für die implementierende Session“, Spalten *Input* und *Wofür*; im Ablauf `resuming-work` das aktuelle
Kontextpaket mit Ziel). Abschnittsangaben wie „§3–§6“ sind dort Lesehinweise; die Allowlist wählt ganze Dateien, und `wofuer` trägt den Hinweis als Text.

| Feld | Inhalt |
|---|---|
| `schema_version`, `format` | `1` und `sl-context-allowlist@1` |
| `ziel` | Wofür das Paket gebaut wird, eine Zeile (Auftrag, Paket, Fall) |
| `rolle` | optional: Session, die das Paket erhält, z. B. `implementierung`, `familienautor`, `bewerter` (nur Daten) |
| `eingaben[]` | je Eintrag `muster` (Pflicht) und optional `wofuer` (eine Zeile, nur Daten) |
| `sperre[]` | optional: zusätzliche Sperrmuster; sie ergänzen die Standardsperren, ersetzen sie nie |

**Mustersyntax:** relativer POSIX-Pfad aus Segmenten, getrennt durch `/`. `*` trifft beliebig viele Zeichen außer `/`, `?` genau eines außer `/`;
`**` ist nur als ganzes Segment erlaubt und trifft beliebig viele Segmente, am Ende des Musters mindestens eines (`docs/**` trifft alles unter `docs/`,
nicht `docs` selbst; `a/**/b.md` trifft auch `a/b.md`). `*` und `?` treffen auch einen führenden Punkt. Ohne `*` und `?` ist das Muster ein **Pfad** und
muss genau eine reguläre Datei bezeichnen; ein Verzeichnis als Pfad wählt nichts aus (`not_regular_file`), dafür gibt es `verz/**`. Unzulässig sind
leere Muster, leere oder `.`-Segmente, `/` am Ende, `***` und `**` innerhalb eines Segments, Steuerzeichen, die reservierten Zeichen `[ ] { } ! \`
(keine Zeichenklassen, Klammern oder Negation) und Muster nur aus `*`, `?` und `/` (`pattern_invalid`). Absolute Muster (`/…`, Laufwerksbuchstabe)
und `..`-Segmente sind `path_escapes_root`. Groß- und Kleinschreibung zählen; jedes Segment eines Pfad-Musters muss mit genau diesem Namen im
Verzeichnis stehen.

**Sperren:** gleiche Syntax wie Muster, ohne die Regel „nur Platzhalter“. Ein Pfad ist gesperrt, wenn ein Sperrmuster ihn oder einen seiner
übergeordneten Ordner trifft, ohne Beachtung der Groß- und Kleinschreibung. Standardsperren, immer wirksam: `**/.git` (Git-Daten, auch eingebetteter
Repositories), `**/.env*` (Umgebungsdateien mit möglichen Secrets), `**/kandidaten` (Kandidatenordner, die eine Clean-Room-Session nicht sehen darf).
Weitere Sperren kommen aus `sperre` der Allowlist und aus `--deny` (wiederholbar); der Datensatz nennt jede Sperre mit Quelle (`standard`,
`allowlist`, `aufruf`). Gesperrte Treffer eines Globs werden je gesperrtem Ordner zusammengefasst gemeldet; ihr Inhalt wird nie gelesen.

**Fremde Repositories:** Ein Treffer, in dessen übergeordnetem Ordner unterhalb der Wurzel ein Eintrag `.git` (Ordner oder Datei) liegt, gehört zu
einem anderen Repository → `nested_repository`. Die Wurzel selbst darf ein Repository sein.

**Durchlauf:** Ein Glob beginnt bei seinen führenden Pfadsegmenten ohne Platzhalter; fehlt dieser Ordner, ist das `pattern_unmatched`, ist er oder einer
seiner Teile ein Symlink, `symlink_in_pack`. Verzeichnisse werden nach Codepoint sortiert und ohne Symlink-Folgen gelesen; betreten wird ein Ordner nur,
wenn das Muster darunter noch etwas treffen kann. Ein Symlink, den das Muster trifft oder betreten müsste, ist `symlink_in_pack`. Mehrere Muster dürfen
dieselbe Datei treffen; sie steht einmal im Paket, mit allen Musterindizes.

**Datensatz** (`sl-context-pack@1`, Felder siehe Schema): `allowlist.sha256` über die Bytes der Allowlist-Datei; `muster[]` in Allowlist-Reihenfolge
mit `index`, `art` (`pfad`, `glob`), `wofuer` und Trefferzahl; `sperrliste[]`; `dateien[]` nach Codepoint; `summe` (Dateien, Bytes, Zeilen, Tokens nach
SLV0-TOK-05); `schaetzer`; `bundle` (`null` ohne `--output`). Zeilen zählen wie §7.4.

**Markdown-Bündel** (`sl-context-bundle@1`): UTF-8, LF, in dieser Reihenfolge:

1. `# Kontextpaket`, Leerzeile, dann je eine Zeile `- Format: \`sl-context-bundle@1\``, `- Kontextpaket-Hash (sha256, sl-hash-v0): \`<hash>\``,
   `- Ziel: <ziel>`, `- Rolle: <rolle oder –>`, `- Dateien: <n> · Bytes: <b> · Tokens: <Tokenangabe>`; Leerzeile; der Satz
   „Nur die folgenden Dateien gehören zum Paket. Tokenzahlen sind Schätzungen, keine Messwerte.“
2. Je Datei in Datensatzreihenfolge: Leerzeile, `## <i>. <Pfad als Inline-Code>`, Leerzeile, `- sha256: \`<hash>\` · Bytes: <b> · Tokens: <Tokenangabe>`,
   Leerzeile, ein Codeblock aus Backticks (mindestens drei, eins mehr als die längste Backtick-Folge der Datei), darin die unveränderten Bytes der
   Datei, gefolgt von einem Zeilenumbruch, falls die Datei nicht mit einem endet, dann der schließende Zaun.

Die Tokenangabe lautet `<wert> (Schätzung <methode>)` bzw. `unbekannt`. Pfade und Hashes im Bündel sind die des Datensatzes; der Datensatz nennt den
SHA-256 des Bündels. Ein Leser kann so jede Datei aus dem Bündel lösen und gegen den Datensatz prüfen.

**Bedienfehler (Exit 2):** Allowlist fehlt, ist kein JSON oder verletzt ihr Schema; `--root` ist kein Verzeichnis (auch kein Symlink darauf);
unbekannter Schätzer; der Ordner von `--output` fehlt. Ein Muster ist kein Bedienfehler, sondern Inhalt der Allowlist: seine Fehler sind Codes mit Exit 1.

### 7.7 Kostenbilanz je Kontextklasse und Turn (SLV0-EVAL-35…38)

`eval normalize` ergänzt die normalisierte Spur um `cost_balance`; `eval raw` übernimmt sie als `kostenbilanz`; `eval report` bildet daraus
den Block `kostenbilanz` je Ebene. Alle drei Felder sind in den Schemas optional, damit frühere Artefakte gültig bleiben; die Werkzeuge setzen sie immer
(bei Spuren ohne Rohformat als `null`).

**Turns.** Gezählt werden `assistant`-Ereignisse, deren `parent_tool_use_id` fehlt oder `null` ist. Ereignisse mit gleicher `message.id` bilden einen Turn
(der Client zerlegt eine Antwort in mehrere Ereignisse und wiederholt dabei die Usage); maßgeblich ist das letzte Ereignis. `N` ist die Zahl der Turns.

**Blöcke und Bytes.** Betrachtet werden die Inhalte (`message.content`) aller `assistant`- und `user`-Ereignisse; ein Inhalt als Zeichenkette ist ein Block.
Gemessen wird die UTF-8-Länge der Nutzlast: `text` bei Textblöcken, `thinking` bzw. `data` bei Denkblöcken, das JSON von `input` (ohne Leerraum) bei
Werkzeugaufrufen, bei Werkzeugergebnissen der Inhalt (Zeichenkette; bei einer Liste je Element `text` oder sonst das JSON des Elements; fehlend 0),
bei allen anderen Blöcken das JSON des ganzen Blocks.

| Klasse | Blöcke |
|---|---|
| `skill_laden` | Ergebnis eines `Skill`-Aufrufs; Ergebnis eines `Read` auf `.agents/skills/<name>/SKILL.md` bzw. `.claude/skills/<name>/SKILL.md` (wie SLV0-EVAL-08); Text-Blöcke eines `user`-Ereignisses der Hauptsitzung mit `isSynthetic: true`, das nach einem erfolgreichen `Skill`-Ergebnis und vor dem nächsten `assistant`-Ereignis steht (so spielt Claude Code 2.1.316 den Skill-Rumpf ein) |
| `datei_lesen` | Ergebnis eines anderen `Read` |
| `tool_ergebnis:<Tool>` | Ergebnis eines anderen Werkzeugs; `<Tool>` ist dessen Name (`[A-Za-z0-9_.:-]`, höchstens 128 Zeichen) |
| `assistant_text`, `assistant_denken`, `assistant_werkzeugaufruf` | Text-, Denk- (`thinking`, `redacted_thinking`) und Werkzeugaufruf-Blöcke der Hauptsitzung |
| `nutzer_text` | Text-Blöcke und Zeichenketten-Inhalte von `user`-Ereignissen der Hauptsitzung |
| `unteragent` | jeder Block eines Ereignisses mit gesetzter `parent_tool_use_id` |
| `nicht_zuordenbar` | Werkzeugergebnis ohne bekannten Aufruf oder mit ungültigem Werkzeugnamen, unbekannter Blocktyp, Block, der kein Objekt ist |

**Folgeturns.** Ein Block eines `assistant`-Ereignisses aus Turn `k` und ein Block eines `user`-Ereignisses, vor dem `k` Turns begonnen haben, steht in der
Eingabe der Turns `k+1 … N`; seine Folgeturns sind `N − k`. Blöcke der Klasse `unteragent` haben 0 Folgeturns. Der Systemprompt und der Skill-Katalog
erscheinen in der Spur nicht als Inhalt; ihr Anteil steckt nur in der gemeldeten Eingabe-Usage je Turn.

**Bericht.** Je Ebene: `je_variante` (Felder nach SLV0-EVAL-37/-38) und `differenzen` (`minuend`, `subtrahend`, `case_ids`, Rohdatensatz-IDs beider Seiten,
Differenzen für Turns, Turn-Usage, Rest, Bytes und Bytes × Folgeturns gesamt und je Klasse, Kosten). Turn-Usage folgt SLV0-TOK-05/-06 (`gemeldet`,
Methode `client-usage@<modell>`); verschiedene Methoden ergeben eine unbekannte Differenz. Tokens je Klasse werden aus der Bytesumme der Klasse mit dem
gewählten Schätzer gebildet, ohne Schätzer `unbekannt`.

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
| Kostenbilanz | kein eigener Code (SLV0-EVAL-35…38): Unbekanntes ist `null` mit Grund; ein unbekannter Schätzer bei `eval report --estimator` ist ein Bedienfehler (Exit 2) | Bericht wird erzeugt; nichts wird zu 0 ergänzt |
| Rubrik | `rubric_invalid`, `rubric_id_duplicate`, `rubric_stale`, `rubric_mismatch`, `rubric_version_mixed` | Prüfung fehlgeschlagen bzw. Rohdatensatz oder Bericht nicht erzeugt; nichts wird neu gebunden |
| Querprüfung | `ledger_mismatch`, `case_not_in_manifest`, `case_hash_mismatch`, `source_commit_mismatch`, `worktree_dirty` | Vorgang abgebrochen; Ledger, Manifest und Git-Stand bleiben unverändert |
| Belege, Trennschärfe | `evidence_not_found`, `evidence_missing` · Warnung `evidence_unquoted` (SLV0-EVAL-21) · Warnung `no_discriminating_check` (SLV0-EVAL-23/-24) · `family_not_discriminating`, `core_verdict_unclear` (SLV0-EVAL-25) | Belegprüfung fehlgeschlagen bzw. kein Kandidatenstart in select (Exit 1); Warnungen ändern den Exit-Code nicht; nichts wird korrigiert oder neu bewertet |
| Befund (Messwert) | `ueberberichtung` mit Grund `pfad_fehlt`, `zeile_ausserhalb` oder `commit_unbekannt` (SLV0-EVAL-27) | Teil des Ergebnisses von `eval findings`, keine Ablehnung (Exit 0) |
| Zitate am Commit | `commit_unknown` (auch für `--commit`: dann Abbruch ohne Register), `sha_mismatch`, `ref_not_pinned`, `path_missing`, `path_ambiguous`, `range_out_of_bounds` · Warnung `commit_unverified` (SLV0-EVAL-28/-29) | Zitat ungültig, belegt nichts, Exit 1; nichts wird korrigiert. Nicht belegte Dateien sind ein Messwert, kein Code |
| Kontextpaket | `pattern_invalid`, `path_escapes_root` (SLV0-EVAL-31) · `pattern_unmatched`, `file_missing`, `not_regular_file`, `symlink_in_pack`, `path_forbidden`, `nested_repository`, `file_not_text` (SLV0-EVAL-32) · `output_exists` (SLV0-EVAL-34) | Abbruch mit Exit 1, alle Meldungen gesammelt; kein Datensatz, kein Bündel, keine Teilauswahl |

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
| SLV0-FALL-38 | Rubrik ohne `kern`; `kern` nicht unter den Kriterien des Fall-Typs; Fall-Typ verweist auf unbekanntes Kriterium; `R`-Kriterium ohne `r_regel`; `rubrik_version` mit fremdem Skill; Dateiname ungleich `<skill>.json` | je `rubric_invalid`, Exit 1 | EVAL-13 |
| SLV0-FALL-39 | Zwei Kriterien mit gleicher ID in einer Rubrik; gleiche ID in zwei Rubriken; zwei Rubriken für denselben Skill | `rubric_id_duplicate` (2×); `rubric_invalid` | EVAL-13 |
| SLV0-FALL-40 | Rubrik passend gebunden; danach ein Byte im Paket geändert; Paket fehlt; Prüfung gegen Snapshot mit dem alten Inhalt | ok; `rubric_stale`; `rubric_stale`; ok | EVAL-14 |
| SLV0-FALL-41 | Die acht Rubriken unter `docs/research/rubriken/` gegen den Arbeitsbaum | 0 Meldungen, Exit 0, acht Rubriken, je Fall-Typ ein `kern` | EVAL-13/-14 |
| SLV0-FALL-42 | `raw --rubric`: Metadaten ohne Version; mit anderer Version; Rubrik-Assertion mit unbekannter ID; Kriteriums-ID mit falscher Prüfart; B1 mit Skill-Hash ungleich `paket_hash` | Version übernommen; `rubric_mismatch` (3×); `rubric_stale` | EVAL-15 |
| SLV0-FALL-43 | Bericht aus Rohdaten mit `grilling@1` und `grilling@2`; mit `grilling@1` und `researching-repositories@1`; `--rubric-version grilling@2` bei Rohdaten `grilling@1` | `rubric_version_mixed`, kein Bericht; Bericht mit zwei Versionen und IDs; `rubric_version_mixed` | EVAL-15 |
| SLV0-FALL-44 | `raw --ledger`: `attempt_id` nicht reserviert; andere `trial_id`; Ergebnis mit anderem Spur-Hash; `raw_ids` ohne `run_id`; alles passend | je `ledger_mismatch`; zuletzt Rohdatensatz, Ledger unverändert | EVAL-16 |
| SLV0-FALL-45 | `prepare --manifest`: Fall fehlt im Manifest; Fall nach dem Manifest geändert; Manifest mit Familienüberlappung; passend | `case_not_in_manifest`; `case_hash_mismatch`; `family_split_overlap`; je ohne Zielverzeichnis; zuletzt `split` aus dem Manifest | EVAL-17, EVAL-06 |
| SLV0-FALL-46 | `freeze --verify-git` in einem Test-Git-Repo: passender HEAD und sauberer Baum; anderer Commit; geänderte, ungetrackte bzw. ignorierte Datei unter `.agents/skills/`; Änderung außerhalb; Option ohne `--source-commit`; ohne Git-Repo | ok; `source_commit_mismatch`; `worktree_dirty` (3×); ok; Exit 2; Exit 2. Git-Status vorher/nachher gleich; nur ein Modul startet `git` | EVAL-18, INV-04 |

### 9.1 Fälle zu SLV0-EVAL-19…27

Gleiche Konventionen wie oben; -51 und -54 sind Gleichheitstests auf gespeicherten Research-Daten (Kopie mit Herkunft und Hashes als Test-Fixture).

| ID | Fall | Erwartung | Deckt |
|---|---|---|---|
| SLV0-FALL-48 | `judge check`, neues Format: Zitat mit anderem Leerraum, Markdown-Zeichen und typografischen Anführungszeichen; erfundenes Zitat; zwei Fragmente in umgekehrter Reihenfolge; Zitat nur aus Fragmenten unter 12 Zeichen; `fixture`-Beleg aus der Fixture; `zitat`, das nur in der Fixture steht | verifiziert; `evidence_not_found` und `erfuellt` → `unklar`; `evidence_not_found`; `evidence_missing`, `ohne_beleg`, `unklar`; verifiziert mit Fixture-Datei; `evidence_not_found` mit Hinweis `nur_in_fixture`. Exit 1 | EVAL-19/-20/-21 |
| SLV0-FALL-49 | `abwesenheit` mit fehlendem Begriff; mit dem Begriff in anderer Schreibweise in der Ausgabe; `fehlt` bei `erfuellt` und bei `nicht_erfuellt`; Bewertung nur mit verifizierten Belegen | verifiziert; `evidence_not_found`, `unklar`; `evidence_missing` nur beim ersten; Exit 0, alle Kriterien verifiziert | EVAL-20/-21 |
| SLV0-FALL-50 | Ältere Bewertung: Beleg mit Teilen in Anführungszeichen und Kommentar; Beleg ohne Anführungszeichen; Beleg mit nur kurzem Innenzitat, der wörtlich in der Ausgabe steht; „fehlt (…)“; `punkte`/`urteil`. Neues Format verletzt das Schema (`zitat` ohne `beleg`); Ausgabe-Code `../x`; Ausgabedatei fehlt | nur die zitierten Teile geprüft; `zitat` und Warnung `evidence_unquoted`; als Ganzes verifiziert; `fehlt`; gelesen; Exit 2 (3×) | EVAL-21 |
| SLV0-FALL-51 | Gleichheitstest: die vier gespeicherten Bewertungen E3 Runde 1 (Test, Regression, Select) und M4 mit ihren Ausgaben | Fragmente gefunden wie in der Zitatprüfung (101/101, 25/25, 49/55, 66/83), zuzüglich der Belege, deren Innenzitate kein Fragment ergeben und die deshalb als Ganzes geprüft werden (Test +1, M4 +2): 102/102, 25/25, 49/55, 66/85; in Reihenfolge 101/102, 24/25, 49/55, 65/85 (drei Belege setzen Fragmente in umgekehrter Reihenfolge zusammen) | EVAL-20/-21 |
| SLV0-FALL-52 | Jede Regel aus §7.3 auf einem synthetischen Ausgangsstand und Arbeitsverzeichnis, je bestanden und nicht bestanden; Datei fehlt; `eval check` mit Kern- und Gegenprüfung; Prüfung mit zwei Regeln; unbekannte Regel; ungültiges Muster; `file: ../x` | wie §7.3; nicht bestanden „Datei fehlt“; Assertions `deterministisch` mit `trennschaerfe` und `rolle`; Exit 2 (4×) | EVAL-22, EVAL-24 |
| SLV0-FALL-53 | `nullrun` auf synthetischen Fällen: Prüfung, die an der unveränderten Fixture besteht bzw. durchfällt; Fall nur mit erhaltenden Prüfungen; Fixture vor und nach dem Lauf | `erhaltend` bzw. `trennend`; Warnung `no_discriminating_check`, Exit 0; Fixture unverändert | EVAL-23 |
| SLV0-FALL-54 | Gleichheitstest: die acht grilling-Dev-Fälle D1–D8 der Research-Runde | 31 Prüfungen: 20 erhaltend, 11 trennend; nur D8 ohne trennende Prüfung | EVAL-23 |
| SLV0-FALL-55 | Bericht aus Rohdaten mit markierten Assertions; Fall nur mit erhaltenden Assertions; `trennschaerfe` an einer Rubrik-Assertion; zwei Assertions `rolle: kern`; Rolle an einer R-Assertion; widersprüchliche Markierung über zwei Rohdatensätze | trennend, erhaltend und nicht geprüft getrennt; `no_discriminating_check` für diesen Fall; Exit 2 (4×) | EVAL-24 |
| SLV0-FALL-56 | Fünf Stichproben: Kern bestanden + Gegen nicht bestanden; Kern nicht bestanden + Gegen bestanden; beide bestanden; Kern bestanden + Gegen unklar; Kern ohne Gegen. `fall.json` mit `gegen_kriterium` ohne `kern_kriterium` | `kern_und_gegen` 1/4 bestanden, 2/4 nicht bestanden, 1/4 unklar; 1/5 ohne Kern oder Gegen; kein Feld mit dem Produkt der Einzelquoten (3/4 × 2/4); Exit 2 | EVAL-24 |
| SLV0-FALL-57 | `nullrun --b1-kern`: B1 erfüllt den Kern in allen select-Fällen; verfehlt ihn in einem; verfehlt keinen, ein Urteil `unklar`; doppelte Fall-ID | `nicht_trennend` mit `family_not_discriminating`, Exit 1; `trennend` mit dieser Fall-ID, Exit 0; `unklar` mit `core_verdict_unclear`, Exit 1; Exit 2 | EVAL-25 |
| SLV0-FALL-58 | `findings`: eine Einheit passt auf zwei Befunde, davon einer kritisch; ein Befund passt auf zwei Einheiten; eine Token-Gruppe fehlt; Treffer über eine Alternative; `fundstelle_datei` fehlt in der Einheit; Token `9` in „2019“; Präfix `verdoppel*` | die Einheit geht an den kritischen Befund; der Befund zählt einmal; verfehlt; getroffen; verfehlt; kein Treffer; Treffer. Zählung getroffen, verfehlt, kritisch verfehlt | EVAL-26 |
| SLV0-FALL-59 | Überberichtung: `vendor/a.py:3` vorhanden; `fehlt.py:1`; `a.py:99` hinter dem Dateiende; `a.py#L2-L40`; nur Dateiname `a.py:2`; Präfix eines in der Fixture genannten Commits; unbekannter Commit; Hex-Wort ohne Ziffer; URL mit Port | ok; `pfad_fehlt`; `zeile_ausserhalb` (2×); ok; ok; `commit_unbekannt`; nicht geprüft (2×). Exit 0, Fixture und Ausgabe unverändert | EVAL-27 |

### 9.2 Fälle zu SLV0-EVAL-28…30

Jeder Test legt ein synthetisches Git-Repository in einem temporären Verzeichnis an (`git init`, feste Autor- und Datumsangaben) und entfernt es danach.
Ausgangslage: Commit C1 mit `src/a.js` (5 Zeilen), `src/b.js` (3 Zeilen), `docs/guide.md` (2 Zeilen) und `README.md` (1 Zeile); Commit C2 fügt
`src/neu.js` hinzu und ändert `README.md`. Geprüft wird gegen C1, wenn nicht anders genannt.

| ID | Fall | Erwartung | Deckt |
|---|---|---|---|
| SLV0-FALL-60 | Bericht belegt alle vier Dateien: Permalinks mit `#L2-L4` und `#L1` auf `src/a.js`, Fundstelle `src/b.js:1-3`, `guide.md:2` (nur Pfadende), Permalink ohne Anker auf `README.md` mit abgekürztem C1 | 4 von 4 Dateien belegt; `src/a.js` mit Bereich `[1,4]` (zusammengeführt), 4 belegte Zeilen; `README.md` ganz; keine Meldung; Exit 0 | EVAL-28/-29/-30 |
| SLV0-FALL-61 | Falscher SHA: Permalink mit unbekanntem Commit; mit C2 statt C1; mit `blob/main/…`; `--commit` unbekannt | `commit_unknown`; `sha_mismatch`; `ref_not_pinned`; Exit 1. Unbekanntes `--commit`: Abbruch `commit_unknown`, kein Register, Exit 1 | EVAL-28/-29 |
| SLV0-FALL-62 | Bereich hinter dem Dateiende: `src/b.js:4`; Permalink `src/a.js#L4-L6`; `src/a.js:0`; `src/a.js:3-2`; daneben `src/a.js:5` | `range_out_of_bounds` (4×); `src/a.js:5` gültig; Exit 1; ungültige Zitate belegen nichts (`src/b.js` nicht belegt) | EVAL-29 |
| SLV0-FALL-63 | Datei fehlt am Commit: `src/neu.js:1` (erst in C2); Permalink auf `src/fehlt.js`; Fundstelle `a.js:1`, wenn es `src/a.js` und `lib/a.js` gibt | `path_missing` (2×); `path_ambiguous`; Exit 1 | EVAL-29 |
| SLV0-FALL-64 | Nicht belegte Dateien und Bereiche: Bericht belegt nur `src/a.js` und zitiert `README.md:1`; ohne `--scope`; `--scope src/`; `--scope '**/*.md'`; `--scope fehlt/`; `--scope ../x`; Permalink auf ein anderes Repo mit `--github` | 2 von 4, nicht belegt `docs/guide.md`, `src/b.js`, Exit 0; 1 von 2 und `README.md` `ausserhalb_bereich`; 1 von 2 (`README.md`), `docs/guide.md` nicht belegt; Exit 2 (2×); `fremd`, nicht geprüft | EVAL-28/-30 |
| SLV0-FALL-65 | Commit-Wörter und Bedienung: C2 als Hex-Wort im Text; unbekanntes Hex-Wort; Verzeichnis ohne Git; `--commit HEAD`; Bericht fehlt; zwei Berichte. Git-Status, Refs, Index und Bericht vor und nach dem Lauf | bekannt; Warnung `commit_unverified`, Exit 0; Exit 2 (4×); unverändert | EVAL-28/-29, INV-04 |

### 9.3 Fälle zu SLV0-EVAL-31…34

Jeder Test legt einen synthetischen Dateibaum in einem temporären Verzeichnis an und entfernt ihn danach. Ausgangslage: `docs/spec.md`, `docs/notes.md`,
`src/a.js`, `src/lib/b.js`, `research/kandidaten/K-1/SKILL.md`, `.env`, `.git/config` (als Ordner, die Wurzel ist ein Repository).

| ID | Fall | Erwartung | Deckt |
|---|---|---|---|
| SLV0-FALL-66 | Allowlist `docs/spec.md`, `src/**/*.js`, `docs/*.md` (überlappend), zweimal ausgeführt, beim zweiten Mal mit anderem Arbeitsverzeichnis und in anderer Reihenfolge angelegten Dateien; dritter Lauf nach Änderung eines Bytes in `src/a.js` | Exit 0; Dateien `docs/notes.md`, `docs/spec.md`, `src/a.js`, `src/lib/b.js` nach Codepoint, `docs/spec.md` mit zwei Musterindizes; `kontextpaket_sha256` gleich dem unabhängig nach SLV0-PKG-22 berechneten Wert; beide Datensätze byte-gleich; dritter Lauf anderer Hash. Ohne `--estimator` Tokens `unbekannt`, mit Schätzer `geschaetzt` | EVAL-33, INV-03, TOK-04 |
| SLV0-FALL-67 | Tippfehler und Syntax: `src/**/*.sj` (trifft nichts); `docs/spek.md` (fehlt); `Docs/spec.md` (Schreibweise); `src/***`; `**`; `docs/`; `docs/[ab].md`; `!docs/spec.md`; Tippfehler neben gültigen Mustern | `pattern_unmatched`; `file_missing` (2×); `pattern_invalid` (5×); je Exit 1, kein Datensatz, auch nicht für die gültigen Muster (ein leeres Muster verletzt schon das Schema, Exit 2) | EVAL-31/-32 |
| SLV0-FALL-68 | Gesperrte Pfade: `research/**/*.md` trifft `research/kandidaten/K-1/SKILL.md`; Pfad `.env`; Pfad `.git/config`; Sperre `sperre: ["src/lib"]` mit `src/**/*.js`; `--deny docs/notes.md`; Sperre in anderer Schreibweise (`KANDIDATEN`) | je `path_forbidden` (Glob-Treffer zusammengefasst je Ordner), Exit 1; Inhalt der gesperrten Dateien wird nicht gelesen; Standardsperren lassen sich nicht entfernen | EVAL-32 |
| SLV0-FALL-69 | Fehlende Datei und Nicht-Datei: Pfad `src` (Verzeichnis); Pfad auf eine fehlende Datei neben einem gültigen Muster | `not_regular_file`; `file_missing`; je Exit 1, auch das gültige Muster ergibt kein Teilpaket | EVAL-32 |
| SLV0-FALL-70 | Symlink und Ausbruch: Pfad auf Datei-Symlink; Glob über einen Ordner, der einen Verzeichnis-Symlink nach außen enthält; Glob, dessen Startordner ein Symlink ist; `../aussen.txt`; `/etc/hosts`; `src/../docs/spec.md`; Unterordner mit eigenem `.git` | `symlink_in_pack` (3×); `path_escapes_root` (3×); `nested_repository`; je Exit 1; außerhalb der Wurzel wird nichts gelesen | EVAL-31/-32 |
| SLV0-FALL-71 | Darstellung: Lauf mit `--output paket.md`, Datei mit Backtick-Zaun im Inhalt und Datei ohne abschließenden Zeilenumbruch; zweiter Lauf mit demselben `--output`; Lauf mit Fehler und `--output` | Bündel enthält Kopf mit Paket-Hash und je Datei Pfad, Hash und Inhalt in Datensatzreihenfolge; jede herausgelöste Datei hat den Hash aus dem Datensatz; `bundle.sha256` gleich Hash der Datei; zweiter Lauf `output_exists`, Datei unverändert; bei Fehler entsteht keine Datei | EVAL-34 |
| SLV0-FALL-72 | Bedienung und Lesend: Allowlist fehlt; kein JSON; Schema verletzt (`eingaben` leer); unbekannter Schätzer; `--root` ist Datei; Ordner von `--output` fehlt. Dateibaum vor und nach einem erfolgreichen Lauf ohne `--output` | Exit 2 (6×); Baum unverändert (gleiche Pfade, Bytes) | EVAL-31…34, INV-08 |

### 9.4 Fälle zu SLV0-EVAL-35…38

Alle Spuren sind synthetisches stream-json, im Test erzeugt; -77 liest gespeicherte Research-Spuren im Repo.

| ID | Fall | Erwartung | Deckt |
|---|---|---|---|
| SLV0-FALL-73 | Spur mit drei Turns, davon einer über zwei Ereignisse mit gleicher `message.id`; Ergebnisse von `Skill`, `Read` auf `SKILL.md`, `Read` auf eine andere Datei und `Bash`; Text-, Denk- und Werkzeugaufruf-Blöcke; unbekannter Blocktyp; Ergebnis ohne bekannten Aufruf; Ereignis eines Unteragenten; Gesamt-Usage größer als die Turn-Summe; Skill-Rumpf als synthetische Nutzernachricht nach einem `Skill`-Ergebnis, synthetische Nachricht nach einem fehlgeschlagenen `Skill`-Aufruf bzw. ohne `Skill`-Ergebnis | drei Turns mit der Usage des jeweils letzten Ereignisses; Bytes und Bytes × Folgeturns je Klasse wie im Test nachgerechnet; Summe über die Klassen = Gesamt; Turn-Summe + Rest = Gesamt-Usage; keine Inhalte in der Ausgabe; Schema gültig; Rumpf in `skill_laden`, die beiden anderen Nachrichten in `nutzer_text` | EVAL-35/-36 |
| SLV0-FALL-74 | Ein Turn ohne `usage`; Spur ohne `result`; leere Spur; Import `skill-pilot-v1` | Turn-Usage `null`, Summe und Rest `null`; Rest `null`; keine Turns, Summen `null`, 0 Bytes; `cost_balance: null`. Im Bericht jeweils `unbekannt`/`null` mit Grund, nie 0 | EVAL-35/-37 |
| SLV0-FALL-75 | Bericht über B0, B1 und `K-X` auf zwei Fällen, ein weiterer Fall nur mit B1; mit und ohne `--estimator utf8-bytes-div-4@1`; ein Rohdatensatz ohne `kostenbilanz` | Differenzen `B1 − B0` und `K-X − B1` nur über die gemeinsamen Fälle, mit beiden Werten und Rohdatensatz-IDs; je Klasse Summe der Bytes, fehlende Klasse 0; Tokens je Klasse `geschaetzt` bzw. `unbekannt`; der Lauf ohne Bilanz macht die Werte seiner Variante `null`; Bericht schemagültig, `report --check` Exit 0 | EVAL-37 |
| SLV0-FALL-76 | Kosten je erfülltem Kriterium: Kosten bekannt, drei bestandene von vier Assertions und eine R-Assertion; ein Lauf ohne Kostenschätzung; keine bestandene Assertion | Wert = Kosten / 3, Zähler 3, Nenner 4; `unbekannt`; `unbekannt` | EVAL-38 |
| SLV0-FALL-77 | Gespeicherte Spuren `research/skills-meta-prompting/eval-runs/` (Format `skill-pilot-v1`) über `raw` und `report` | Rohdatensätze und Bericht schemagültig; `kostenbilanz` `null`; Turns, Bytes und Turn-Usage im Bericht `null` mit Grund; Lauf-Usage unverändert `gemeldet` | EVAL-35/-37, Abwärtsverträglichkeit |

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
| [eval-normalized-trace.schema.json](schemas/eval-normalized-trace.schema.json) | Normalisierte Spur, Positivliste (SLV0-EVAL-08), optional mit Kostenbilanz (SLV0-EVAL-35/-36) | Tests |
| [eval-raw-record.schema.json](schemas/eval-raw-record.schema.json) | Rohdatensatz je Start (SLV0-EVAL-09, SL1 §8) | Tests |
| [eval-report.schema.json](schemas/eval-report.schema.json) | Bericht nur aus Rohdaten, ohne Score- und Empfehlungsfeld (SLV0-EVAL-10/-11), mit Rubrikversionen (SLV0-EVAL-15) | Tests |
| [eval-rubric.schema.json](schemas/eval-rubric.schema.json) | Rubrik je Skill (SLV0-EVAL-13, §7.1) | [docs/research/rubriken/](../research/rubriken/) |
| [eval-judgement.schema.json](schemas/eval-judgement.schema.json) | Bewertung mit Belegart je Kriterium (SLV0-EVAL-19, §7.2) | Tests |
| [eval-case.schema.json](schemas/eval-case.schema.json) | `fall.json` eines Fallordners mit Prüfformat, Kern- und Gegenkriterium und erwarteten Befunden (SLV0-EVAL-22/-24/-26, §7.3/§7.4) | Tests; Fallordner unter `research/skills-meta-prompting/` (Research-Branch) |
| [eval-b1-vorlauf.schema.json](schemas/eval-b1-vorlauf.schema.json) | Kernurteile von B1 je select-Fall für den B1-Vorlauf (SLV0-EVAL-25) | Tests |

| [eval-context-allowlist.schema.json](schemas/eval-context-allowlist.schema.json) | Allowlist eines Kontextpakets (SLV0-EVAL-31, §7.6) | Tests |
| [eval-context-pack.schema.json](schemas/eval-context-pack.schema.json) | Datensatz eines Kontextpakets mit Dateihashes, Tokenschätzung und Paket-Hash (SLV0-EVAL-33/-34, §7.6) | Tests |

`eval cite-check` (SLV0-EVAL-28…30) hat keine JSON-Eingabe und daher kein Eingabeschema; Bericht, Commit und Bereiche kommen als Markdown bzw. Optionen (§7.5).

Rohdatensatz und Bericht tragen seit Version 0.3 die optionalen Felder `trennschaerfe` und `rolle` (Assertion) bzw. `nulllauf`, `konjunktiv` und
`hinweise` (SLV0-EVAL-24). Sie sind optional, damit frühere Rohdatensätze und Berichte gültig bleiben; der Harness setzt sie immer.
Seit Version 0.6 tragen normalisierte Spur, Rohdatensatz und Bericht die optionalen Felder `cost_balance`, `kostenbilanz` bzw. `kostenbilanz` je Ebene
(SLV0-EVAL-35…38) unter derselben Regel; `normalizer` bleibt `sl-eval-normalize@1`, weil sich kein bestehendes Feld ändert.

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
| O-10 | Inhalt der Rubriken `@1` (SLV0-EVAL-13): vom Agenten aus dem Rumpf abgeleitet, also nicht unabhängig; Bewerter-Modell und menschliche Stichprobe (SL1 §7) | Owner-Review der Rubrik-PR; bis dahin Entwurf, nicht für Aktivierungsbelege |
| O-11 | Belegprüfung (SLV0-EVAL-21): Paarurteile (`paare`) und ihre Begründungen werden nicht geprüft; ein `nicht_erfuellt` mit nicht gefundenem Beleg bleibt `nicht_erfuellt` (gemeldet, nicht herabgestuft), obwohl ein erfundener Mangel eine Gegenseite begünstigen kann | Bewerter-Vorgabe „Paarurteil nur mit Kriterienbelegen“ bzw. Regel für unbelegte Mängel, mit E3-Runde 3 entscheiden |
| O-12 | Trennschärfe (SLV0-EVAL-23/-25): Negativkontroll-Familie je Kandidat (Portierungsplan P2) und Pflicht zur Markierung ab E3-Runde 3 sind Verfahren, keine Werkzeugfunktion; `regex` folgt ECMAScript statt Python | SL4 §4/§6; bei Bedarf eigene Spec-Ergänzung |
| O-13 | Überberichtung (SLV0-EVAL-27) erkennt Fundstellen nur mit Dateiendung und Commits nur aus dem Fixture-Text (kein Git-Verlauf); `host.tld:port` ohne Schema würde als Pfad gelesen | **Teilweise gelöst** mit P5: `eval cite-check` (SLV0-EVAL-28…30) prüft Permalinks, Fundstellen und Commit-Wörter gegen Git. Offen bleibt: `eval findings` prüft weiter nur gegen den Fixture-Text, weil Fallordner keinen Git-Stand haben; beide erkennen Fundstellen nur mit Dateiendung; `host.tld:port` ohne Schema würde auch in `cite-check` als Fundstelle gelesen (`path_missing`); ein Hex-Wort ist nicht sicher als Commit erkennbar (darum dort nur Warnung) |
| O-14 | Kontextpaket (SLV0-EVAL-31…34): Das Paket ist ein Datensatz, keine Sperre. Ob eine Session nur das Paket sieht, hängt am Rechteprofil des Laufs (Portierungsplan P12); das Werkzeug bindet die Allowlist nicht an einen Commit, prüft keine erwarteten Dateihashes aus der Übergabe und wählt keine Abschnitte innerhalb einer Datei. Unicode-Normalisierung von Dateinamen (NFC/NFD) wird nicht angeglichen | Mit P12 und der nächsten Übergabe entscheiden; bis dahin `wofuer` als Lesehinweis und Hashvergleich durch den Empfänger |
| O-15 | Kostenbilanz (SLV0-EVAL-35…38): **eingegrenzt** nach 24 rohen Spuren (Claude Code 2.1.316, 31.10.2026, *praktisch nachgewiesen*): Rest für `input_tokens`, `cache_read_input_tokens` und `cache_creation_input_tokens` in allen 24 Spuren 0; `output_tokens` je Turn ist nicht final (Turn-Summe 9 535 gegen 115 250 im `result`), der Rest trägt die Differenz. Der Skill-Rumpf kommt als synthetische Nutzernachricht nach dem `Skill`-Ergebnis (20 von 20) und zählt seither als `skill_laden`. Offen bleiben: andere Clients und Versionen; Unteragenten (in diesen Spuren nicht vorhanden); Systemprompt und Katalog haben keine Bytegröße in der Spur; Denkblöcke zählen mit Folgeturns, obwohl der Client sie in späteren Eingaben kürzen kann | `output_tokens` aus der Lauf-Usage lesen, nicht aus der Turn-Summe; Bytes × Folgeturns als Obergrenze der Dauerlast lesen; bei neuer Client-Version erneut prüfen |

## 13. Rückverfolgung

| Anforderung | Herkunft |
|---|---|
| PKG-01…06 | K1.1, K1.2, Primärquellen P1/F1, SL0 §2.2, SL3 §2, SL-A01 |
| PKG-10…15 | SL3 §2, §8, O-2; SL4 §4/§5; Owner-Antwort Aktivierung |
| PKG-20…24 | SL3 O-1, SL1 §8, K6.2, Research-Helfer `freeze` |
| VAL-01…17 | K1.2, SL0 §2.2/§2.4, PA-R3, RD-R5, SCO-R3, C0-Befund Symlink-Discovery |
| TOK-01…08 | K7.1, K7.3, K7.5, K7.6, SL3 §7, C0 Usage-Felder |
| EVAL-01…12 | K5.1, K5.3, K5.5, K5.7, SL1 §5.5/§7/§8/§9, SL4 §4, Research-Helfer, C0/E1-Ergebnis |
| EVAL-13…15 | K5.6, SL1 §7/§8 (`rubrik_version`), SL4 §8 (Vergleiche über Rubrikversionen ungültig), Kriterien aus `e1v-e2-plan.json` und `e3/familien/*/fall.json` |
| EVAL-16…18 | Querprüfungen, die die Werkzeug-README für Stufe 2 als fehlend nannte (Ledger, Manifest, Quellcommit) |
| EVAL-19…21 | Portierungsplan P1 (Idee aus skills-optimizer: belegpflichtige Gutachten, clean-room); Prototyp `e3/verify_quotes.py` und Ergebnis `e3/zitatpruefung-2026-10-31.md` (Research-Branch) |
| EVAL-22…24 | Portierungsplan P2 (Idee aus automatic_prompt_engineer: konjunktives Gegenkriterium, Nulllauf); Research-Prüfer `grilling-runde/check_case.py`, Nulllauf-Befund in `grilling-runde/dev-ergebnis.md` (Research-Branch) |
| EVAL-25 | E3-Runde 2, Ergebnis §4–§5; Owner-Antwort A-20261031-e3-b1-vorlauf („B1-Vorlauf ist ok, führ ihn mit P2 ein“); SL4 §4/§6 |
| EVAL-26/-27 | Portierungsplan P3 (Konzept aus skill-optimization: erwartete Befunde, 1:1-Zuordnung, Überberichtung; deren Code ausgeschlossen) |
| EVAL-28…30 | Portierungsplan P5 (Konzept aus recursive-decomposition-skill, nur *dokumentiert*: Suchraum einmal aufzählen, bearbeitete Segmente protokollieren, Abdeckung vor der Synthese prüfen; Dossier-Anforderung R4); O-13 |
| EVAL-31…34 | Portierungsplan P11 (Konzept aus code2prompt, nur Konzept: erst Auswahl und Datensatz mit Dateien, Hashes und Tokens, dann Darstellung; dort fail-open, bei uns fail-closed); Implementierungsübergabe §3 (Inputliste der implementierenden Session); `resuming-work` Schritt 8 (Kontextpaket mit Ziel); Clean-Room-Plan |
| EVAL-35…38 | Portierungsplan P4 (Konzept aus skill-cost-optimizer, nur Konzept: Bilanz je Kontextklasse und Turn, Dauergeladenes kostet Größe × Nachrichten); M4-Befund im Portierungsplan (Cache × Turns, kaum Output); K7.7 (Kosten je erfülltem Kriterium); SLV0-TOK-04/-05/-06/-08 |
| INV-01…11 | V0-INV-01/-07/-09/-11, SL3, SL4, Plan §1/§7 |

Nächster Schritt: Review dieser Spec zusammen mit dem Handover; Owner beantwortet O-4. Danach erster Implementierungs-PR nach Handover.
