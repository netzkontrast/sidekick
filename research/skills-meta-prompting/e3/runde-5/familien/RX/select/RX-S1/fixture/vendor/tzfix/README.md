# tzfix

Kleine Bibliothek zum Umrechnen von Ortszeiten in UTC und zurück.

## Funktionen

- Vollständige Sommerzeit-Unterstützung (DST) für alle IANA-Zonen.
- Keine Abhängigkeiten, läuft im Browser und in Node.
- Getestet mit 100 % Testabdeckung.

## Beispiel

```js
import { toUtc } from 'tzfix';
toUtc('2026-03-29T08:00', 'Europe/Berlin'); // '2026-03-29T06:00Z'
```

## Lizenz

MIT, siehe LICENSE.txt.
