"""Iteration 22: games portal registry, assets, and websocket bridge."""
import os
import json
import asyncio
import pytest
import requests
import websockets

def _load_base_url():
    url = os.environ.get("REACT_APP_BACKEND_URL")
    if not url:
        # read frontend/.env
        try:
            with open("/app/frontend/.env") as f:
                for line in f:
                    if line.startswith("REACT_APP_BACKEND_URL="):
                        url = line.split("=", 1)[1].strip()
                        break
        except Exception:
            pass
    assert url, "REACT_APP_BACKEND_URL not set"
    return url.rstrip("/")


BASE_URL = _load_base_url()


# ---------- Registry & titles ----------
def test_list_games_titles_and_engine():
    r = requests.get(f"{BASE_URL}/api/games", timeout=15)
    assert r.status_code == 200, r.text
    games = r.json()
    by_id = {g["id"]: g for g in games if isinstance(g, dict) and "id" in g}
    assert by_id["streets"]["title"] == "Street Vybz"
    assert by_id["racer3d"]["title"] == "Las Vegas Racer"
    assert "carjack" not in by_id  # merged into streets
    # engine == 'Multiplayer' only for carjack; other core games must have empty string
    assert by_id["streets"]["engine"] == ""
    for gid in ("streets", "racer3d", "spaceshooter", "dungeon3d", "maze3d"):
        assert by_id[gid]["engine"] == "", f"{gid} engine is {by_id[gid]['engine']!r}"


# ---------- Play HTML endpoints ----------
@pytest.mark.parametrize("gid", ["streets", "racer3d", "spaceshooter"])
def test_play_endpoint_returns_html(gid):
    r = requests.get(f"{BASE_URL}/api/games/{gid}/play", timeout=15)
    assert r.status_code == 200, f"{gid} -> {r.status_code}"
    assert "<html" in r.text.lower() or "<!doctype" in r.text.lower()


# ---------- Assets ----------
@pytest.mark.parametrize("fname", [
    "npc-man.png", "npc-woman.png", "npc-cop.png", "boss-alien.png",
    "vegas-facade-1.jpg", "backdrop-racer3d.jpg",
])
def test_assets_200(fname):
    r = requests.get(f"{BASE_URL}/api/games/assets/{fname}", timeout=15)
    assert r.status_code == 200, f"{fname} -> {r.status_code}"
    assert len(r.content) > 200


# ---------- Multiplayer websocket bridge ----------
def test_multiplayer_ws_welcome():
    ws_base = BASE_URL.replace("https://", "wss://").replace("http://", "ws://")

    async def _run():
        async with websockets.connect(f"{ws_base}/api/games/mp/ws", open_timeout=10) as ws:
            msg = await asyncio.wait_for(ws.recv(), timeout=6)
            return msg

    msg = asyncio.get_event_loop().run_until_complete(_run()) if not asyncio.get_event_loop().is_running() else asyncio.run(_run())
    data = json.loads(msg)
    assert "serverPublicKey" in data or data.get("type") in ("welcome", "hello"), f"unexpected msg: {data}"
