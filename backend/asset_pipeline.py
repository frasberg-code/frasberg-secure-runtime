import asyncio
import hashlib
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

logger = logging.getLogger(__name__)

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]

router = APIRouter()

ASSETS_DIR = Path(__file__).parent / "builder_assets"
ASSETS_DIR.mkdir(exist_ok=True)

FREE_PACKS_DAILY = 5

CITIES = {
    "las vegas": "the Las Vegas strip at night, neon signs, high-contrast nightlife glow",
    "los angeles": "Los Angeles at warm golden hour, palm trees, urban sprawl haze",
    "new york": "New York City streets, steel and glass towers, gritty cinematic realism",
    "tokyo": "Tokyo at night, dense neon-lit streets, rain-slick reflections",
    "miami": "Miami ocean drive at dusk, pastel art-deco neon, palm silhouettes",
    "chicago": "Chicago downtown, elevated train tracks, moody overcast steel tones",
    "paris": "Paris boulevards at blue hour, haussmann facades, warm street lamps",
    "london": "London streets in fog, brick and iron, cold cinematic grade",
    "dubai": "Dubai skyline at night, futuristic glass towers, gold and teal glow",
    "san francisco": "San Francisco hills, fog rolling over the bay, cable car street",
}

CREATURES = [
    "dragon", "orc", "skeleton", "zombie", "demon", "wolf", "spider", "wyvern",
    "golem", "wraith", "lich", "titan", "alien", "ghost", "goblin", "troll",
    "vampire", "hellspawn", "minotaur", "kraken",
]

CHAR_WORDS = [
    "street fighter", "fighter", "detective", "soldier", "warrior", "knight",
    "ninja", "assassin", "racer", "pilot", "athlete", "hero", "mercenary",
    "cyborg", "samurai", "bounty hunter", "gang member", "cop", "hacker",
]


def extract_asset_plan(prompt: str):
    p = prompt.lower()
    plan = []
    for city, grade in CITIES.items():
        if city in p:
            plan.append({
                "kind": "environment", "key": city,
                "image_prompt": f"Photorealistic cinematic game backdrop of {grade}, wide composition, "
                                "no people in foreground, suitable as a 2D game parallax background layer, "
                                "no text, no watermark, no UI",
            })
            break
    for w in CHAR_WORDS:
        if w in p:
            plan.append({
                "kind": "character", "key": w,
                "image_prompt": f"Photorealistic full-body video game character: a {w}, cinematic dramatic "
                                "lighting, standing action-ready pose facing right, centered on a plain solid "
                                "black background for sprite compositing, no text, no watermark",
            })
            break
    for c in CREATURES:
        if re.search(rf"\b{c}s?\b", p):
            plan.append({
                "kind": "creature", "key": c,
                "image_prompt": f"Photorealistic dark-fantasy game creature: a menacing {c}, full body, glowing "
                                "eyes, dramatic rim lighting, centered on a plain solid black background for "
                                "sprite compositing, no text, no watermark",
            })
            break
    return plan[:3]


async def check_pack_quota(user: dict, is_pro: bool) -> bool:
    if is_pro:
        return True
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    used = await db.builder_asset_packs.count_documents({"user_id": user["id"], "day": day})
    return used < FREE_PACKS_DAILY


async def record_pack(user: dict):
    await db.builder_asset_packs.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"],
        "day": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "ts": datetime.now(timezone.utc).isoformat(),
    })


async def _gen_one(item: dict):
    h = hashlib.sha1(f"{item['kind']}:{item['key']}".encode()).hexdigest()[:20]
    fname = f"{h}.png"
    cached = await db.builder_assets.find_one({"hash": h})
    if cached and (ASSETS_DIR / fname).exists():
        return {"kind": item["kind"], "key": item["key"], "url": f"/api/builder-assets/{fname}"}
    gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
    images = await gen.generate_images(prompt=item["image_prompt"], model="gpt-image-1", number_of_images=1)
    if not images:
        raise RuntimeError("no image returned")
    (ASSETS_DIR / fname).write_bytes(images[0])
    await db.builder_assets.update_one(
        {"hash": h},
        {"$set": {"hash": h, "kind": item["kind"], "key": item["key"], "file": fname,
                  "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"kind": item["kind"], "key": item["key"], "url": f"/api/builder-assets/{fname}"}


async def generate_assets(plan: list):
    results = await asyncio.gather(*[_gen_one(i) for i in plan], return_exceptions=True)
    assets = []
    for r in results:
        if isinstance(r, Exception):
            logger.warning("asset generation failed: %s", r)
        else:
            assets.append(r)
    return assets


def asset_injection(assets: list) -> str:
    if not assets:
        return ""
    lines = "\n".join(f"- {a['kind'].upper()} ({a['key']}): {a['url']}" for a in assets)
    return (
        "\n\nPRELOADED PHOTOREALISTIC VISUAL ASSETS — generated specifically for this game. "
        "You MUST load and use these exact same-origin image URLs (loading them is allowed and required, "
        "they are not external requests):\n" + lines + "\n"
        "Usage rules: load each with new Image() before starting the game loop and show a brief loading state. "
        "ENVIRONMENT image: draw as the full-screen background layer (cover-fit, subtle parallax scroll). "
        "CHARACTER image: use as the player sprite (drawImage preserving aspect ratio, ~90-150px tall; flip "
        "horizontally when moving left). CREATURE image: use as the enemy/boss sprite (scale bosses larger). "
        "Composite sprites directly — their dark backgrounds blend into dark scenes; prefer dark/nocturnal "
        "scene palettes so the sprites integrate cinematically. Do NOT draw placeholder rectangles for these "
        "entities."
    )


@router.get("/builder-assets/{fname}")
async def serve_asset(fname: str):
    if not re.fullmatch(r"[a-f0-9]{20}\.png", fname):
        raise HTTPException(status_code=404, detail="Not found")
    path = ASSETS_DIR / fname
    if not path.exists():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(path, media_type="image/png", headers={"Cache-Control": "public, max-age=31536000"})
