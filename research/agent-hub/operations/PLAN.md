# Durchführung und Backlog

## Methode

Jeder Befund enthält Quelle, Commit, Datum und Evidenzstufe: dokumentiert / Code geprüft / praktisch getestet / offen. Lizenz je Komponente prüfen. Fremdcode nicht in den eigenen Kern kopieren; Verhalten und eigene Abnahmetests spezifizieren. Dependencies und bewusste Codeübernahmen getrennt inventarisieren.

## Backlog

- [x] Sidekick inventarisieren (Erstaufnahme am 30.10.2026, vor den Setup-Merges): damals nur README, keine AGENTS.md oder bestehenden Research-Vorgaben im main-Baum.
- [x] Paperclip und OpenHands Quellstände bestimmen und erste Dokumente lesen.
- [ ] P0 Paperclip: atomare Claims, Rechte und Tool-Freigaben, Budgets, Restart, Plugin-Grenzen.
- [ ] P0 OpenHands: SDK/Server und Automation separat prüfen, ACP-Permissions und Persistenz.
- [ ] P0 Claude ACP vs SDK: Auth, Resume, Cancel und Permission-Details mit Versionsmatrix.
- [ ] P0 Happy: Pairing, Reconnect, Relay, Verschlüsselungsgrenzen.
- [ ] P1 Goose: zweite Runtime für Portabilität.
- [ ] P1 Pi und DeepSeek: RPC/SDK und Plugin-Lifecycle als spätere Harness-Referenz.
- [ ] P1 LibreChat/assistant-ui: UI-Komponenten statt zweites Backend.
- [ ] Workflow/Transport/Hosting anhand Fault-Tests entscheiden.
- [ ] Vorschläge P1–P9 aus der [Reflexion zur ChatGPT-Spec](../inputs/2026-10-30-reflexion-chatgpt-spec.md#4-konsequenzen-für-die-planung-vorschläge) mit dem Owner klären; P3 und P8 sind entschieden (Claude Code zuerst; ein Repo), siehe [Grundsatzentscheidungen](../../../docs/entscheidungen/README.md#grundsatzentscheidungen-des-owners).

## Reihenfolge ab 31.10.2026 (Vorschlag, Owner-Entscheidung offen)

Maßgebliche Reihenfolge: [Gesamtplan ab November 2026](gesamtplan-2026-11.md) (Meilensteine M0–M4, Library L1–L6). Begründung: [Plan-Review](plan-review-2026-10-31.md). Status nur hier:

- [x] AP1–AP3 und MUXI-Dossier, Skill `using-codegraph` gemergt (#31–#36).
- [x] M0.1–M0.2: Plan-Review und N1/RS-1 (DSPy-Dossier auf `92d97ca`; RTA-INV-07, -AUF-07, -LEB-09).
- [ ] M0.3–M0.4: Gesamtplan und Owner-Entscheidungen E1–E6.
- [x] M1: Kern-Port, Fake-Runtime, Vertragssuite, wegwerfbarer Referenzkern, getrennter CodeGraph-Index.
  - [x] M1.1: [Kern-Port V0](../../../docs/spec/kern-port-v0.md) als Spec-Entwurf (31.10.2026).
  - [x] M1.5: eigener CodeGraph-Index für sidekick (Owner-Freigabe 31.10.2026; 112 Dateien, ohne Fremdrepos).
  - [x] M1.2–M1.4: [Vertragssuite](../../../tools/contract-suite/README.md) mit Fake-Runtime, Referenzkern und Supervisor-Prototyp; 57 Tests grün, Abdeckung 62 automatisiert, 33 offen mit Grund, 6 Datenprüfungen (31.10.2026). Ablage unter `tools/` statt `research/` wegen der Owner-Regel vom 30.10.2026.
  - [x] M1.6: Budget (V0-FALL-18…26), Rückwärtsabnahme (27…32), Entwurfskonflikt (13), Run-Effekte mit Epoch, Connector-Prototyp für die Kopplung Supervisor ↔ Kern (V0-FALL-03, -04, -05, -08, -17; RTA-FALL-36, -37) und Beobachter-Prototyp (RTA-FALL-41…47). 93 Tests grün; Abdeckung 92 automatisiert, 3 offen (V0-FALL-11 → M3.1, RTA-FALL-33/34 → V1), 6 Datenprüfungen. Prüfgrenze ergänzt in [Kern-Port §12](../../../docs/spec/kern-port-v0.md) (0.2, Review offen) (31.10.2026).
  - Nächster Schritt: M2 wartet auf **E4** (Budget ≤ 12 Starts / ≤ 3 USD und zulässiger CLI-Zugang, für M2.1) und **E5** (Docker mit Netz, für M2.3). Ohne Freigabe nur kostenfreie Arbeit: Owner-Review von Kern-Port 0.2 (aus M4.1 vorgezogen).
- [ ] M2: Tor B (CLI, ACP/SDK) und Tor A mit der Vertragssuite.
- [ ] M3: Tor C und Tor D mit Prozessgrenze und Neustarts.
- [ ] M4: Review-Schulden, Stack (O-4), vertikaler MVP.

## Run-Supervisor statt eigener Agent-Runtime (31.10.2026)

Befund aus dem [MUXI-Dossier](../../../docs/research/dossiers/muxi-runtime.md): Eine MUXI-artige Runtime (≈ 184.000 Zeilen, davon ≈ 100.000 Orchestrierung) wird nicht nachgebaut. Gebraucht wird nur das Verhalten ihrer Teile `coding/` und `watch/` (≈ 3.000 Zeilen) als **Run-Supervisor im Connector** nach der [Runtime-Adapter-Spec](../../../docs/spec/runtime-adapter-v0.md). Status: vorgeschlagen, Owner-Freigabe offen.

- [x] RS-1 (erledigt mit N1): Drei MUXI-Befunde in die Runtime-Adapter-Spec (PR #32) einarbeiten: Umgebung des Kindprozesses nur per Positivliste; Negativfall „Rückweg ohne Freigabe oder mit Kanal-Benachrichtigung“; benannter Bezug der Kapazitätsgrenze (Gerät/Owner statt implizit pro Nutzer).
- [ ] RS-2: Arbeitspaket planen: deterministische Fake-Runtime plus Contract-Tests für RTA-FALL-01…48, ohne echtes Claude Code.
- [ ] RS-3: Claude-Code-Pfad unter Tor B praktisch prüfen (Resume, Abbruch der Prozessgruppe, Kostenmeldung, Wiederanbindung); Profilfähigkeiten erst danach auf `nachgewiesen`.
- [ ] RS-4: Supervisor-Code erst ab Phase 1: Profil-Loader, Run-Supervisor, Ausgabe-Parser, Arbeitsbereich, Umgebungsfilter, lokale Outbox (Tor C), Beobachter. Schätzung 1.500–2.500 Zeilen TypeScript ohne Tests, nicht gemessen.
- Abgrenzung zu MUXI: Rückweg nur als Einreichung ins Journal (kein Chat, kein Freigabe-Bypass); Rechte nur aus dem Profil; `lost`/`outcome_unknown` nie Erfolg; Fencing über die Epoch. Wählt Tor B ACP oder das Agent SDK, schrumpft der Supervisor; die Prinzipien bleiben.

## Neuer Planungsinput: Vision v5

- [x] Offline-/Geräte-/Sprach-/Gedächtnisrichtung mit elf fixierten GitHub-Quellen und Selfplay abgleichen; [fertiger Befund](../../../docs/research/vision-v5-machbarkeit.md).
- [x] Separaten [Vision-Entwurf](../../../docs/vision-v5-entwurf.md) und [Claude-Bauauftrag](../../../docs/claude-startauftrag-vision-v5.md) vorlegen; v4 unverändert lassen.
- [x] V0: Drei Vorentscheidungen mit dem Owner geklärt ([Fragen](../../../docs/fragen/v0-ziel-und-vertraege/index.md)); [V0-Spec](../../../docs/spec/v0-ziel-und-vertraege.md) mit synchronisierten Schemas/Beispielen (0.3, Datenprüfungen V0-FALL-33…38); Tore A–D um offene Punkte ergänzt, keine Tor-Entscheidung getroffen.
- [ ] V1: Contract-Test-Spec für V0-ABL-01 und die Fallmatrix V0-FALL-01 bis -32; abhängig von Befunden zu Tor A.
- [ ] Vor dem Geräte-Prototyp: Offline-/Origin-Zugriff, Vercel-Instanzwechsel und dauerhafte Zustellung praktisch prüfen; Polling/SSE gegen erneuerbares WSS vergleichen.
- [ ] N0: Frühen Needle-Baseline-/Fine-Tune-Versuch mit synthetischen deutschen Beispielen spezifizieren; tatsächliche GPU-Zeit und Nutzen auf Zielhardware messen.

Dieser PLAN ist die maßgebliche Statusablage auch für V0–V6/N0. Der Bauauftrag beschreibt die Pakete und ihre Abnahme, ohne separaten Ausführungsstatus. V0 liegt als Spec-Entwurf vor (Review offen); V1–V6 und N0 sind noch nicht begonnen.

N0 folgt dem ausdrücklichen neuen Owner-Ziel eines frühen Lernversuchs. Es ist als begrenzter, unabhängiger Research-Spike vorgesehen und erklärt keine P0-Prüfung zu Paperclip/OpenHands/Claude für erledigt. Der neue Input ergänzt diese Prüfungen. v5 bleibt bis zu einer gesonderten Entscheidung Ergänzungsentwurf; der Merge ersetzt v4 nicht.

## Schnittstelle zur Skill-Library

Der neue Owner-Auftrag untersucht die Library als Kernfähigkeit innerhalb Sidekicks. Ablauf, Status und nächste Schritte SL0–SL7 stehen ausschließlich im [Library-Research-Plan](../../skills-meta-prompting/library-research-plan.md). Dieser Hub-Plan führt keine Kopie dieser Pakete. N0 kann später Auswahl-/Routingmodelle prüfen; die Library-Recherche setzt dafür kein Fine-Tuning voraus. Hub-Rechte, Geräteverbindung und fachliche Zustände bleiben bei den bestehenden Toren.

## Entscheidungstore

A: Paperclip/OpenHands erweitern oder eigener Kern. Gewichte: Domäne 25, Rechte/Effekte 25, Recovery 20, Adapter 15, Betrieb/Export 10, UI 5. Keine Scores ohne Belege.
B: Claude-Adapter nach Capability-Tests wählen.
C: HTTPS-Polling/Event-Upload plus Browser-SSE zuerst; WSS nur bei nachgewiesenem Bedarf.
D: Workflow und Storage hinter austauschbaren Verträgen.

## Grenzen

Worktrees sind keine Security-Sandbox. Attached Sessions haben schwächere Kontrollgarantien als Managed Runner. Event-Replay ist kein Prozess-Resume. Postgres besitzt fachliche Zustände. Freigaben binden Parameter, Artefakt und Zielversion. Fencing muss am Effekt greifen. Local-only umfasst Logs/Traces/Benachrichtigungen. Unklare Außenwirkungen niemals blind wiederholen.
