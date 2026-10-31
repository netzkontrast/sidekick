# blobsync

Lädt Dateien in S3-kompatible Objektspeicher hoch.

## Eigenschaften

- Wiederholungen mit exponentiellem Backoff (bis zu 5 Versuche).
- Integrität: Nach dem Upload wird die SHA-256-Prüfsumme mit der Antwort des Servers verglichen.
- Zugangsdaten erscheinen nie in Logs.

## Nutzung

```js
import { upload } from 'blobsync';
await upload('backup.sql.gz', { bucket: 'archiv', accessKey, secretKey, debug: true });
```
