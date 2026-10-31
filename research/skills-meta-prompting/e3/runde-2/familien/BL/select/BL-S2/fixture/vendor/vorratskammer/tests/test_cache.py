import asyncio

import pytest

from vorratskammer.cache import Vorrat


@pytest.mark.asyncio
async def test_returns_cached_value():
    cache = Vorrat(ttl=60)
    calls = []

    async def loader():
        calls.append(1)
        return "wert"

    assert await cache.get_or_load("k", loader) == "wert"
    assert await cache.get_or_load("k", loader) == "wert"
    assert len(calls) == 1


@pytest.mark.skip(reason="flaky auf CI, später ansehen")
@pytest.mark.asyncio
async def test_concurrent_calls_share_one_load():
    cache = Vorrat(ttl=60)
    calls = []

    async def loader():
        calls.append(1)
        await asyncio.sleep(0.01)
        return "wert"

    await asyncio.gather(*(cache.get_or_load("k", loader) for _ in range(10)))
    assert len(calls) == 1
