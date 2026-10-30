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
- [ ] Vorschläge P1–P9 aus der [Reflexion zur ChatGPT-Spec](../inputs/2026-10-30-reflexion-chatgpt-spec.md#4-konsequenzen-für-die-planung-vorschläge) mit dem Owner klären; offen sind vor allem P3 (Goose als Vertrags-Runtime) und P8 (eigenes Implementierungs-Repo).

## Neuer Planungsinput: Vision v5

- [x] Offline-/Geräte-/Sprach-/Gedächtnisrichtung mit elf fixierten GitHub-Quellen und Selfplay abgleichen; [fertiger Befund](../../../docs/research/vision-v5-machbarkeit.md).
- [x] Separaten [Vision-Entwurf](../../../docs/vision-v5-entwurf.md) und [Claude-Bauauftrag](../../../docs/claude-startauftrag-vision-v5.md) vorlegen; v4 unverändert lassen.
- [x] V0: Drei Vorentscheidungen mit dem Owner geklärt ([Fragen](../../../docs/fragen/v0-ziel-und-vertraege/index.md)); [V0-Spec](../../../docs/spec/v0-ziel-und-vertraege.md) mit Schemas als Entwurf; Tore A–D um offene Punkte ergänzt, keine Tor-Entscheidung getroffen.
- [ ] V1: Contract-Test-Spec für V0-ABL-01 und die Fallmatrix V0-FALL-01 bis -17; abhängig von Befunden zu Tor A.
- [ ] Vor dem Geräte-Prototyp: Offline-/Origin-Zugriff, Vercel-Instanzwechsel und dauerhafte Zustellung praktisch prüfen; Polling/SSE gegen erneuerbares WSS vergleichen.
- [ ] N0: Frühen Needle-Baseline-/Fine-Tune-Versuch mit synthetischen deutschen Beispielen spezifizieren; tatsächliche GPU-Zeit und Nutzen auf Zielhardware messen.

Dieser PLAN ist die maßgebliche Statusablage auch für V0–V6/N0. Der Bauauftrag beschreibt die Pakete und ihre Abnahme, ohne separaten Ausführungsstatus. V0 liegt als Spec-Entwurf vor (Review offen); V1–V6 und N0 sind noch nicht begonnen.

N0 folgt dem ausdrücklichen neuen Owner-Ziel eines frühen Lernversuchs. Es ist als begrenzter, unabhängiger Research-Spike vorgesehen und erklärt keine P0-Prüfung zu Paperclip/OpenHands/Claude für erledigt. Der neue Input ergänzt diese Prüfungen. v5 bleibt bis zu einer gesonderten Entscheidung Ergänzungsentwurf; der Merge ersetzt v4 nicht.

## Entscheidungstore

A: Paperclip/OpenHands erweitern oder eigener Kern. Gewichte: Domäne 25, Rechte/Effekte 25, Recovery 20, Adapter 15, Betrieb/Export 10, UI 5. Keine Scores ohne Belege.
B: Claude-Adapter nach Capability-Tests wählen.
C: HTTPS-Polling/Event-Upload plus Browser-SSE zuerst; WSS nur bei nachgewiesenem Bedarf.
D: Workflow und Storage hinter austauschbaren Verträgen.

## Grenzen

Worktrees sind keine Security-Sandbox. Attached Sessions haben schwächere Kontrollgarantien als Managed Runner. Event-Replay ist kein Prozess-Resume. Postgres besitzt fachliche Zustände. Freigaben binden Parameter, Artefakt und Zielversion. Fencing muss am Effekt greifen. Local-only umfasst Logs/Traces/Benachrichtigungen. Unklare Außenwirkungen niemals blind wiederholen.
