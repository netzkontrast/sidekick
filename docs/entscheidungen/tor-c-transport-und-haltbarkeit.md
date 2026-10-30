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

- *dokumentiert*: Vercel unterstützt laut Changelog WebSockets allgemein; eine Verbindung ist an eine Function-Instanz mit Laufzeitgrenze gebunden, eine spätere Verbindung kann eine andere Instanz treffen. Konkrete Grenzen und Kosten sind *offen*. Quelle und Ableitung: [Machbarkeit v5 – Vercel](../research/vision-v5-machbarkeit.md#vercel-hub-ja-unendlicher-prozess-nein). Die Ausgangshypothese oben bleibt bis zur Messung bestehen.

## Entscheidung

## Offene Punkte

- Aus der [V0-Spec](../spec/v0-ziel-und-vertraege.md): Transport muss V0-FALL-03, -11 und -12 erfüllen (Nachlieferung per Cursor, Instanzwechsel, doppelt gesendete Offline-Entwürfe). Lokale Entwürfe des Browsers (§4.7) brauchen dieselbe Idempotenz wie die Connector-Outbox.
