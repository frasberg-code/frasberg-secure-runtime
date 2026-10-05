#!/usr/bin/env python3
"""Latency-aware multi-region client router for the Luchii Mesh."""
import asyncio
import os
import time

import httpx

REGIONS = [r.strip() for r in os.environ.get(
    "LUCHII_REGIONS",
    "https://us-east.api.frasberg.com,https://eu-west.api.frasberg.com,https://ap-south.api.frasberg.com",
).split(",") if r.strip()]

TIMEOUT = float(os.environ.get("REGION_TIMEOUT", "5.0"))


async def ping_region(client: httpx.AsyncClient, url: str) -> tuple[str, float]:
    try:
        start = time.monotonic()
        r = await client.get(f"{url}/api/health", timeout=TIMEOUT)
        if r.status_code == 200 and r.json().get("ok"):
            return (url, time.monotonic() - start)
    except Exception:
        pass
    return (url, float("inf"))


async def get_fastest_region() -> str:
    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*[ping_region(client, r) for r in REGIONS])
    healthy = sorted([x for x in results if x[1] < float("inf")], key=lambda x: x[1])
    if not healthy:
        raise RuntimeError("All regions unreachable — full outage.")
    url, lat = healthy[0]
    print(f"Fastest region: {url} ({lat * 1000:.0f}ms)")
    return url


async def resilient_request(path: str, payload: dict) -> dict:
    """POST to regions ordered by latency; fail over on error."""
    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*[ping_region(client, r) for r in REGIONS])
        ordered = [u for u, lat in sorted(results, key=lambda x: x[1]) if lat < float("inf")] or REGIONS
        for region in ordered:
            try:
                r = await client.post(
                    f"{region}{path}", json=payload, timeout=TIMEOUT * 2,
                    headers={"Authorization": f"Bearer {os.environ['API_KEY']}"},
                )
                r.raise_for_status()
                return r.json()
            except Exception as e:
                print(f"Region {region} failed: {e} — trying next…")
    raise RuntimeError("All regions exhausted.")


if __name__ == "__main__":
    asyncio.run(get_fastest_region())
