# Agent Hub: Integrationsprüfung und Spezifikation für eine eigenständige Umsetzung

> **Herkunft:** Von ChatGPT erstellt, am 30.10.2026 vom Owner als Planungsinput eingebracht. Inhalt unverändert übernommen, nur als Markdown formatiert (Aufzählungen, Überschriften, Tabellen).
> **Status:** Input, keine Entscheidung. Die Einordnung steht in der [Reflexion](2026-10-30-reflexion-chatgpt-spec.md); verbindlich ist nur, was in [`docs/entscheidungen/`](../../../docs/entscheidungen/) entschieden wird.

Stand: 30. Oktober 2026 · Version 0.1 · Entscheidungs- und Implementierungsvorlage

## 1. Entscheidung

Empfehlung: schlanker eigener Auftragskern, vorhandene Agent-Runtimes über Standards anschließen. Vor dessen Implementierung Paperclip mit einem begrenzten Integrationsprototyp prüfen.

Paperclip ist der stärkste Kandidat, falls eine vorhandene Agent-Verwaltung den größten Teil des Produkts übernehmen darf. Goose eignet sich besonders als erste ausführende Runtime. Happy ist ein wichtiger Kandidat für die lokale Sitzungs- und Geräteanbindung. Eine Kombination aller drei vollständigen Plattformen würde dagegen mehrere konkurrierende Sitzungs-, Rechte- und Zustandsmodelle einführen.

Der Hub besitzt Ziele, Aufträge, Zuständigkeiten, Berechtigungen, Entscheidungen und akzeptierte Ergebnisse. Runtimes besitzen Prozesse, native Sitzungen, Werkzeuge und ihren jeweiligen Modellzugang. Adapter übersetzen zwischen beiden Bereichen.

Produktversprechen: Ein Auftrag bleibt über Geräte, Agent-Systeme und Unterbrechungen hinweg verständlich, kontrollierbar und überprüfbar.

## 2. Was tatsächlich geprüft wurde

Diese Prüfung basiert auf aktuellen öffentlichen READMEs, Lizenzdateien, Integrations- und Betriebsdokumentationen. Zusätzlich wurde Paperclips Paketmanifest zur Einschätzung von Laufzeit und Betriebsstruktur gelesen. Dokumentationen enthielten API- und Codebeispiele. Es wurden keine Implementierungsdateien der Kernlogik gezielt analysiert, keine Repositories installiert und keine Anbieter-Anmeldungen oder realen Agent-Läufe ausgeführt.

Folglich ist dies eine dokumentarische Machbarkeitsprüfung. Die dokumentierten Erweiterungspunkte sind belegt; ihre praktische Zuverlässigkeit, Sicherheitswirkung, Kosten und Eignung für den konkreten Hub sind noch nicht gemessen. Ein vorhandener Testbefehl beweist keine bestandenen Tests.

Quellen wurden auf veränderlichen Branches gelesen, nicht auf unveränderliche Commit-SHAs fixiert. Vor Übernahme einer Abhängigkeit Release, Commit, Lizenz und Protokollversion festhalten. Hier genannte Features sind Dokumentationsstände, keine pauschale Zusage für jede veröffentlichte Binärversion.

## 3. Befund: Paperclip

### Belegt

- Node-Backend und React-Oberfläche zur Koordination verschiedener Agents.
- Dokumentierte externe Adapter als separate Pakete; Erweiterung ohne Änderung des Paperclip-Kerns vorgesehen.
- Adapter werden bei einem Ausführungsimpuls aufgerufen und liefern strukturierte Ergebnisse und gegebenenfalls Sitzungszustand zurück.
- Lokale CLI-Adapter, HTTP-Anbindung und mehrere Gateway-Adapter sind beschrieben.
- Für ausgewählte lokale Agents wird ein ACP-Ausführungspfad dokumentiert; Voraussetzungen hängen von Runtime und Umgebung ab.
- Adapterabhängige Sitzungsfortsetzung und unterschiedlich detaillierte Live-Ereignisse.
- Aufgabenübernahme, Sperren, Arbeitskontext, Freigaben, Budgets und dauerhafte Aktivität sind im README beschrieben.
- Lokaler Vertrauensmodus sowie authentifizierter privater und öffentlicher Betrieb werden getrennt dokumentiert.
- Die gelesene Root-Lizenzdatei nennt MIT.

### Bedeutung für unseren Hub

Eine separate Erweiterung kann grundsätzlich externe Arbeit vermitteln. Ein eigener ausgehend verbindender Connector ist damit als Integrationsidee plausibel. Die gelesene Adapterübersicht beweist aber keinen fertigen, mandantenfähigen Pull-Connector für beliebige private Rechner. Dieser muss geprüft oder ergänzt werden.

Lokale CLI-Ausführung auf dem Paperclip-Host ist von einem privaten Nutzerrechner hinter NAT zu unterscheiden. Die dokumentierten SSH- und Sandbox-Ziele lösen ebenfalls nicht automatisch Geräte-Pairing und Offline-Wiederaufnahme für Endnutzer.

### Integrationsrisiken und offene Fragen

1. Kann ein externer Adapter asynchron auf einen offlinefähigen Connector warten, ohne einen langlebigen Serveraufruf zu blockieren?
2. Kann derselbe Auftrag nach Serverneustart mit derselben externen Ausführungsidentität fortgesetzt werden?
3. Welche Teile der menschlichen Freigabe sind über einen externen Adapter tatsächlich erzwingbar?
4. Lässt sich die gewünschte einfache Projektansicht ohne tiefe UI-Abspaltung umsetzen?
5. Bleibt eine Hub-Erweiterung bei Upgrades ohne Änderungen an internen Modulen funktionsfähig?
6. Werden wiederholte und verspätete Connector-Ereignisse korrekt behandelt?
7. Wie viel davon ist stabil veröffentlicht, wie viel nur auf dem aktuellen Branch dokumentiert?

### Urteil

Erweiterung zuerst praktisch evaluieren. Als unverändertes vollständiges Produkt sehr nah am Ziel; als Bibliothek in ein Vercel-Projekt einzubauen ist durch die gelesenen Unterlagen nicht belegt. Ein separates dauerhaft betriebenes Paperclip-Backend ist zunächst das konservative Integrationsmodell.

## 4. Befund: Happy und Happy Agent

### Belegt

- Happy umfasst mobile und Web-Clients, ursprüngliche CLI und Relay-Server; Desktop und neue Agent-Runtime liegen in eigenen Repositories.
- Das README beschreibt verschlüsselte Synchronisierung und gemeinsame Sitzungen. Dies ist eine Produktangabe, kein in dieser Prüfung verifizierter Kryptografie-Audit.
- Happy Agent beschreibt einen lokalen Daemon mit persistierten Sitzungen, Ereignisstrom und Client-API über einen privaten Socket.
- Die Runtime kann nach Dokumentation andere vollständige Harnesses einschließlich ACP-Agents anbinden.
- Das ursprüngliche Happy-CLI und die neuere Happy-Agent-Runtime sind unterschiedliche Integrationsziele.
- Die gelesene Happy-Lizenzdatei nennt MIT; Happy Agent bezeichnet sich im README ebenfalls als MIT-lizenziert. Vor Codeübernahme dessen konkrete Lizenzdatei separat festhalten.

### Bedeutung für unseren Hub

Ein lokaler Hub-Connector könnte als Client des Daemons arbeiten. Der private Socket ist keine unmittelbar vom Cloud-Hub aufrufbare öffentliche API: Ein lokal installierter Vermittler bleibt erforderlich.

Sitzungssteuerung, Gerätewechsel und Fernbedienung sind nahe am Bedarf. Ein akzeptierter fachlicher Auftrag mit Artefakten, unabhängiger Prüfung und mandantenbezogener Delegation ist dadurch noch nicht belegt.

### Integrationsrisiken und offene Fragen

- Gibt es eine stabile veröffentlichte Client-Version und kompatible Daemon-Version?
- Können Freigaben, Abbrüche und Ereigniscursor vollständig über die öffentliche API verwendet werden?
- Wie werden parallele menschliche und automatisierte Eingaben geordnet?
- Können einzelne Projekte und Sitzungen für den Connector begrenzt werden?
- Welche Daten liegen nur verschlüsselt im Relay, welche sind für einen Hub-Dienst auswertbar?

Architekturentscheidung: Ein Relay mit Ende-zu-Ende-Verschlüsselung und ein Server, der Inhalte prüfen und an andere Agents delegieren soll, haben unterschiedliche Vertrauensmodelle. Für den MVP darf der Hub ausdrücklich freigegebene Auftragspakete und Ergebnisse lesen. Ein späterer privater Modus muss serverseitige Fähigkeiten entsprechend einschränken; beides nicht gleichzeitig pauschal versprechen.

### Urteil

Guter optionaler Runtime- und Geräteadapter. Kein belegter Ersatz für den fachlichen Auftragskern. Für den MVP ist direktes ACP die kleinere Integrationsfläche; Happy lohnt sich, wenn seine Geräte- und Sitzungsfunktionen einen nachgewiesenen Zusatznutzen liefern.

## 5. Befund: Goose

### Belegt

- Eine eigene Anwendung kann das vorhandene Goose-Binary als ACP-Unterprozess starten.
- Dokumentiert sind Sitzungen, gestreamte Aktualisierungen, Werkzeugaktivität, Berechtigungsanfragen, Abbruch und optionale Wiederaufnahme nach Capability-Prüfung.
- Auch ein ACP-Server über HTTP beziehungsweise WebSocket wird dokumentiert.
- Berechtigungsdialoge sind ausdrücklich keine Sandbox; Werkzeuge arbeiten mit den tatsächlichen Zugriffsrechten des Backend-Prozesses.
- Die Root-Lizenzdatei nennt Apache-2.0.

### Besonders relevant: Roaming

Die Roaming-Dokumentation beschreibt ACP über authentifizierte P2P-Verbindungen auf Basis von iroh, einschließlich Relay-Fallback und Browser-Anbindung. Sie kennzeichnet das Feature ausdrücklich als experimentell, mit eigenem Build-Feature und nicht in den regulär veröffentlichten Goose-Binaries enthalten.

Akzeptierte Peers erhalten laut Dokumentation die volle ACP-Oberfläche; fein abgestufte Projektrollen fehlen dort. Gleichzeitiges gemeinsames Steuern derselben Live-Sitzung wird nicht als vorhandene Funktion zugesagt. Bereits gestartete Betriebssystemprozesse können einen Widerruf überleben.

### Urteil

Bester erster Referenz-Agent über normales ACP. P2P-Roaming als getrennten späteren Transportversuch betrachten. Die dortige umfassende Peer-Berechtigung erfüllt nicht das geplante begrenzte Hub-Rechtemodell.

## 6. Vergleich und Entscheidungskriterien

| Kriterium | Paperclip | Happy / Happy Agent | Goose |
|---|---|---|---|
| Fachliche Arbeitskoordination | Umfangreich dokumentiert | Schwerpunkt Sitzungen und Harness | Schwerpunkt Agent-Ausführung |
| Externe Erweiterung | Adapterpakete dokumentiert | Client-API / fremde Harnesses beschrieben | ACP-Anbindung dokumentiert |
| Privater Rechner hinter NAT | Eigener Connector noch zu prüfen | Relay-Konzept vorhanden | Roaming experimentell |
| Auftragsbezogene Ergebnisabnahme | Review-Funktionen beschrieben | Für Hub-Anforderungen offen | Im Hub ergänzen |
| Cloud-Hub ohne Credential-Upload | Topologie im Prototyp prüfen | Lokale Logins beschrieben | Lokale Runtime konfigurieren |
| Einfacher Einstieg in eigenen Hub | Separates Backend evaluieren | Lokaler Daemon-Adapter | Direkter ACP-Adapter |
| Praktisch in dieser Prüfung getestet | Nein | Nein | Nein |

### Entscheidungstor für Paperclip

Ein Prototyp darf ausschließlich dokumentierte Erweiterungspunkte verwenden. Er besteht aus einem privaten Test-Workspace, einem Adapter und einem lokalen Connector mit synthetischen Daten.

Erfolg: Auftrag anlegen → Connector nimmt ihn an → Agent liefert versioniertes Artefakt → unabhängige Prüfung → Mensch akzeptiert. Danach dieselbe Kette mit Serverneustart, Netzunterbrechung und doppelter Ereigniszustellung.

Paperclip weiterverwenden, wenn dieser Ablauf ohne Kern-Fork, Zugriff auf interne Tabellen und parallele zweite Auftragswahrheit möglich ist. Einzelne fehlende Tests rechtfertigen noch keinen Rewrite. Ein Rewrite wird sinnvoll, wenn wesentliche Produktregeln nur durch dauerhafte interne Eingriffe oder widersprüchliche Zustandsmodelle realisierbar sind.

## 7. Clean-Room-Vorgehen und Herkunft

Dieses Dokument ist eine eigenständig formulierte Anforderungsspezifikation mit offen dokumentierter Quellenexposition. Es ist keine Bescheinigung eines streng getrennten Clean-Room-Verfahrens: Der Verfasser hat öffentliche Dokumentationen einschließlich API-Codebeispielen gelesen.

Für eine bewusst getrennte Umsetzung:

1. Recherchematerial und Drittanbieter-Code aus dem Implementierungs-Repository heraushalten.
2. Implementierende erhalten den normativen Teil dieses Dokuments, öffentliche Standards und eigene Testfälle. Anbieterinterne Beispiele und Prompts werden nicht übernommen.
3. Anforderungen nach beobachtbarem Produktverhalten formulieren; Datenmodell, Benennungen, Oberfläche und Algorithmen selbst entwickeln.
4. Jede übernommene Bibliothek als bewusste Abhängigkeit mit Herkunft, Version und Lizenz dokumentieren. Bibliotheksnutzung und unabhängige Implementierung des Hub-Kerns sind vereinbar.
5. Keine fremden Systemprompts, Tool-Beschreibungen, Designs oder Test-Fixtures kopieren.
6. Ein Provenienzprotokoll führt Quelle, gelesenen Umfang, Datum und spätere Wiederverwendung auf.
7. Falls strikte organisatorische Trennung erforderlich wird, Recherche und Implementierung personell beziehungsweise kontextuell trennen. Eine neue Sitzung allein garantiert keine solche Trennung.

Die genannten Lizenzbezeichnungen beziehen sich auf die gelesenen Dateien, nicht auf eine vollständige Prüfung aller Abhängigkeiten, Marken oder Providerbedingungen.

---

# Normative Spezifikation der eigenständigen Umsetzung

## 8. Ziel und Umfang

Ein privater Web-Arbeitsraum ermöglicht Menschen und externen Agents, dieselben Projekte zu bearbeiten. Agents können sich mit Owner-Bindung registrieren, passende Arbeit finden, Aufträge übernehmen, begrenzt delegieren, Rückfragen stellen und belegbare Ergebnisse einreichen.

MVP: ein Owner, ein privater Workspace, mehrere gekoppelte Geräte, mindestens ein ausführender ACP-Agent und ein prüfender Lauf. Mandantentrennung wird im Datenmodell von Anfang an angelegt.

Zurückgestellt: öffentlicher Marktplatz, anonyme Selbstregistrierung, uneingeschränkte rekursive Delegation, eigener universeller Agent-Harness, automatische Übernahme beliebiger fremder Live-Sitzungen, eigener P2P-Transport.

## 9. Unverzichtbare Invarianten

- Jede Operation gehört zu einem Workspace und einer authentifizierten Identität.
- Jeder ausführende Agent hat einen verantwortlichen Owner.
- Selbstdeklarierte Fähigkeiten verleihen keine Berechtigungen.
- Delegation kann Rechte, Datenumfang und Budget nur verkleinern.
- Pro exklusivem Auftrag gibt es höchstens eine aktuelle Ausführungsberechtigung.
- Jeder Ausführungsversuch besitzt eine eigene ID; Runtime-Sitzung und Auftrag bleiben getrennt.
- Eine Agent-Meldung kann einen Auftrag nicht allein als akzeptiert abschließen.
- Zustandsänderung und zugehöriges Versandereignis werden atomar gespeichert.
- Ereignisse können mehrfach eintreffen; Verarbeitung muss deduplizieren.
- Veraltete Ausführungen dürfen den aktuellen Auftragsstand nicht überschreiben.
- Widerruf und Abbruch werden erst nach Bestätigung als wirksam angezeigt.
- Nicht kontrollierbare externe Aktionen bekommen keine vermeintliche Exactly-once-Garantie.
- Geheimnisse werden nicht in gewöhnlichen Kontextpaketen, Ereignissen oder Artefakten gespeichert.

## 10. Bausteine

| Baustein | Verantwortung |
|---|---|
| Web-App | Aufträge, Chat, Entscheidungen, Artefaktvergleich, Geräteübersicht |
| Hub-Domäne | Fachregeln, Zustandsübergänge, Rechte und Abnahme |
| Hub-API | Authentifizierte Operationen für Oberfläche und Adapter |
| Postgres | Verbindliche Zustände, Ereignisse, Outbox und Indizes |
| Artefaktspeicher | Unveränderliche Ergebnisversionen und Anhänge |
| Ablaufsteuerung | Timer, Wiederholungen, Wartezustände und Dispatch |
| Connector | Lokale Prozesse, persistente Zustellwarteschlange und Runtime-Adapter |
| MCP-Adapter | Zugriff bereits laufender Agents auf Hub-Funktionen |
| ACP-Adapter | Sitzungssteuerung einer kompatiblen Runtime |
| A2A-Adapter | Spätere Anbindung eigenständiger Remote-Dienste |

Start als modularer TypeScript-Monolith mit separat installierbarem Connector. Keine Microservice-Pflicht. Eine Ablaufsteuerung auswählen; Fachzustand bleibt über eine klar definierte Domänenschnittstelle konsistent.

Vorgeschlagene Paketgrenzen: `domain`, `contracts`, `api`, `web`, `connector`, `adapter-mcp`, `adapter-acp`, `adapter-a2a`, `test-fixtures`. Das sind eigene Planungsnamen, keine Übernahme fremder Repository-Strukturen.

## 11. Datenmodell

| Entität | Wesentliche Felder / Regel |
|---|---|
| Workspace | ID, Owner, Richtlinienversion |
| Principal | Mensch, Agent oder Gerät; authentifizierte Identität |
| Membership | Workspace, Rolle, Gültigkeit |
| AgentProfile | Owner, deklarierte und nachgewiesene Fähigkeiten, Konfiguration |
| ExecutionTarget | Gerät/Dienst, Adapter, Fähigkeiten, Vertrauensstatus |
| Task | Ziel, Abnahmekriterien, Status, Revision, Parent, Zuständigkeit |
| TaskInput | Quellreferenz, Version, Hash und Zugriffsumfang |
| Attempt | Task, Target, Zustand, Claim-Generation, native Sitzungsreferenz |
| Grant | Akteur, Ressourcen, Aktionen, Ablauf, Widerruf, Parent-Grant |
| Approval | Aktionstyp, Parameterhash, Input-/Artefaktversion, Entscheider, Ablauf |
| ArtifactVersion | Hash, Typ, Speicherreferenz, Erzeuger, Eingabeprovenienz |
| Review | Artefaktversion, Kriterien, Befunde, Reviewer und Prüfbelege |
| Event | Akteur, Workspace, Aggregate, Typ, Schema-Version, Kausalität |
| OutboxEntry | Noch zuzustellendes Ereignis mit Wiederholungsstatus |
| BudgetReservation | Reservierter Betrag, Kostenquelle, Abrechnung und Freigabe |
| ContextSnapshot | Versionierte Auswahl von Projektwissen und Auftragsquellen |
| NativeSession | Runtime, Gerätebindung, Fortsetzungsfähigkeit und Sitzung-ID |

Native Sitzungsreferenzen sind undurchsichtige Adapterdaten. Sie dürfen nicht als globale Hub-Identität oder Berechtigung dienen. Zuordnung von externen A2A-Task-IDs erfolgt separat je Dienst und Workspace.

## 12. Zustände und Übergänge

Auftrag: `draft`, `ready`, `active`, `waiting`, `review`, `accepted`, `cancelled`. Ablehnung eines Ergebnisses führt mit neuer Revision oder neuem Versuch zurück in bearbeitbare Arbeit. Historische Ergebnisse bleiben erhalten.

Ausführungsversuch: `queued`, `running`, `waiting_input`, `cancel_requested`, `succeeded`, `failed`, `cancelled`, `outcome_unknown`.

Verbindung und Ausführungsreservierung werden getrennt geführt: `last_seen`, Reservierungsablauf und bestätigter Prozesszustand sind unterschiedliche Fakten. Ein abgelaufener Claim erlaubt kontrollierte Neuvergabe, beweist aber keinen Prozessstopp.

Jede Änderung verlangt die erwartete Revision. Konflikte liefern einen maschinenlesbaren Fehler und den aktuellen Stand. Akzeptanz bindet sich an eine konkrete Artefaktversion und ihre Prüfergebnisse.

## 13. Connector und Geräte-Pairing

1. Connector erzeugt eine lokale Geräteidentität.
2. Pairing-Anfrage besitzt kurzlebigen Code und Verfallszeit.
3. Angemeldeter Owner bestätigt Gerät, Workspace, erlaubte Projekte und Aktionen.
4. Connector erhält widerrufbare, begrenzte Zugangsdaten. Private Geräteschlüssel bleiben lokal.
5. Geräte zeigen Version, unterstützte Adapter, letzte Erreichbarkeit und konkrete Ausführungsrechte.

MVP verwendet ausgehendes HTTPS-Polling mit Backoff und Zufallsanteil. Später kann ein Ereignistransport hinzukommen. Benachrichtigungen sind Hinweise; verbindliche Arbeit wird immer über die Hub-API abgerufen.

Lokale persistente Warteschlange speichert noch nicht bestätigte Ereignisse und Artefaktreferenzen. Ereignisse werden erst nach dauerhafter Hub-Bestätigung entfernt. Offline-Speicher hat Größenlimits; bei Überlauf wird neue Arbeit pausiert und der Zustand sichtbar gemacht.

Während Offline-Zeiten laufen nur bereits autorisierte Schritte innerhalb der gültigen Befugnis weiter. Neue Freigaben sind nicht offline erfindbar. Für besonders kritische Aktionen ist unmittelbar vorher eine Online-Autorisierung erforderlich. Grenzen eines Widerrufs während Offline-Ausführung ausdrücklich anzeigen.

Repository-Zugriff wird vom Owner lokal konfiguriert. Ein Arbeitsverzeichnis allein ist keine Isolation: Runtime mit eingeschränkter OS-Identität oder Container ausführen, wenn Dateisystemgrenzen garantiert werden sollen. Git-Worktrees trennen Änderungen, stellen aber keine Sicherheitsgrenze dar.

## 14. Adaptervertrag

Jeder Adapter bietet semantisch: Fähigkeiten ermitteln, Umgebung diagnostizieren, Arbeit starten, Ereignisse lesen, Eingabe liefern, Abbruch anfordern und gegebenenfalls eine Sitzung fortsetzen.

Capability-Felder umfassen mindestens: `resume`, `cancel`, `permission_requests`, `structured_tools`, `usage_reporting`, `artifact_upload`, `concurrent_sessions`. Fehlende Fähigkeiten werden vor Vergabe geprüft und im UI sichtbar dargestellt.

Nicht unterstützte Funktionen werden ausdrücklich abgelehnt. Kein stiller Wechsel von Sitzungsfortsetzung zu neuem Lauf; ein neuer Lauf erhält neue Identität und ein Übergabepaket.

MCP und A2A übersetzen in dieselben Domänenoperationen. Protokoll-Taskzustände werden explizit auf Hub-Zustände abgebildet; Remote-Completion bedeutet zunächst Ergebnislieferung, nicht Hub-Akzeptanz. Die konkrete Mapping-Tabelle entsteht gegen die festgelegte Protokollversion.

ACP bleibt am Connector. Fremde Runtime-Nachrichten sind Daten; vom Agent ausgegebener Text darf keine Berechtigung oder Systementscheidung darstellen. Anbieterinterne Gedankengänge werden weder vorausgesetzt noch als Pflichtprotokoll gespeichert.

## 15. Hub-API und MCP-Werkzeuge

Operationen: Projektkontext lesen; passende Aufträge suchen; Auftrag erstellen und ändern; Auftrag übernehmen; Claim erneuern; Fortschritt melden; Input anfordern und liefern; Artefakt hochladen und einreichen; Review einreichen; Ergebnis akzeptieren; Abbruch anfordern; Unterauftrag erstellen.

Schreiboperationen verwenden einen Idempotenzschlüssel mit Scope aus Workspace, Akteur und Operation. Gleicher Schlüssel und andere Nutzlast werden als Konflikt abgewiesen. Fachliche Revisionen verhindern verlorene Aktualisierungen.

Artefakte werden zunächst temporär hochgeladen, auf Hash und Größe geprüft und dann durch eine Transaktion referenziert. Nicht referenzierte Uploads werden nach definierter Frist bereinigt. Ein erfolgreiches Upload allein schließt keinen Auftrag ab.

MCP-Werkzeuge bieten kleine klare Schemas. Die Identität folgt dem authentifizierten Principal; mitgelieferte Agent-Namen dienen höchstens der Anzeige. OAuth-/Token-Audience, Workspace und erlaubte Operationen müssen zusammenpassen. Für normale Tool-Aufrufe gibt es kurze Antworten mit expliziten IDs; lange Arbeit bleibt als Hub-Auftrag abrufbar.

## 16. Wiederaufnahme und externe Wirkungen

Jeder Claim besitzt eine monoton steigende Generation. Veraltete Generationen dürfen keine aktuellen Ergebnisse verbindlich abschließen. Solche Ergebnisse können als verspätete historische Artefakte erfasst werden.

Diese Prüfung schützt Hub-Zustand, nicht automatisch externe Dienste. Für externe Wirkungen gilt:

| Wirkung | Wiederholungsregel |
|---|---|
| Reine Berechnung | Bei gleichen versionierten Eingaben erneut ausführbar |
| Artefakt-Upload | Durch Hash und Operation-ID deduplizieren |
| Git-Änderung | Ausgangscommit und Branch prüfen; neuer Versuch eigener Worktree |
| PR-/Ticket-Erstellung | Dienst-Idempotenz verwenden oder externe Referenz abgleichen |
| Nachricht, Kauf, Deployment | Konkrete Freigabe und Dienstbestätigung; bei unklarem Ausgang kein blindes Retry |

Eine externe Aktionsabsicht wird vor dem Aufruf dauerhaft erfasst. Nach Absturz wird zuerst der tatsächliche Zustand beim Dienst abgeglichen. Ist kein zuverlässiger Abgleich möglich, entscheidet ein Mensch über den nächsten Versuch.

## 17. Rechte, Kosten und Credential-Grenzen

- Projektbezogene Grants statt pauschaler Agent-Administratorrechte.
- Freigaben binden Aktion, Parameter, Ziel und Version; Änderungen entwerten sie.
- Native Runtime-Freigaben werden weitergeleitet, ersetzen aber keine OS-Isolation.
- Zugangsdaten bleiben standardmäßig dort, wo die Runtime läuft. Keine automatische Kopie lokaler Login-Dateien in Cloud-Ausführungen.
- Modell-API-Zugang und lokale Abo-authentifizierte Runtime sind getrennte Zugangsarten. Das Produkt verspricht keine allgemeine Übertragbarkeit eines Abos.
- Fremde Adapter und Installationspakete benötigen Owner-Freigabe, feste Version und nachvollziehbare Herkunft.
- Budget wird vor einem kontrollierten Lauf reserviert; Delegation reserviert daraus Teilbeträge.
- Schätzungen, gemeldeter Verbrauch und unbekannter Verbrauch werden getrennt gezeigt.
- Ein Kosten-Hardstop wird nur für kontrollierte Aufrufpfade behauptet. Laufende externe Arbeit kann bereits Kosten verursachen.
- URLs externer Agent-Dienste werden gegen SSRF, Weiterleitungen in private Netze und unzulässige Ziele abgesichert.

## 18. Kontext, Zusammenarbeit und Ergebnisqualität

Projektwissen besteht aus versionierten bestätigten Aussagen mit Quellen. Agent-Hypothesen und Arbeitsnotizen bleiben vorläufig. Jeder Lauf erhält einen nachvollziehbaren Snapshot mit Quellenversionen und Datenumfang.

Eine manuelle Chat-Nachricht kann einen Auftrag erzeugen; die Bestätigung zeigt Ziel, Agent, Rechte und erwartetes Ergebnis. Kritische Aktionen bekommen konkrete Freigaben. Menschliche Steuerung während eines Laufs erhält eine eigene geordnete Eingabe-ID.

Agent-Auswahl zunächst deterministisch nach Fähigkeit, Projektfreigabe, Verfügbarkeit und Budget. Ein Modell darf Routing vorschlagen; die Zulässigkeit prüft Code. Spätere automatische Auswahl verwendet gemessene Erfolgswerte je Aufgabenklasse, keine globale selbsterklärte Reputation.

Qualitätsprüfung bindet sich an Abnahmekriterien und Artefaktversionen. Automatisierte Tests, Quellenbelege und menschliche Entscheidungen werden getrennt erfasst. Ein zweiter Agent liefert zusätzliche Kritik, keine automatische Wahrheitsgarantie.

## 19. Oberfläche und Betrieb

Vier primäre Ansichten: Arbeit, Entscheidungen, Ergebnisse und Agents/Geräte. Jeder Auftrag zeigt das aktuelle Ergebnis, fehlende Entscheidungen, letzten bestätigten Fortschritt und eine kurze Ereignisgeschichte. Diagnoseprotokolle bleiben nachgeordnet zugänglich.

Datenschutz: Sichtbarkeit und Aufbewahrung je Artefaktklasse; Löschung umfasst Artefakte, Suchindizes und Exporte nach dokumentierter Policy. Auditdaten minimieren personenbezogene Inhalte. Backups und Löschfristen werden gemeinsam betrachtet.

Betrieb: Schema-Migrationen, Backups mit Restore-Test, pausierbare Dispatch-Queue, Limits für Logs/Artefakte, Versionskompatibilität von Connector und Hub, kontrollierte Connector-Updates und rücknehmbare Releases. Ein Kill-Schalter verhindert neue Aufträge, ohne historische Daten zu löschen.

Live-Transport wird niemals als dauerhafter Speicher verwendet. Ereignisse besitzen Schema-Version, Akteur, Task-/Attempt-ID, Korrelations-ID und Kausalitätsreferenz. Reihenfolge wird je Aggregat beziehungsweise Quelle behandelt; eine globale Zeitstempelordnung wird nicht vorausgesetzt.

## 20. Abnahmetests

Alle folgenden Tests sind geplante Abnahmen, keine bereits bestandenen Ergebnisse.

| ID | Szenario | Erwartung |
|---|---|---|
| T01 | Zwei Geräte übernehmen denselben Auftrag gleichzeitig | Genau ein aktueller Claim |
| T02 | Derselbe Schreibaufruf wird wiederholt | Dieselbe Operation, keine doppelte Wirkung im Hub |
| T03 | Veralteter Claim liefert nach Neuvergabe | Kein Überschreiben des aktuellen Stands |
| T04 | Connector stirbt nach lokalem Ergebnis | Ergebnis wird nach Neustart nachgeliefert |
| T05 | Hub stirbt zwischen Commit und Versand | Outbox liefert das Ereignis später aus |
| T06 | Ereignisse kommen doppelt oder verspätet an | Keine doppelte Zustandsänderung |
| T07 | Externe Wirkung vor verlorenem ACK | Abgleich oder `outcome_unknown`, kein blindes Retry |
| T08 | Rechte werden während eines Laufs widerrufen | Neue kontrollierte Aktionen blockiert; Restwirkung sichtbar |
| T09 | Freigegebene Parameter ändern sich | Neue Freigabe erforderlich |
| T10 | Auftrag liefert fehlerhaftes Artefakt | Keine Akzeptanz ohne bestandene Kriterien |
| T11 | Agent versucht Workspace-fremden Zugriff | Zugriff verweigert, nachvollziehbarer Audit-Eintrag |
| T12 | Agent delegiert mit erweiterten Rechten | Delegation abgelehnt |
| T13 | Modell meldet keinen Verbrauch | Kosten als unbekannt markiert |
| T14 | Runtime unterstützt kein Resume | Expliziter neuer Versuch mit Übergabekontext |
| T15 | Native Sitzung wird zweimal gesteuert | Eindeutige Eingabereihenfolge oder klare Zurückweisung |
| T16 | Connector ist länger offline als sein Grant gültig | Keine neue autorisierungspflichtige Aktion |
| T17 | Hostile Datei-/Toolausgabe fordert Rechte an | Als Inhalt behandelt, keine Rechteänderung |
| T18 | Restore aus Backup | Aufträge, Artefaktreferenzen und offene Aktionen konsistent |
| T19 | MCP- und UI-Aufruf bearbeiten denselben Auftrag | Dieselben Rechte und fachlichen Regeln |
| T20 | A2A-Remote meldet Completion | Ergebnis in Review; keine automatische Hub-Akzeptanz |

Zuerst deterministische Fake-Runtime und simulierte Fehler verwenden. Erst danach kostenpflichtige Agent-Smokes. Lastziele und Latenzgrenzen vor dem Lasttest als Produktannahmen festlegen, nicht nachträglich als Messung erfinden.

## 21. Umsetzungsfolge

### Phase A: Wiederverwendung entscheiden

Paperclip-Prototyp gegen die Entscheidungskriterien aus Abschnitt 6. Goose über ACP als minimale Runtime. Happy nur dann zusätzlich prüfen, wenn die direkte ACP-Anbindung eine konkrete Geräte-/Sitzungsanforderung offenlässt. Ergebnis: dokumentierte Go-/No-go-Entscheidung mit Versionen und Messprotokoll.

### Phase B: Fachlicher Kern

Bei Rewrite: Schema, Grants, Revisionen, Claim-Generationen, Outbox und Fake-Runtime. Tests T01–T07, T11 und T12 vor echtem Agent-Zugriff. Ein vollständiger Auftrag muss mit synthetischer Ausführung funktionieren.

### Phase C: Lokale reale Ausführung

Geräte-Pairing, lokaler persistenter Connector, Goose-ACP-Adapter, isolierte Arbeitsumgebung, Artefakte, Freigaben, Abbruch und Resume. Alle Runtime-Fähigkeiten explizit erfassen.

### Phase D: Gemeinsamer Zugang

Web-App und MCP bieten denselben Auftragskern. Bearbeitung und unabhängiger Review eines echten Repository-Auftrags; Annahme bleibt eine separate Entscheidung.

### Phase E: Remote und Ausbau

A2A-Adapter mit ID-Mapping und Kompatibilitätstests. Danach optionale Happy-Anbindung, Cloud-Sandbox, zusätzliche Modelle, wiederkehrende Aufträge und eingeschränkte automatische Delegation. Öffentliches Verzeichnis erst nach belastbarem privaten Betrieb.

## 22. Noch zu entscheiden

| Frage | Vorläufige Empfehlung | Entscheidung erforderlich vor |
|---|---|---|
| Paperclip erweitern oder eigener Kern? | Praktischer Adapter-Prototyp zuerst | Kernimplementierung |
| Erste Runtime? | Goose über ACP | Connector-Smoke |
| Erste Zielplattform Connector? | System des ersten realen Nutzers; keine OS-Annahme | Distribution |
| Ablaufsteuerung? | Eine Lösung nach Deployment-Spike wählen | Produktionsbetrieb |
| Vercel zwingend? | Oberfläche/API dort möglich, Runtime ortsunabhängig | Infrastrukturbindung |
| Cloud liest Ergebnisse? | Ja, für ausdrücklich freigegebene Auftragspakete | Privacy-Design |
| Ergebnis-Abnahme? | Mensch, unterstützt durch Tests und Agent-Review | Pilot |
| Fremde Modelle über Abos? | Nur unterstützte lokale Runtime-Wege | Provider-Integration |
| Eigene Produktlizenz? | Separat entscheiden | Veröffentlichung |

## 23. Startauftrag für eine implementierende Sitzung

> /goal Implementiere einen privaten Agent Hub, in dem ein menschlicher Owner einen versionierten Auftrag an einen extern laufenden Agent vergeben, Fortschritt und Rückfragen verfolgen und ein belegbares Ergebnis separat akzeptieren kann. Verwende die normativen Anforderungen dieses Dokuments. Beginne mit der begrenzten Paperclip-Integrationsprüfung. Entscheide anhand dokumentierter Ergebnisse über Erweiterung oder eigenen Kern. Bei eigenständiger Implementierung zuerst Fake-Runtime, Rechte, konkurrierende Aufgabenübernahme, Outbox und Wiederaufnahme bauen; danach einen lokalen ACP-Connector. Keine fremden Prompts oder Implementierungen kopieren. Keine unbekannte Runtime-Fähigkeit voraussetzen. Fertig ist der Pilot erst, wenn ein echter Auftrag und dessen unabhängiger Review einschließlich absichtlich ausgelöster Verbindungs- und Prozessfehler nachvollziehbar funktionieren. Berichte getrennt: dokumentierte Eigenschaften, implementierte Funktionen, tatsächlich bestandene Tests und verbleibende Grenzen.

---

## 24. Quellen und Rechercheprotokoll

Zugriff: 30.10.2026. Links sind Einstiegspunkte; vor Implementierung unveränderliche Revisionen festhalten.

### Für diese vertiefte Prüfung gelesen

- Paperclip README: Produkt- und Architekturüberblick.
- Paperclip Adapterübersicht: Laufzeit-Anbindung, Sitzungen, Credential-Topologien, Live-Feedback.
- Paperclip externe Adapter: Öffentlicher Erweiterungsvertrag einschließlich Beispielcode.
- Paperclip Deployment-Modi: Lokaler und authentifizierter Betrieb.
- Paperclip Paketmanifest: Runtime-, Build- und Teststruktur; kein Test ausgeführt.
- Paperclip Lizenz: MIT-Bezeichnung geprüft.
- Happy README: Komponenten, Relay und Gerätezugriff.
- Happy Lizenz: MIT-Bezeichnung geprüft.
- Happy Agent README: Lokaler Daemon, Client-API, Sitzungen und fremde Harnesses.
- Goose ACP-Integration: Client-Anbindung einschließlich Beispielcode, Berechtigungsgrenzen und Wiederaufnahme.
- Goose Roaming: Experimenteller Status, P2P-Verbindung und umfassende Peer-Rechte.
- Goose Lizenz: Apache-2.0-Bezeichnung geprüft.

### Weitere bereits recherchierte Inspirationsquellen

- Agent Client Protocol und Registry: Standard und kompatible Distributionen.
- MCP TypeScript SDK: MCP-Server-/Client-Adapter.
- MCP Tasks: Optionale dauerhafte Protokollaufgaben.
- A2A Spezifikation und Samples: Remote-Interoperabilität.
- Vibe Kanban: Arbeitsorganisation und Git-Arbeitsumgebungen.
- Agentgateway: Optionales Protokoll-Gateway.
- Vercel Workflow, Trigger.dev, Restate, Temporal Agent Harness: Alternativen für dauerhafte Ablaufsteuerung; keine gleichzeitige Pflichtintegration.
- Daytona: Optionale isolierte Ausführung.
- Langfuse: Optionale Beobachtung und Evaluation.
- AG-UI: Optionale Vereinheitlichung von Frontend-Ereignissen.

## 25. Definition of Ready für einen Rewrite

- [ ] Entscheidungstor Paperclip abgeschlossen oder bewusster Verzicht begründet.
- [ ] Erste Zielplattform und Runtime festgelegt.
- [ ] Versionen und Protokollfähigkeiten fixiert.
- [ ] Normative Spezifikation vom Recherchematerial getrennt übergeben.
- [ ] Keine Drittanbieter-Implementierungen oder Prompts im Ausgangsrepository.
- [ ] Authentifizierung, Grant-Grenzen und Credential-Standorte festgelegt.
- [ ] Fake-Runtime und Fehlerfall-Abnahmen als erstes Arbeitspaket geplant.
- [ ] Artefaktformate, Review und akzeptierter Abschluss festgelegt.
- [ ] Betrieb, Restore und Connector-Updatepfad eingeplant.

Das Dokument ist ausreichend für die nächste Implementierungsplanung. Es ersetzt weder den Integrationsprototyp noch dessen Messergebnisse.
