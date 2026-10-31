# drosselhttp 4.2

HTTP-Client mit eingebauter Wiederholungslogik (synthetisches Fremdpaket).

## Wiederholungen

- Bis zu 3 Wiederholungen bei 429 und bei allen 5xx-Antworten.
- Exponentielles Backoff: 200 ms, 400 ms, 800 ms, jeweils mit etwas Jitter.
- Schickt der Server `Retry-After`, wartet der Client genau so lange.

## Beispiel

    const { request } = require("drosselhttp");
    const res = await request("https://example.invalid/api/items");
    console.log(res.status);
