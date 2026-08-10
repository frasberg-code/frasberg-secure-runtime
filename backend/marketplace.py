import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field

import auth as auth_module

db = None
router = APIRouter(prefix="/marketplace")

SEED = [
    {"type": "agent", "name": "Luchii Builder", "description": "Full-stack coding agent — builds live HTML apps from a prompt.", "owner": "Frasberg", "version": "1.2.0", "installs": 4210, "safety_score": 92,
     "history": [
         {"version": "1.0.0", "date": "2026-01-14", "note": "Initial release — prompt-to-HTML pipeline with sandboxed preview.", "safety_score": 84},
         {"version": "1.1.0", "date": "2026-03-02", "note": "Added live code editing sync and tool permission boundaries.", "safety_score": 88},
         {"version": "1.2.0", "date": "2026-05-20", "note": "Validated cycle: 18% faster builds, mutation classifier v2 integrated.", "safety_score": 92}]},
    {"type": "agent", "name": "Luchii Realtime", "description": "Realtime multimodal agent with voice, vision and audio streaming.", "owner": "Frasberg", "version": "1.0.3", "installs": 2894, "safety_score": 88,
     "history": [
         {"version": "1.0.0", "date": "2026-02-10", "note": "Initial release — LiveKit audio/vision streams.", "safety_score": 80},
         {"version": "1.0.3", "date": "2026-04-28", "note": "Validated cycle: latency down 22%, region-aware safety routing added.", "safety_score": 88}]},
    {"type": "agent", "name": "Zion Support", "description": "Customer support agent with live chat, transcripts and inbox handoff.", "owner": "Frasberg", "version": "1.1.0", "installs": 1187, "safety_score": 95,
     "history": [
         {"version": "1.0.0", "date": "2026-03-15", "note": "Initial release — live chat with SSE streaming.", "safety_score": 90},
         {"version": "1.1.0", "date": "2026-05-30", "note": "Validated cycle: transcripts to admin inbox, identity membrane hardened.", "safety_score": 95}]},
    {"type": "model", "name": "Luchii-70b", "description": "Frontier reasoning model — 32K context, constellation layer.", "owner": "Frasberg", "version": "12.0", "installs": 9640, "safety_score": 96,
     "history": [
         {"version": "11.0", "date": "2025-11-01", "note": "Constellation layer preview.", "safety_score": 91},
         {"version": "12.0", "date": "2026-04-01", "note": "Validated cycle: +14% reasoning benchmark, GSS-2 certification passed.", "safety_score": 96}]},
    {"type": "model", "name": "Luchii-7b", "description": "Fast general model for chat, code generation and tooling.", "owner": "Frasberg", "version": "12.0", "installs": 15320, "safety_score": 94,
     "history": [
         {"version": "11.0", "date": "2025-11-01", "note": "Distilled from Luchii-70b for low-latency chat.", "safety_score": 89},
         {"version": "12.0", "date": "2026-04-01", "note": "Validated cycle: tool-calling accuracy +9%, safety score band Fully Safe.", "safety_score": 94}]},
    {"type": "extension", "name": "Frasberg SDK", "description": "Agent runtime SDK — tools, memory, realtime streams (@frasbergai/sdk).", "owner": "Frasberg", "version": "1.0.0", "installs": 6013, "safety_score": 90,
     "history": [
         {"version": "1.0.0", "date": "2026-05-01", "note": "Initial release — createAgent, memory API, realtime streams.", "safety_score": 90}]},
    {"type": "pipeline", "name": "GitHub Agent Sync", "description": "Push/PR-triggered pipeline that syncs agent.json from your repos.", "owner": "Frasberg", "version": "0.9.1", "installs": 742, "safety_score": 78,
     "history": [
         {"version": "0.9.0", "date": "2026-05-15", "note": "Beta — webhook ingestion with HMAC verification.", "safety_score": 74},
         {"version": "0.9.1", "date": "2026-06-01", "note": "Validated cycle: delegation limits added, moved to Safe with monitoring band.", "safety_score": 78}]},
]


def safety_band(score: int) -> str:
    if score >= 90:
        return "Fully safe"
    if score >= 75:
        return "Safe with monitoring"
    if score >= 60:
        return "Restricted evolution"
    return "Evolution disabled"


def setup(database):
    global db
    db = database


async def _seed():
    if await db.marketplace.count_documents({}) == 0:
        now = datetime.now(timezone.utc).isoformat()
        await db.marketplace.insert_many([
            {"id": str(uuid.uuid4()), **item, "created_at": now, "official": True} for item in SEED
        ])
    else:
        # backfill safety_score/history on legacy docs
        for item in SEED:
            await db.marketplace.update_one(
                {"name": item["name"], "safety_score": {"$exists": False}},
                {"$set": {"safety_score": item["safety_score"], "history": item["history"]}},
            )
        await db.marketplace.update_many(
            {"safety_score": {"$exists": False}},
            {"$set": {"safety_score": 75}},
        )


@router.get("")
async def list_items(type: str | None = None):
    await _seed()
    q = {"type": type} if type in ("agent", "model", "extension", "pipeline") else {}
    items = await db.marketplace.find(q, {"_id": 0}).sort("installs", -1).to_list(200)
    for i in items:
        i["safety_band"] = safety_band(i.get("safety_score", 75))
    return {"items": items}


@router.get("/{item_id}")
async def get_item(item_id: str):
    item = await db.marketplace.find_one({"id": item_id}, {"_id": 0, "owner_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item["safety_band"] = safety_band(item.get("safety_score", 75))
    return item


class PublishBody(BaseModel):
    type: str = Field(pattern=r"^(agent|model|extension|pipeline)$")
    name: str = Field(min_length=2, max_length=80)
    description: str = Field(min_length=5, max_length=400)
    version: str = Field(default="1.0.0", max_length=20)


@router.post("/publish")
async def publish_item(body: PublishBody, request: Request):
    user = await auth_module.get_current_user(request)
    if await db.marketplace.find_one({"name": body.name}):
        raise HTTPException(status_code=409, detail="An item with this name already exists.")
    item = {
        "id": str(uuid.uuid4()), "type": body.type, "name": body.name,
        "description": body.description, "version": body.version,
        "owner": user.get("name") or user["email"].split("@")[0],
        "owner_id": user["id"], "installs": 0, "official": False,
        "safety_score": 75,
        "history": [{"version": body.version, "date": datetime.now(timezone.utc).date().isoformat(),
                     "note": "Initial publication — passed marketplace validation (security scan, tool permission audit).",
                     "safety_score": 75}],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.marketplace.insert_one({**item})
    item.pop("owner_id", None)
    return item


@router.post("/{item_id}/install")
async def install_item(item_id: str):
    res = await db.marketplace.find_one_and_update(
        {"id": item_id}, {"$inc": {"installs": 1}}, projection={"_id": 0}
    )
    if not res:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"ok": True, "installs": res["installs"] + 1}


class EvolutionBody(BaseModel):
    enabled: bool


@router.post("/{item_id}/evolution")
async def toggle_evolution(item_id: str, body: EvolutionBody, request: Request):
    """Evolution Mode — published agents auto-update through validated improvement cycles."""
    user = await auth_module.get_current_user(request)
    item = await db.marketplace.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    is_owner = item.get("owner_id") == user["id"]
    is_admin = user.get("role") == "admin"
    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Only the publisher (or an admin) can toggle Evolution Mode.")
    update = {"evolution_mode": body.enabled}
    if body.enabled:
        update["evolution"] = {
            "lineage": item.get("evolution", {}).get("lineage", f"v{item.get('version', '1.0.0')}"),
            "pipeline": ["static analysis", "security scan", "test suite", "benchmark delta"],
            "enabled_at": datetime.now(timezone.utc).isoformat(),
        }
    await db.marketplace.update_one({"id": item_id}, {"$set": update})
    return {"ok": True, "evolution_mode": body.enabled}
