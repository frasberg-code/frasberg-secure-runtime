"""Backend regression tests for Frasberg Streets multi-file game build + scores endpoints."""
import os
import pytest
import requests
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    # Fallback for backend tests running inside container
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')

API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def sess():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Game registry ---
def test_games_registry_includes_streets(sess):
    r = sess.get(f"{API}/games", timeout=15)
    assert r.status_code == 200, r.text
    games = r.json()
    assert isinstance(games, list) and len(games) >= 1
    streets = next((g for g in games if g.get("id") == "streets"), None)
    assert streets is not None, f"streets not in registry: {[g.get('id') for g in games]}"
    assert streets.get("title") == "Frasberg Streets", streets
    controls = (streets.get("controls") or "") + " " + str(streets)
    assert "F" in controls and "carjack" in controls.lower(), f"controls missing F carjack: {streets}"


# --- Play endpoint (multi-file build) ---
def test_streets_play_returns_html_referencing_assets(sess):
    r = sess.get(f"{API}/games/streets/play", timeout=15)
    assert r.status_code == 200
    html = r.text
    assert "./assets/" in html or "assets/" in html, "HTML doesn't reference ./assets/ chunks"
    assert "<script" in html.lower()


# --- Asset serving ---
def test_streets_asset_serves_js_chunk(sess):
    # Pick actual hashed filename from disk
    assets_dir = Path("/app/games/streets/assets")
    files = [p.name for p in assets_dir.glob("*.js")]
    assert files, "No JS chunks on disk"
    fname = files[0]
    r = sess.get(f"{API}/games/streets/assets/{fname}", timeout=15)
    assert r.status_code == 200
    ctype = r.headers.get("content-type", "")
    assert "javascript" in ctype or "application" in ctype, ctype
    assert len(r.content) > 100


def test_streets_asset_path_traversal_rejected(sess):
    # URL-encoded traversal
    r1 = sess.get(f"{API}/games/streets/assets/..%2Findex.html", timeout=15)
    assert r1.status_code in (400, 404), r1.status_code
    # Literal dotdot in name (requests won't normalize since no slash)
    r2 = sess.get(f"{API}/games/streets/assets/..evil.js", timeout=15)
    assert r2.status_code in (400, 404), r2.status_code


def test_streets_asset_missing_returns_404(sess):
    r = sess.get(f"{API}/games/streets/assets/nonexistent-xyz.js", timeout=15)
    assert r.status_code == 404


# --- Scores ---
def test_streets_scores_post_and_get_and_weekly(sess):
    payload = {"name": "QA-BOT", "score": 1234}
    r = sess.post(f"{API}/games/streets/scores", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("ok") is True, body

    r2 = sess.get(f"{API}/games/streets/scores", timeout=15)
    assert r2.status_code == 200
    scores = r2.json()
    # response may be list or dict with "scores"
    entries = scores if isinstance(scores, list) else scores.get("scores", scores.get("data", []))
    assert any(e.get("name") == "QA-BOT" and e.get("score") == 1234 for e in entries), entries[:5]

    r3 = sess.get(f"{API}/games/streets/scores?period=weekly", timeout=15)
    assert r3.status_code == 200
    w = r3.json()
    assert isinstance(w, (list, dict))


# --- Regression: old single-file game still works ---
def test_dungeon3d_play_still_works(sess):
    r = sess.get(f"{API}/games/dungeon3d/play", timeout=15)
    assert r.status_code == 200
    assert "<html" in r.text.lower() or "<!doctype" in r.text.lower()


# --- Cleanup QA-BOT ---
def test_zzz_cleanup_qa_bot():
    async def _clean():
        mongo_url = os.environ.get("MONGO_URL")
        db_name = os.environ.get("DB_NAME")
        if not mongo_url or not db_name:
            # try backend/.env
            with open('/app/backend/.env') as f:
                for ln in f:
                    if ln.startswith("MONGO_URL="): mongo_url = ln.split("=",1)[1].strip().strip('"').strip("'")
                    if ln.startswith("DB_NAME="): db_name = ln.split("=",1)[1].strip().strip('"').strip("'")
        client = AsyncIOMotorClient(mongo_url)
        res = await client[db_name].game_scores.delete_many({"name": "QA-BOT"})
        client.close()
        return res.deleted_count
    n = asyncio.get_event_loop().run_until_complete(_clean()) if False else asyncio.run(_clean())
    assert n >= 1
