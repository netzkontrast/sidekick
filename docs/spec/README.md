# Spec

Verhaltensspecs für Sidekick. Code folgt erst, wenn die zugehörige Spec gemergt ist (siehe `AGENTS.md`).
Vision und Recherche begründen; hier steht, was das System tun muss und woran das geprüft wird.

| Spec | Inhalt | Status |
|---|---|---|
| [V0 – Ziel und Verträge](v0-ziel-und-vertraege.md) | Verträge und Fallmatrix; seit 0.3 Schemas/Beispiele zu Budget und Rückwärtsabnahme synchronisiert | Datenform geprüft; Produktlaufzeit und V1-Vertragstests offen |
| [Skill-Library V0](skill-library-v0.md) | Paketvertrag, Hashes, Validator, Registry und Eval-Harness; IDs `SLV0-<Bereich>-<nn>` | Stufen 0–2 implementiert; Grenzen und offene Punkte in der Spec |
| [Runtime-Adapter V0](runtime-adapter-v0.md) | Adapterprofil, Aufruf ohne Shell, Session-Formen, Abbruch und Timeout, Laufrechte, Beobachter für unklare Effekte, Fallmatrix; IDs `RTA-<Bereich>-<nn>` | Entwurf; nicht implementiert |
| [Kern-Port V0](kern-port-v0.md) | Prüfgrenze der Vertragssuite: Commands, Steuerbefehle, Fehlercodes, Zuordnung von V0-ABL-01 und V0-FALL; IDs `KP-<Bereich>-<nn>` | Entwurf; nicht implementiert |
| [Fragen-CLI V0](questions-cli-v0.md) | Fragenablage, Befehle, Zustandsinvarianten, Dateiformat und Fehlerfälle; IDs `QCLI-<Bereich>-<nn>` | Implementiert; Einsparung im Modellvergleich offen (QO-1) |

## Konventionen

- **IDs:** `V0-<Bereich>-<nn>`, z. B. `V0-INV-01`. Einmal vergeben, nie umnummern; Entfallenes bleibt als *gestrichen* stehen.
  Tests und spätere Specs verweisen auf diese IDs.
- **Schemas:** [`schemas/`](schemas/) als JSON Schema (Draft 2020-12). Sie beschreiben Vertragsdaten,
  kein Speicherlayout und keine Wahl eines Frameworks.
- **Beispiele:** [`beispiele/`](beispiele/) enthält nur synthetische Fixtures. Keine echten Nutzerdaten, keine Secrets.
- **Versionierung:** Jede Datei trägt ihre Version im Kopf bzw. in `$id`. Eine inkompatible Änderung erhöht die Hauptversion.
- **Entscheidungen** bleiben unter [`docs/entscheidungen/`](../entscheidungen/README.md), Rückfragen unter
  [`docs/fragen/`](../fragen/README.md). Die Spec verlinkt sie, statt sie zu wiederholen.
