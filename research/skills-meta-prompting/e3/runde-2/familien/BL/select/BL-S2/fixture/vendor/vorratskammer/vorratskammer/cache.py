"""vorratskammer.cache – Cache mit Ablaufzeit und Stampede-Schutz."""
import asyncio
import time

DEFAULT_TTL = 30  # Sekunden


class Vorrat:
    def __init__(self, ttl: float = DEFAULT_TTL):
        self.ttl = ttl
        self._data: dict = {}
        self._lock = asyncio.Lock()

    async def get_or_load(self, key, loader):
        """Liefert den Wert; gleichzeitige Aufrufe teilen sich einen Ladevorgang."""
        async with self._lock:
            hit = self._data.get(key)
        if hit and hit[1] > time.monotonic():
            return hit[0]
        value = await loader()
        async with self._lock:
            self._data[key] = (value, time.monotonic() + self.ttl)
        return value

    def invalidate(self, key):
        self._data.pop(key, None)
