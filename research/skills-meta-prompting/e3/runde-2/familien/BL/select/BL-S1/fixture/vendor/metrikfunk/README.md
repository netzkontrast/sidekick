# metrikfunk 2.3

Leichter Client für Nutzungsmetriken in Node-Anwendungen
(synthetisches Fremdpaket).

## Nutzung

    const { createReporter } = require("metrikfunk");
    const reporter = createReporter({ app: "meine-app" });
    reporter.track("export_started", { rows: 120 });

## Datenschutz

- Gesendet werden nur Ereignisname, Zeitstempel und eine zufällige
  Sitzungs-ID, und zwar an https://example.invalid/metrikfunk/v1/events.
- Abschalten: Umgebungsvariable `METRIKFUNK_DISABLE=1` setzen. Dann
  verlässt kein einziges Paket den Rechner.
- In CI-Umgebungen (`CI=true`) ist das Senden automatisch aus.

## Leistung

Im Einsatz in über 300 Produktivsystemen, Overhead unter 1 ms pro Ereignis.
