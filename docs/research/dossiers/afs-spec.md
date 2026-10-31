# Dossier: afs-spec (Agent Formation Schema)

> Nach [Vorlage](_vorlage.md). Belegstatus je Aussage: *dokumentiert* · *im Code gefunden* · *praktisch nachgewiesen* · *offen*.
> Clean-Room: Hier steht beobachtbares Verhalten und unsere Bewertung. Es wurde kein Text und keine Vorlage aus dem Repo übernommen.

| Feld | Wert |
|---|---|
| URL | [netzkontrast/afs-spec](https://github.com/netzkontrast/afs-spec) (Fork; Upstream laut README die Organisation `agent-formation`, nicht geprüft) |
| Commit-SHA | [`ce254f6dcc5f524de1c868f6197de4c89dbba78b`](https://github.com/netzkontrast/afs-spec/tree/ce254f6dcc5f524de1c868f6197de4c89dbba78b) |
| Release / Datum | keine Tags; Commit vom 13.07.2026; alle Dateien tragen `schema: "1.0.0"` |
| Lizenz(en), Notices, Assets | Apache-2.0 (Standardtext, [`LICENSE`](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/LICENSE)). Keine Copyright-Zeile, keine `NOTICE`, keine SPDX-Header; Rechteinhaber nicht genannt (*offen*). |
| Priorität / Tor | Vergleichsquelle; Bezug zu Tor B (Adaptervertrag) und Tor C (Abgleich unklarer Effekte). Kein Kandidat für Tor A. |
| Geprüft am / von | 31.10.2026 · Explorer-Agent (alle 36 Dateien gelesen) und Claude Code (Stichproben der unten zitierten Stellen) |

## Kurzfassung

Agent Formation ist ein deklaratives Konfigurationsformat für Agentensysteme: Agents, MCP-Tools, A2A-Dienste, Memory, Zugriffsregeln, Trigger und SOPs in YAML-Dateien mit der Endung `.afs`. Referenz-Runtime ist MUXI; das Format ist an mehreren Stellen MUXI-spezifisch. Das Repo enthält **keinen ausführbaren Code, kein JSON-Schema und keinen Validator** – „Schema“ meint annotierte YAML-Vorlagen plus Prosa (*dokumentiert*, [`ROADMAP.md`](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/ROADMAP.md) nennt Validator und Fixtures als künftig).

AFS beschreibt ein **Betriebsprofil**, keinen **Arbeitsvertrag**. Für sidekick wertvoll sind zwei Abschnitte: die Coding-Delegation (§7) als Vorbild für einen Runtime-Adaptervertrag und `watch_job` (§8) als deterministischer Beobachter. Mehrere Grundannahmen widersprechen sidekicks Grundsätzen; sie sind unten als Anti-Muster festgehalten.

## Startanleitung

Entfällt. Es gibt nichts auszuführen. Die Vorlagen lassen sich nur lesen; eine MUXI-Runtime wurde nicht installiert (*offen*).

## Öffentliche Verträge

Normativ ist [`specs/formation.md`](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/specs/formation.md) (844 Zeilen, 14 Abschnitte); Feldreferenz ist [`schemas/formation.afs`](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/schemas/formation.afs) plus [`schemas/SCHEMA_GUIDE.md`](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/schemas/SCHEMA_GUIDE.md). Alle Aussagen dieses Abschnitts sind *dokumentiert*.

| Bereich | Fundstelle | Beobachtbares Verhalten |
|---|---|---|
| Kernbausteine | formation.md §2, [L30–213](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/specs/formation.md#L30-L213) | Formation-Wurzel, Agents, MCP-Server, A2A-Dienste, Skills, SOPs, Trigger, Transformer |
| Zwei Erfassungsstufen | §3, [L214–245](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/specs/formation.md#L214-L245) | Architekturteile (Agents, MCP, A2A, Skills) werden explizit deklariert, Inhalte (SOPs, Trigger, Gruppen, Transformer) automatisch aus Ordnern entdeckt |
| „Registry is not grant“ | §2.3, [L76](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/specs/formation.md#L76) | Ein auf Formationsebene deklarierter MCP-Server gibt keinem Agenten Werkzeuge; erst das Attachment am Agenten tut das |
| Zugriff | §5, [L281–413](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/specs/formation.md#L281-L413) | Runtime speichert keine Mitgliedschaften; ein Middleware-MCP-Tool liefert je Request Gruppen. Fehler und Timeouts lehnen ab (fail-closed), kein Caching, Gruppen nie aus der Eingabe. Erlaubnisse werden vereinigt, Deny gewinnt; vierstufige Override-Kaskade; „Tool-Granularität ist Rechte-Granularität“ (§5.4) |
| Coding-Delegation | §7, [L464–590](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/specs/formation.md#L464-L590) | siehe Abschnitt „Adaptervertrag“ unten |
| Job-Beobachtung | §8, [L591–670](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/specs/formation.md#L591-L670) | `watch_job` pollt ein Status-Tool im Rechtekontext des Aufrufers bis zu einer deterministischen Endbedingung; Takt und Frist sind Konfiguration, keine Agent-Parameter |
| Antwort-Affordanzen | §9, [L671–776](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/specs/formation.md#L671-L776) | Text ist immer vollständig, Widgets sind Zusatz; Ziel-URLs für Aktionslinks dürfen nicht vom Modell stammen (§9.4) |
| Secrets | §11 und [`specs/secrets.md`](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/specs/secrets.md) | Referenzen `${{ secrets.NAME }}`, beim Laden aufgelöst, nie geloggt; Speicherung implementierungsdefiniert |
| Erweiterungen | §13, [L822–838](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/specs/formation.md#L822-L838) | ein Namensraum `extensions:` mit Domain-Schlüsseln; unbekannte werden ignoriert |
| Versionierung | [`specs/versioning.md`](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/specs/versioning.md) | SemVer je Datei; Deprecation über mindestens eine Minor-Linie |

### Adaptervertrag der Coding-Delegation (§7)

Das ist der für sidekick wichtigste Teil. Beobachtbares Verhalten laut Spec (*dokumentiert*; ob MUXI es so umsetzt, ist *offen*):

- Ein Adapter beschreibt deklarativ, wie eine Coding-CLI aufgerufen wird: Binary, Argumentfragmente mit Platzhaltern für Prompt, Session-ID und Modell, Ausgabeformat (`stream-json`, `json`, `text`) und Selektoren für Ergebnis und Session-ID (§7.1, §7.3).
- Der Aufruf wird als Argument-Array zusammengesetzt, nie über eine Shell (§7.1).
- Es gibt genau eine von drei Session-Formen: ein idempotentes Fragment, ein Paar aus Anlegen und Fortsetzen, oder eine von der CLI vergebene und aus der Ausgabe gelesene ID (§7.2). Bei gestreamter Ausgabe gilt für das Ergebnis der letzte nichtleere Treffer, für die Session-ID der erste.
- Jeder Lauf bekommt ein frisches Arbeitsverzeichnis; Dauerhaftes liegt nur in Git. Ein fortgesetzter Lauf bekommt wieder ein neues Verzeichnis (§7.4). Flags, die das Arbeitsverzeichnis verschieben würden, lehnt das Laden ab.
- Secrets dürfen nur in Umgebungsvariablen stehen, nie in Argumenten, weil Argumente für andere Prozesse sichtbar sind (§7.5).
- Delegation ist immer asynchron. Ein Timeout beendet die ganze Prozessgruppe, die Session-ID bleibt erhalten. Überschreitet ein Aufruf die Parallelitätsgrenze, ist das ein Fehler, keine Warteschlange (§7.6).
- Braucht ein Lauf eine Rückfrage, endet er mit der Frage; die Antwort setzt die Session fort. **Ein Freigabe-Primitiv gibt es nicht** (§7.6).
- Herstellerflags für Rechte und Sicherheit werden unverändert durchgereicht; der Standard modelliert sie nicht (§7.5).
- Ungültige Konfiguration scheitert beim Laden, nie erst beim Aufruf (§7.7).

Die mitgelieferte Vorlage [`schemas/coding/claude-code.yaml`](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/schemas/coding/claude-code.yaml) (38 Zeilen) beschreibt damit den Aufruf von Claude Code im Print-Modus mit JSON-Stream, Prompt über stdin, Session-Paar aus `--session-id` und `--resume`. Sie nennt Claude Code CLI 2.x als getestet (*dokumentiert*, nicht von uns nachgeprüft).

## Persistenz

Laut Spec: Memory in drei Stufen (Vektorindex, Puffer, persistent in SQLite oder PostgreSQL), Artefakte lokal mit optionaler Verschlüsselung, Delegations-Jobs als „tracked jobs“ der Runtime; Arbeitsverzeichnisse sind Wegwerfware (*dokumentiert*). Wo und wie MUXI das speichert, ist *offen*.

## Credential-Fluss

Die Runtime löst Secret-Referenzen beim Laden auf und reicht sie an Tools und Subprozesse weiter (Coding-Delegation nur über Umgebungsvariablen). Nutzerbezogene Credentials werden verschlüsselt mit Salt gespeichert; die Vorlage setzt einen festen Standard-Salt ([`formation.afs` L908–910](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/schemas/formation.afs#L908-L910)) und zeigt Verbindungszeichenfolgen mit Passwort im Klartext ([L385](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/schemas/formation.afs#L385)). Alles *dokumentiert*. Das Modell „die Runtime besitzt alle Credentials“ ist das Gegenteil von sidekicks Gerätegrenze.

## Sicherheitsgrenzen

- Isolation der Coding-CLI ist ausdrücklich Sache des Entwicklers; die Runtime prüft nur, ob das Binary existiert (§7, Einleitung). Ein frisches Verzeichnis ist keine Sandbox.
- Rechteprüfung nur über Gruppen am Request-Eingang; einmal gestartete Delegation läuft mit den Rechten der CLI und ihrer durchgereichten Flags.
- Trigger-Webhooks, proaktive Kanäle und Transformer senden ohne Freigabe nach außen (§2.7, §2.8, §6).
- `init:` führt beim Laden beliebigen Shell-Code aus (§12).

Ein Agent kann damit kontrollierte Effekte im sidekick-Sinn vollständig umgehen (*dokumentiert* als Designentscheidung, nicht als Lücke).

## Ausfallverhalten

| Fall | Beobachtung | Belegstatus |
|---|---|---|
| Netzwerkunterbrechung | nicht spezifiziert | *offen* |
| Prozess-/Connector-Neustart | nicht spezifiziert; Timeout und Abbruch beenden die Prozessgruppe und behalten die Session-ID (§7.6) | *dokumentiert* (nur Timeout/Abbruch) |
| Doppelte Zustellung | keine Idempotenz, kein Fencing, keine Epochen | *dokumentiert* durch Fehlen |
| Rechteentzug | Middleware je Request, kein Cache; laufende Delegation wird nicht erwähnt | *offen* |
| Fremdjob mit unklarem Ende | `watch_job` mit Frist; bei Ablauf wird „timed out“ gemeldet, nichts verschwindet still (§8.1) | *dokumentiert* |

## Tests

Keine. Es gibt nichts Ausführbares; Analyse-§8-Tests sind nicht anwendbar.

## Bewertung für den Hub

**Gesamtkategorie:** Verhalten neu implementieren (§7, §8, ausgewählte Regeln aus §5, §9, §11) · Rest zurückstellen bzw. nur dokumentieren. Keine Dependency, keine Integration, keine Textübernahme.

**Was sidekick übernimmt (als eigene Anforderung):**

1. Runtime-Adaptervertrag nach dem Muster von §7, ergänzt um das, was AFS fehlt: Freigabe-Rückkanal, Epoch/Fencing, Budgetmeldung, typisierter Unsupported-Fehler, Capability-Profil. Ziel: eigene Spec `docs/spec/runtime-adapter-v0.md` (Arbeitspaket AP2).
2. Deterministischer Beobachter für Fremdjobs (§8) als Baustein zum Abgleich unklarer Effekte (Tor C).
3. Für die Grant-Spec: „Registry ist kein Grant“, Deny gewinnt, fail-closed bei Fehlern der Identitätsquelle, Gruppen nie als Behauptung des Aufrufers.
4. Für die UI: Aktionsziele nie vom Modell, Text vollständig und Widgets additiv.
5. Für Validator und Schemas: geschlossene Schlüsselmengen, tote Konfiguration scheitert beim Laden.

**Anti-Muster, die sidekick ausdrücklich nicht übernimmt** (jedes wird ein negativer Fall in der Fallmatrix der Adapter-Spec):

| AFS | Fundstelle | sidekick-Grundsatz |
|---|---|---|
| SOPs überspringen Planfreigabe per Default | [formation.md L133](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/specs/formation.md#L133) | Freigabe ist Pflicht, Default aus |
| Herstellerflags wie das Überspringen aller Rechteabfragen werden durchgereicht | §7.5 | Rechte nur aus Grants; Flags sind Teil eines geprüften Adapterprofils |
| Webhooks, Heartbeat, Kanäle senden direkt | §2.7, §6 | Außenwirkung nur als typisierter Effekt über den Hub |
| Entitäten werden ab Score 0,85 automatisch zusammengeführt | [SCHEMA_GUIDE L551](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/schemas/SCHEMA_GUIDE.md#L551) | Agent-Aussagen werden erst nach Prüfung Projektwissen |
| Klartext-Passwort, fester Salt in der Vorlage | formation.afs L385, L908–910 | Credentials bleiben am Gerät |
| Shell-Hook beim Laden | §12 | Kein beliebiger Code im Hub-Prozess |

## Dateizuordnung (36 von 36)

Jede Datei hat genau eine Entscheidung. „Dossier“ heißt: Inhalt ist in diesem Dokument ausgewertet, mehr folgt nicht.

| Datei | Zeilen | Inhalt | Entscheidung | Ziel in sidekick |
|---|---:|---|---|---|
| `README.md` | 266 | Überblick, Prinzipien | Dossier | dieses Dokument |
| `CHARTER.md` | 47 | Mission, IP/DCO, geplanter Wechsel zur Linux Foundation | Dossier | Lizenzzeile, offene Punkte |
| `GOVERNANCE.md` | 108 | Lazy Consensus, Abstimmungen | Dossier | – |
| `MAINTAINERS.md` | 17 | ein Maintainer | Dossier | offene Punkte |
| `ROADMAP.md` | 57 | geplante Validatoren, Fixtures, Mappings | Dossier | Kurzfassung |
| `LICENSE` | 201 | Apache-2.0 | Dossier | [Herkunftsregister](../../herkunftsregister.md) |
| `.gitattributes` | 1 | `.afs` als YAML | nicht übernehmen | – |
| `.gitignore` | 1 | – | nicht übernehmen | – |
| `.vscode/settings.json` | 5 | Editor | nicht übernehmen | – |
| `specs/README.md` | 27 | Index | Dossier | – |
| `specs/formation.md` §1–§3 | 844 (gesamt) | Grundbegriffe, Erfassungsstufen | Dossier | Öffentliche Verträge |
| `specs/formation.md` §4 | | Modellwahl-Hierarchie | zurückstellen | – |
| `specs/formation.md` §5 | | Zugriff, Gruppen, Kaskade | Verhalten neu spezifizieren | Grant-Spec (V1), Bausteine AP5 |
| `specs/formation.md` §6 | | proaktive Nachrichten, Befehle | zurückstellen | – |
| `specs/formation.md` §7 | | Coding-Delegation | Verhalten neu spezifizieren | `docs/spec/runtime-adapter-v0.md` (AP2) |
| `specs/formation.md` §8 | | `watch_job` | Verhalten neu spezifizieren | Adapter- bzw. Effekt-Spec (AP2) |
| `specs/formation.md` §9 | | Links, Widgets, Herkunftsregel | Verhalten neu spezifizieren (zwei Regeln) | UI-Anforderungen, später |
| `specs/formation.md` §10–§14 | | Artefakte, Secrets, Init, Erweiterungen, Kompatibilität | Dossier; Secret-Grundsätze neu spezifizieren | Credential-Abschnitt der Adapter-Spec |
| `specs/secrets.md` | 134 | Secret-Syntax und Pflichten | Verhalten neu spezifizieren (Grundsätze) | Adapter-Spec |
| `specs/versioning.md` | 60 | SemVer, Deprecation | Dossier | sidekick hat eigene Regeln in [`docs/spec/README.md`](../../spec/README.md) |
| `schemas/README.md` | 46 | Index | Dossier | – |
| `schemas/SCHEMA_GUIDE.md` | 1616 | Feldreferenz, Validierungsregeln | Dossier; Validierungsstil neu spezifizieren | Validator-Konventionen |
| `schemas/LOGGING.md` | 1233 | MUXI-Logging, ~110 Ereignisnamen | zurückstellen | Namensvergleich bei Ereignis-Spec |
| `schemas/formation.afs` | 979 | annotierte Vorlage | Dossier | – |
| `schemas/agents/minimal.afs` | 11 | Agent-Vorlage | Dossier | – |
| `schemas/agents/full.afs` | 119 | Agent-Vorlage | Dossier | – |
| `schemas/mcp/local_tools.afs` | 39 | MCP stdio | Dossier | – |
| `schemas/mcp/web_tools.afs` | 50 | MCP http | Dossier | – |
| `schemas/a2a/analytics_engine.afs` | 11 | A2A-Dienst | zurückstellen (A2A ist Phase 5) | – |
| `schemas/a2a/external_billing_service.afs` | 34 | A2A mit Auth | zurückstellen | – |
| `schemas/groups/analyst.afs` | 71 | RBAC-Gruppe | Dossier | Grant-Spec als Gegenbeispiel |
| `schemas/transformers/slack-bridge.afs` | 53 | Ausgangsformatierer | zurückstellen | – |
| `schemas/coding/README.md` | 86 | Delegation | Verhalten neu spezifizieren | AP2 |
| `schemas/coding/claude-code.yaml` | 38 | Claude-Code-Adapter | Verhalten neu spezifizieren; eigene synthetische Fixture statt Kopie | AP2, Tor B |
| `schemas/middleware/README.md` | 78 | Middleware-Vertrag | Dossier | Grant-Spec (fail-closed) |
| `schemas/knowledge/README.md` | 72 | Wissensquellen | zurückstellen; Gegenbeispiel zum Kontextpaket | – |
| `schemas/skills/README.md` | 52 | Agent-Skills-Format | Dossier | Prüfpunkt Skill-Library |
| `schemas/skills/example-skill/SKILL.md` | 44 | Beispiel-Skill | Dossier | – |
| `schemas/skills/example-skill/scripts/example.py` | 26 | Beispielskript | nicht übernehmen | – |
| `schemas/sops/README.md` | 35 | SOP-Format | Verhalten neu spezifizieren (Schritt-Vokabular, mit Freigabe und Abnahme) | Playbook-Spec, später |
| `schemas/sops/weekly-report.md` | 31 | Beispiel | Dossier | – |
| `schemas/triggers/README.md` | 43 | Trigger-Format | zurückstellen (Intake ist spätere Phase) | – |
| `schemas/triggers/github-issues.md` | 43 | Beispiel | zurückstellen | – |

`specs/formation.md` ist nach Abschnitten aufgeteilt; das ergibt 36 Dateien in 41 Zeilen der Tabelle.

## Interne Widersprüche der Quelle

Festgehalten, nicht geglättet (*dokumentiert*):

- Standardport 8271 in der Vorlage ([formation.afs L33](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/schemas/formation.afs#L33)), 3000 im Guide ([SCHEMA_GUIDE L143, L155](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/schemas/SCHEMA_GUIDE.md#L143)).
- „Formation-level MCP servers: Available to ALL agents“ ([SCHEMA_GUIDE L1271](https://github.com/netzkontrast/afs-spec/blob/ce254f6dcc5f524de1c868f6197de4c89dbba78b/schemas/SCHEMA_GUIDE.md#L1271)) widerspricht „Registry is not grant“ (formation.md L76).
- `runtime` ist oben ein String, später ein Mapping (`runtime.built_in_mcps`).
- Überall `schema: "1.0.0"`, obwohl Felder ohne Versionssprung entfernt wurden (z. B. `server.auth`, §5.1).

## Offene Punkte

1. Rechteinhaber und Upstream-Herkunft klären, bevor je eine Datei lizenziert übernommen würde.
2. Ob MUXI die Spec so umsetzt, ist ungeprüft (Referenz-PRs in `schemas/coding/README.md` nicht gelesen).
3. Kompatibilität des AFS-Skill-Formats mit [`skill-package.schema.json`](../../spec/schemas/skill-package.schema.json) prüfen.
4. Der geplante Wechsel zur Linux Foundation kann die IP-Regeln ändern; Updates nur nach erneuter Prüfung am neuen Commit.
5. Import/Export von Formationen ist nicht geplant; nur bei nachgewiesenem Bedarf neu bewerten.
