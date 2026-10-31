# Vertragssuite (M1)

Ausführbare Vertragstests für den [Kern-Port](../../docs/spec/kern-port-v0.md) und die [Runtime-Adapter-Spec](../../docs/spec/runtime-adapter-v0.md).
Plan: [Gesamtplan](../../research/agent-hub/operations/gesamtplan-2026-11.md), Meilenstein M1 (M1.6: Budget, Rückwärtsabnahme, Kopplung, Beobachter). Ergänzungen der Prüfgrenze: [Kern-Port §12](../../docs/spec/kern-port-v0.md#12-ergänzungen-02-m16-31102026). Node 22, keine Dependencies, kein Install.

```sh
node --test "tools/contract-suite/test/*.test.js"                       # ganze Suite gegen die Referenz-Prüflinge
CONTRACT_KERN="node pfad/zu/anderem-kern.js" node --test tools/contract-suite/test/kern.test.js tools/contract-suite/test/budget.test.js
CONTRACT_SUPERVISOR=pfad/zu/supervisor.js node --test tools/contract-suite/test/runtime-adapter.test.js
```

| Pfad | Inhalt | Lebensdauer |
|---|---|---|
| `test/kern.test.js` | V0-ABL-01, V0-Fälle und KP-Fälle über die JSON-Lines-Prüfgrenze; jedes Journal-Ereignis wird gegen `ereignis.schema.json` geprüft, jede Antwort gegen `kern-port-nachricht.schema.json` | bleibt |
| `test/budget.test.js` | V0-FALL-18…26 auf der simulierten Kernuhr (`test.clock_set`) | bleibt |
| `test/rueckwaerts.test.js` | V0-FALL-27…32: Prüf-Claim, Phase 1 blind, Phase 2 mit Vergleichsgrundlage, Verzicht, Prüfbudget | bleibt |
| `test/kopplung.test.js` | V0-FALL-03, -04, -05, -08, -17 und RTA-FALL-36, -37: Fake-Runtime als echter Prozess, Connector-Prototyp, Kern hinter dem Port | bleibt |
| `test/beobachter.test.js` | RTA-FALL-41…47 auf virtueller Uhr; Kernreaktion über den Port | bleibt |
| `test/runtime-adapter.test.js` | RTA-Fälle gegen Supervisor und Fake-Runtime | bleibt |
| `test/helfer.js` | gemeinsame Vorläufe und Schemaprüfungen der Kern-Tests | bleibt |
| `test/abdeckung.test.js` | hält [`abdeckung.json`](abdeckung.json) synchron mit Specs und Testnamen | bleibt |
| `lib/pruefling.js` | startet einen Prüfling als Prozess und spricht JSON Lines | bleibt |
| `fake-runtime.js`, `profile/fake-runtime.json` | deterministische Coding-Runtime; Verhalten kommt als JSON-Plan über den Prompt | bleibt |
| `referenzkern/kern.js` | **wegwerfbarer** Referenzkern: Journal im Speicher, Zustand als Faltung über das Journal | wird nach M4 nicht weitergepflegt |
| `referenzkern/supervisor.js` | **wegwerfbarer** Supervisor-Prototyp (Profilprüfung, Start ohne Shell, Prozessgruppe, Positivliste der Umgebung) | dto. |
| `referenzkern/connector.js` | **wegwerfbarer** Connector-Prototyp: Outbox mit lokaler Sequenz und festen Idempotenz-Keys, Neustart ohne Doppelstart, Abbruch aus dem Journal, Wiederaufnahme nur bei nachgewiesenem Resume | dto.; der echte Connector folgt in M3.1 |
| `referenzkern/beobachter.js` | **wegwerfbarer** Beobachter-Prototyp für unklare Effekte (RTA-BEO) | dto. |

**Regeln.** Testnamen beginnen mit der Fall-ID. Ein Fall ist erst `automatisiert`, wenn ein Test mit seiner ID existiert; sonst steht er mit Grund in `abdeckung.json`.
Gegenproben am 31.10.2026: Ein Stub, der alles mit `nicht_abbildbar` beantwortet, besteht 4 von 58 Tests der Dateien `kern`, `budget`, `rueckwaerts`, `kopplung` und `beobachter`. Die 4 sind reine Beobachtertests ohne Kern (RTA-FALL-42, -44, -45, -47).
Mutationen des Referenzkerns fallen auf: Ohne Budgetauswertung scheitern 11 Tests, ohne Budgetuhr 9, und eine Prüfinstanz, die die Vergleichsgrundlage schon in Phase 1 sieht, lässt V0-FALL-27 scheitern.
Der Referenzkern ist kein Vorgriff auf Tor A; er beweist nur, dass die Fälle prüfbar sind.

**Ablage.** Suite und Referenzkern liegen unter `tools/`, nicht unter `research/`, weil `research/` nach Owner-Entscheidung vom 30.10.2026 außerhalb von Build- und Testpfaden bleibt.
