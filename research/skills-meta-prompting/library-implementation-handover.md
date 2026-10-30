# SL7 – Implementierungsübergabe: erster PR der Skill-Library

> Stand 30.10.2026 · Ergebnis SL7 im [Library-Research-Plan](library-research-plan.md) · **Entwurf zur Review**.
> Verbindlicher Vertrag: [Spec Skill-Library V0](../../docs/spec/skill-library-v0.md) mit [Schema](../../docs/spec/schemas/skill-package.schema.json). Dieses Dokument schneidet daraus **einen** kleinen PR zu.
> Bei SL7 wurde kein Produktcode geschrieben, nichts installiert, kein Modell- oder CLI-Lauf gestartet. Gerechnet wurden nur lokale Ad-hoc-Hashes und eine Schemaprüfung der Spec-Dateien (§9).

## 1. Ausgangsstand

| Gegenstand | Stand |
|---|---|
| Branch | `research/learnable-skill-library` |
| Commit beim Schreiben | `06869bc6186298b6e6f80f7bf8852ded5e1b29ec` |
| Skills | acht Pakete unter `.agents/skills/`, je `SKILL.md`, `references/`, `agents/openai.yaml`; acht relative Symlinks unter `.claude/skills/` |
| Paketsatz-Hash (Methode SLV0-PKG-23) | `4ad5b6dbae228982fe3ba7df6552d9e7029af0fc0c972dde09ad9406f2473967` = Baseline B1 ([skill-pilot-baseline-v2.json](skill-pilot-baseline-v2.json), Quellcommit `d0cf27cd`) |
| Research-Helfer | [skill_pilot.py](skill_pilot.py) mit [14 Tests](test_skill_pilot.py): `freeze`, `verify_snapshot`, `variant_files`, `prepare`, `normalize`, `record-start`; Python-Standardbibliothek; ausdrücklich kein Produktcode ([library-experiments.md](library-experiments.md)) |
| Messstand | 14 von ~40 CLI-Starts verbraucht; Auswahl 8/10 positiv, 2/2 negativ als Diagnosehinweis ([C0/E1-Ergebnis](eval-runs/C0-E1-ergebnis-2026-10-30.md)) |
| Produktlaufzeit | keine (`AGENTS.md`: Phase 0, „Befehle: noch keine“) |

**Voraussetzungen vor Beginn:** (1) Spec [skill-library-v0.md](../../docs/spec/skill-library-v0.md) ist reviewt und gemergt (Spec-driven, `docs/spec/README.md`).
(2) Owner hat [Q-20261030-sl-code-sprache](../../docs/fragen/skill-library/questions/Q-20261030-sl-code-sprache.md) beantwortet. (3) Ausgangsstand neu abgleichen: Haben sich `.agents/skills/` oder die Spec seit `06869bc6` geändert, gelten die Erwartungen in §5 nur nach Neuberechnung.

## 2. Auftrag in einem Satz

Ein PR liefert ein **read-only Kommandozeilenwerkzeug** mit Tests, das die acht Skills nach SLV0-VAL prüft, Inhalts- und Paketsatz-Hash nach
Profil `sl-hash-v0` bildet, Registry-Datensätze gegen Schema und Hash prüft und Tokenzahlen nur mit Quellenkennzeichnung ausgibt (Stufe 1).
Der Eval-Harness (Stufe 2) ist der zweite PR (§7).

## 3. Inputs für die implementierende Session

Clean-Room nach [clean-room-plan.md](clean-room-plan.md): Die Implementierung bekommt nur Spec, Schema, dieses Dokument und eigene Repo-Artefakte; keine Fremdquellen.

| Input | Wofür |
|---|---|
| [Spec](../../docs/spec/skill-library-v0.md) §3–§6, §8, §9 | Regeln, Codes, Fälle |
| [skill-package.schema.json](../../docs/spec/schemas/skill-package.schema.json), [Beispiel](../../docs/spec/beispiele/skill-paket-demo.json) | Registry-Prüfung |
| [skill-pilot-baseline-v2.json](skill-pilot-baseline-v2.json) | eingefrorene Eingabe für den Golden-Hash (SLV0-FALL-23) |
| [skill_pilot.py](skill_pilot.py) `digest`, `canonical`, `safe_path` | Referenz für Hash- und Pfadmethode; eigener Repo-Code, kein Herkunftsregister nötig |
| [SL3 §2, §7, §12](library-composition.md) | Hintergrund Registry, Ladestufen, deterministische Anteile |
| Agent-Skills-Format P1 am Commit `69ef37e9` ([Primärquellenprüfung](../../docs/research/skill-library-primaerquellen-2026-10-30.md)) | Gegenprüfung der Frontmatter-Feldliste (AK-02); nur Format, kein Text übernehmen |

## 4. Liefergegenstände

| # | Gegenstand | Spec-IDs |
|---|---|---|
| L1 | Bibliotheksmodul mit reinen Funktionen: Paket einlesen (ohne Symlinks zu folgen), Frontmatter-Teilmenge parsen, Regeln anwenden, Prüfmeldungen sortieren | VAL-01…14, VAL-17, INV-03/-08 |
| L2 | Hash: Dateihash, Inhaltshash je Paket, Paketsatz-Hash; verweigert Hash bei ungültigem Paket | PKG-20…24 |
| L3 | Projektprüfung: `.claude/skills/`-Adapter, optionale Projektliste für Neutralität | VAL-11, VAL-15 |
| L4 | Registry-Prüfung: Schema (ohne neue Dependency: handgeschriebene Prüfung der im Schema genutzten Konstrukte **oder** Dependency nur nach Owner-Freigabe), Hashvergleich, Versions-/Hash-Konflikt über mehrere Dateien | VAL-16, PKG-10…15 |
| L5 | Token-Zählung: Bytes/Zeilen/Wörter exakt; Tokens standardmäßig `unbekannt`; optionaler Schätzer `utf8-bytes-div-4@1` nur auf ausdrücklichen Schalter; Summenregel | TOK-01…05, TOK-07 |
| L6 | CLI mit Unterbefehlen `validate` (`--scope package` oder `project`), `hash`, `tokens`, `registry-check`; JSON auf stdout, Exit-Codes 0/1/2 | VAL-17 |
| L7 | Tests: je Fall SLV0-FALL-01…29 mindestens ein Test (synthetische Pakete in temporären Verzeichnissen; -01 und -23 gegen Repo bzw. eingefrorenen Snapshot) | §9 |
| L8 | Kurze README im Werkzeugordner und – nach Owner-OK im PR – Eintrag unter „Befehle“ in `AGENTS.md` mit exakten Befehlen für Test und Validator | AGENTS „Befehle“ |

**Research-Helfer: Wiederverwendung prüfen, nicht umziehen.** Im ersten PR bleibt `skill_pilot.py` unverändert, seine 14 Tests müssen weiter bestehen.
Gründe: Die dokumentierten Befehle in [library-experiments.md](library-experiments.md) und die Rohdaten unter `eval-runs/` verweisen auf ihn; die Sprache ist noch offen.
Die neue Hash-Funktion muss für denselben Snapshot denselben Paketsatz-Hash liefern (SLV0-FALL-23); das ist der Kompatibilitätsbeleg.
Ob `freeze`/`verify`/`variant_files`/`prepare`/`normalize`/`record-start` in den Produktbaum wandern oder neu nach SLV0-EVAL entstehen, entscheidet PR 2 (§7).

## 5. Abnahmekriterien

| AK | Kriterium | Spec-IDs | Nachweis im PR |
|---|---|---|---|
| AK-01 | `validate --scope project` auf dem Repo meldet für die acht Skills 0 Fehler und 0 Warnungen, Exit 0 | FALL-01 | Testausgabe; Erwartung stammt aus einer Ad-hoc-Vorprüfung und muss vom Werkzeug selbst belegt werden |
| AK-02 | Feldliste SLV0-PKG-02 und Grenzen (64/1024/500) gegen P1 am Commit `69ef37e9` geprüft; Abweichung als Spec-Änderung vorgeschlagen, nicht still umgesetzt | PKG-02…04, VAL-03/-05 | Fundstellen im PR |
| AK-03 | Paketsatz-Hash über `skill-pilot-baseline-v2.json` = `4ad5b6db…2473967` | FALL-23, PKG-23 | Test |
| AK-04 | Inhaltshashes je Paket am Ausgangscommit wie in §9 (unter Profil `sl-hash-v0`) | PKG-22, FALL-01 | Test oder dokumentierter Abgleich |
| AK-05 | Jeder Fehlercode aus §8 der Gruppen Format, Referenzen, Portabilität, Adapter, Registry hat mindestens einen auslösenden Test; jede Warnung ebenso | VAL-01…16, FALL-02…24 | Testnamen mit Fall-ID |
| AK-06 | Ungültiges Paket erhält keinen Hash; Symlink-Schleife terminiert | PKG-20, FALL-11/-17 | Test |
| AK-07 | Ausgabe byte-identisch bei geänderter Anlage-Reihenfolge, mtime und Arbeitsverzeichnis | INV-03, FALL-20 | Test |
| AK-08 | Kein Befehl schreibt unter `.agents/skills/` oder `.claude/skills/`; Paketsatz-Hash vor/nach Testlauf gleich; kein Befehl ändert `status` | INV-01/-08, FALL-25 | Test |
| AK-09 | Tokens ohne Schätzer `unbekannt` mit `null`; Schätzer gekennzeichnet; Summenregel | TOK-01…05/-07, FALL-26/-27/-29 | Test |
| AK-10 | Kein Netz- und kein Modellzugriff; keine neue Dependency ohne Owner-Freigabe im PR | INV-04, Spec §10 | Code-Review, Dependency-Liste |
| AK-11 | `skill_pilot.py` unverändert, 14 von 14 Tests bestehen | – | Testausgabe |
| AK-12 | PR-Beschreibung (Deutsch) trennt: ausgeführt (Tests, Validator-Lauf), nicht ausgeführt (Discovery, Auswahl, Verhalten), offene Punkte O-1…O-9 | INV-11 | PR-Text |

## 6. Tests

Befehle hängen von der Owner-Antwort ab und werden mit L8 exakt in `AGENTS.md` eingetragen. Pflicht in jedem Fall:

- Einheitstests je Regel und Fehlercode mit synthetischen Paketen in temporären Verzeichnissen; keine Testdaten unter `.agents/skills/`.
- Golden-Tests: SLV0-FALL-23 gegen den eingefrorenen Snapshot (bricht nicht bei Skilländerungen); SLV0-FALL-01 gegen den Arbeitsbaum (bricht bewusst, wenn ein Skill ungültig wird).
- Symlink-Fälle nur, wo das Dateisystem Symlinks erlaubt; sonst als übersprungen mit Grund ausweisen, nicht als bestanden.
- Bestehende Research-Tests: `python -m unittest discover -s research/skills-meta-prompting -p test_skill_pilot.py -v`.

Nicht Teil der Tests: Modellläufe, Discovery im Client, Auswahl- oder Qualitätsmessung. Die Tests sind deterministische Werkzeugtests, keine Skill-Evaluation.

## 7. Folgeauftrag PR 2 (nur Umriss)

Eval-Harness nach SLV0-EVAL-01…12: Snapshot, Kandidatenbindung, Vorbereitung, Ledger mit Ergebnisnachtrag, Split-Manifest und rollenbasierter Zugriff,
Normalisierung mit Positivliste, Rohdatenschema, Berichte nur aus Rohdaten; Fälle SLV0-FALL-30…37. Dazu Schemas für Snapshot, Ledger, Split-Manifest,
Rohdatensatz und Bericht nach V0-Konvention. Entscheidung dort: Research-Helfer übernehmen, ersetzen oder als Referenz stehen lassen.
Voraussetzung: PR 1 gemergt. Baseline-Läufe brauchen weiter Owner-Budget (Restbudget ~26 Starts) und gehören nicht in den PR.

## 8. Offene Fragen

| ID | Frage | Wirkung auf PR 1 |
|---|---|---|
| O-4/O-5 | Sprache und Ort gegenüber Phase 1 (TypeScript/Next.js); eigene YAML-Teilmenge oder Parser-Dependency | **blockierend**; [Q-20261030-sl-code-sprache](../../docs/fragen/skill-library/questions/Q-20261030-sl-code-sprache.md), Status `open`. Hier nicht entschieden |
| O-1 | Hash-Kanonisierung: zählt `agents/openai.yaml`, Normalisierung | PR 1 implementiert Profil `sl-hash-v0` aus der Spec; eine abweichende Review-Entscheidung ändert nur das Profil |
| O-2 | Registry-Ort und -Form | PR 1 checkt keine Registry-Dateien für die acht Skills ein; `registry-check` prüft übergebene Dateien und das Spec-Beispiel |
| O-6 | Größenbudgets | Vorschlagswerte als Konstanten mit Spec-Verweis, nur Warnungen |
| O-7 | Quelle für `gemeldet` je Skill | nicht in PR 1; nur `unbekannt`/`geschaetzt` |
| O-8 | Feldsprache der Schemas | PR 1 folgt dem gemergten Schema |
| – | Schemaprüfung ohne Dependency | wenn handgeschriebene Prüfung zu groß wird: Owner-Freigabe für eine Dependency im PR erfragen, nicht still einführen |

## 9. Lokal berechnete Erwartungswerte (Profil `sl-hash-v0`, Commit `06869bc6`)

Ad hoc mit einem Python-Einzeiler nach SLV0-PKG-22/-23 berechnet; kein Validatorergebnis. Gleichzeitig wurde geprüft: keine CRLF, kein BOM,
jede Datei mit Zeilenende, kein Ausführungsbit, nur `name`/`description` im Frontmatter, alle Referenzlinks und der Anker `#ohne-rückkanal` lösen auf,
keine Treffer für „Sidekick“ oder `docs/fragen` in den Paketen. Das Schema wurde mit lokal vorhandenem `jsonschema` 4.26.0 gegen das Beispiel
und zwei Negativvarianten (`approved` ohne Beleg, Übernahme ohne Herkunftsregister) geprüft – erwartungsgemäß gültig bzw. abgelehnt.

| Paket | Inhaltshash |
|---|---|
| evaluating-changes | `8b18e432f756812ef1f54b497d260edc6c9fa01229a9e6fa73defbbca0e2ed67` |
| grilling | `7fb06a3e5dc31280b4a780adb67f0d32a51cc99676be13091a7b311e85aadb76` |
| planning-work-packages | `d6a4f2ccd9e072682a1dba07ff0fbe3912e34d90162997814657cd102a9971b0` |
| researching-repositories | `f164ff6cfe32280bda3d6bb4acce5adcac176837a6c4951879ea4397a536acbc` |
| resuming-work | `e81b02eba819c68ba58c19576963af2ba38c2f544b5f41d6e7af25eba30fedf1` |
| reviewing-decision-gates | `fb0236ab1f16442a01f84559829e7d61f81101ef588d816985a7946ab462e177` |
| specifying-behavior | `9bdc2b8250fa1f16d2a5a18a75c0c13bdfa361f36b3879b8a3286462bc9d7df3` |
| testing-system-boundaries | `76f9c4e25c2d630a32ec246136c63f799cbc326679a8c4188f21f0751f1973c9` |

## 10. Rücknahme

PR 1 ist rein additiv: neuer Werkzeugordner, Tests, README, ggf. zwei Zeilen unter „Befehle“ in `AGENTS.md`. Er ändert keine Skills,
keine Adapter, keinen Research-Helfer und legt keine Registry-Dateien an. Rücknahme = Revert des Merge-Commits durch den Owner.
Prüfung nach Revert: Paketsatz-Hash unverändert gegenüber vor dem Merge, `skill_pilot.py`-Tests 14/14, keine verwaisten Einträge unter „Befehle“.
Keine Daten- oder Statusmigration nötig, weil nichts aktiviert wurde.

## 11. Ausdrücklich nicht Teil von PR 1

- Aktivierung, Statusänderung oder Registry-Dateien für die acht Skills (SLV0-INV-01, O-2).
- Eval-Harness, Split-Zugriff, Berichte (PR 2); Modell- oder CLI-Läufe; Budgetverbrauch.
- Laufzeit-Loader, Auswahl, Komposition, Run-Manifest, Resolver, Offline-Pinning (Stufe 3/6, SL3).
- Änderungspipeline, Kandidaten, Optimierer (Stufe 4/5, SL4).
- Tokenizer-Dienst oder sonstiger Netzzugriff; Kosten- oder Ersparnisaussagen.
- Generierung von `agents/openai.yaml` (K1.1); Änderungen an Skill-Texten, auch „kleine Korrekturen“, die der Validator anregt (eigener PR).
- Next.js-App-Gerüst, Hub-Code, UI.

## 12. Grenzen der Aussagekraft

Ein grüner Validator heißt: M0 erfüllt. Er belegt weder Discovery (M1, nur im Client prüfbar) noch Auswahl (M2, bisher 12 Diagnoseläufe) noch Verhalten
oder Wirkung (M3/M4, nicht gemessen). Forschungsbelege aus SL1–SL5 begründen die Regeln; sie sind keine Laufzeitgarantie.

Nächster Schritt: Owner-Review von Spec und Handover; Antwort auf Q-20261030-sl-code-sprache. Danach PR 1 in einer frischen Session nur mit den Inputs aus §3.
