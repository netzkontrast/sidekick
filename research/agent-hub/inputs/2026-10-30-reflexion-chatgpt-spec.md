# Reflexion: ChatGPT-Spec „Integrationsprüfung und Spezifikation“ (v0.1)

> Stand: 30.10.2026 · Verfasser: Claude (Claude Code), im Auftrag des Owners · Status: **Planungsinput, keine Entscheidung**
> Bezieht sich auf: [ChatGPT-Spec v0.1](2026-10-30-chatgpt-integrationspruefung-spec.md) · Abgeglichen mit: [Vision v4](../../../docs/vision.md), [Analyse und Übernahmeplan](../../../docs/analyse-und-uebernahmeplan.md), [Entscheidungstore](../../../docs/entscheidungen/), [laufende Dossiers](../repos/)

## 1. Kurzurteil

Das Dokument ist eine **gute Grundlage für die normative Spec (Phase 0b)** und bestätigt die bisherige Richtung: ein schlanker eigener Auftragskern, Runtimes über Standards angebunden, und vor dem Eigenbau ein begrenzter Paperclip-Prototyp. Besonders wertvoll sind die Invarianten (§9), der Adaptervertrag mit expliziten Capabilities (§14), die Wiederholungsregeln für externe Wirkungen (§16), die Offline-Regeln des Connectors (§13) und die Testliste T01–T20 (§20).

Es hat aber **drei inhaltliche Lücken gegenüber der Vision**:

- Der Übernahme-Schritt fehlt; „accepted“ ist dort Endzustand.
- Playbooks fehlen als Konzept.
- Datenklassen bzw. `local-only` sind nicht spezifiziert.

Außerdem gibt es **zwei Richtungswechsel, die der Owner bewusst entscheiden sollte**: Goose statt Claude Code als erste Runtime, und OpenHands fällt aus der Prüfung heraus. Sein Startauftrag (§23) ist für eine einzelne Sitzung zu breit.

Die Belegqualität ist ehrlich deklariert, aber schwächer als unser eigener Standard: Die Quellen sind nicht auf Commits fixiert. Die Dossiers unter `research/agent-hub/repos/` haben das für Paperclip und OpenHands bereits getan.

## 2. Was ich übernehmen würde

| Element | Warum es trägt | Wohin es gehört |
|---|---|---|
| **Eigentumsgrenze Hub / Runtime / Adapter** (§1) | Der klarste Satz zur Architektur bisher: Der Hub besitzt Aufträge, Rechte, Entscheidungen und akzeptierte Ergebnisse. Runtimes besitzen Prozesse, Sitzungen und Modellzugang. | Spec, Kapitel Architektur |
| **Harte Kriterien für Paperclip** (§6): kein Kern-Fork, kein Zugriff auf interne Tabellen, keine zweite Auftragswahrheit | Schärfer und prüfbarer als unsere gewichtete Punkteskala allein. Sie ergänzt die bestehenden harten Ausschlüsse. | [Tor A](../../../docs/entscheidungen/tor-a-erweiterung-oder-eigener-kern.md) |
| **Invarianten** (§9) | Sie lassen sich fast eins zu eins als Property-/Contract-Tests formulieren. | Spec, normativer Kern |
| **Capability-Felder und explizite Ablehnung** (§14) | Sie verhindern simulierte Fähigkeiten, etwa ein stilles Resume über einen neuen Lauf, und decken sich mit Analyse §5/§7. | Spec, Runtime-Vertrag; [Tor B](../../../docs/entscheidungen/tor-b-claude-anbindung.md) |
| **Wiederholungsregeln je Wirkungstyp** (§16) | Sie machen die Zusage „kein blindes Retry“ konkret und lassen sich je Effekt-Typ testen. | Spec, Effekte |
| **Pairing- und Offline-Regeln** (§13): keine Freigaben offline, Größenlimit der Warteschlange, Online-Autorisierung für kritische Aktionen | Diese Lücke war in unseren Dokumenten bisher nur angedeutet. | Spec, Connector; [Tor C](../../../docs/entscheidungen/tor-c-transport-und-haltbarkeit.md) |
| **Idempotenzschlüssel mit Scope** (Workspace × Akteur × Operation; gleicher Schlüssel mit anderer Nutzlast führt zu einem Konflikt) und **Revision je Änderung** (§15, §12) | Das ist präziser als die Vision und schließt verlorene Updates aus. | Spec, Hub-API |
| **Zweiphasiger Artefakt-Upload** (§15) | Er trennt Speicherung von fachlicher Einreichung sauber. | Spec, Artefakte |
| **Tests T11–T13 und T15–T20** | Sie erweitern unsere Fehlermatrix um Mandantengrenze, Delegationsausweitung, unbekannte Kosten, doppelte Sitzungssteuerung, Grant-Ablauf offline, Prompt-Injection, Restore, MCP/UI-Parität und A2A-Completion. | [Analyse §8](../../../docs/analyse-und-uebernahmeplan.md#8-abnahmetests-für-die-recherche-prototypen), [Nordstern-Test](../experiments/north-star.md) |
| **Paketgrenzen** (§10) | Sie sind als Startpunkt für Phase 1 sinnvoll; `adapter-a2a` ist allerdings verfrüht. | Spec, Modulstruktur |
| **„Ehrlich berichten“** (§2, §23): dokumentiert, implementiert, getestet und Grenzen getrennt ausweisen | Das deckt sich mit unserem Belegstatus und sollte Pflichtformat für jeden Implementierungsbericht werden. | AGENTS.md (Konvention) |

## 3. Wo ich widerspreche oder ergänze

### 3.1 Übernahme fehlt: „accepted“ ist nicht „fertig“

Der Auftragsautomat in §12 endet bei `accepted`. Die Vision trennt aber ausdrücklich **Abnahme ≠ Übernahme** (Vision §9.5, Leitprinzip „Geliefert ≠ akzeptiert ≠ übernommen“). Das Mergen eines PRs ist ein eigener Effekt mit Konfliktprüfung gegen den aktuellen Ausgangsstand. §16 beschreibt solche Wirkungen zwar, hängt sie aber nicht an den Auftragszustand.

**Meine Haltung:** Den kleineren Automaten von ChatGPT übernehmen, aber um die Übernahme ergänzen, etwa: `draft → ready → active ⇄ waiting → review → accepted → applying → done`, dazu `cancelled`. `outcome_unknown` wird am Effekt geführt und im Auftrag als „gestört“ sichtbar. Weniger Zustände als die 15 der Vision, aber nicht auf Kosten des Kernversprechens.

### 3.2 Playbooks fehlen

Die Spec kennt Aufträge, Versuche und Reviews, aber keine deterministische Schrittfolge: implementieren → Checks → Review (≠ Implementierer) → Abnahme → Übernahme, mit Nacharbeitsschleife und Limits. Genau das meint die Vision mit „Deterministisch steuern, intelligent arbeiten“ (Vision §10).

**Meine Haltung:** Für den MVP reicht ein **fest kodiertes Playbook `code-change`**, ohne YAML-Engine. Das Konzept „Schritt“ muss aber von Anfang an im Datenmodell stehen: Ein Attempt gehört zu einem Schritt, nicht direkt zum Auftrag. Sonst sind Review-Unabhängigkeit, Nacharbeitslimit und Wettbewerbsmodus später nur mit Umbau möglich.

### 3.3 Datenklassen und `local-only` fehlen

§22 entscheidet „Cloud liest Ergebnisse: ja, für freigegebene Auftragspakete“, und §4 erkennt den Konflikt mit E2E-Relays richtig. Eine Datenklassen-Policy fehlt aber. Die Vision verspricht `local-only`, und die Analyse §3 stellt fest, dass das nur mit einer vollständig lokalen Instanz oder reinen Metadaten in der Cloud ehrlich ist.

**Meine Haltung:** Für den MVP explizit festhalten: **Nur `internal` wird unterstützt; `local-only` ist nicht verfügbar.** Die Datenklasse wird trotzdem als Feld am Projekt geführt und beim Packen des Kontexts geprüft. Wer `local-only` will, betreibt später die ganze Instanz lokal. Das ist ehrlicher, als es halb zu versprechen.

### 3.4 Erste Runtime: Goose oder Claude Code? *(Owner-Entscheidung)*

ChatGPT empfiehlt Goose über ACP als erste Runtime. In der Vision ist entschieden: **erste Runtime Claude Code** (Vision §26, abgehakt).

**Meine Haltung:** Beides hat einen eigenen Zweck.

- **Goose als erste Vertrags-Runtime.** Goose ist Apache-lizenziert und ACP-nativ. Die Frage nach Abo und Nutzungsbedingungen stellt sich nicht. Damit eignet es sich ideal, um Adaptervertrag, Capabilities, Abbruch und Resume gegen eine echte Runtime zu testen, ohne Tor B (Auth-Grenzen) auf den kritischen Pfad zu legen.
- **Claude Code als erste Produkt-Runtime.** Die MVP-Abnahme (Nordstern) läuft mit Claude Code, weil das der tatsächliche Alltag des Owners ist.

Das entkoppelt die Risiken, kostet aber einen zweiten Adapter früh. Wenn nur einer möglich ist, würde ich bei Claude Code bleiben und Goose direkt danach nehmen. **Entschieden (30.10.2026): Claude Code zuerst, auch für die Vertragstests; Goose in Phase 2.**

### 3.5 OpenHands verschwindet ohne Begründung

Die ChatGPT-Prüfung betrachtet nur Paperclip, Happy und Goose. In der Analyse ist OpenHands P0-Kandidat für Tor A. Das laufende [Dossier](../repos/openhands.md) zeigt außerdem, dass dessen Agent-Server und SDK ein eigenständiger Integrationspunkt sind.

**Meine Haltung:** OpenHands nicht stillschweigend streichen, sondern mit einer **Papierprüfung von ½ Tag** gegen die harten Kriterien aus §6 abschließen. Nur wenn sie positiv ausfällt, folgt ein Prototyp. So wird der Scope kleiner, ohne eine Option ungeprüft aufzugeben.

### 3.6 Paperclip: Credential-Topologie ist ein Ausschlusskandidat

ChatGPT nennt die Credential-Topologie nur als „im Prototyp prüfen“. Unser [Paperclip-Dossier](../repos/paperclip.md) hat bereits dokumentiert gefunden, dass Auth-Dateien des Hosts in verwaltete Sandboxes hochgeladen werden. Das widerspricht dem Grundsatz „Credentials bleiben lokal, der Hub sieht keine Abo-Tokens“.

**Meine Haltung:** In Tor A als **harten Ausschluss** formulieren, falls sich dieses Muster für den Pfad mit Claude-Code-Abo nicht vermeiden lässt. Der Prototyp sollte das als erstes prüfen, weil es die Entscheidung am billigsten kippen kann.

### 3.7 MVP-Zuschnitt: mehrere Geräte und Chat

ChatGPT sieht im MVP „mehrere gekoppelte Geräte“ und eine Web-App mit Chat. Unser Plan sieht ein Gerät und keinen vollen Chat vor.

**Meine Haltung:** Das **Datenmodell für mehrere Geräte und Workspaces** wird angelegt; das ist billig (`workspace_id` überall, Geräte als eigene Entität). Die **MVP-Abnahme** bleibt bei einem Gerät. T01 (zwei Geräte claimen gleichzeitig) lässt sich trotzdem mit zwei Connector-Instanzen testen. Chat bleibt draußen; Rückfragen und Freigaben laufen über die Entscheidungs-Inbox.

### 3.8 Startauftrag (§23) ist zu breit

Ein `/goal` mit dem Inhalt „Paperclip prüfen, dann entscheiden, dann ggf. den ganzen Kern bauen, dann Connector“ widerspricht dem Torprinzip der Analyse. Eine Sitzung würde eine Architekturentscheidung treffen *und* umsetzen.

**Meine Haltung:** In drei getrennte Aufträge mit Übergabe teilen:

1. Paperclip-Prototyp nach Tor A, mit Ergebnisprotokoll.
2. Nach der Entscheidung: Kern mit Fake-Runtime, Tests T01–T07, T11, T12.
3. Connector mit erster Runtime.

Die Abschlussformel „dokumentiert / implementiert / bestanden / Grenzen“ bleibt.

### 3.9 Clean-Room und dieses Repo

§7.1 verlangt, Recherchematerial aus dem Implementierungs-Repository herauszuhalten. sidekick ist heute Recherche- *und* künftiges Implementierungs-Repo.

**Meine Haltung:** Das ist vertretbar, solange **kein Drittanbieter-Code, keine fremden Prompts und keine fremden Fixtures** eingecheckt werden. Unsere Dossiers beschreiben Verhalten und verlinken nur. Vor Phase 1 sollte trotzdem entschieden werden, ob der Implementierungscode in ein eigenes Repo kommt oder `research/` zumindest aus den Build- und Test-Pfaden ausgeschlossen bleibt. Ehrlich festgehalten: Auch diese Reflexion entsteht mit Kenntnis der öffentlichen Dokumentation. Ein Clean-Room-Zertifikat ist sie nicht.

### 3.10 Kleinere Punkte

- **Happy** auf „optional, nur bei nachgewiesenem Zusatznutzen“ herabzustufen, halte ich für richtig. Als Referenz für Pairing und Reconnect bleibt es nützlich (vgl. Analyse §5: P0 nur als Referenz).
- **Goose-Roaming** als experimentell zurückzustellen, ist richtig. Die volle ACP-Oberfläche für Peers ist mit dem Grant-Modell unvereinbar.
- **Agent-Auswahl deterministisch, Modell darf nur vorschlagen** (§18): Das deckt sich mit „Vorschlagen, nicht handeln“ und sollte so bleiben.
- **„Kill-Schalter ohne Datenlöschung“** und **Restore-Test** (§19) gehören in die MVP-Abnahme, nicht erst in den Betrieb.
- **Belegqualität:** Alle Feature-Aussagen sind Doku-Stand auf beweglichen Branches. Bevor eine davon in ein Tor-Protokoll eingeht, muss sie im Dossier mit Commit-SHA nachgezogen werden.

## 4. Konsequenzen für die Planung (Vorschläge)

| Nr. | Vorschlag | Betrifft | Status |
|---|---|---|---|
| P1 | Harte Kriterien aus ChatGPT §6 (kein Kern-Fork, keine internen Tabellen, keine zweite Auftragswahrheit) und Credential-Upload als möglichen Ausschluss in Tor A aufnehmen | `docs/entscheidungen/tor-a-…` | vorgeschlagen |
| P2 | OpenHands: ½-Tag-Papierprüfung statt vollem Prototyp | Arbeitsplan, Tor A | vorgeschlagen |
| P3 | Goose als Vertrags-Runtime neben Claude Code als Produkt-Runtime | Tor B, Vision §26 | **entschieden 30.10.: abgelehnt**, Claude Code zuerst, Goose in Phase 2 |
| P4 | Testmatrix um T11–T13, T15–T20 erweitern; IDs T01–T20 als gemeinsame Nummerierung verwenden | Nordstern-Test, Analyse §8 | vorgeschlagen |
| P5 | ChatGPT §9–§19 als Ausgangstext der normativen Spec nutzen, korrigiert um Übernahme-Schritt (3.1), Schritt/Playbook im Datenmodell (3.2) und Datenklassen-Policy (3.3) | Phase 0b | vorgeschlagen |
| P6 | MVP: Datenmodell für mehrere Geräte und Workspaces, Abnahme mit einem Gerät; kein Chat | README/MVP | vorgeschlagen |
| P7 | Startauftrag in drei getrennte Aufträge teilen | Phase 0 → 1 | vorgeschlagen |
| P8 | Vor Phase 1 entscheiden: eigenes Implementierungs-Repo oder strikte Trennung von `research/` | Clean-Room | **entschieden 30.10.:** alles bleibt in diesem Repo, `research/` außerhalb von Build/Test |
| P9 | Berichtsformat „dokumentiert / implementiert / bestanden / Grenzen“ als Konvention in AGENTS.md | AGENTS.md | vorgeschlagen |

Keiner dieser Vorschläge ist umgesetzt. Sie werden erst wirksam, wenn der Owner zustimmt und sie in die jeweiligen Dokumente übernommen werden.
