import asyncio
import hashlib
import logging
import os
import re
import secrets
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

import auth as auth_module

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


def _item(kind: str, key: str):
    key = key.lower().strip()
    if kind == "environment" and key in CITIES:
        return {
            "kind": "environment", "key": key,
            "image_prompt": f"Photorealistic cinematic game backdrop of {CITIES[key]}, wide composition, "
                            "no people in foreground, suitable as a 2D game parallax background layer, "
                            "no text, no watermark, no UI",
        }
    if kind == "character" and key in CHAR_WORDS:
        return {
            "kind": "character", "key": key,
            "image_prompt": f"Photorealistic full-body video game character: a {key}, cinematic dramatic "
                            "lighting, standing action-ready pose facing right, centered on a plain solid "
                            "black background for sprite compositing, no text, no watermark",
        }
    if kind == "character_damaged" and key in CHAR_WORDS:
        return {
            "kind": "character_damaged", "key": key,
            "image_prompt": f"Photorealistic full-body video game character: a {key} in a battle-damaged "
                            "state — torn clothing, visible wounds, bruises, dirt and scratches, exhausted "
                            "but defiant stance, same outfit as their pristine version, cinematic dramatic "
                            "lighting, standing pose facing right, centered on a plain solid black background "
                            "for sprite compositing, no text, no watermark",
        }
    if kind == "creature" and key in CREATURES:
        return {
            "kind": "creature", "key": key,
            "image_prompt": f"Photorealistic dark-fantasy game creature: a menacing {key}, full body, glowing "
                            "eyes, dramatic rim lighting, centered on a plain solid black background for "
                            "sprite compositing, no text, no watermark",
        }
    if kind == "arena":
        return {
            "kind": "arena", "key": key,
            "image_prompt": f"Photorealistic epic boss arena game backdrop: the dramatic lair of a {key}, "
                            "ominous red-orange rim lighting, embers and smoke in the air, scorched ground, "
                            "towering scale, wide composition suitable as a 2D game background layer, "
                            "no creatures in frame, no text, no watermark, no UI",
        }
    return None


def extract_asset_plan(prompt: str):
    p = prompt.lower()
    plan = []
    creature_key = None
    for city in CITIES:
        if city in p:
            plan.append(_item("environment", city))
            break
    for w in CHAR_WORDS:
        if w in p:
            plan.append(_item("character", w))
            plan.append(_item("character_damaged", w))
            break
    for c in CREATURES:
        if re.search(rf"\b{c}s?\b", p):
            creature_key = c
            plan.append(_item("creature", c))
            break
    if re.search(r"\bboss\b", p):
        plan.append(_item("arena", creature_key or "colossal final boss"))
    return [i for i in plan if i][:5]


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


async def _gen_one(item: dict, fresh: bool = False):
    h = hashlib.sha1(f"{item['kind']}:{item['key']}".encode()).hexdigest()[:20]
    cached = await db.builder_assets.find_one({"hash": h})
    if not fresh and cached and (ASSETS_DIR / cached.get("file", "")).exists():
        return {"kind": item["kind"], "key": item["key"], "url": f"/api/builder-assets/{cached['file']}"}
    fname = f"{h}-{secrets.token_hex(3)}.png" if fresh else f"{h}.png"
    prompt = item["image_prompt"]
    if fresh:
        prompt += f" Fresh alternative take (seed {secrets.token_hex(2)}): distinctly different composition, angle and details."
    gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
    images = await gen.generate_images(prompt=prompt, model="gpt-image-1", number_of_images=1)
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


_USAGE = {
    "environment": "draw as the full-screen background layer (cover-fit, subtle parallax scroll)",
    "character": "use as the player sprite (drawImage preserving aspect ratio, ~90-150px tall; flip horizontally when moving left)",
    "character_damaged": "DYNAMIC DAMAGE STATE — swap the player sprite to this battle-damaged version whenever player health drops below 40%, and swap back when healed above 40%",
    "creature": "use as the enemy/boss sprite (scale bosses larger)",
    "arena": "BOSS ARENA — when the boss encounter begins, transition the background to this arena image with a dramatic red/orange lighting shift; restore the normal environment after the boss is defeated",
}


def asset_injection(assets: list) -> str:
    if not assets:
        return ""
    lines = "\n".join(
        f"- {a['kind'].upper()} ({a['key']}): {a['url']} → {_USAGE.get(a['kind'], 'use appropriately')}"
        for a in assets
    )
    return (
        "\n\nPRELOADED PHOTOREALISTIC VISUAL ASSETS — generated specifically for this game. "
        "You MUST load and use these exact same-origin image URLs (loading them is allowed and required, "
        "they are not external requests):\n" + lines + "\n"
        "General rules: load each with new Image() before starting the game loop and show a brief loading state. "
        "Composite sprites directly — their dark backgrounds blend into dark scenes; prefer dark/nocturnal "
        "scene palettes so the sprites integrate cinematically. Do NOT draw placeholder rectangles for these "
        "entities."
    )


@router.get("/builder-assets/{fname}")
async def serve_asset(fname: str):
    if not re.fullmatch(r"[a-f0-9]{20}(-[a-f0-9]{6})?\.png", fname):
        raise HTTPException(status_code=404, detail="Not found")
    path = ASSETS_DIR / fname
    if not path.exists():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(path, media_type="image/png", headers={"Cache-Control": "public, max-age=31536000"})


class RegenReq(BaseModel):
    kind: str
    key: str
    old_url: str = ""
    project_id: str = ""


def _is_pro(user: dict) -> bool:
    return user.get("plan") in ("pro", "premium", "builder", "trial") or user.get("role") == "admin"


@router.post("/builder/assets/regenerate")
async def regenerate_asset(body: RegenReq, user: dict = Depends(auth_module.get_current_user)):
    item = _item(body.kind, body.key)
    if not item:
        raise HTTPException(status_code=400, detail="Unknown asset")
    if not await check_pack_quota(user, _is_pro(user)):
        raise HTTPException(status_code=429,
                            detail=f"Daily asset pack limit reached ({FREE_PACKS_DAILY}/day). Upgrade to Luchii Pro for unlimited asset packs.")
    try:
        asset = await _gen_one(item, fresh=True)
    except Exception:
        logger.exception("asset regeneration failed")
        raise HTTPException(status_code=502, detail="Asset regeneration failed — please try again")
    await record_pack(user)
    swapped = False
    if body.project_id and body.old_url.startswith("/api/builder-assets/"):
        doc = await db.builder_projects.find_one({"id": body.project_id, "user_id": user["id"]})
        if doc and doc.get("html") and body.old_url in doc["html"]:
            await db.builder_projects.update_one(
                {"id": doc["id"]},
                {"$set": {"html": doc["html"].replace(body.old_url, asset["url"]),
                          "updated_at": datetime.now(timezone.utc).isoformat()}},
            )
            swapped = True
    return {**asset, "swapped_in_project": swapped}
