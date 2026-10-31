# csvlesen

CSV-Parser für Node.js.

## Funktionen

- Streaming mit konstantem Speicherbedarf, auch für Dateien im Gigabyte-Bereich.
- RFC 4180: Felder in Anführungszeichen dürfen Trennzeichen und Zeilenumbrüche enthalten.
- Trennzeichen konfigurierbar (`delimiter`, Standard `,`).
- Ein UTF-8-BOM am Dateianfang wird automatisch entfernt.

## Nutzung

```js
import { parseFile } from 'csvlesen';
for (const row of parseFile('auszug.csv', { delimiter: ';' })) buche(row);
```

## Lizenz

MIT
