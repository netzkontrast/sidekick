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

- Dokumentiert, abgerufen am 30.10.2026: [Vercel meldet WebSocket-GA seit 20.10.2026](https://vercel.com/changelog/websocket-support-is-now-generally-available). [Verbindungen sind an die Laufzeit ihrer Function-Instanz gebunden](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections); Folge-Verbindungen können andere Instanzen erreichen. Das ermöglicht WSS als Kandidaten, entscheidet aber den Transport nicht. Konkrete Laufzeitwerte pro Plan und ihre Kosten bleiben für unseren Versuch offen.

## Entscheidung

## Offene Punkte

- Offen, 30.10.2026: Erneuerbares WSS anhand des [Vercel-Befunds](../research/vision-v5-machbarkeit.md#vercel-hub-ja-unendlicher-prozess-nein) gegen Polling/Event-Upload/SSE messen. Instanzwechsel, dauerhafte Zustellung, Reconnect, Offline-/Origin-Zugriff und Kosten nachweisen; Ausgangshypothese bis zur Entscheidung unverändert.

- Aus der [V0-Spec](../spec/v0-ziel-und-vertraege.md): Transport muss V0-FALL-03, -11 und -12 erfüllen (Nachlieferung per Cursor, Instanzwechsel, doppelt gesendete Offline-Entwürfe). Lokale Entwürfe des Browsers (§4.7) brauchen dieselbe Idempotenz wie die Connector-Outbox.
