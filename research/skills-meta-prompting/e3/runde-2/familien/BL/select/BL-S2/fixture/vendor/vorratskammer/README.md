# vorratskammer 1.8

Asynchroner In-Memory-Cache mit Ablaufzeit für Python 3.11+
(synthetisches Fremdpaket).

## Eigenschaften

- `get_or_load(key, loader)` lädt fehlende Werte genau einmal: Kommen
  mehrere Anfragen für denselben Schlüssel gleichzeitig, warten alle auf
  denselben Ladevorgang (Schutz vor Cache-Stampedes).
- Einträge verfallen nach `ttl` Sekunden (Standard: 300).
- Vollständig getestet, siehe `tests/test_cache.py`.

## Beispiel

    cache = Vorrat(ttl=60)
    user = await cache.get_or_load(("user", 42), lambda: fetch_user(42))
