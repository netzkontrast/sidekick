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

Begründung und Kritik: [Plan-Review 31.10.2026](plan-review-2026-10-31.md). Vorschlag „Kern vor Library“:

- [x] AP1–AP3 der Übernahme afs-spec/DSPy-Buch gemergt (#31, #32, #34); MUXI-Dossier und Skill `using-codegraph` gemergt (#36, #35).
- [x] N1: DSPy-Dossier auf `92d97ca` (Zahlen, Dateizuordnung 346 Dateien, Kapitel 11), RS-1 als RTA-INV-07, RTA-AUF-07, RTA-LEB-09 mit Fällen 49–51, Präsentation korrigiert (31.10.2026).
- [ ] N2: Tor B praktisch über die Claude-CLI (≤ 12 Starts, ≤ 3 USD; Owner-Budget und Auth offen).
- [ ] N3: Fake-Runtime und ausführbare RTA-Fälle (= RS-2; Ablageort offen).
- [ ] N4: Tor-A-Spike Paperclip/OpenHands lokal mit Docker (Owner-Freigabe offen).
- [ ] N5–N6: Spielraum-Vorprüfung vor D3, AP4 nur als Fallfamilie – Status im [Library-Plan §8.2](../../skills-meta-prompting/library-research-plan.md#82-buchgestützter-dspy-ausbau-owner-auftrag-31102026).
- [ ] N7: Eigener CodeGraph-Index für sidekick (Owner-Entscheidung; Clean-Room-Risiko K6).

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
