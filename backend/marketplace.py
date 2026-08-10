import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field

import auth as auth_module

db = None
router = APIRouter(prefix="/marketplace")

SEED = [
    {"type": "agent", "name": "Luchii Builder", "description": "Full-stack coding agent — builds live HTML apps from a prompt.", "owner": "Frasberg", "version": "1.2.0", "installs": 4210},
    {"type": "agent", "name": "Luchii Realtime", "description": "Realtime multimodal agent with voice, vision and audio streaming.", "owner": "Frasberg", "version": "1.0.3", "installs": 2894},
    {"type": "agent", "name": "Zion Support", "description": "Customer support agent with live chat, transcripts and inbox handoff.", "owner": "Frasberg", "version": "1.1.0", "installs": 1187},
    {"type": "model", "name": "Luchii-70b", "description": "Frontier reasoning model — 32K context, constellation layer.", "owner": "Frasberg", "version": "12.0", "installs": 9640},
    {"type": "model", "name": "Luchii-7b", "description": "Fast general model for chat, code generation and tooling.", "owner": "Frasberg", "version": "12.0", "installs": 15320},
    {"type": "extension", "name": "Frasberg SDK", "description": "Agent runtime SDK — tools, memory, realtime streams (@frasbergai/sdk).", "owner": "Frasberg", "version": "1.0.0", "installs": 6013},
    {"type": "pipeline", "name": "GitHub Agent Sync", "description": "Push/PR-triggered pipeline that syncs agent.json from your repos.", "owner": "Frasberg", "version": "0.9.1", "installs": 742},
]


def setup(database):
    global db
    db = database


async def _seed():
    if await db.marketplace.count_documents({}) == 0:
        now = datetime.now(timezone.utc).isoformat()
        await db.marketplace.insert_many([
            {"id": str(uuid.uuid4()), **item, "created_at": now, "official": True} for item in SEED
        ])


@router.get("")
async def list_items(type: str | None = None):
    await _seed()
    q = {"type": type} if type in ("agent", "model", "extension", "pipeline") else {}
    items = await db.marketplace.find(q, {"_id": 0}).sort("installs", -1).to_list(200)
    return {"items": items}


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
