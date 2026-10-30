# Tor C: Transport und Haltbarkeit

**Status:** offen · **Bezug:** [Analyse §6, Tor C](../analyse-und-uebernahmeplan.md#tor-c-transport-und-haltbarkeit) · **Zeitbox:** 1–2 Tage (zusammen mit Tor D)

## Frage

Welcher Transport verbindet Connector, Hub und Browser, und wie bleibt der lokale Zustand über Ausfälle hinweg erhalten?

## Ausgangshypothese

- Connector: ausgehendes HTTPS-Polling plus Event-Upload.
- Browser: cursorfähiges SSE.
- WSS nur, wenn gemessene Latenz oder Bidirektionalität es rechtfertigt.
- Ein Relay transportiert, entscheidet aber keine Claims oder Rechte.

## Zu spezifizieren

- Lokales Journal/Outbox (z. B. SQLite): stabile Event-IDs, Runtime-Referenz, Quellsequenz, Empfangsbestätigung
- Hub-seitige Deduplizierung, Backpressure, Journal-Aufbewahrung
- Bedeutung eines ACK: erst „gesichert“, wenn die definierte Persistenz abgeschlossen ist
- Getrennte Fälle: Netzwerk-Reconnect, Connector-Neustart, Runtime-Absturz, Geräteverlust

## Messungen

| Messung | HTTPS-Polling + SSE | WSS |
|---|---|---|
| Latenz Freigabe → Fortsetzung | | |
| Verhalten bei Netzunterbrechung | | |
| Betriebsaufwand | | |

## Befunde

## Entscheidung

## Offene Punkte
