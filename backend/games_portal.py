import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

router = APIRouter(prefix="/games")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

GAMES_DIR = Path(__file__).parent.parent / "games"

GAME_REGISTRY = [
    {
        "id": "dungeon3d",
        "title": "Luchii Dungeon",
        "genre": "FPS",
        "description": "Descend into the sovereign dungeon. Waves of drones, torchlight, and one way out — through them.",
        "thumbnail": "/games-thumbs/dungeon3d.jpg",
        "controls": "WASD move · Mouse aim · Click shoot · R reload · Space jump",
        "engine": "Frasberg Engine · Three.js",
    },
    {
        "id": "racer3d",
        "title": "Frasberg Racer",
        "genre": "Racing",
        "description": "Neon highway at 300 km/h. Weave through traffic on the mesh grid — one touch and it's over.",
        "thumbnail": "/games-thumbs/racer3d.jpg",
        "controls": "A/D or ←/→ steer · W/↑ boost",
        "engine": "Frasberg Engine · Three.js",
    },
    {
        "id": "spaceshooter",
        "title": "Constellation Wars",
        "genre": "Shooter",
        "description": "Defend the Constellation Layer. Endless enemy formations descend from the void.",
        "thumbnail": "/games-thumbs/spaceshooter.jpg",
        "controls": "←/→ or A/D move · Space fire",
        "engine": "Frasberg Engine · Three.js",
    },
    {
        "id": "maze3d",
        "title": "Meta Maze",
        "genre": "Puzzle",
        "description": "A procedurally generated labyrinth. Find the beacon before the clock runs out.",
        "thumbnail": "/games-thumbs/maze3d.jpg",
        "controls": "WASD move · Mouse look",
        "engine": "Frasberg Engine · Three.js",
    },
]


@router.get("")
async def list_games():
    out = []
    for g in GAME_REGISTRY:
        top = await db.game_scores.find_one(
            {"game_id": g["id"]}, {"_id": 0, "name": 1, "score": 1}, sort=[("score", -1)]
        )
        out.append({**g, "champion": top})
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
    return out


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
async def post_score(game_id: str, body: ScoreIn):
    _valid_game(game_id)
    name = body.name.strip()[:20] or "PLAYER"
    await db.game_scores.insert_one({
        "id": str(uuid.uuid4()), "game_id": game_id, "name": name,
        "score": body.score, "week": _week_key(),
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    docs = await db.game_scores.find({"game_id": game_id}, {"_id": 0, "name": 1, "score": 1}) \
        .sort("score", -1).to_list(10)
    return {"ok": True, "top": docs}


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


@router.get("/{game_id}/environment")
async def game_environment(game_id: str):
    gid = game_id.replace("builder:", "builder-")
    now = datetime.now(timezone.utc)
    hour = now.hour
    label = "dawn" if 5 <= hour < 10 else "day" if 10 <= hour < 17 else "dusk" if 17 <= hour < 21 else "night"
    weather = WEATHERS[(now.timetuple().tm_yday + sum(map(ord, gid))) % len(WEATHERS)]
    image_url = None
    source = None
    if gid == "racer3d":
        doc = await db.generated_assets.find_one(
            {"asset_type": {"$in": ["environment", "city_zone"]}}, sort=[("created_at", -1)])
        if doc:
            image_url, source = doc["image_url"], "studio"
    bundled = GAMES_DIR / "_assets" / f"backdrop-{gid}.jpg"
    if not image_url and bundled.exists():
        image_url, source = f"/api/games/assets/backdrop-{gid}.jpg", "bundled"
    if not image_url:
        image_url, source = "/api/games/assets/backdrop-spaceshooter.jpg", "default"
    return {"game": gid, "hour": hour, "time_of_day": label, "weather": weather,
            "image_url": image_url, "source": source}
