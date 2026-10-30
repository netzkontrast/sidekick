# sidekick – Agent Hub

> **Ein gemeinsamer Arbeitsraum für Menschen und ihre vorhandenen Agents – mit verbindlichen Aufträgen, kontrollierter Delegation und überprüfbaren Ergebnissen.**

**Status:** Phase 0: Recherche und Entscheidungstore, noch kein Code · private Instanz (self-hosted, Open Source) · erste Runtime: Claude Code

---

## Was sidekick werden soll

### Das Problem

Wer mit mehreren Agents arbeitet (Claude Code im Terminal, die Claude-App, Codex, lokale Modelle, Skripte), verliert schnell den Überblick:

- Niemand weiß, was gerade wo läuft.
- Kontext wird per Copy-Paste übertragen.
- Freigaben warten im Terminal, sobald man nicht davorsitzt.
- „Fertig“ heißt nicht „richtig“.
- Laptop zu oder Limit erreicht: Fortschritt geht verloren oder entsteht doppelt.

Chat-Apps lösen *Gespräche*, Coding-Harnesses lösen *Ausführung*. Es fehlt die Schicht dazwischen: **verbindliche Arbeit**.

### Die Idee

sidekick ist für gemischte Teams aus Menschen und Agents das, was Ticketsystem plus CI für Entwicklerteams sind. Ein **Auftrag** hat ein Ziel, prüfbare Abnahmekriterien, eine begrenzte Befugnis und ein Budget. Er bleibt über Geräte, Agent-Systeme und Unterbrechungen hinweg verständlich und überprüfbar. Vorhandene Agents arbeiten ihn ab. Der Hub verfolgt den Fortschritt, prüft die Ergebnisse und führt Außenwirkungen wie PRs kontrolliert aus.

Die eigentliche Innovation liegt im **Arbeitsvertrag und seiner überprüfbaren Erfüllung**, nicht in der Breite der Chat-Funktionen.

### Nordstern-Ablauf

> Ich lege einen Änderungsauftrag an. Claude Code bearbeitet ihn lokal in einem eigenen Git-Worktree, fragt bei Bedarf nach und fordert Freigaben an. Checks laufen, ein zweiter Agent prüft den Diff in einem separaten Run. Im Browser sehe ich Ergebnis, Befunde und offene Entscheidungen. Ich nehme an, und der Hub erstellt den PR.

### Was sidekick ausmacht

| Grundsatz | Bedeutung |
|---|---|
| **Delegation vor Chat** | Der Hub verteilt und verfolgt Arbeit; Chat ist höchstens eine Oberfläche dafür. |
| **Ein Vertrag für alle Bearbeiter** | Menschen und Agents übernehmen Schritte nach denselben Regeln. |
| **Geliefert ≠ abgenommen ≠ übernommen** | Ein sauber beendeter Run ist kein akzeptiertes Ergebnis, und ein akzeptiertes Ergebnis ist noch nicht gemergt. |
| **Belege statt Behauptungen** | Fortschritt und Ergebnisse verweisen auf Testausgaben, Logs oder Quellen; Unbelegtes wird markiert. |
| **Außenwirkung über den Hub** | Agents *beantragen* Push, PR oder Veröffentlichung, der Hub *führt sie aus*: typisiert, idempotent, an eine Freigabe gebunden. |
| **Rechte nur aus Grants** | Autonomie-Stufen L0–L4 sind verständliche Voreinstellungen. Wirksam sind nur explizit vergebene Grants; Delegation verkleinert sie nur. |
| **Deterministisch steuern, intelligent arbeiten** | Playbooks, Zustand, Geld und Rechte sind Code. Agents entscheiden über den Inhalt. |
| **Zweckgebundener Kontext** | Jeder Run bekommt ein Kontextpaket aus verifiziertem Wissen statt ganzer Verläufe. Agent-Aussagen werden erst nach Prüfung zu Projektwissen. |
| **Ehrliche Zuverlässigkeit** | „Ausgang unklar“ wird angezeigt statt versteckt. Es gibt keine globale Exactly-once-Zusage. |
| **Provider-konform** | Abos laufen nur über die offiziellen Clients der Anbieter. Der Hub sieht keine Abo-Tokens. |

### Was die Analyse an der Vision geschärft hat

Die [Analyse](docs/analyse-und-uebernahmeplan.md) bestätigt die Vision im Kern und präzisiert ihre Zusagen:

- **Eigener kleiner Kern, vorhandene Runtimes.** sidekick baut Auftragsverträge, Befugnisse, Artefakte, Checks, Abnahmen und kontrollierte Effekte selbst. Agent-Loops kommen von Claude Code, später Goose, Codex oder Pi. Vor dem Eigenbau wird geprüft, ob sich Paperclip oder OpenHands erweitern lassen ([Tor A](docs/entscheidungen/tor-a-erweiterung-oder-eigener-kern.md)).
- **Managed vs. Attached.** Volle Garantien gibt es nur für Runs, die der Hub selbst startet und kontrolliert. Eine bereits offene Session, die sich per MCP Aufträge holt, kann den Hub mit eigener Shell und eigenem Token umgehen. Sie wird deshalb als „eingeschränkt überwacht“ gekennzeichnet.
- **Ein Worktree ist keine Sandbox.** Er trennt Arbeitsstände, aber nicht Prozesse, Credentials oder Netzwerkzugriff. Belastbare Befugnisse brauchen zusätzlich Sandbox und eingeschränkte Credentials.
- **Wiederaufnahme hat Grenzen.** Das Nachliefern von Events stellt weder Prozess noch Modellkontext wieder her. Garantiert wird für eine benannte Fehlermatrix:
  - kein Verlust bestätigter Ereignisse,
  - keine doppelte Auftragsannahme,
  - unbekannte Effekte werden sichtbar.

  Wo eine Session nicht fortgesetzt werden kann, ist das Übergabepaket der ehrliche Fallback.
- **Fencing am Effekt.** Eine veraltete Epoch wird bei der Einreichung abgewiesen und zusätzlich unmittelbar vor jeder kontrollierten Außenwirkung geprüft.
- **Eine Zustandswahrheit.** Postgres-Transaktionen definieren fachliche Übergänge. Eine Workflow-Engine organisiert nur Warten und Wiederholen.
- **`local-only` heißt wirklich lokal.** Das gilt auch für Logs, Traces, Push-Nachrichten und Zusammenfassungen. Sonst muss die ganze Instanz lokal laufen.

### Was sidekick nicht wird (v1)

Kein weiterer Chat-Client · kein eigener Coding-Agent · kein Modell-Hosting · kein Proxy für Abo-Tokens · kein Marketplace · kein Multi-Tenant-Betrieb · kein Ersatz für Git/GitHub.

### Der MVP

Bewusst klein:

- ein Owner, ein Projekt, ein Gerät,
- Playbook `code-change`, eine Runtime (Claude Code),
- Reviewer als separater Run, menschliche Abnahme,
- PR-Erstellung als einziger externer Effekt,
- kleine Entscheidungs-Inbox und Auftragsansicht.

Browser-Reload und Netzwerkverlust müssen funktionieren. Delegation, Wettbewerbsmodus, Scorecards, Hub-Assistenz, voller Chat und A2A kommen später.

---

## Stand und Roadmap

| Phase | Ziel | Exit-Kriterium |
|---|---|---|
| **0 – Recherche & Spec** ← *aktuell* | Entscheidungstore A–D, danach Spec für Commands, Events, Grants, Effekte, Runtime-Vertrag, Connector-Journal | Tore entschieden, Spec reviewt |
| **1 – Kern** | Nordstern-Ablauf als vertikaler MVP | MVP-Abnahme inkl. Ausfalltests grün |
| **2 – Breite** | Weitere Runtimes (ACP, Goose, Codex), Auftragstypen Recherche und Lektorat, Claude-App per Remote-MCP | 3 Runtimes, 3 Auftragstypen |
| **3 – Autonomie** | L1–L3, Delegation, Wettbewerbsmodus, Scorecards | Kette Coder → Tester → Reviewer bis zur Abnahme |
| **4 – Komfort** | Hub-Assistenz, PWA + Push, Intake aus GitHub-Issues und Zeitplänen | Auftrag aus Issue, Freigabe vom Telefon |
| **5 – Cloud & Netz** | Hub-Runtime in der Sandbox, A2A | Externer A2A-Agent liefert ab |

### Phase 0: offene Entscheidungen

| Tor | Frage | Status |
|---|---|---|
| [A](docs/entscheidungen/tor-a-erweiterung-oder-eigener-kern.md) | Paperclip/OpenHands erweitern oder eigener Kern? | offen; erste Dossiers in Arbeit |
| [B](docs/entscheidungen/tor-b-claude-anbindung.md) | Claude ACP, Agent SDK oder strukturierte CLI? | offen |
| [C](docs/entscheidungen/tor-c-transport-und-haltbarkeit.md) | HTTPS-Polling + SSE oder WSS; lokales Journal | offen; Hypothese HTTPS + SSE |
| [D](docs/entscheidungen/tor-d-workflow-hosting-artefakte.md) | Vercel Workflow, Trigger.dev oder Restate; Betriebsprofil; Artefaktspeicher | offen |

**Bisheriger Recherchestand:** Für [Paperclip](research/agent-hub/repos/paperclip.md) und [OpenHands](research/agent-hub/repos/openhands.md) sind Referenzcommits fixiert und erste Dokumentation gelesen. Nichts davon ist praktisch validiert. Erste Befunde:

- Paperclips Muster, Credentials in Sandboxes hochzuladen, passt nicht zum Ziel, Abo-Credentials lokal zu halten.
- Bei OpenHands verteilt sich die relevante Logik auf mehrere Repos (SDK, Client, Automation).

Nächster Schritt laut [Arbeitsplan](research/agent-hub/operations/PLAN.md): Claims, Permissions und Persistenz im fixierten Quellstand untersuchen.

### Technischer Rahmen (vorläufig, abhängig von Tor C/D)

| Schicht | Vorläufige Wahl |
|---|---|
| Web + Hub-API | Next.js 16 + TypeScript, PWA |
| DB | Postgres + Drizzle; Transactional Outbox; `SKIP LOCKED` + `claim_epoch` |
| Ablaufsteuerung | Playbook-Engine hinter einem Interface (Kandidaten: Vercel Workflow, Trigger.dev, Restate) |
| Artefakte | Objektstore hinter eigenem Adapter, Content-Hash |
| Realtime | SSE mit Event-Cursor; Connector zunächst per ausgehendem HTTPS |
| Auth | Better Auth (Menschen), Kopplungscode (Geräte/Agents), OAuth/CIMD (Remote-MCP) |
| Connector | Node-CLI mit lokalem Journal (z. B. SQLite) und ACP-/SDK-Adapter |
| MCP | `@modelcontextprotocol/sdk`, dieselben Domain-Commands wie die REST-API |

Betriebsprofile: privater Server, optional Vercel. Backup/Restore und laufende Kosten werden in Tor D dokumentiert.

---

## Repository

```
.
├── README.md                Überblick (diese Datei)
├── AGENTS.md                Regeln für Coding-Agents (Research-Ablauf, CodeGraph, Grenzen)
├── CLAUDE.md                Importiert AGENTS.md, plus Hinweise für Claude Code
├── docs/                    Kanonische, abgeschlossene Dokumente
│   ├── vision.md                     Ausgangsvision v4 (bleibt unverändert)
│   ├── analyse-und-uebernahmeplan.md Analyse, Repo-Prioritäten, Entscheidungstore, Übernahmeplan
│   ├── entscheidungen/               Verbindliche Entscheidungen (Tore A–D)
│   ├── herkunftsregister.md          Fremdsoftware: Quelle, Lizenz, Kategorie
│   └── research/                     Fertige Recherchen; Dossier-Vorlage unter dossiers/
└── research/agent-hub/      Laufende Recherche
    ├── operations/PLAN.md            Backlog und Arbeitsstand
    ├── repos/                        Laufende Repo-Dossiers (Paperclip, OpenHands, …)
    ├── experiments/north-star.md     Gemeinsamer Nordstern-Test und Ausfallmatrix
    └── decisions/                    Entscheidungsregister (verweist auf docs/entscheidungen/)
```

**Leseempfehlung:** dieses README → [Analyse](docs/analyse-und-uebernahmeplan.md) → [Arbeitsplan](research/agent-hub/operations/PLAN.md). Wer die ursprüngliche Produktidee in voller Breite sehen will (Domänenmodell, Datenmodell, Domain Events, Szenarien), liest die [Vision](docs/vision.md).

### CodeGraph

Das Repo ist für [CodeGraph](https://www.npmjs.com/package/@colbymchenry/codegraph) eingerichtet, damit Agents Code über einen Symbol-Graphen statt per grep erkunden. Die Datenbank ist lokal und wird nicht committet. Solange das Repo nur Markdown enthält, bleibt der Index leer. Wann Agents CodeGraph und wann grep/Read nutzen, regelt [`AGENTS.md`](AGENTS.md); den Hintergrund liefert [`docs/research/agents-md-und-codegraph.md`](docs/research/agents-md-und-codegraph.md).

Index anlegen bzw. neu aufbauen:

```bash
codegraph init -y
```

Nach Änderungen synchronisieren:

```bash
codegraph sync
```

Code erkunden:

```bash
codegraph explore "<Symbolnamen oder Frage>"
```

## Mitarbeiten

sidekick ist *spec-driven*: Verhaltensänderungen beginnen in der Spec, erst danach folgt Code. Recherche folgt dem Ablauf in [`AGENTS.md`](AGENTS.md): Befunde mit Commit und Belegstatus, Clean-Room für den eigenen Kern, Entscheidungen unter `docs/entscheidungen/`. Fragen und Vorschläge bitte als Issue.
