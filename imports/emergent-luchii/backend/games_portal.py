import os
import re
import uuid
import base64
import hashlib
import asyncio
import time as _time
from datetime import datetime, timezone
from pathlib import Path

import httpx
import websockets as ws_client
from fastapi import APIRouter, HTTPException, WebSocket, Request
from fastapi.responses import FileResponse, HTMLResponse, Response
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from emergentintegrations.llm.openai import OpenAITextToSpeech

router = APIRouter(prefix="/games")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
_VOICE_RL = {}
_VOICE_OK = re.compile(r"^[A-Za-z0-9 ,.!?'\u2019\-]{1,60}$")


@router.get("/voice")
async def game_voice(request: Request, text: str, sex: str = "male"):
    """Natural human voice lines for games — generated once via the Frasberg voice API, cached forever."""
    text = (text or "").strip()[:60]
    if not text or not _VOICE_OK.match(text):
        raise HTTPException(status_code=400, detail="invalid line")
    voice = "nova" if sex == "female" else "onyx"
    h = hashlib.sha1(f"{voice}|{text.lower()}".encode()).hexdigest()
    cached = await db.game_voice_cache.find_one({"_id": h})
    if cached:
        return Response(content=base64.b64decode(cached["b64"]), media_type="audio/mpeg",
                        headers={"Cache-Control": "public, max-age=604800"})
    ip = request.client.host if request.client else "?"
    now = _time.time()
    hits = [t for t in _VOICE_RL.get(ip, []) if now - t < 60]
    if len(hits) >= 40:
        raise HTTPException(status_code=429, detail="voice rate limit")
    hits.append(now)
    _VOICE_RL[ip] = hits
    try:
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        b64 = await tts.generate_speech_base64(text=text, model="tts-1", voice=voice)
    except Exception:
        raise HTTPException(status_code=502, detail="voice engine unavailable")
    await db.game_voice_cache.update_one(
        {"_id": h}, {"$set": {"b64": b64, "text": text, "voice": voice,
                              "created": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return Response(content=base64.b64decode(b64), media_type="audio/mpeg",
                    headers={"Cache-Control": "public, max-age=604800"})


GAMES_DIR = Path(__file__).parent.parent / "games"

GAME_REGISTRY = [
    {
        "id": "streets",
        "title": "Street Vybz",
        "genre": "Open World",
        "description": "Street Vybz — Jack City. You owe Frankie the mob boss: his cut gets collected on a timer, and if you can't pay, his boys find you. Earn it any way you can — carjacking, hit contracts from the burner phone, pizza runs from Mama's Kitchen, taxi fares, or VYBZ's 3-mission street chain. Realistic human characters, natural spoken voices, real-time day/night synced to your clock, LVMPD wanted stars and LVFR fire crews.",
        "thumbnail": "/games-thumbs/streets.jpg",
        "controls": "WASD drive · E carjack/exit · F bat · G pistol · V talk to Vybz · Space brake · Shift sprint",
        "engine": "",
    },
    {
        "id": "dungeon3d",
        "title": "Luchii Dungeon",
        "genre": "FPS",
        "description": "Descend into the sovereign dungeon. Waves of drones, torchlight, and one way out — through them.",
        "thumbnail": "/games-thumbs/dungeon3d.jpg",
        "controls": "WASD move · Mouse aim · Click shoot · R reload · Space jump",
        "engine": "",
    },
    {
        "id": "racer3d",
        "title": "Las Vegas Racer",
        "genre": "Racing",
        "description": "Neon Las Vegas at 300 km/h. Weave through Strip traffic — one touch and it's over.",
        "thumbnail": "/games-thumbs/racer3d.jpg",
        "controls": "A/D or ←/→ steer · W/↑ boost",
        "engine": "",
    },
    {
        "id": "spaceshooter",
        "title": "Constellation Wars",
        "genre": "Shooter",
        "description": "Defend the Constellation Layer. Endless enemy formations descend from the void.",
        "thumbnail": "/games-thumbs/spaceshooter.jpg",
        "controls": "WASD/arrows move · Space or click fire · 1-4 weapons",
        "engine": "",
    },
    {
        "id": "maze3d",
        "title": "Meta Maze",
        "genre": "Puzzle",
        "description": "A procedurally generated labyrinth. Find the beacon before the clock runs out.",
        "thumbnail": "/games-thumbs/maze3d.jpg",
        "controls": "WASD move · Mouse look",
        "engine": "",
    },
]


@router.get("")
async def list_games():
    counts = {d["game_id"]: int(d.get("plays", 0))
              async for d in db.game_plays.find({}, {"_id": 0, "game_id": 1, "plays": 1})}
    week = _week_key()
    out = []
    for g in GAME_REGISTRY:
        top = await db.game_scores.find_one(
            {"game_id": g["id"]}, {"_id": 0, "name": 1, "score": 1}, sort=[("score", -1)]
        )
        weekly = await db.game_scores.find_one(
            {"game_id": g["id"], "week": week}, {"_id": 0, "name": 1, "score": 1}, sort=[("score", -1)]
        )
        out.append({**g, "champion": top, "weekly_champion": weekly, "plays": counts.get(g["id"], 0)})
    community = await db.builder_projects.find(
        {"type": "game", "published": True, "featured": True, "hidden": {"$ne": True}},
        {"_id": 0, "slug": 1, "title": 1, "plays": 1},
    ).sort("plays", -1).to_list(12)
    for d in community:
        out.append({
            "id": f"builder-{d['slug']}", "title": d["title"], "genre": "Community",
            "description": "Community build — made with Luchii Game Builder and promoted to the official library.",
            "thumbnail": None, "controls": "", "engine": "Built with Luchii Builder",
            "community": True, "slug": d["slug"], "plays": int(d.get("plays", 0)), "champion": None,
        })
    out.sort(key=lambda g: g.get("plays", 0), reverse=True)
    return out


@router.post("/{game_id}/play-count")
async def count_play(game_id: str):
    await db.game_plays.update_one({"game_id": game_id}, {"$inc": {"plays": 1}}, upsert=True)
    doc = await db.game_plays.find_one({"game_id": game_id}, {"_id": 0})
    return {"ok": True, "plays": int((doc or {}).get("plays", 0))}


class ScoreIn(BaseModel):
    name: str = Field(min_length=1, max_length=20)
    score: int = Field(ge=0, le=1_000_000_000)


def _valid_game(game_id: str):
    game = next((g for g in GAME_REGISTRY if g["id"] == game_id), None)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


def _week_key():
    return datetime.now(timezone.utc).strftime("%G-W%V")


def _optional_user_id(request) -> str:
    token = request.cookies.get("access_token", "")
    if not token:
        auth_hdr = request.headers.get("Authorization", "")
        if auth_hdr.lower().startswith("bearer "):
            token = auth_hdr[7:]
    if not token:
        return None
    try:
        import jwt as _jwt
        payload = _jwt.decode(token, os.environ["JWT_SECRET"], algorithms=["HS256"])
        return payload.get("sub")
    except Exception:
        return None


def _require_user_id(request) -> str:
    uid = _optional_user_id(request)
    if not uid:
        raise HTTPException(status_code=401, detail="Sign in to use player features")
    return uid


@router.get("/player/favorites")
async def get_favorites(request: Request):
    uid = _require_user_id(request)
    doc = await db.game_favorites.find_one({"user_id": uid}, {"_id": 0, "game_ids": 1})
    return {"favorites": (doc or {}).get("game_ids", [])}


@router.post("/player/favorites/{game_id}")
async def toggle_favorite(game_id: str, request: Request):
    uid = _require_user_id(request)
    doc = await db.game_favorites.find_one({"user_id": uid}, {"game_ids": 1})
    fav = game_id in (doc or {}).get("game_ids", [])
    op = {"$pull": {"game_ids": game_id}} if fav else {"$addToSet": {"game_ids": game_id}}
    await db.game_favorites.update_one({"user_id": uid}, op, upsert=True)
    return {"ok": True, "favorited": not fav}


@router.post("/player/playtime")
async def record_playtime(request: Request, body: dict):
    uid = _require_user_id(request)
    game_id = str(body.get("game_id", ""))[:80]
    seconds = max(1, min(int(body.get("seconds", 0)), 120))
    if not game_id:
        raise HTTPException(status_code=400, detail="game_id required")
    await db.game_playtime.update_one({"user_id": uid, "game_id": game_id},
                                      {"$inc": {"seconds": seconds}}, upsert=True)
    return {"ok": True}


@router.get("/player/profile")
async def player_profile(request: Request):
    uid = _require_user_id(request)
    titles = {g["id"]: g["title"] for g in GAME_REGISTRY}
    fav_doc = await db.game_favorites.find_one({"user_id": uid}, {"_id": 0, "game_ids": 1})
    favorites = [{"game_id": gid, "title": titles.get(gid, gid)}
                 for gid in (fav_doc or {}).get("game_ids", [])]
    docs = await db.game_scores.find({"user_id": uid}, {"_id": 0, "game_id": 1, "score": 1,
                                                        "ts": 1}).sort("score", -1).to_list(500)
    best = {}
    for d in docs:
        if d["game_id"] not in best:
            best[d["game_id"]] = {**d, "title": titles.get(d["game_id"], d["game_id"])}
    playtime = [{"game_id": d["game_id"], "title": titles.get(d["game_id"], d["game_id"]),
                 "seconds": int(d.get("seconds", 0))}
                async for d in db.game_playtime.find({"user_id": uid}, {"_id": 0})]
    playtime.sort(key=lambda p: p["seconds"], reverse=True)
    return {"favorites": favorites, "best_scores": list(best.values()),
            "playtime": playtime, "total_seconds": sum(p["seconds"] for p in playtime)}


@router.get("/player/achievements")
async def player_achievements(request: Request):
    uid = _require_user_id(request)
    scores = await db.game_scores.find({"user_id": uid}, {"_id": 0, "game_id": 1, "score": 1,
                                                          "week": 1}).to_list(1000)
    fav_doc = await db.game_favorites.find_one({"user_id": uid}, {"game_ids": 1})
    favorites = (fav_doc or {}).get("game_ids", [])
    playtime = [d async for d in db.game_playtime.find({"user_id": uid}, {"_id": 0})]
    total_seconds = sum(int(p.get("seconds", 0)) for p in playtime)
    week = _week_key()
    weekly_king = False
    for gid in {s["game_id"] for s in scores if s.get("week") == week}:
        top = await db.game_scores.find_one({"game_id": gid, "week": week},
                                            {"user_id": 1}, sort=[("score", -1)])
        if top and top.get("user_id") == uid:
            weekly_king = True
            break
    badges = [
        {"id": "first_score", "title": "First Blood", "desc": "Post your first score",
         "icon": "🎯", "earned": len(scores) > 0},
        {"id": "high_roller", "title": "High Roller", "desc": "Score 5,000+ in any game",
         "icon": "🎰", "earned": any(s["score"] >= 5000 for s in scores)},
        {"id": "hour_played", "title": "Marathon", "desc": "Play for 1 hour total",
         "icon": "⏱️", "earned": total_seconds >= 3600},
        {"id": "collector", "title": "Collector", "desc": "Favorite 3+ games",
         "icon": "❤️", "earned": len(favorites) >= 3},
        {"id": "explorer", "title": "Explorer", "desc": "Play 3 different games",
         "icon": "🧭", "earned": len({p["game_id"] for p in playtime}) >= 3},
        {"id": "weekly_king", "title": "Weekly King", "desc": "Hold a #1 weekly score",
         "icon": "👑", "earned": weekly_king},
    ]
    return {"badges": badges, "earned": sum(1 for b in badges if b["earned"])}


@router.get("/player/best-scores")
async def my_best_scores(request: Request):
    uid = _require_user_id(request)
    docs = await db.game_scores.find({"user_id": uid}, {"_id": 0, "game_id": 1, "name": 1,
                                                        "score": 1, "ts": 1}).sort("score", -1).to_list(500)
    best = {}
    for d in docs:
        if d["game_id"] not in best:
            best[d["game_id"]] = d
    titles = {g["id"]: g["title"] for g in GAME_REGISTRY}
    return [{**d, "title": titles.get(d["game_id"], d["game_id"])} for d in best.values()]


@router.get("/{game_id}/scores")
async def get_scores(game_id: str, period: str = "all"):
    _valid_game(game_id)
    q = {"game_id": game_id}
    if period == "weekly":
        q["week"] = _week_key()
    docs = await db.game_scores.find(q, {"_id": 0, "name": 1, "score": 1}) \
        .sort("score", -1).to_list(10)
    return docs


@router.post("/{game_id}/scores")
async def post_score(game_id: str, body: ScoreIn, request: Request):
    _valid_game(game_id)
    name = body.name.strip()[:20] or "PLAYER"
    uid = _optional_user_id(request)
    personal_best = False
    if uid:
        prev = await db.game_scores.find_one({"game_id": game_id, "user_id": uid},
                                             {"score": 1}, sort=[("score", -1)])
        personal_best = prev is None or body.score > prev.get("score", 0)
    await db.game_scores.insert_one({
        "id": str(uuid.uuid4()), "game_id": game_id, "name": name,
        "score": body.score, "week": _week_key(),
        "user_id": uid,
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    docs = await db.game_scores.find({"game_id": game_id}, {"_id": 0, "name": 1, "score": 1}) \
        .sort("score", -1).to_list(10)
    return {"ok": True, "top": docs, "personal_best": personal_best}


GAME_WS_UPSTREAM = os.environ.get("GAME_WS_UPSTREAM", "ws://localhost:3001/ws")


@router.websocket("/mp/ws")
async def multiplayer_ws_proxy(websocket: WebSocket):
    """Bridges browser clients to the Node.js encrypted multiplayer server."""
    await websocket.accept()
    try:
        async with ws_client.connect(GAME_WS_UPSTREAM, max_size=2 ** 20) as upstream:
            async def client_to_server():
                while True:
                    data = await websocket.receive_text()
                    await upstream.send(data)

            async def server_to_client():
                async for message in upstream:
                    await websocket.send_text(message if isinstance(message, str) else message.decode())

            t1 = asyncio.create_task(client_to_server())
            t2 = asyncio.create_task(server_to_client())
            _, pending = await asyncio.wait({t1, t2}, return_when=asyncio.FIRST_COMPLETED)
            for t in pending:
                t.cancel()
    except Exception:
        pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


@router.get("/stream/health")
async def stream_health():
    node = os.environ.get("STREAM_NODE_URL", "http://localhost:4000")
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            r = await client.get(f"{node}/health")
            data = r.json()
            return {
                "online": True,
                "sessions": data.get("sessions", 0),
                "ws_url": os.environ.get("STREAM_NODE_WS", ""),
            }
    except Exception:
        return {"online": False}


async def _builder_game(slug: str):
    return await db.builder_projects.find_one(
        {"slug": slug, "type": "game", "published": True, "hidden": {"$ne": True}}
    )


def _community_slug(game_id: str):
    if game_id.startswith("builder-"):
        return game_id[8:]
    if game_id.startswith("builder:"):
        return game_id[8:]
    return None


@router.get("/{game_id}")
async def game_meta(game_id: str):
    slug = _community_slug(game_id)
    if slug:
        doc = await _builder_game(slug)
        if not doc:
            raise HTTPException(status_code=404, detail="Game not found")
        return {
            "id": game_id, "title": doc["title"], "genre": "Community",
            "engine": "Built with Luchii Builder", "controls": "", "community": True,
            "slug": doc["slug"], "plays": int(doc.get("plays", 0)),
            "champion": None, "description": "", "thumbnail": None,
        }
    game = next((g for g in GAME_REGISTRY if g["id"] == game_id), None)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.get("/{game_id}/play")
async def play_game(game_id: str):
    slug = _community_slug(game_id)
    if slug:
        doc = await _builder_game(slug)
        if not doc or not doc.get("html"):
            raise HTTPException(status_code=404, detail="Game not found")
        return HTMLResponse(doc["html"])
    game = next((g for g in GAME_REGISTRY if g["id"] == game_id), None)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    html_path = GAMES_DIR / game_id / "index.html"
    if not html_path.exists():
        raise HTTPException(status_code=404, detail="Game build missing")
    return HTMLResponse(html_path.read_text())


WEATHERS = ["clear", "rain", "fog", "stormy", "heat_haze", "clear", "rain"]


@router.get("/assets/{fname}")
async def game_asset(fname: str):
    if "/" in fname or ".." in fname:
        raise HTTPException(status_code=400, detail="Bad filename")
    path = GAMES_DIR / "_assets" / fname
    if not path.exists():
        raise HTTPException(status_code=404, detail="Asset not found")
    return FileResponse(path, headers={"Cache-Control": "public, max-age=86400"})


@router.get("/{game_id}/assets/{fname}")
async def game_bundle_asset(game_id: str, fname: str):
    """Serves hashed JS/CSS chunks for multi-file game builds (e.g. Frasberg Streets pro build)."""
    if "/" in fname or ".." in fname or "/" in game_id or ".." in game_id:
        raise HTTPException(status_code=400, detail="Bad filename")
    path = GAMES_DIR / game_id / "assets" / fname
    if not path.exists():
        raise HTTPException(status_code=404, detail="Asset not found")
    return FileResponse(path, headers={"Cache-Control": "public, max-age=86400"})


@router.get("/{game_id}/environment")
async def game_environment(game_id: str):
    gid = game_id.replace("builder:", "builder-")
    now = datetime.now(timezone.utc)
    hour = now.hour
    label = "dawn" if 5 <= hour < 10 else "day" if 10 <= hour < 17 else "dusk" if 17 <= hour < 21 else "night"
    weather = WEATHERS[(now.timetuple().tm_yday + sum(map(ord, gid))) % len(WEATHERS)]
    image_url = None
    source = None
    bundled = GAMES_DIR / "_assets" / f"backdrop-{gid}.jpg"
    if not image_url and bundled.exists():
        image_url, source = f"/api/games/assets/backdrop-{gid}.jpg", "bundled"
    if not image_url:
        image_url, source = "/api/games/assets/backdrop-spaceshooter.jpg", "default"
    return {"game": gid, "hour": hour, "time_of_day": label, "weather": weather,
            "image_url": image_url, "source": source}
