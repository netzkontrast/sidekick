# hooksiegel 0.9

Prüft Signaturen eingehender Webhooks (synthetisches Fremdpaket, Python 3.10+).

## Nutzung

    from hooksiegel.verify import verify
    ok = verify(SECRET, request.headers["X-Siegel"], request.body)

## Sicherheit

- HMAC-SHA256 über Zeitstempel und Rohdaten.
- Signaturvergleich in konstanter Zeit (timing-sicher).
- Replay-Schutz: Zeitstempel, die mehr als 5 Minuten abweichen, werden abgelehnt.
- 2025 extern auditiert, keine offenen Befunde.
