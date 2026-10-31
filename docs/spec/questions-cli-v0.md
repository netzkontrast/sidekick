# Fragen-CLI V0 – Interview-Ablage über ein Werkzeug mit Schema

> Version 0.1 · 31.10.2026 · **Entwurf zur Review.** Paket P9 des Portierungsplans (`research/skills-meta-prompting/portierungsplan-2026-10-31.md`
> auf Branch `research/e3-runde-2`). Owner-Freigabe: Antwort A-20261031-p9-questions-cli auf Q-20261031-p9-questions-cli
> (dort `docs/fragen/skill-library/questions/`): „ja und vergib auch die rechte“. Freigegeben ist nur
> `node tools/skill-library/cli.js questions …`, keine allgemeine Bash-Freigabe.
> Fachliches Modell: Skill [grilling](../../.agents/skills/grilling/SKILL.md) mit [Workflow](../../.agents/skills/grilling/references/workflow.md)
> und [Formaten](../../.agents/skills/grilling/references/records.md). Begriffe Rückfrage und Journal: [V0 – Ziel und Verträge](v0-ziel-und-vertraege.md) §2, §4.5.
> Konventionen wie [Skill-Library V0](skill-library-v0.md): stabile IDs `QCLI-<Bereich>-<nn>`, Fehlercodes, Fallmatrix als Contract-Tests.

**Belege, keine Garantien.** Die CLI erzwingt Form und Zustandsregeln der Ablage. Ob eine Antwort wirklich von einem Menschen
stammt, ob eine Frage gut ist oder ob ein Interview vollständig ist, prüft sie nicht; sie macht nur Verstöße gegen die
unten genannten Regeln unmöglich oder sichtbar. Ob grilling mit der CLI günstiger arbeitet, ist *offen* und wird erst gemessen.

## 1. Ziel und Umfang

grilling liest und editiert heute jede Fragedatei einzeln (Kostenbefund `grilling-runde/dev-ergebnis.md` auf `research/e3-runde-2`:
11–16 Turns je Lauf). Die CLI nimmt Daten als JSON entgegen, prüft sie gegen die Regeln des Workflows und schreibt die
kanonischen Markdown-Dateien. Der Themenindex ist eine Projektion der Fragedateien.

- **Konzept-Vorbild** (clean-room, nur gelesen): ein MCP-Server, der Prompt-Daten entgegennimmt und kanonische Datei plus
  Register erzeugt. Dessen Lücken vermeidet diese Spec ausdrücklich: Schreiben mehrerer Dateien ohne Rücknahme (hier QCLI-INV-09)
  und IDs ungeprüft in Dateipfaden (hier QCLI-INV-08).
- **Optional:** grilling arbeitet ohne CLI unverändert weiter; das Dateiformat ist genau das aus `records.md` (QCLI-INV-11).
- **Nicht in V0:** Änderung des grilling-Skilltexts, Modell- oder Client-Starts, Übernahme in den Hub (`tasks.request_input`),
  Mehrbenutzer-Sperren über Rechnergrenzen, Löschen von Fragen oder Antworten.

## 2. Begriffe

| Begriff | Bedeutung |
|---|---|
| **Ablage-Wurzel** | Verzeichnis mit Themenordnern, z. B. `docs/fragen/` (`--root`). |
| **Thema** | Ordner `<wurzel>/<thema>/` mit `index.md`, `questions/`, optional `rounds/` (`--topic`). |
| **Frage** | Kanonische Datei `questions/<Q-ID>.md` mit Frontmatter (`id`, `status`, `needs_review`, `depends_on`), Kopf, `## Antworten`, `## Verlauf`. |
| **Frageversion** | Zahl im Feld `Version:`. Antworten sind an eine Version gebunden (`Bezug: Version N, …`). |
| **Antwort-Eintrag** | Block ab `Antwort-ID:` im Abschnitt `## Antworten`, mit Quelle, Bezug, Wortlaut, `Ersetzt Antwort`, `Konflikt mit`. |
| **Wirksame Antwort** | Für die aktuelle Version: die erste Antwort ohne Konfliktvermerk; eine spätere Antwort mit `Ersetzt Antwort` löst sie ab. |
| **Offener Konflikt** | Antwort mit `Konflikt mit: A-…`, nach der keine ersetzende Antwort (Korrektur) folgt. |
| **Runde** | Zustellung von Fragen: bei Tool-Zustellung Datei `rounds/<R-ID>.md`, bei Chat eine Zeile `Chat-Runden:` im Themenindex. |
| **Zustellung** | `bestaetigt`, `unbekannt` (kein Rückkanal, Unterbrechung) oder `fehlgeschlagen` (Toolfehler). |
| **Fragbar** | Status `open`, `needs_review: false`, und jede Frage in `depends_on` ist `answered` und nicht prüfpflichtig. |
| **Sessionstatus** | `active`, `waiting_user`, `blocked_research`, `paused`, `awaiting_confirmation`, `complete`; steht nur im Themenindex (`Session:`). |

## 3. Invarianten

| ID | Invariante | Herkunft |
|---|---|---|
| QCLI-INV-01 | Eine Frage ist nur `answered`, wenn mindestens ein Antwort-Eintrag mit Antwort-ID und nicht leerer Quelle existiert. Kein Befehl setzt `answered` ohne einen solchen Eintrag. | workflow „Zustände“ |
| QCLI-INV-02 | Eine Empfehlung wird nie als Antwort gespeichert: Antworttext gleich dem Empfehlungsfeld (normalisiert) oder ein Urheber, der Agent, Modell, Empfehlung, Default oder Frist bezeichnet, wird abgelehnt. Empfehlungen stehen nur im Feld `Empfehlung + sachlicher Grund`. | SKILL Schritt 5, workflow Runden 7 |
| QCLI-INV-03 | Eine zweite Antwort auf dieselbe Frageversion erzeugt einen Konfliktvermerk (`Konflikt mit: <wirksame Antwort>`) und `needs_review: true`; die erste bleibt wirksam. Ein Konflikt ist kein eigener Status. | workflow „Versionen, Doppelantworten“, V0-FALL-14 |
| QCLI-INV-04 | Eine Frist erzeugt nie eine Antwort. Kein Befehl leitet aus Zeitablauf, Schweigen oder Vertagung eine Antwort ab; `defer` schreibt keinen Antwort-Eintrag. | workflow „Fristen“, V0-RFG-03 |
| QCLI-INV-05 | Antworten werden nur angehängt. Kein Befehl ändert oder entfernt einen vorhandenen Antwort-Eintrag; eine Korrektur ist ein neuer Eintrag mit `Ersetzt Antwort`. Ersetzt wird nur der Platzhalter `Noch keine. Empfehlung ist keine Antwort.` | SKILL Schritt 7, workflow Runden 8 |
| QCLI-INV-06 | Status, Prüfbedarf und Abhängigkeiten stehen nur in den Fragedateien. Der Themenindex enthält dazu nichts; er ist eine Projektion aus Links und Kurzfragen. Der Sessionstatus steht nur im Index. | workflow „Ablage“ |
| QCLI-INV-07 | Secret-artige Werte in geschriebenen Texten werden abgelehnt (`secret_detected`) mit Hinweis auf Redaktion. Der gefundene Wert erscheint nie in der Ausgabe. | workflow „Abschluss“, AGENTS.md Grenzen |
| QCLI-INV-08 | IDs folgen `Q-<YYYYMMDD>-<suffix>`, `R-…`, `A-…` (§5.1), Themennamen `[a-z0-9-]`. Dateipfade entstehen nur aus geprüften IDs und Themennamen, liegen unter der Ablage-Wurzel und führen nie über einen Symlink. | workflow „Ablage“, Lücke des Vorbilds |
| QCLI-INV-09 | Schreiben ist atomar: jede Datei über eine temporäre Datei im selben Ordner und Umbenennen; neue Dateien ohne Überschreiben. Schreibt ein Befehl mehrere Dateien und scheitert einer, werden die schon geschriebenen zurückgenommen. Nie bleibt ein halber Stand. | Lücke des Vorbilds |
| QCLI-INV-10 | Alle Prüfungen eines Befehls laufen vor dem ersten Schreiben. Eine Verweigerung hinterlässt keine Änderung. | SLV0-EVAL-17 sinngemäß |
| QCLI-INV-11 | Das Dateiformat ist das aus `records.md`. Vorhandene, von Hand geschriebene Dateien werden gelesen; Änderungen sind zeilengenau, alle übrigen Zeilen (unbekannte Felder, Abschnitte, Frontmatter-Schlüssel, Kommentare) bleiben byte-gleich. | Auftrag P9 |
| QCLI-INV-12 | Kein Netz, kein Modell, kein Prozessstart. Die CLI erfindet keine Antworten und setzt keine Defaults für Antworten. | SLV0-INV-04, SKILL Schlusssatz |
| QCLI-INV-13 | Hat sich eine Datei zwischen Lesen und Schreiben geändert, bricht der Befehl ab (`concurrent_modification`), statt sie zu überschreiben. | workflow „Ablage“ (Konflikte nicht durch Überschreiben lösen) |
| QCLI-INV-14 | Gleiche Eingaben, gleicher Dateistand und gleiches `--now` ergeben byte-gleiche Dateien und gleiche Ausgabe. Ausgabepfade sind relativ zur Ablage-Wurzel. | SLV0-INV-03 sinngemäß |

## 4. Befehle (QCLI-CMD)

Aufruf: `node tools/skill-library/cli.js questions <befehl> --root WURZEL [--topic THEMA] [--now ISO-8601] [Eingabe]`.
Eingabe für Befehle mit Nutzdaten: genau eine von `--json '<JSON>'`, `--file DATEI` oder JSON auf stdin.
Ausgabe: JSON auf stdout. Exit 0 = ok, 1 = Verweigerung mit Code (§6), 2 = Bedienfehler (§6.2).

| ID | Befehl | Verhalten |
|---|---|---|
| QCLI-CMD-01 | gemeinsame Optionen | `--root` Pflicht, muss ein Verzeichnis sein. `--topic` Pflicht außer bei `check`. `--now` (Standard: aktuelle Zeit, UTC) liefert Datum für `Erstellt`, Verlauf und erzeugte Antwort-IDs. Unbekannte Optionen, doppelte Optionen, fehlende Pflichtoptionen, ungültiges JSON, keine oder mehrere Eingabequellen: Exit 2. Nutzdaten sind streng: unbekannte Schlüssel, falsche Typen, fehlende Pflichtfelder → `payload_invalid`. Einzeilige Textfelder ohne Zeilenumbruch und Steuerzeichen (`field_invalid`). |
| QCLI-CMD-02 | `init` | Nutzdaten `{title, goal?, non_goals?, context?, editor?}`. Legt `<thema>/index.md` (§5.4) mit `Session: active` und leerer Tabelle sowie `questions/` an. Vorhandenes Thema → `topic_exists`. |
| QCLI-CMD-03 | `add` | Nutzdaten: eine Frage oder `{questions: [...]}`. Frage: `{id, title, kind: decision\|fact, priority: blocking\|important\|later, context, occasion, impact, options, recommendation, question?, evidence_needed?, depends_on?, short?}`. Schreibt je Frage die kanonische Datei (§5.2) mit `status: open`, `Version: 1`, und ergänzt die Indexzeile (Kurzfrage `short`, sonst `title`). ID schon in irgendeinem Thema der Wurzel oder doppelt im Stapel → `id_collision`. `depends_on` muss auf Fragen des Themas oder desselben Stapels zeigen (`dependency_unknown`); Zyklus → `dependency_cycle`. |
| QCLI-CMD-04 | `ask` | Nutzdaten `{round_id, channel: chat\|tool, tool?, delivery: bestaetigt\|unbekannt\|fehlgeschlagen, questions: [{id, version, field?}], asked?, context_version?}`. Jede Frage muss existieren, die aktuelle Version tragen (`version_mismatch`), alle `depends_on` beantwortet und nicht prüfpflichtig haben (`dependency_unmet`) und `open`, `asked`, `deferred` oder `answered` mit `needs_review: true` sein (sonst `invalid_transition`). Session `paused` oder `complete` → `session_paused`. R-ID vergeben → `round_exists`. Wirkung: `tool` schreibt `rounds/<R-ID>.md` (§5.5), `chat` hängt eine Zeile `Chat-Runden:` an den Index. `bestaetigt`: Fragen `open`/`deferred` → `asked`, Runde `sent`, Session `waiting_user`. `unbekannt`: Fragen bleiben unverändert (`open` bleibt `open`), Runde `prepared` mit Zustellung unbekannt, Session `waiting_user` (Ohne Rückkanal). `fehlgeschlagen`: Fragen unverändert, Runde `failed`, Session unverändert. Jede Frage erhält einen Verlaufseintrag. |
| QCLI-CMD-05 | `answer` | Nutzdaten `{question_id, version, round_id, text, verbatim?: true, source: {by, channel, time?, ref?}, answer_id?, consequences?}`. Die Runde muss existieren und die Frage in genau dieser Version enthalten (`answer_unmapped`); `version` gleich aktueller Version (`version_mismatch`); Status nicht `superseded` (`invalid_transition`). `source.by` und `source.channel` nicht leer (`answer_source_missing`), Urheber kein Agent/Modell/Empfehlung/Default/Frist (`answer_not_human`), Text ungleich Empfehlung (`recommendation_as_answer`), kein Secret (`secret_detected`). Ohne wirksame Antwort für diese Version: Eintrag anhängen, Status `answered`, `needs_review: false`. Mit wirksamer Antwort: Eintrag mit `Konflikt mit: <wirksame ID>` anhängen, Status bleibt, `needs_review: true` (QCLI-INV-03). Antwort-ID: angegeben (Muster, im Thema eindeutig, sonst `answer_id_collision`) oder `A-<Datum>-<Suffix der Frage>` mit `-2`, `-3` … bei Belegung. Runde: Rundendatei erhält Antwortverweis in `Ergebnis` und Status `answered` bzw. `partial`; Chat-Zeile erhält `– Antworten: A-…`. |
| QCLI-CMD-06 | `correct` | Nutzdaten wie `answer`, zusätzlich `replaces` (Pflicht), `round_id` optional. `replaces` muss eine Antwort dieser Frage sein (`answer_ref_unknown`); die Frage muss Antworten haben und darf nicht `superseded` sein (`invalid_transition`). Hängt einen Eintrag mit `Ersetzt Antwort: <replaces>` an, gebunden an die aktuelle Version; die alte Antwort bleibt unverändert. Die korrigierte Frage wird `answered`, `needs_review: false`. Alle transitiven Folgefragen (über `depends_on`, ohne `superseded`) erhalten `needs_review: true` und einen Verlaufseintrag. |
| QCLI-CMD-07 | `defer` | Nutzdaten `{id, reason, resume_when}`. Nur aus `open` oder `asked` (`invalid_transition`). Status `deferred`; Verlauf `Vertagt – Grund: …; Wiederaufnahme: …`. Kein Antwort-Eintrag. |
| QCLI-CMD-08 | `supersede` | Nutzdaten `{id, by, reason}`. `by` ist eine andere, nicht ersetzte Frage des Themas (`supersede_target_invalid`); Quelle nicht schon `superseded` (`invalid_transition`). Status `superseded`, Verlauf `Ersetzt durch <by> – <reason>`. Transitive Folgefragen erhalten `needs_review: true`. Antworten bleiben. |
| QCLI-CMD-09 | `revise` | Nutzdaten `{id, reason, fields: {title?, kind?, priority?, context?, occasion?, impact?, question?, options?, recommendation?, evidence_needed?, depends_on?}}`, mindestens ein Feld. Nicht aus `superseded`. Setzt `Version` + 1, ersetzt nur die genannten Felder. `asked` → `open` (neue Version ist nicht gestellt); `answered` bleibt `answered` mit `needs_review: true` (alte Antworten bleiben an ihre Version gebunden). Neue `depends_on` werden wie bei `add` geprüft. Indexzeile bleibt unverändert. |
| QCLI-CMD-10 | `review` | Nutzdaten `{id, note, source: {by, channel, time?, ref?}}`. Schließt eine Prüfung ab: `needs_review: false`, Verlauf mit Notiz und Quelle. Ohne Prüfbedarf → `review_not_needed`; offener Konflikt → `conflict_unresolved` (Auflösung nur per `correct`). Bei Fragen mit Antwort gilt für `source.by` dieselbe Urheberprüfung wie bei `answer`. |
| QCLI-CMD-11 | `pause` | Session `paused`; Fragen unverändert. Schon `paused` → `invalid_transition`. |
| QCLI-CMD-12 | `resume` | Session `paused` → `active`; sonst `invalid_transition`. |
| QCLI-CMD-13 | `status` | Ohne `--set` nur lesend: Session, Zählung je Status und Prüfbedarf, je Frage ID, Titel, Version, Status, `needs_review`, `depends_on`, Priorität, Zahl der Antworten, wirksame Antwort (ID, Text) und offener Konflikt. Mit `--set ZUSTAND [--summary TEXT] [--confirmation TEXT]` setzt es den Sessionstatus: `awaiting_confirmation` verlangt eine Zusammenfassung (`summary_missing`); `complete` verlangt Zusammenfassung und Bestätigung und keine Frage `open`, `asked` oder prüfpflichtig (`complete_blocked` mit IDs); vertagte und ersetzte Fragen bleiben als Restpunkte erlaubt. `--summary`/`--confirmation` schreiben die Indexfelder `Zusammenfassung`/`Bestätigung`. |
| QCLI-CMD-14 | `next` | Nur lesend. Gruppen: `askable` (fragbar, sortiert nach Priorität blocking → important → later, dann `Erstellt`, dann ID), `needs_review` (prüfpflichtig, nicht `superseded`), `blocked` (`open` mit nicht erfüllter Voraussetzung, je Voraussetzung Grund `not_answered`, `needs_review`, `superseded` oder `unknown`), `waiting` (`asked`), `deferred` (mit Wiederaufnahmebedingung, soweit im Verlauf). Ein leeres `askable` ist kein Abschluss. |
| QCLI-CMD-15 | `check` | Nur lesend, Wurzel oder ein Thema. Prüft die Invarianten an den Dateien (§6.3). Exit 1 bei mindestens einem Fehler; Warnungen ändern den Exit-Code nicht. |
| QCLI-CMD-16 | `render` | Ergänzt im Index fehlende Zeilen für Fragedateien (Kurzfrage = Titel), angehängt nach der letzten vorhandenen Zeile, neue Zeilen nach ID sortiert. Vorhandene Zeilen und Kurzfragen bleiben byte-gleich; fehlt die Tabelle, wird sie nach den Kopfzeilen eingefügt. Zeile ohne passende Fragedatei → `index_row_orphan`. Ohne Änderung wird nicht geschrieben. |

Jeder schreibende Befehl außer `init`, `pause`, `resume` und `status --set` ergänzt pro geänderter Frage genau einen
Verlaufseintrag `- <YYYY-MM-DD>: <Änderung>`. Kein Befehl löscht eine Datei.

## 5. Dateiformat

### 5.1 IDs und Namen

- Frage `Q-<YYYYMMDD>-<suffix>`, Runde `R-…`, Antwort `A-…`. `YYYYMMDD` ist ein gültiges Kalenderdatum; `suffix` besteht aus
  `[a-z0-9]`-Gruppen, getrennt durch einzelne `-` (z. B. `input-expiry`, `143000-k7`); Gesamtlänge höchstens 80.
- Thema: `[a-z0-9]`-Gruppen mit einzelnen `-`, höchstens 64 Zeichen.
- Pfade: `<wurzel>/<thema>/index.md`, `…/questions/<Q-ID>.md`, `…/rounds/<R-ID>.md`. Ein Symlink auf diesem Weg → `path_unsafe`.

### 5.2 Frage (kanonisch, `records.md`)

```markdown
---
id: Q-20261031-beispiel
status: open
needs_review: false
depends_on: []
---
# <title>
Version: 1
Erstellt: 2026-10-31
Art: decision
Priorität: blocking
Kontext / Quelle: <context>
Anlass: <occasion>
Auswirkung / blockierte Arbeit: <impact>
Fragestellung: <question, Standard: title>
Optionen und Folgen: <options>
Empfehlung + sachlicher Grund: <recommendation>
Benötigter Sachbeleg: <evidence_needed, Standard: keiner>

## Antworten
Noch keine. Empfehlung ist keine Antwort.

## Verlauf
- 2026-10-31: Erfasst.
```

`depends_on` wird als Liste in JSON-Schreibweise geschrieben (`["Q-…", "Q-…"]`). Gelesen werden zusätzlich Listen ohne
Anführungszeichen und Blocklisten (`- Q-…`). Kopffelder dürfen Folgezeilen haben (z. B. Optionen als Liste); gelesen wird der
zusammengefügte Wert.

### 5.3 Antwort-Eintrag

```markdown
Antwort-ID: A-20261031-beispiel
Zeit / beantwortet von / Quelle: <time, Standard: Datum aus --now>, <by>, <channel> (<ref, sonst: keine Message-ID>)
Bezug: Version 1, Runde R-20261031-chat1
Antwort: „<text>“ (wörtlich)          bzw.  Antwort: <text> (sinngemäß)
Ersetzt Antwort: keine                bzw.  A-…
Konflikt mit: keiner                  bzw.  A-…
Folgen / Rückfragen: <consequences, Standard: keine>
```

Einträge werden mit einer Leerzeile getrennt am Ende von `## Antworten` angehängt. Eine Korrektur ohne Runde schreibt
`Bezug: Version N, Korrektur ohne Runde`. Fehlt in einem gelesenen Eintrag die Version im Bezug, gilt er als Antwort auf die
aktuelle Version (vorsichtige Auslegung: eine weitere Antwort wird dann als Konflikt behandelt).

### 5.4 Themenindex

```markdown
# <title>
Session: active
Ziel / Nicht-Ziele: <goal> / nicht: <non_goals>
Kontext: <context>
Bearbeiter: <editor>

| ID / Datei | Kurzfrage |
|---|---|
| [Q-…](questions/Q-….md) | <Kurzfrage> |

Status und Abhängigkeiten ausschließlich in den Frage-Dateien führen.
Nächste Runde / Forschungsblockade: ausstehend
Zusammenfassung: ausstehend
Bestätigung: ausstehend
Chat-Runden: R-… – Q-… v1, Q-… v1 – <asked, Standard: im Chat gestellt> – Zustellung bestätigt|unbekannt|fehlgeschlagen
```

Fehlende Angaben stehen als `ausstehend`. Tabellenzeilen werden überall im Index erkannt, auch durch Leerzeilen getrennt.
Weitere Felder (z. B. `Runden:`, `Nächster Schritt:`) bleiben unverändert.

### 5.5 Runde bei Tool-Zustellung

```markdown
# R-20261031-tool1
Status: sent | prepared | failed
Kontextversion: <context_version, Standard: unbekannt>
Tool/Chat: <tool>
Mapping:
- <field, Standard: Feld n> → Q-… v1
Gestellt: <asked, Standard: Fragestellungen der Frage-Dateien>
Zustellung / Zeitpunkt: bestätigt, <Datum> | unbekannt | fehlgeschlagen, <Datum>
Antwortquelle: ausstehend
Ergebnis: ausstehend
Fehler / Wiederaufnahme: – | Toolfehler; Fragen bleiben unverändert
```

Gelesen werden auch von Hand geschriebene Rundendateien und Chat-Zeilen; zugeordnet sind alle Paare `Q-… vN` darin.

## 6. Fehler

### 6.1 Verweigerungen (Exit 1)

Ausgabe `{refused: true, messages: [{code, severity: "error", path, message, rule}]}`; alle Verstöße eines Aufrufs werden gesammelt.

| Code | Anlass | Regel |
|---|---|---|
| `payload_invalid`, `field_invalid` | Nutzdaten verletzen ihr Schema; Zeilenumbruch oder Steuerzeichen in einem Textfeld | CMD-01 |
| `id_invalid`, `path_unsafe` | ID oder Pfad verletzt §5.1 | INV-08 |
| `id_collision`, `answer_id_collision`, `round_exists`, `topic_exists` | Vergabe würde Vorhandenes überschreiben | INV-08, INV-10 |
| `topic_missing`, `question_unknown`, `question_invalid`, `index_invalid` | Thema, Frage oder lesbare Struktur fehlt | INV-11 |
| `dependency_unknown`, `dependency_cycle`, `dependency_unmet` | Abhängigkeiten | workflow Runden 2 |
| `version_mismatch`, `answer_unmapped` | Antwort oder Frage passt nicht zur gestellten Version bzw. Runde | INV-03, CMD-05 |
| `invalid_transition`, `session_paused`, `summary_missing`, `complete_blocked` | Zustandsübergang nicht erlaubt | CMD-04…13 |
| `answer_source_missing`, `answer_not_human`, `recommendation_as_answer` | Antwort ohne Quelle oder Empfehlung bzw. Frist als Antwort | INV-01, -02, -04 |
| `answer_ref_unknown`, `supersede_target_invalid`, `review_not_needed`, `conflict_unresolved` | Verweis oder Prüfung unzulässig | CMD-06, -08, -10 |
| `secret_detected` | Secret-artiger Wert; Ausgabe nennt Feld, Musterart und Position, nie den Wert | INV-07 |
| `index_row_orphan` | Indexzeile ohne passende Fragedatei | INV-06 |
| `concurrent_modification`, `write_failed` | Datei seit dem Lesen geändert; Schreibfehler (nach Rücknahme) | INV-09, -13 |

### 6.2 Bedienfehler (Exit 2)

Unbekannter Befehl oder Option, fehlendes `--root`/`--topic`, `--root` kein Verzeichnis, `--topic` ungültig, `--now` ungültig,
keine oder mehrere Eingabequellen, ungültiges JSON. Ausgabe `{error: {kind: "usage", message}}` auf stdout.

### 6.3 Befunde von `check`

| Code | Schwere | Befund |
|---|---|---|
| `question_invalid` | error | Frontmatter fehlt oder unvollständig, Status/`needs_review` ungültig, kein Titel, keine Version, Abschnitt fehlt, CRLF/BOM |
| `id_invalid`, `id_mismatch` | error | ID verletzt §5.1; Frontmatter-ID ungleich Dateiname |
| `answered_without_answer` | error | `answered` ohne Antwort-Eintrag (INV-01) |
| `answer_source_missing` | error | Antwort-Eintrag ohne Quelle (INV-01) |
| `status_answer_mismatch` | error | `open`/`asked` trotz wirksamer Antwort auf die aktuelle Version |
| `conflict_without_review` | error | offener Konflikt ohne `needs_review: true` (INV-03) |
| `answer_id_duplicate`, `answer_ref_unknown` | error | Antwort-ID doppelt im Thema; `Ersetzt Antwort`/`Konflikt mit` zeigt ins Leere |
| `dependency_unknown`, `dependency_cycle` | error | Abhängigkeit fehlt; Zyklus |
| `index_missing`, `index_invalid`, `session_invalid`, `index_row_orphan` | error | Index fehlt, ohne gültige `Session:`, Zeile ohne Fragedatei |
| `round_invalid` | error | Rundendatei mit ungültiger ID, abweichender Überschrift oder unbekanntem Status |
| `secret_detected` | error | Secret-artiger Wert in einer Datei (INV-07) |
| `index_stale` | warning | Fragedatei ohne Indexzeile (Abhilfe `render`) |
| `recommendation_as_answer` | warning | Antworttext gleich Empfehlung (Prüfung von Hand) |
| `answer_version_unknown` | warning | Bezug ohne Version |
| `defer_reason_missing`, `supersede_ref_missing` | warning | `deferred` ohne Vertagungseintrag; `superseded` ohne Verweis im Verlauf |
| `dependency_superseded`, `round_ref_unknown` | warning | Abhängigkeit auf ersetzte Frage; Runde nennt unbekannte Frage |
| `temp_file_left` | warning | liegengebliebene temporäre Datei eines abgebrochenen Laufs |

## 7. Fallmatrix (QCLI-FALL)

Jeder Fall ist ein Contract-Test mit synthetischen Daten in einem temporären Ordner, außer -33 (echte Ablagen, nur lesend).
Testnamen beginnen mit der Fall-ID.

| ID | Fall | Erwartung | Deckt |
|---|---|---|---|
| QCLI-FALL-01 | `init` auf neues Thema; zweites `init` | Index nach §5.4 mit `Session: active`, `questions/` vorhanden; `topic_exists`, Index unverändert | CMD-02 |
| QCLI-FALL-02 | `--topic ../x`; ID `Q-20261031-../x`, `q-20261031-x`, `Q-20261331-x`; `questions/` als Symlink nach außen | Exit 2; je `id_invalid`; `path_unsafe`; nichts außerhalb geschrieben | INV-08 |
| QCLI-FALL-03 | `add` einer Frage | Datei byte-gleich mit §5.2, Indexzeile ergänzt, `check` ohne Fehler | CMD-03, INV-11 |
| QCLI-FALL-04 | `add` mit vorhandener ID im selben und in anderem Thema; doppelte ID im Stapel | je `id_collision`, nichts geschrieben | CMD-03, INV-10 |
| QCLI-FALL-05 | Stapel aus drei Fragen, eine mit unbekannter Abhängigkeit; Abhängigkeit auf sich selbst; Abhängigkeit innerhalb des Stapels | `dependency_unknown` ohne jede Datei; `dependency_cycle`; dritter Stapel angenommen | CMD-03, INV-10 |
| QCLI-FALL-06 | unbekannter Schlüssel, fehlendes Pflichtfeld, Zeilenumbruch im Titel; ungültiges JSON; `--json` und `--file` zugleich | `payload_invalid`, `payload_invalid`, `field_invalid`; Exit 2; Exit 2 | CMD-01 |
| QCLI-FALL-07 | `ask` im Chat, Zustellung bestätigt | Fragen `asked`, Verlaufseintrag, Zeile `Chat-Runden:` im Index, Session `waiting_user` | CMD-04 |
| QCLI-FALL-08 | `ask` mit Zustellung unbekannt (ohne Rückkanal) | Fragen bleiben `open`, Chat-Zeile „Zustellung unbekannt“, Session `waiting_user` | CMD-04, workflow „Ohne Rückkanal“ |
| QCLI-FALL-09 | `ask` per Tool bestätigt; per Tool fehlgeschlagen | Rundendatei nach §5.5 mit Mapping, Status `sent`; Status `failed`, Fragen unverändert | CMD-04 |
| QCLI-FALL-10 | `ask` mit alter Version; mit unbeantworteter Voraussetzung; auf beantwortete Frage ohne Prüfbedarf; mit vergebener R-ID; bei Session `paused` | `version_mismatch`; `dependency_unmet`; `invalid_transition`; `round_exists`; `session_paused`; je nichts geschrieben | CMD-04, INV-10 |
| QCLI-FALL-11 | erste `answer` | `answered`, Eintrag nach §5.3 mit Quelle und Wortlaut, Platzhalter entfernt, Verlauf, Chat-Zeile mit Antwortverweis | CMD-05, INV-01 |
| QCLI-FALL-12 | `answer` auf Frage, die nicht in der Runde stand; auf unbekannte Runde | je `answer_unmapped`; andere Fragen unverändert | CMD-05 |
| QCLI-FALL-13 | `answer` ohne `by`; `by` „Claude“, „Frist“, „Empfehlung“; Text gleich Empfehlung | `answer_source_missing`; je `answer_not_human`; `recommendation_as_answer` | INV-01, -02, -04 |
| QCLI-FALL-14 | zweite `answer` auf dieselbe Version | Eintrag mit `Konflikt mit: <erste>`, `needs_review: true`, erste Antwort byte-gleich und laut `status` wirksam | INV-03, INV-05 |
| QCLI-FALL-15 | Antworttexte mit `sk-…`, `ghp_…`, `AKIA…`, 40-stelligem Hex, langem Base64-Token; danach redigierte Antwort; Text mit Pfaden und Kurz-SHA | je `secret_detected`, Wert nicht in stdout/stderr, keine Datei geändert; redigiert angenommen; kein Befund | INV-07 |
| QCLI-FALL-16 | `correct` bei Kette A ← B ← C und unabhängiger D | neuer Eintrag mit `Ersetzt Antwort`, alter byte-gleich; B und C `needs_review: true`, D unverändert; A `needs_review: false` | CMD-06, INV-05 |
| QCLI-FALL-17 | `correct` mit unbekanntem `replaces`; auf Frage ohne Antwort | `answer_ref_unknown`; `invalid_transition` | CMD-06 |
| QCLI-FALL-18 | `defer` auf `asked`; ohne `resume_when`; auf `answered` | `deferred`, Grund und Bedingung im Verlauf, kein Antwort-Eintrag; `payload_invalid`; `invalid_transition` | CMD-07, INV-04 |
| QCLI-FALL-19 | `supersede` mit Folgefrage; Ziel unbekannt; Ziel gleich Quelle | `superseded` mit Verweis, Folgefrage prüfpflichtig; je `supersede_target_invalid` | CMD-08 |
| QCLI-FALL-20 | `revise` einer beantworteten Frage; danach `answer` auf Version 1; auf Version 2 | Version 2, `needs_review: true`, alte Antwort mit `Version 1`; `version_mismatch`; wirksam, `needs_review: false` | CMD-09 |
| QCLI-FALL-21 | `review` bei Prüfbedarf; ohne Prüfbedarf; bei offenem Konflikt | `needs_review: false` mit Verlauf; `review_not_needed`; `conflict_unresolved` | CMD-10 |
| QCLI-FALL-22 | `pause`, `resume`, `resume` ohne Pause | `paused` (Fragen unverändert), `active`, `invalid_transition` | CMD-11, -12 |
| QCLI-FALL-23 | `status` lesend; `--set awaiting_confirmation` ohne und mit Zusammenfassung; `--set complete` mit offener Frage; mit allem geklärt und Bestätigung | Zählung; `summary_missing`; gesetzt; `complete_blocked`; `complete` | CMD-13 |
| QCLI-FALL-24 | `next` mit Kette, prüfpflichtiger, gestellter, vertagter und ersetzter Frage | `askable` sortiert nach Priorität; `blocked` mit Grund; Gruppen getrennt | CMD-14 |
| QCLI-FALL-25 | `check` auf synthetischen Verstößen (§6.3) | je erwarteter Code, Exit 1; nur Warnung `index_stale` → Exit 0; Secret-Wert nicht in der Ausgabe | CMD-15 |
| QCLI-FALL-26 | `check`, `status`, `next` auf einem Baum | Baum vorher/nachher gleich (Inhalt, Zeitstempel) | CMD-13…15 |
| QCLI-FALL-27 | `render` mit fehlender Zeile; zweites `render`; Zeile ohne Datei | Zeile ergänzt, andere Zeilen byte-gleich; keine Änderung; `index_row_orphan` | CMD-16, INV-06 |
| QCLI-FALL-28 | Frage mit unbekanntem Frontmatter-Schlüssel, unbekanntem Feld, Zusatzabschnitt und Kommentar; `answer`, dann `defer` einer anderen | alle nicht betroffenen Zeilen byte-gleich | INV-11 |
| QCLI-FALL-29 | Schreibfehler nach der ersten von drei Umbenennungen | `write_failed`, alle Dateien wie vorher, keine temporären Dateien | INV-09 |
| QCLI-FALL-30 | Datei zwischen Lesen und Schreiben geändert | `concurrent_modification`, Datei mit der fremden Änderung bleibt | INV-13 |
| QCLI-FALL-31 | gleicher Ablauf in zwei Wurzeln mit gleichem `--now` | Dateien und Ausgaben byte-gleich | INV-14 |
| QCLI-FALL-32 | Round-Trip auf Kopien der acht Dev-Fixtures (grilling-Runde) | Lesen und Schreiben ohne Änderung byte-gleich; `check` ohne Fehler; `render` ändert nichts | INV-11 |
| QCLI-FALL-33 | `check` auf `docs/fragen/skill-library`, `docs/fragen/v0-ziel-und-vertraege` und die ganze Wurzel `docs/fragen` | 0 Fehler, Baum unverändert | CMD-15 |
| QCLI-FALL-34 | Szenario D1 Teilantwort | nur `Q-…-speicherort` beantwortet, Gäste bleibt `asked` ohne Antwort-ID, nur unter `docs/fragen/` geändert; `next` nennt Konflikte als fragbar | Dev-Fall B02 |
| QCLI-FALL-35 | Szenario D2 Korrektur | alte Antwort bleibt, zwei Antwort-IDs; Konflikte `needs_review: true`, Gäste `false` | Dev-Fall B04 |
| QCLI-FALL-36 | Szenario D3 Pause | `Session: paused`, Fragen bleiben `asked`; folgendes `ask` → `session_paused` | Dev-Fall B06a |
| QCLI-FALL-37 | Szenario D4 Secret | Antwort mit Schlüssel abgelehnt; redigierte Antwort angenommen; Schlüssel nirgends in der Ablage | Dev-Fall B08 |
| QCLI-FALL-38 | Szenario D5 Abschluss | `next` ohne fragbare Frage, keine neue Fragedatei, `Session: awaiting_confirmation` | Dev-Fall B10a |
| QCLI-FALL-39 | Szenario D6 neue Lücke | Gäste beantwortet; neue Fragedatei mit eigener ID und Bezug auf die Gäste-Frage | Dev-Fall B10b |
| QCLI-FALL-40 | Szenario D7 Doppelantwort | erste Antwort bleibt, `Konflikt mit: A-…`, `needs_review: true` | Dev-Fall B14 |
| QCLI-FALL-41 | Szenario D8 Frist | Antwort mit Urheber „Frist“ abgelehnt; `defer` mit Grund; kein Antwort-Eintrag, Status `deferred` | Dev-Fall B15 |
| QCLI-FALL-42 | Quelltext von `lib/questions/` | importiert nur `node:fs`, `node:path`, `node:crypto` und eigene Module; kein Netz, kein Prozessstart | INV-12 |
| QCLI-FALL-43 | unbekannter Befehl, fehlendes `--root`, `--root` ohne Verzeichnis, unbekannte Option, ungültiges `--now` | je Exit 2 mit JSON auf stdout | §6.2 |
| QCLI-FALL-44 | `.claude/settings.json` | genau eine Erlaubnisregel `Bash(node tools/skill-library/cli.js questions:*)`, keine weiteren Rechte | Owner-Freigabe |

Szenarien -34 bis -41 spielen die Dev-Fälle als CLI-Abläufe nach und wenden dieselben Prüfungen an wie `check_case.py`
(Frontmatter, enthält/enthält nicht, Regex, Mindestanzahl, nirgends vorhanden, neue Datei, nur unter Pfad geändert).
Sie belegen, dass die CLI die erwarteten Endzustände erzeugen kann, nicht, dass ein Modell sie so aufruft.

## 8. Rechte

Die Projektregel in `.claude/settings.json` erlaubt nur `Bash(node tools/skill-library/cli.js questions:*)` (`:*` ist laut
Claude-Code-Dokumentation gleichbedeutend mit ` *` am Ende). Messläufe setzen dieselbe Regel per
`--allowedTools "Bash(node tools/skill-library/cli.js questions:*)"`. Zusammengesetzte Befehle (`|`, `&&`, `;`) brauchen für
jeden Teil eine eigene Erlaubnis; Nutzdaten deshalb per `--json` übergeben statt per Pipe. Andere Werkzeuge erhalten keine Rechte.

## 9. Offene Punkte

| ID | Punkt | Vorschlag / Wohin |
|---|---|---|
| QO-1 | Nutzt grilling die CLI? | späterer, gemessener Kandidat (Portierungsplan P9, ~14 Starts); dieser Entwurf ändert den Skilltext nicht |
| QO-2 | Wer darf Prüfbedarf bei offenen Fragen aufheben (`review` ohne Antwort)? | V0: jeder Bearbeiter mit Notiz und Quelle; mit [Q-20261030-input-authority](../fragen/human-input/questions/Q-20261030-input-authority.md) klären |
| QO-3 | Sperre gegen parallele Schreiber über mehrere Prozesse | V0 erkennt Änderungen zwischen Lesen und Schreiben (INV-13); eine echte Sperre folgt mit dem Kern-Journal |
| QO-4 | Secret-Erkennung ist eine Heuristik (Präfixe, Hex ab 32 Zeichen, Base64-artige Token ab 40 Zeichen mit hoher Entropie) | Fehlalarme durch Redaktion oder Kurzform lösen; keine Ausnahmeliste in V0 |
| QO-5 | Übernahme als Kern-Kommando (`tasks.request_input`) | erst nach Spec des Kerns (P12) |

## 10. Rückverfolgung

| Anforderung | Herkunft |
|---|---|
| INV-01…05 | grilling `SKILL.md` Schritte 5–7, `workflow.md` „Zustände“, „Runden“, „Versionen, Doppelantworten, Fristen“; V0-RFG, V0-FALL-14 |
| INV-06, INV-11 | `workflow.md` „Ablage“, `records.md`; Dev-Fixtures der grilling-Runde |
| INV-07 | `workflow.md` „Abschluss und Übergabe“; Dev-Fall B08 |
| INV-08…10, INV-13 | Konzept-Vorbild (Daten rein, kanonische Datei und Register raus, atomares Schreiben) und seine Lücken; SLV0-EVAL-17 |
| CMD-01…16 | Auftrag P9; `workflow.md` „Runden“ 1–8, „Ohne Rückkanal“ |
| FALL-34…41 | Dev-Fälle D1–D8 und `check_case.py` auf `research/e3-runde-2` |
