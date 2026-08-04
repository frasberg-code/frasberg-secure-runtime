import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
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


@router.get("/{game_id}")
async def game_meta(game_id: str):
    game = next((g for g in GAME_REGISTRY if g["id"] == game_id), None)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.get("/{game_id}/play")
async def play_game(game_id: str):
    game = next((g for g in GAME_REGISTRY if g["id"] == game_id), None)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    html_path = GAMES_DIR / game_id / "index.html"
    if not html_path.exists():
        raise HTTPException(status_code=404, detail="Game build missing")
    return HTMLResponse(html_path.read_text())
