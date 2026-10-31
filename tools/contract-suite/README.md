# Vertragssuite (M1)

Ausführbare Vertragstests für den [Kern-Port](../../docs/spec/kern-port-v0.md) und die [Runtime-Adapter-Spec](../../docs/spec/runtime-adapter-v0.md).
Plan: [Gesamtplan](../../research/agent-hub/operations/gesamtplan-2026-11.md), Meilenstein M1. Node 22, keine Dependencies, kein Install.

```sh
node --test "tools/contract-suite/test/*.test.js"                       # ganze Suite gegen die Referenz-Prüflinge
CONTRACT_KERN="node pfad/zu/anderem-kern.js" node --test tools/contract-suite/test/kern.test.js
CONTRACT_SUPERVISOR=pfad/zu/supervisor.js node --test tools/contract-suite/test/runtime-adapter.test.js
```

| Pfad | Inhalt | Lebensdauer |
|---|---|---|
| `test/kern.test.js` | V0-ABL-01, V0-Fälle und KP-Fälle über die JSON-Lines-Prüfgrenze; jedes Journal-Ereignis wird gegen `ereignis.schema.json` geprüft, jede Antwort gegen `kern-port-nachricht.schema.json` | bleibt |
| `test/runtime-adapter.test.js` | RTA-Fälle gegen Supervisor und Fake-Runtime | bleibt |
| `test/abdeckung.test.js` | hält [`abdeckung.json`](abdeckung.json) synchron mit Specs und Testnamen | bleibt |
| `lib/pruefling.js` | startet einen Prüfling als Prozess und spricht JSON Lines | bleibt |
| `fake-runtime.js`, `profile/fake-runtime.json` | deterministische Coding-Runtime; Verhalten kommt als JSON-Plan über den Prompt | bleibt |
| `referenzkern/kern.js` | **wegwerfbarer** Referenzkern: Journal im Speicher, Zustand als Faltung über das Journal | wird nach M4 nicht weitergepflegt |
| `referenzkern/supervisor.js` | **wegwerfbarer** Supervisor-Prototyp (Profilprüfung, Start ohne Shell, Prozessgruppe, Positivliste der Umgebung) | dto. |

**Regeln.** Testnamen beginnen mit der Fall-ID. Ein Fall ist erst `automatisiert`, wenn ein Test mit seiner ID existiert; sonst steht er mit Grund in `abdeckung.json`.
Gegen einen Stub, der alles mit `nicht_abbildbar` beantwortet, schlagen alle Kern-Tests fehl (geprüft am 31.10.2026: 0 von 22 bestanden).
Der Referenzkern ist kein Vorgriff auf Tor A; er beweist nur, dass die Fälle prüfbar sind.

**Ablage.** Suite und Referenzkern liegen unter `tools/`, nicht unter `research/`, weil `research/` nach Owner-Entscheidung vom 30.10.2026 außerhalb von Build- und Testpfaden bleibt.
