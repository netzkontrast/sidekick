# Spec

Verhaltensspecs für Sidekick. Code folgt erst, wenn die zugehörige Spec gemergt ist (siehe `AGENTS.md`).
Vision und Recherche begründen; hier steht, was das System tun muss und woran das geprüft wird.

| Spec | Inhalt | Status |
|---|---|---|
| [V0 – Ziel und Verträge](v0-ziel-und-vertraege.md) | Begriffe, Invarianten, Zustandsautomaten, Fallmatrix, erster Ablauf | Entwurf |

## Konventionen

- **IDs:** `V0-<Bereich>-<nn>`, z. B. `V0-INV-01`. Einmal vergeben, nie umnummern; Entfallenes bleibt als *gestrichen* stehen.
  Tests und spätere Specs verweisen auf diese IDs.
- **Schemas:** [`schemas/`](schemas/) als JSON Schema (Draft 2020-12). Sie beschreiben Vertragsdaten,
  kein Speicherlayout und keine Wahl eines Frameworks.
- **Beispiele:** [`beispiele/`](beispiele/) enthält nur synthetische Fixtures. Keine echten Nutzerdaten, keine Secrets.
- **Versionierung:** Jede Datei trägt ihre Version im Kopf bzw. in `$id`. Eine inkompatible Änderung erhöht die Hauptversion.
- **Entscheidungen** bleiben unter [`docs/entscheidungen/`](../entscheidungen/README.md), Rückfragen unter
  [`docs/fragen/`](../fragen/README.md). Die Spec verlinkt sie, statt sie zu wiederholen.
