# ratezaun

Rate-Limiting-Middleware für Node.js-HTTP-Server.

## Funktionen

- Gleitendes Fenster (Sliding Window) statt starrer Zeitfenster: keine Lastspitzen an Fenstergrenzen.
- Speicher-Backends: `MemoryStore` (Standard) und `RedisStore` für den Betrieb mit mehreren Instanzen.
- `burst`: erlaubt kurzfristig zusätzliche Anfragen über dem Limit.
- Schlüssel frei wählbar, z. B. je Mandant über `keyFn(req)`.

## Nutzung

```js
import { limiter } from 'ratezaun';
app.use(limiter({ limit: 100, windowMs: 60000, burst: 20, keyFn: (r) => r.headers['x-tenant'] }));
```

## Mitwirken

Fehler bitte als Issue melden. Vor einem Pull Request `npm test` ausführen.

## Lizenz

ISC
