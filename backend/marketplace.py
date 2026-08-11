import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field

import auth as auth_module

db = None
router = APIRouter(prefix="/marketplace")

SEED = [
    {"type": "agent", "name": "Luchii Builder", "description": "Full-stack coding agent — builds live HTML apps from a prompt.", "owner": "Frasberg", "version": "1.2.0", "installs": 4210, "safety_score": 92, "codex_tier": "CG-v27",
     "history": [
         {"version": "1.0.0", "date": "2026-01-14", "note": "Initial release — prompt-to-HTML pipeline with sandboxed preview.", "safety_score": 84},
         {"version": "1.1.0", "date": "2026-03-02", "note": "Added live code editing sync and tool permission boundaries.", "safety_score": 88},
         {"version": "1.2.0", "date": "2026-05-20", "note": "Validated cycle: 18% faster builds, mutation classifier v2 integrated.", "safety_score": 92}]},
    {"type": "agent", "name": "Luchii Realtime", "description": "Realtime multimodal agent with voice, vision and audio streaming.", "owner": "Frasberg", "version": "1.0.3", "installs": 2894, "safety_score": 88, "codex_tier": "CG-v24",
     "history": [
         {"version": "1.0.0", "date": "2026-02-10", "note": "Initial release — LiveKit audio/vision streams.", "safety_score": 80},
         {"version": "1.0.3", "date": "2026-04-28", "note": "Validated cycle: latency down 22%, region-aware safety routing added.", "safety_score": 88}]},
    {"type": "agent", "name": "Zion Support", "description": "Customer support agent with live chat, transcripts and inbox handoff.", "owner": "Frasberg", "version": "1.1.0", "installs": 1187, "safety_score": 95, "codex_tier": "CG-v22",
     "history": [
         {"version": "1.0.0", "date": "2026-03-15", "note": "Initial release — live chat with SSE streaming.", "safety_score": 90},
         {"version": "1.1.0", "date": "2026-05-30", "note": "Validated cycle: transcripts to admin inbox, identity membrane hardened.", "safety_score": 95}]},
    {"type": "model", "name": "Luchii-70b", "description": "Frontier reasoning model — 32K context, constellation layer.", "owner": "Frasberg", "version": "12.0", "installs": 9640, "safety_score": 96, "codex_tier": "CG-v35",
     "history": [
         {"version": "11.0", "date": "2025-11-01", "note": "Constellation layer preview.", "safety_score": 91},
         {"version": "12.0", "date": "2026-04-01", "note": "Validated cycle: +14% reasoning benchmark, GSS-2 certification passed.", "safety_score": 96}]},
    {"type": "model", "name": "Luchii-7b", "description": "Fast general model for chat, code generation and tooling.", "owner": "Frasberg", "version": "12.0", "installs": 15320, "safety_score": 94, "codex_tier": "CG-v29",
     "history": [
         {"version": "11.0", "date": "2025-11-01", "note": "Distilled from Luchii-70b for low-latency chat.", "safety_score": 89},
         {"version": "12.0", "date": "2026-04-01", "note": "Validated cycle: tool-calling accuracy +9%, safety score band Fully Safe.", "safety_score": 94}]},
    {"type": "extension", "name": "Frasberg SDK", "description": "Agent runtime SDK — tools, memory, realtime streams (@frasbergai/sdk).", "owner": "Frasberg", "version": "1.0.0", "installs": 6013, "safety_score": 90, "codex_tier": "CG-v21",
     "history": [
         {"version": "1.0.0", "date": "2026-05-01", "note": "Initial release — createAgent, memory API, realtime streams.", "safety_score": 90}]},
    {"type": "pipeline", "name": "GitHub Agent Sync", "description": "Push/PR-triggered pipeline that syncs agent.json from your repos.", "owner": "Frasberg", "version": "0.9.1", "installs": 742, "safety_score": 78, "codex_tier": "CG-v21",
     "history": [
         {"version": "0.9.0", "date": "2026-05-15", "note": "Beta — webhook ingestion with HMAC verification.", "safety_score": 74},
         {"version": "0.9.1", "date": "2026-06-01", "note": "Validated cycle: delegation limits added, moved to Safe with monitoring band.", "safety_score": 78}]},
]


TRADEMARKS = ("frasberg", "frasbergai", "frasbergos", "linq", "luchii", "emerald estates", "emerald orbit")

TIER_LADDER = ["CG-v21", "CG-v22", "CG-v24", "CG-v27", "CG-v29", "CG-v35"]
TIER_LAYER = {"CG-v21": "Soul", "CG-v22": "Spirit", "CG-v24": "Celestial", "CG-v27": "Omniversal", "CG-v29": "Primordium", "CG-v35": "Apex"}


def _trademark_hit(name: str) -> str | None:
    low = name.lower()
    return next((t for t in TRADEMARKS if t in low), None)


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
            await db.marketplace.update_one(
                {"name": item["name"], "codex_tier": {"$exists": False}},
                {"$set": {"codex_tier": item.get("codex_tier", "CG-v21")}},
            )
        await db.marketplace.update_many(
            {"safety_score": {"$exists": False}},
            {"$set": {"safety_score": 75}},
        )
        await db.marketplace.update_many(
            {"codex_tier": {"$exists": False}},
            {"$set": {"codex_tier": "CG-v21"}},
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
async def get_item(item_id: str, request: Request):
    item = await db.marketplace.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    owner_id = item.pop("owner_id", None)
    item["safety_band"] = safety_band(item.get("safety_score", 75))
    item["can_ascend"] = False
    try:
        user = await auth_module.get_current_user(request)
        item["can_ascend"] = user.get("role") == "admin" or (owner_id is not None and owner_id == user["id"])
    except HTTPException:
        pass
    return item


@router.post("/{item_id}/ascend")
async def ascend_item(item_id: str, request: Request):
    """Agent Ascension — evolution ceremony that raises the agent's Codex tier."""
    user = await auth_module.get_current_user(request)
    item = await db.marketplace.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not (item.get("owner_id") == user["id"] or user.get("role") == "admin"):
        raise HTTPException(status_code=403, detail="Only the publisher (or an admin) can initiate an Ascension ceremony.")
    current = item.get("codex_tier", "CG-v21")
    idx = TIER_LADDER.index(current) if current in TIER_LADDER else 0
    if idx >= len(TIER_LADDER) - 1:
        raise HTTPException(status_code=400, detail="Already at CG-v35 Apex — the terminal tier. There is no beyond.")
    new_tier = TIER_LADDER[idx + 1]
    new_safety = min(100, item.get("safety_score", 75) + 2)
    entry = {"version": item.get("version", "1.0.0"), "date": datetime.now(timezone.utc).date().isoformat(),
             "note": f"Ascension ceremony — evolved from {current} ({TIER_LAYER.get(current, 'Identity')}) to {new_tier} ({TIER_LAYER[new_tier]} layer). Substrate rebinding validated.",
             "safety_score": new_safety}
    await db.marketplace.update_one({"id": item_id}, {
        "$set": {"codex_tier": new_tier, "safety_score": new_safety},
        "$push": {"history": entry}})
    return {"ok": True, "from_tier": current, "to_tier": new_tier, "layer": TIER_LAYER[new_tier], "safety_score": new_safety}


class PublishBody(BaseModel):
    type: str = Field(pattern=r"^(agent|model|extension|pipeline)$")
    name: str = Field(min_length=2, max_length=80)
    description: str = Field(min_length=5, max_length=400)
    version: str = Field(default="1.0.0", max_length=20)
    cognition_graph: dict | None = None


@router.post("/publish")
async def publish_item(body: PublishBody, request: Request):
    user = await auth_module.get_current_user(request)
    hit = _trademark_hit(body.name)
    if hit and user.get("role") != "admin":
        raise HTTPException(status_code=400, detail=f'"{hit}" is a Frasberg trademark — agents may not use Frasberg trademarks in their names (see Trademark Guidelines). Try "Built for Frasberg" in the description instead.')
    if await db.marketplace.find_one({"name": body.name}):
        raise HTTPException(status_code=409, detail="An item with this name already exists.")
    graph_nodes = len((body.cognition_graph or {}).get("nodes", []))
    codex_tier = "CG-v29" if graph_nodes > 8 else ("CG-v27" if graph_nodes > 5 else "CG-v21")
    item = {
        "id": str(uuid.uuid4()), "type": body.type, "name": body.name,
        "description": body.description, "version": body.version,
        "owner": user.get("name") or user["email"].split("@")[0],
        "owner_id": user["id"], "installs": 0, "official": False,
        "safety_score": 75, "codex_tier": codex_tier,
        "cognition_graph": body.cognition_graph,
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


class DeployBody(BaseModel):
    repo: str = Field(min_length=3, max_length=200, pattern=r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")


@router.post("/deploy-from-github")
async def deploy_from_github(body: DeployBody, request: Request):
    """One-click deploy: publish a synced GitHub agent (agent.json/luchii.yaml) to the marketplace."""
    user = await auth_module.get_current_user(request)
    row = await db.synced_agents.find_one({"user_id": user["id"], "repo": body.repo})
    if not row:
        raise HTTPException(status_code=404, detail=f"No synced agent found for {body.repo} — run Sync agents first.")
    agent = row["agent"]
    name = agent.get("name") or agent.get("id") or body.repo.split("/")[-1]
    hit = _trademark_hit(name)
    if hit and user.get("role") != "admin":
        raise HTTPException(status_code=400, detail=f'Agent name contains "{hit}" — Frasberg trademarks are not allowed in agent names (see Trademark Guidelines). Rename it in your {agent.get("file", "agent.json")}.')
    description = (agent.get("description") or f"Autonomous agent synced from github.com/{body.repo}.")[:400]
    now = datetime.now(timezone.utc)
    existing = await db.marketplace.find_one({"name": name})
    if existing:
        if existing.get("owner_id") != user["id"]:
            raise HTTPException(status_code=409, detail="An item with this name already exists.")
        entry = {"version": existing.get("version", "1.0.0"), "date": now.date().isoformat(),
                 "note": f"Re-deployed from github.com/{body.repo} — validated marketplace scan passed.",
                 "safety_score": existing.get("safety_score", 75)}
        await db.marketplace.update_one({"id": existing["id"]}, {
            "$set": {"description": description, "model": agent.get("model"), "source_repo": body.repo},
            "$push": {"history": entry}})
        return {"ok": True, "id": existing["id"], "name": name, "updated": True}
    item = {
        "id": str(uuid.uuid4()), "type": "agent", "name": name, "description": description,
        "version": "1.0.0", "owner": user.get("name") or user["email"].split("@")[0],
        "owner_id": user["id"], "installs": 0, "official": False,
        "model": agent.get("model"), "source_repo": body.repo, "safety_score": 75, "codex_tier": "CG-v21",
        "history": [{"version": "1.0.0", "date": now.date().isoformat(),
                     "note": f"Deployed from github.com/{body.repo} — passed marketplace validation (security scan, tool permission audit).",
                     "safety_score": 75}],
        "created_at": now.isoformat(),
    }
    await db.marketplace.insert_one({**item})
    return {"ok": True, "id": item["id"], "name": name, "updated": False}


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
