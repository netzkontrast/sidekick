# zeitplan

Cron-artiger Job-Planer für Node.js.

## Funktionen

- Cron-Ausdrücke mit sechs Feldern (inklusive Sekunden), z. B. `0 30 2 * * *`.
- Zeitzonen: `schedule(ausdruck, job, { tz: 'Europe/Berlin' })`, Sommerzeitwechsel werden berücksichtigt.
- Keine Überlappung: Ein Job startet erst wieder, wenn der vorige Lauf beendet ist.

## Lizenz

MIT
