import logging
import os
import secrets
import time
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

import auth as auth_module
from asset_pipeline import ASSETS_DIR, check_pack_quota, record_pack, _is_pro

logger = logging.getLogger(__name__)
client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]

router = APIRouter(prefix="/studio")

CITIES = {
    "las_vegas": {
        "name": "Las Vegas",
        "zones": ["The Strip", "Fremont Street", "Desert Outskirts", "Downtown", "Summerlin", "East Las Vegas"],
        "flavor": "neon signs, casinos, desert atmosphere",
    },
    "los_angeles": {
        "name": "Los Angeles",
        "zones": ["Downtown LA", "Hollywood", "South Central", "Compton", "Venice Beach", "Boyle Heights", "Watts"],
        "flavor": "urban sprawl, palm trees, smog haze",
    },
}

CREATURE_SEED = [
    {"name": "Dungeon Rat Lord", "tier": 1, "creature_class": "beast",
     "description": "Enormous sewer rat with matted fur and glowing red eyes",
     "behavior_tags": ["pack_hunter", "scavenger"]},
    {"name": "Shadow Wraith", "tier": 2, "creature_class": "undead",
     "description": "Translucent humanoid with hollow eyes, trails darkness",
     "behavior_tags": ["camouflage", "ambush", "fear_inducing"]},
    {"name": "Stone Troll", "tier": 2, "creature_class": "beast",
     "description": "Eight-foot granite-skinned troll with moss growing on its back",
     "behavior_tags": ["aggressive", "territorial", "regenerating"]},
    {"name": "Elder Dragon", "tier": 3, "creature_class": "elemental",
     "description": "Ancient dragon with obsidian scales, wingspan of 60 feet",
     "behavior_tags": ["apex_predator", "intelligent", "fire_breathing"]},
    {"name": "The Void Entity", "tier": 4, "creature_class": "demon",
     "description": "World-ending being of pure darkness, no fixed form",
     "behavior_tags": ["reality_warping", "unkillable", "fear_aura"]},
]


async def seed_creatures():
    for c in CREATURE_SEED:
        await db.studio_creatures.update_one(
            {"name": c["name"]},
            {"$setOnInsert": {**c, "id": str(uuid.uuid4()), "generated_image_url": None,
                              "created_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )


async def _generate(prompt: str) -> tuple[str, int]:
    start = time.time()
    gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
    images = await gen.generate_images(prompt=prompt, model="gpt-image-1", number_of_images=1)
    if not images:
        raise HTTPException(status_code=502, detail="Image generation failed")
    fname = f"{secrets.token_hex(10)}.png"
    (ASSETS_DIR / fname).write_bytes(images[0])
    return f"/api/builder-assets/{fname}", int((time.time() - start) * 1000)


async def _charge(user: dict):
    if not await check_pack_quota(user, _is_pro(user)):
        raise HTTPException(status_code=429,
                            detail="Daily asset pack limit reached (5/day). Upgrade to Luchii Pro for unlimited.")


async def _log(asset_type: str, prompt: str, url: str, ms: int, user: dict):
    await record_pack(user)
    await db.generated_assets.insert_one({
        "id": str(uuid.uuid4()), "asset_type": asset_type, "prompt_used": prompt,
        "image_url": url, "generation_time_ms": ms, "model_used": "gpt-image-1",
        "user_id": user["id"], "created_at": datetime.now(timezone.utc).isoformat(),
    })


TIME_STATES = [
    {"label": "dawn", "range": (5, 10), "ambient_color": "#f59e0b", "sky_brightness": 0.4, "neon_intensity": 0.1, "crowd_modifier": 0.5},
    {"label": "day", "range": (10, 17), "ambient_color": "#ffffff", "sky_brightness": 1.0, "neon_intensity": 0.0, "crowd_modifier": 1.0},
    {"label": "dusk", "range": (17, 21), "ambient_color": "#ef4444", "sky_brightness": 0.5, "neon_intensity": 0.3, "crowd_modifier": 0.8},
    {"label": "night", "range": (21, 29), "ambient_color": "#1e1b4b", "sky_brightness": 0.1, "neon_intensity": 1.0, "crowd_modifier": 1.2},
]

WEATHER_MODIFIERS = {
    "clear": "clear skies, sharp shadows",
    "rain": "heavy rain, wet reflective streets, rain drops on camera lens, puddles",
    "fog": "thick fog, low visibility, eerie atmosphere, mist",
    "heat_haze": "heat distortion rising from asphalt, shimmering air, desert heat",
    "stormy": "dark storm clouds, lightning in background, dramatic sky",
}

CROWD_MODIFIERS = {
    "empty": "completely deserted streets, ghost town",
    "sparse": "few people walking, quiet",
    "normal": "moderate foot traffic, busy streets",
    "packed": "massive crowd, wall-to-wall people, packed sidewalks, festival atmosphere",
}


def get_time_state(hour: int) -> dict:
    h = hour if hour >= 5 else hour + 24
    for s in TIME_STATES:
        if s["range"][0] <= h < s["range"][1]:
            return s
    return TIME_STATES[3]


def build_time_prompt_modifier(hour: int, city_slug: str) -> str:
    state = get_time_state(hour)
    neon = (f"bright neon signs glowing, {state['neon_intensity'] * 100:.0f}% neon intensity"
            if city_slug == "las_vegas" else "city lights")
    return (f"{state['label']} lighting, ambient color {state['ambient_color']}, "
            f"sky brightness {state['sky_brightness']}, {neon}, cinematic atmosphere")


class EnvironmentRequest(BaseModel):
    city_slug: str
    zone: str
    hour: int
    weather: str = "clear"
    crowd_density: str = "normal"


@router.post("/environment/render")
async def render_environment(req: EnvironmentRequest, user: dict = Depends(auth_module.get_current_user)):
    city = CITIES.get(req.city_slug)
    if not city:
        raise HTTPException(status_code=400, detail=f"Unknown city: {req.city_slug}")
    if not 0 <= req.hour <= 23:
        raise HTTPException(status_code=400, detail="Hour must be 0-23")
    await _charge(user)
    time_mod = build_time_prompt_modifier(req.hour, req.city_slug)
    weather_mod = WEATHER_MODIFIERS.get(req.weather, "clear skies")
    crowd_mod = CROWD_MODIFIERS.get(req.crowd_density, "moderate foot traffic")
    prompt = (f"photorealistic {city['name']}, {req.zone}, ultra-detailed, real photography style, "
              f"{city['flavor']}, {time_mod}, {weather_mod}, {crowd_mod}, wide composition, "
              "no text, no watermark")
    url, ms = await _generate(prompt)
    await _log("environment", prompt, url, ms, user)
    state = get_time_state(req.hour)
    return {"city": req.city_slug, "zone": req.zone, "hour": req.hour,
            "time_of_day": state["label"], "weather": req.weather,
            "crowd_density": req.crowd_density, "ambient_color": state["ambient_color"],
            "neon_intensity": state["neon_intensity"], "prompt_used": prompt,
            "image_url": url, "generation_time_ms": ms}


@router.get("/cities")
async def list_cities():
    return {"cities": [{"slug": k, "name": v["name"], "zones": v["zones"]} for k, v in CITIES.items()]}


class CityZoneRequest(BaseModel):
    city_slug: str
    zone: str
    time_of_day: str = "night"
    weather: str = "clear"


@router.post("/cities/generate-zone")
async def generate_city_zone(req: CityZoneRequest, user: dict = Depends(auth_module.get_current_user)):
    city = CITIES.get(req.city_slug)
    if not city:
        raise HTTPException(status_code=400, detail=f"Unknown city: {req.city_slug}")
    await _charge(user)
    prompt = (f"photorealistic {city['name']}, {req.zone}, {req.time_of_day}, {req.weather}, "
              f"ultra-detailed, cinematic lighting, real photography style, {city['flavor']}, "
              "wide composition, no text, no watermark")
    url, ms = await _generate(prompt)
    await _log("city_zone", prompt, url, ms, user)
    return {"city": req.city_slug, "zone": req.zone, "time_of_day": req.time_of_day,
            "weather": req.weather, "prompt_used": prompt, "image_url": url, "generation_time_ms": ms}


class CharacterRequest(BaseModel):
    character_type: str
    gender: str
    ethnicity: str
    build: str
    style: str
    level: int = 1


@router.post("/characters/generate")
async def generate_character(req: CharacterRequest, user: dict = Depends(auth_module.get_current_user)):
    await _charge(user)
    tier = "legendary elite" if req.level > 66 else "seasoned" if req.level > 33 else "rookie"
    prompt = (f"photorealistic {req.character_type}, {req.gender}, {req.ethnicity}, {req.build} build, "
              f"wearing {req.style}, {tier} level-{req.level} appearance, cinematic full-body portrait, "
              "hyper-realistic skin, detailed face, dramatic lighting, real human photography, "
              "plain dark studio background, no text, no watermark")
    url, ms = await _generate(prompt)
    await _log("character", prompt, url, ms, user)
    return {"character_type": req.character_type, "prompt_used": prompt, "image_url": url, "generation_time_ms": ms}


@router.get("/creatures/list")
async def list_creatures():
    docs = await db.studio_creatures.find({}, {"_id": 0}).sort("tier", 1).to_list(100)
    return {"creatures": docs}


class CreatureRequest(BaseModel):
    name: str
    creature_class: str
    tier: int
    description: str
    behavior_tags: List[str] = []
    creature_id: Optional[str] = None


@router.post("/creatures/generate")
async def generate_creature(req: CreatureRequest, user: dict = Depends(auth_module.get_current_user)):
    if not 1 <= req.tier <= 4:
        raise HTTPException(status_code=400, detail="Tier must be 1-4")
    await _charge(user)
    behavior = ", ".join(req.behavior_tags) if req.behavior_tags else "aggressive"
    prompt = (f"photorealistic {req.name}, {req.creature_class}, tier {req.tier} dungeon creature, "
              f"{req.description}, {behavior}, cinematic lighting, hyper-detailed, dark fantasy, "
              "terrifying, real-world texture, movie quality, full body, no text, no watermark")
    url, ms = await _generate(prompt)
    await _log("creature", prompt, url, ms, user)
    if req.creature_id:
        await db.studio_creatures.update_one({"id": req.creature_id}, {"$set": {"generated_image_url": url}})
    return {"name": req.name, "tier": req.tier, "prompt_used": prompt, "image_url": url, "generation_time_ms": ms}
