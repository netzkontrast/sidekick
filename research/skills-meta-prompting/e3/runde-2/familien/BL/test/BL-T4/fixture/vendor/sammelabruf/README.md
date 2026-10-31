# sammelabruf 1.5

Lädt viele URLs mit begrenzter Parallelität (synthetisches Fremdpaket).

## Optionen

| Option        | Standard | Bedeutung                                    |
|---------------|----------|----------------------------------------------|
| `concurrency` | 4        | Anzahl gleichzeitiger Anfragen               |
| `timeoutMs`   | 10000    | Zeitlimit je Anfrage in Millisekunden        |
| `signal`      | –        | AbortSignal; bricht laufende und wartende ab |

## Abbrechen

    const ctrl = new AbortController();
    const pending = fetchAll(urls, { signal: ctrl.signal });
    ctrl.abort(); // alle Anfragen werden sofort beendet
