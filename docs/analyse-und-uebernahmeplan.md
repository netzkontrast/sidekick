# Agent Hub: Visionsanalyse, Repo-Recherche und Übernahmeplan

> Stand: 30.10.2026 · Grundlage: [Agent Hub – Vision, Version 4](vision.md)
>
> Umsetzung im Repo: Entscheidungstore unter [`entscheidungen/`](entscheidungen/), Dossier-Vorlage unter [`research/dossiers/`](research/dossiers/), [Herkunftsregister](herkunftsregister.md).

## 1. Entscheidungsempfehlung

Der Hub sollte einen eigenen, kleinen Domänenkern erhalten: Auftragsverträge, Befugnisse, Artefakte, Checks, Abnahmen und kontrollierte Außenwirkungen. Vorhandene Runtimes werden angebunden. Ein eigener Agent-Loop und ein vollständiger Chat-Client sind im MVP nicht erforderlich.

Vor einem Neubau werden Paperclip und OpenHands gegen denselben Nordstern-Ablauf geprüft. Happy wird ergänzend als Referenz für Fernsteuerung und mobile Interaktion untersucht. Pi und DeepSeek Harness liefern später Architekturideen für einen optionalen eigenen Runner, sind aber keine Grundlage für die gesamte Arbeitsverwaltung.

Noch offen ist, ob Erweiterung oder Eigenbau weniger Aufwand verursacht. Die nachstehenden Bewertungen sind Untersuchungshypothesen. Es wurden offizielle Projektbeschreibungen und ausgewählte Dokumentationen geprüft, aber keine Repos lokal aufgebaut, keine Schnittstellen vollständig auditiert und keine Praxistests ausgeführt.

## 2. Was an der Vision trägt

- Das Produktproblem ist präzise: Ergebnisse sollen über unterschiedliche Agents, Geräte und Unterbrechungen hinweg verbindlich bearbeitet und überprüft werden.
- Die Trennung von Lieferung, Abnahme und Übernahme verhindert, dass ein erfolgreich beendeter Prozess mit einer erfolgreichen Änderung verwechselt wird.
- Auftrag, Run und Verbindung haben unterschiedliche Lebenszyklen. Diese Trennung ist richtig.
- MCP für Zugriff auf Hub-Funktionen, ACP/SDK für steuerbare Sessions und A2A für externe Dienste sind passende unterschiedliche Integrationswege.
- Kontext-Snapshots, verifiziertes Wissen und vorläufige Arbeitsnotizen vermeiden eine ungeprüfte gemeinsame Agent-Erinnerung.
- Private Instanz, eine erste Runtime und Git als Wahrheit für Code begrenzen den Einstieg sinnvoll.

Die eigentliche Produktinnovation liegt im Arbeitsvertrag und seiner überprüfbaren Erfüllung. Die Breite der Chat-Funktionen ist dafür nachrangig.

## 3. Was vor einer Spec geändert oder präzisiert werden muss

| Punkt | Befund | Konsequenz |
|---|---|---|
| Worktree als Isolation | Ein Worktree trennt Arbeitsstände, nicht Prozesse, Credentials oder Netzwerkzugriff; Git-Metadaten werden geteilt. | Pro Run zunächst ein eigener Worktree, für belastbare Befugnisse zusätzlich Sandbox und eingeschränkte Credentials. Getrennte Clones bei stärkeren Isolationsanforderungen prüfen. |
| Außenwirkung über Hub | Ein Agent mit Shell, Netzwerk und GitHub-Token kann den Hub umgehen. MCP allein verhindert das nicht. | Managed Runner und selbstständig arbeitende Sessions unterscheiden. Garantien nur für kontrollierte Ausführung anbieten; vorhandene Sessions als eingeschränkt überwacht kennzeichnen. |
| Wiederaufnahme | Cursor-Replay synchronisiert Ereignisse. Es stellt weder Prozess noch Modellkontext oder Terminalzustand wieder her. | Netzwerk-Reconnect, Connector-Neustart, Runtime-Absturz und Geräteverlust separat spezifizieren. Übergabepaket als ehrlicher Fallback. |
| 100 % Wiederherstellung | Ohne definierte Fehlerklasse und Persistenzgrenzen ist das keine überprüfbare Zusage. | Für eine benannte Fehlermatrix garantieren: kein Verlust bestätigter Ereignisse, keine doppelte Auftragsannahme, unbekannte Effekte werden sichtbar. Keine globale Exactly-once-Zusage. |
| Fencing | Ein Epoch-Check kann alte Einreichungen abweisen, verhindert aber keine direkte Außenwirkung eines alten Prozesses. | Epoch zusätzlich unmittelbar am kontrollierten Effekt prüfen; laufende Effekte beim Widerruf abgleichen. |
| Datenklasse `local-only` | Wenn der Cloud-Hub Kontext, Artefakte, Logs oder Zusammenfassungen erhält, bleiben Inhalte nicht lokal. | Entweder gesamte Instanz lokal betreiben oder cloudseitig nur freigegebene Metadaten halten. Gilt auch für Tracing, Push und Hub-Assistenz. |
| Autonomie-Stufen | Vertrauen, Aufgabenauswahl und Aktionsrechte sind unterschiedliche Achsen. | L0–L4 als verständliche Presets behalten; wirksame Rechte immer aus expliziten Grants ableiten. Scorecards verleihen keine Rechte. |
| Self-hosting | Ein offenes Repo mit Vercel, Neon, Relay und Workflow-SaaS ist noch keine einfach selbst betreibbare Instanz. | Unterstützte Betriebsprofile benennen: privater Server und optional Vercel. Abhängigkeiten, Backup/Restore und laufende Kosten dokumentieren. |
| Workflow und Postgres | Zwei unabhängig veränderbare Zustandswahrheiten führen zu Widersprüchen. | Postgres-Transaktionen definieren fachliche Übergänge. Workflow-Engine organisiert Warten und Wiederholungen und ruft idempotente Commands auf. |
| Run als Bearbeiter | Modell und Einstellungen können innerhalb einer Session wechseln. Menschen brauchen keine künstliche Runtime. | Tatsächliche Modellnutzung pro Modellaufruf erfassen, soweit verfügbar; menschliche Bearbeitungen eigenständig darstellen. |
| Reviews | Eine andere Agent-ID belegt keine unabhängige Prüfung. | Implementiereridentität und Artefaktversion binden, separaten Kontext nutzen, deterministische Checks unabhängig ausführen. Mensch sieht die verbleibende Unsicherheit. |
| Quellenchecks | Eine erreichbare URL beweist die zugehörige Behauptung nicht. | Quellenbeleg mit Fundstelle, Abrufstand und Claim-Zuordnung; fachliche Prüfung getrennt von Erreichbarkeit. |
| Freigaben | Ein Shell-String oder Hash sagt wenig über die genaue Wirkung aus. | Typisierte Effekte, kanonische Parameter, Artefakt-Hash, Zielressource und Ausgangsversion binden; konkrete Wirkung in UI anzeigen. |

Weitere Spec-Korrekturen: `tasks.create` darf bei L1 nur einen Vorschlag erzeugen, nicht stillschweigend einen offenen Arbeitsauftrag. Claim gehört einem Schritt und einer Version. Wettbewerb benötigt mehrere Kandidaten-Runs und einen expliziten Gewinner; ein einzelnes `claim_epoch` darf nicht den zweiten zulässigen Kandidaten entwerten. Leases und Ressourcensperren sind zu trennen. Pfadsperren verhindern keine semantischen Git-Konflikte. Menschliche Belegbewertung und Agent-Berichte müssen in der Herkunft unterscheidbar sein.

## 4. Was „portieren“ hier heißen soll

Für jeden Kandidaten wird genau eine Entscheidung dokumentiert:

| Kategorie | Bedeutung | Beispiele |
|---|---|---|
| Integrieren | Vorhandene Software über ihre öffentliche Schnittstelle verwenden. | Claude Code, ACP-Adapter, MCP-SDK, später Codex. |
| Als Dependency nutzen | Austauschbare Bibliothek mit fixierter Version und Lizenzinventar. | Chat-Komponenten, JSON-Schema-Validierung, Tracing-Client. |
| Verhalten neu implementieren | Beobachtbare Anforderungen und eigene Tests formulieren, eigenen Code schreiben. | Auftragszustände, mobile Freigaben, Wiederverbindung. |
| Lizenziert übernehmen | Begrenzten Code bewusst kopieren oder anpassen, Herkunft und Verpflichtungen dokumentieren. | Nur nach separater Entscheidung; kein Standardpfad für den Clean-Room-Kern. |
| Zurückstellen | Erst bei nachgewiesenem Bedarf. | A2A, Gateway, eigener Agent-Loop, Marketplace. |

Ein strenger Clean-Room-Prozess trennt die Untersuchung fremder Implementierungen von der Implementierung des eigenen Kerns. Die Spezifikation enthält öffentlich beobachtbares Verhalten und eigene Anforderungen statt übersetzter Fremdimplementierungen. Codeübernahme wird offen als solche geführt. Open Source ist kein automatischer Nachweis, dass jede Datei oder Abhängigkeit dieselben Nutzungsbedingungen hat; Lizenz, Assets und Notices werden am ausgewählten Commit inventarisiert. Dies ist eine technische Prozessdefinition, keine rechtliche Bewertung.

## 5. Priorisierte Repo-Recherche

Links zeigen auf die offiziellen Repositories; konkrete Dateipfade werden erst nach Prüfung des gewählten Commits als Beleg aufgenommen.

| Prio | Repo | Zu untersuchen | Voraussichtliche Nutzung | Entscheidender Nachweis |
|---|---|---|---|---|
| P0 | [Paperclip](https://github.com/paperclipai/paperclip) | Adapter, Claims, Heartbeats, Berechtigungen, Budgets, Approval-Semantik, Erweiterungspunkte | Erweiterungskandidat; sonst Governance-Verhalten als Referenz | Nordstern ohne Umbau der grundlegenden Identitäts- und Auftragslogik; kein Full-auto-Zwang für kontrollierte Runs |
| P0 | [OpenHands](https://github.com/OpenHands/OpenHands) | Agent Canvas, lokale/entfernte Backends, ACP, Artefakte, Zustandsbesitz | Zweiter Erweiterungs-/Integrationskandidat | Eigene Auftragsverträge und Freigaben mit austauschbaren Runtimes und Self-hosting vereinbar |
| P0 | [Happy](https://github.com/slopus/happy) | Pairing, Relay, Rechteanfragen, Nachrichten-Reihenfolge, Reconnect, Verschlüsselungsgrenzen | Remote-Session-Verhalten als Referenz; kleine Module nur nach Prüfung | Freigabe nach Reconnect bleibt an die ursprüngliche Aktion gebunden; Hub-seitige Prüfung mit Datenschutzmodell vereinbar |
| P0 | [Claude ACP](https://github.com/agentclientprotocol/claude-agent-acp) | Auth-Modi, Start, Permissions, Abbruch, Session-Wiederaufnahme, v1/v2 | Vorhandenen Adapter nutzen | Nachgewiesene Fähigkeiten der fixierten Version, einschließlich Permission- und Crash-Verhalten |
| P0 | [ACP](https://github.com/agentclientprotocol/agent-client-protocol) | Capability-Negotiation, stabile vs. experimentelle Features, Events, Fehler | Standardadapter mit eigener Normalisierung | Fehlende Resume-/Cancel-Funktionen werden korrekt angezeigt statt simuliert |
| P1 | [Goose](https://github.com/aaif-goose/goose) | ACP-Server, Multi-Provider, lokale Modelle, MCP, unbedienter Betrieb | Zweite Test-Runtime für Adapter-Portabilität | Derselbe Runtime-Vertrag funktioniert ohne Claude-spezifische Sonderlogik |
| P1 | [Pi](https://github.com/earendil-works/pi) | RPC/SDK, Extensions, Session- und Kontextmodell | Spätere Runtime und Referenz für kleinen Kern | Welche Fähigkeiten sind Kern, welche Erweiterung? Welche lassen sich über öffentliche APIs anbinden? |
| P1 | [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) | Plugin-Lebenszyklus, Scopes, Tool-Registry, Session-Persistenz, Web-Anbindung | Architekturideen für spätere Cloud-Harness | Lifecycle und Fehlerfortpflanzung verständlich; Plugin-Laden nicht mit Sandbox verwechseln |
| P1 | [LibreChat](https://github.com/LibreChat-AI/LibreChat) | Providerprofile, Datei-/Tool-Darstellung, Agent-Sharing, Traces | Produktmuster; keine vollständige Backend-Übernahme | Chat-Funktionen lassen sich ohne zweiten Auftragszustand darstellen |
| P1 | [assistant-ui](https://github.com/assistant-ui/assistant-ui) | Runtime-Adapter, Tool-Cards, Attachments, Inline-Freigaben | Optionale UI-Dependency | Eigene IDs, Events und Auftragsansicht bleiben führend |
| P2 | [Open WebUI](https://github.com/open-webui/open-webui), [LobeHub](https://github.com/lobehub/lobehub) | Channels, Notes, Memory, Agent-Erlebnis | UX- und Funktionsvergleich | Nur Funktionen übernehmen, die Inbox und Auftrag verbessern |
| P2 | [OpenCode](https://github.com/anomalyco/opencode), [Deep Agents](https://github.com/langchain-ai/deepagents) | Runtime-Integration, Plan-/Build-Rechte, Kontextauslagerung, Human-in-the-loop | Zusätzliche Runtime-/Harness-Referenzen | Öffentliche Schnittstelle und klares Persistenzmodell |
| P2 | [Vibe Kanban](https://github.com/BloopAI/vibe-kanban) | Worktree-Verwaltung, Diffs, Reviews | Archivierte Produktideen, keine ungeprüfte Kernabhängigkeit | Release-Hinweis auf Schließung des Unternehmens beachten; Wartung gesondert bewerten |
| P2 | [A2A Samples](https://github.com/a2aproject/a2a-samples), [AG-UI](https://github.com/ag-ui-protocol/ag-ui), [agentgateway](https://github.com/agentgateway/agentgateway) | Interop, Event-Projektion, Gateway-Bedarf | Nach dem lokalen Nordstern | Kein zusätzlicher Fachzustand; Protokollgrenzen bleiben sichtbar |

### Vorläufige Befunde aus den offiziellen Quellen

- Paperclip dokumentiert viele Adapter und Budgetkontrollen. Die Adapter-Dokumentation beschreibt für Coding-Agents auch Full-auto-Verhalten. Genau deshalb ist ein vorhandener Approval-Screen noch kein Nachweis für unsere aktionsgebundenen Tool-Freigaben.
- OpenHands beschreibt inzwischen Agent Canvas als Kontrollzentrum für mehrere Agents und Backends. Das macht es für diese Vision relevanter als eine bloße weitere Coding-Runtime.
- Happy dokumentiert verschlüsselte Synchronisierung. Wir müssen getrennt prüfen, welche Metadaten der Server sieht und welche Auswertungen der Hub bei verschlüsselten Inhalten überhaupt leisten kann.
- Goose dokumentiert `goose acp` und mögliche Keyring-Blockaden bei unbedientem Betrieb. Der Login muss deshalb Bestandteil des Tests sein.
- Claude ACP verwendet den Claude Agent SDK. „ACP oder SDK“ sind hier keine völlig unabhängigen Ausführungspfade. Der Vergleich betrifft zusätzlich Abstraktion, Versionsrisiko und Funktionsabdeckung.
- Claude ACP dokumentiert experimentelles ACP v2. Öffentliche Protokollversion und nachgewiesene Fähigkeiten werden festgehalten; keine pauschale Annahme, dass `session/load` überall funktioniert.

## 6. Rechercheverfahren und Entscheidungstore

### Einheitliches Repo-Dossier

Für jedes P0-Repo: URL, Commit-SHA, Release/Datum, Lizenzen, Startanleitung, relevante öffentliche Verträge, Persistenzorte, Credential-Fluss, Sicherheitsgrenzen, Ausfallverhalten, konkrete Belegpfade und Ergebnisse der Tests. Aussagen werden als *dokumentiert*, *im Code gefunden*, *praktisch nachgewiesen* oder *offen* markiert. Eine Feature-Liste erhält keine höhere Bewertung als ein reproduzierbarer Test.

### Tor A: Erweiterung oder eigener Kern?

Paperclip und OpenHands bekommen denselben Testauftrag: winziges Testrepo, benannter Ausgangscommit, Änderung an zwei Dateien, bewusst fehlschlagender Check, Nacharbeit, unabhängiger Review, Abnahme und PR als separater Effekt. Gleiche Eingaben und Budgets; Aufwand und verbleibende Lücken erfassen.

Gewichtung: Auftrags-/Artefaktmodell 25 %, kontrollierte Effekte/Rechte 25 %, Wiederherstellung 20 %, Adapterfähigkeit 15 %, privater Betrieb/Export 10 %, UI-Anpassbarkeit 5 %. Harte Ausschlüsse übersteuern den Score: nicht verhinderbare Außenwirkung bei behauptet kontrollierten Runs, unklarer Zustand nach Restart, fehlender Datenexport oder invasive Kernumbauten bei jeder Erweiterung.

Erweiterung wählen, wenn der Vertrag über unterstützte Erweiterungspunkte passt und der verbleibende Aufwand einschließlich Upgrades kleiner ist. Andernfalls eigener Kern und Integration vorhandener Runtimes. Ein Ergebnis „erst ein weiterer Spike nötig“ ist besser als ein künstlich eindeutiger Score.

### Tor B: Claude-Anbindung

Verglichen werden Claude ACP, direkte SDK-Anbindung und bei Bedarf die dokumentierte strukturierte CLI-Schnittstelle. Prüfen: unterstützter Auth-Pfad und Nutzungsbedingungen für den konkreten Betrieb, Streaming, Rückfragen, Permission-Details, Abbruch, Resume, Modell-/Kostenmeldungen, Custom Tools, Arbeitsverzeichnis und Versionsbindung.

Technisches Funktionieren eines Logins beweist keine Berechtigung für jede Produktintegration. Keine Abo-Tokens extrahieren oder an den Hub übertragen. Falls keine geeigneten Credentials vorliegen, Tests mit deterministischem Fake ausführen und Live-Auth ausdrücklich offen lassen.

### Tor C: Transport und Haltbarkeit

Zuerst ausgehendes HTTPS-Polling des Connectors plus Event-Upload testen; Browser erhält Ereignisse per cursorfähigem SSE. WSS nur ergänzen, wenn gemessene Latenz oder Bidirektionalität es rechtfertigt. Ein Relay transportiert, entscheidet aber keine Claims oder Rechte.

Connector hält einen lokalen dauerhaften Journal-/Outbox-Speicher, beispielsweise SQLite. Events haben stabile IDs, Runtime-Referenz, Quellsequenz und Empfangsbestätigung. Hub-seitige Deduplizierung, Backpressure und Journal-Aufbewahrung spezifizieren. Ein ACK bedeutet erst dann „gesichert“, wenn die definierte Persistenz abgeschlossen ist.

### Tor D: Workflow, Hosting und Artefaktspeicher

[Vercel Workflow](https://github.com/vercel/workflow), [Trigger.dev](https://github.com/triggerdotdev/trigger.dev) und [Restate](https://github.com/restatedev/restate) zunächst anhand Restart, langlebiger Freigabe-Wartezeit, Idempotenz, Export, Self-hosting und Betriebsaufwand vergleichen. Nur die zwei passendsten praktisch testen. Keine drei Engines implementieren.

Vor Vercel-Festlegung ein vollständiges privates Betriebsprofil beschreiben. Objektstore hinter eigenem Adapter; „Vercel Blob nutzt S3“ nicht als Nachweis für S3-API-Kompatibilität behandeln. Private Artefakte, autorisierte Downloads, Hash-Prüfung und Backup/Restore sind Pflichtkriterien. Aktuelle WS-Verfügbarkeit, Function-Limits, MCP-Auth und Anbieterbedingungen am Umsetzungstag prüfen.

## 7. Konkreter Übernahmeplan nach Schicht

| Schicht | Was wir übernehmen | Wie | Was wir selbst verantworten |
|---|---|---|---|
| Domäne | Arbeitsmuster aus Paperclip/OpenHands | Verhaltensspec und eigene Tests; bei Tor A ggf. Erweiterung | Auftrag, Versionen, Schritte, Kandidaten, Abnahme, Übernahme |
| Runtime | Claude Code zuerst, Goose/Pi/Codex später | Öffentliche ACP-/SDK-/RPC-Schnittstellen; fixe Versionen | Einheitlicher RuntimeAdapter und Capability-Profil |
| MCP | Offizielles [TypeScript-SDK](https://github.com/modelcontextprotocol/typescript-sdk) | Dependency; versionspassende Imports/Auth | Dieselben Domain-Commands wie REST, keine doppelte Fachlogik |
| Connector | Pairing-/Reconnect-Verhalten aus Happy | Eigenes schlankes Protokoll; Wiederverwendung nur nach Audit | Journal, Prozessaufsicht, Claims, Grant-Prüfung, Wiederabgleich |
| Git | Worktree-/Review-Muster aus OpenHands/Vibe Kanban | Git-Kommandos hinter Workspace-Service | Unveränderliche Base-/Head-SHAs und konfliktgeprüfte Übernahme |
| UI | assistant-ui sowie Patterns aus LibreChat/Happy | Komponenten oder eigenes Rendering | Inbox, Auftrag, Diff/Belege, aktionsgebundene Entscheidungen |
| Harness | Kleiner Kern bei Pi, Plugin-Komposition bei DeepSeek | Spätere unabhängige Implementierung oder vorhandene Runtime | Keine beliebigen Plugins im privilegierten Hub-Prozess |
| Beobachtung | [Langfuse](https://github.com/langfuse/langfuse) optional | Exporter statt Fachdatenspeicher | Audit-/Domain-Events, Datenklassen, Redaction, Aufbewahrung |
| Remote-Netz | A2A/agentgateway | Späterer Adapter | Einreichungsprüfung und begrenzte Vertrauensannahmen |

Minimaler interner Runtime-Vertrag: Fähigkeiten ermitteln, Session starten, Eingabe übermitteln, Events streamen, Rückfrage beantworten, Permission beantworten, Abbruch anfordern, Zustand abgleichen und optional fortsetzen. Nicht unterstützte Methoden liefern einen typisierten Unsupported-Fehler. Domain-API und Runtime-API sind unterschiedliche Verträge.

## 8. Abnahmetests für die Recherche-Prototypen

| Test | Erwartung |
|---|---|
| Doppelte Claim-Anfrage | Ein gültiger Claim pro regulärem Schritt; identische Wiederholung liefert dasselbe Ergebnis. |
| Absichtlich parallele Kandidaten | Zwei gültige Wettbewerbs-Runs; nur explizit ausgewähltes Artefakt wird übernommen. |
| Alter Prozess nach Neuvergabe | Einreichung und kontrollierte Effekte werden wegen alter Epoch abgewiesen. |
| Netz weg, Runtime lebt weiter | Lokale Events werden nachgeliefert; keine neuen unautorisierten Remote-Effekte. |
| Connector stirbt | Bereits bestätigte Daten bleiben erhalten; Zustand des Kindes wird abgeglichen, kein blinder Doppelstart. |
| Runtime stirbt | Run endet nachvollziehbar; Resume nur bei nachgewiesener Unterstützung, sonst neuer Versuch mit Übergabepaket. |
| Parameter nach Freigabe geändert | Alte Freigabe ungültig, einschließlich geändertem Artefakt oder Ziel-SHA. |
| Effekt ausgeführt, Antwort verloren | Ausgang zunächst unklar; dienstspezifische Reconciliation statt automatischer Wiederholung. |
| Rechteentzug/Abbruch | Neue Aktionen gesperrt; Abbruchanforderung und bestätigtes Ende sichtbar getrennt. |
| `local-only` | Kein Inhalt in Cloud-Traces, Push-Payload, Hub-Assistenz oder Cloud-Kontext. |
| Git-Ziel verändert | Erneute Konflikt-/Check-Prüfung und ggf. neue Abnahme; kein stilles Anwenden auf anderen Stand. |
| Fremde offene Session | Nutzer sieht, dass der Hub direkten Shell-/Netzwerkzugriff dieser Session nicht kontrolliert. |

Tests zunächst mit Fake-Runtime und kontrolliertem Effekt-Dienst durchführen. Anschließend ein kleiner Live-Test für jede ausgewählte Runtime. Fake-Erfolg beweist Orchestrierung, nicht reale Runtime-Konformität.

## 9. Umfang und Reihenfolge

Zeitboxen sind Planungsannahmen für einen Entwickler, keine Lieferzusage. Abhängigkeiten und Zugänge können sie verändern.

1. **0,5 Tag: Anforderungen festziehen.** Begriffe, Garantien, Betriebsprofil, Managed-vs.-Attached-Modus, Grenzen von `local-only`; unveränderte Ausgangsvision separat behalten.
2. **2–3 Tage: Paperclip/OpenHands und Claude-Anbindung.** Dossiers, identischer Nordstern-Test, Happy gezielt für Pairing/Freigabe/Reconnect. Tor A und B entscheiden.
3. **1–2 Tage: Zuverlässigkeit und Betrieb.** Fake-Runtime, Claim/Effekt-Fehlermatrix, lokale Outbox, Transportprobe, Workflow-Shortlist. Tor C und D entscheiden.
4. **0,5–1 Tag: Spec und Übernahmeentscheidung.** Fixierte Abhängigkeiten, Herkunftsregister, Domain-Commands, Runtime-Vertrag, Event-Schema und reproduzierbare Testanleitungen.
5. **Danach: ein vertikaler MVP.** Auftrag → Claude → Diff → Checks → Review → Abnahme → PR; Browser-Reload und Netzwerkverlust müssen funktionieren. Erst dann weitere Auftragstypen und Runtime-Breite.

Recherche nicht für alle P1/P2-Projekte vor dem MVP vertiefen. Wenn P0-Fragen ungelöst bleiben, Zeit dort einsetzen statt weitere Feature-Listen zu sammeln.

MVP bewusst reduzieren: ein Owner, ein Projekt, ein Gerät, `code-change`, eine Runtime, Reviewer als separater Run, menschliche Abnahme, PR-Erstellung als einziger externer Apply-Effekt, kleine Inbox und Auftragsansicht. Review und kontrollierte Effekte bleiben Pflicht. Freie Delegation, A2A, eigener Cloud-Harness, Scorecard-Ranking, voller Chat, Hub-Assistenz und Marketplace warten. Grundlegende Datenflussregeln werden von Beginn an durchgesetzt, auch wenn die komfortable Datenklassen-UI später kommt.

## 10. Verlangte Recherche-Ergebnisse

- Je P0-Repo ein belegtes Dossier mit Commit und reproduzierbaren Tests.
- Entscheidung Erweiterung/Eigenbau mit Aufwand, harten Lücken und Alternativen.
- Claude-Adapter-Matrix mit verifizierten Fähigkeiten und Auth-Grenzen.
- Herkunfts-/Übernahmeregister: Quelle, Version, Lizenz, Kategorie, eigener Vertrag und Update-Verantwortung.
- Kleine ausführbare Contract-/Fault-Test-Suite; kein Produktionsprodukt als Recherche-Nebenprojekt.
- Spec für Commands, Events, Grants, Effekte, Connector-Journal und Wiederherstellung.
- Runbook für Start, Kopplung, Widerruf, Backup, Restore und Runtime-Upgrades.

**Definition of Done der Recherche:** Wir wissen für jede MVP-Funktion, wer ihren Zustand besitzt, welche Implementierung sie liefert, worauf sie vertraut, wie sie ausfällt und welcher Test das belegt. Keine Behauptung aus einem README gilt allein als Zuverlässigkeitsgarantie.

## 11. Quellen und Belegstatus

Die Vision selbst ist die Produktquelle. Für aktuelle Projektbefunde wurden folgende offizielle Quellen genutzt; sämtliche Portierungsentscheidungen bleiben bis zur Commit-Prüfung vorläufig.

- [Paperclip Adapter-Dokumentation](https://github.com/paperclipai/paperclip-docs/blob/main/docs/guides/org/agent-adapters.md): Adapter und Full-auto-Verhalten.
- [Paperclip Budget-Dokumentation](https://github.com/paperclipai/paperclip-docs/blob/main/docs/guides/org/agents.md): Budget- und Agent-Verwaltung.
- [OpenHands README](https://github.com/OpenHands/OpenHands): Agent Canvas, mehrere Runtimes und lokale/Remote-Backends.
- [Happy Privacy](https://github.com/slopus/happy/blob/main/PRIVACY.md): verschlüsselte Inhalte und sichtbare Metadaten.
- [Goose CLI](https://github.com/aaif-goose/goose/blob/main/documentation/docs/guides/goose-cli-commands.md): ACP und Keyring-Hinweis.
- [Claude ACP README](https://github.com/agentclientprotocol/claude-agent-acp/blob/main/README.md) und [Permissions](https://github.com/agentclientprotocol/claude-agent-acp/blob/main/docs/permission-extension.md): SDK-Basis, Session-Funktionen und Permission-Grenzen.
- [Pi](https://github.com/earendil-works/pi): minimale Harness, Erweiterungen, RPC/SDK.
- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): Plugin-Ansatz und Developer-Preview-Status.
- [Vibe Kanban Releases](https://github.com/BloopAI/vibe-kanban/releases): Hinweis auf Unternehmensschließung; kein Beweis, dass jede Community-Arbeit beendet ist.
- [Vercel Blob](https://vercel.com/docs/vercel-blob): S3 als Infrastruktur ist keine automatisch gleiche öffentliche API.
- [MCP Authorization SDK](https://apps.extensions.modelcontextprotocol.io/api/documents/authorization.html): CIMD und Authorization-Metadaten. Tatsächliche Client-Kompatibilität gesondert testen.
