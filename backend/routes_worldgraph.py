import os
import hmac
import time
import uuid
import hashlib
import logging
from typing import Optional, List, Dict, Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field

from core import db
from routes_engines import engine_ctx

logger = logging.getLogger(__name__)
router = APIRouter()

# ============ FRASBERG SECURE RUNTIME — live wiring of frasberg-secure-runtime contracts ============
# Mirrors: packages/full-game-stack-schema (WorldDefinition), platform/api/envelope.ts (apiEnvelope),
# apps/gateway-server middleware (identity/continuity/diagnostics/policy/governance-guard).

SCHEMA_VERSION = "1.0.0"
GOVERNANCE_ADMIN_KEY = os.environ.get("GOVERNANCE_ADMIN_KEY", "")


def _now_ms() -> int:
    return int(time.time() * 1000)


# ---- full-game-stack-schema: WorldDefinition ----
class SchemaMetadata(BaseModel):
    model_config = ConfigDict(extra="allow")
    schemaVersion: str = SCHEMA_VERSION
    createdWith: Optional[str] = None
    tags: List[str] = []


class TrackDefinition(BaseModel):
    id: str
    name: str
    lengthMeters: float
    surface: Literal["asphalt", "dirt", "mixed"]
    sectors: int


class VehicleClassDefinition(BaseModel):
    id: str
    name: str
    horsepower: float
    drivetrain: Literal["fwd", "rwd", "awd"]
    tags: List[str] = []


class RaceRuleset(BaseModel):
    id: str
    name: str
    lapCount: int
    rollingStart: bool = False
    allowedVehicleClassIds: List[str] = []


class WorldDefinition(BaseModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    kind: Literal["game", "app", "site"]
    metadata: SchemaMetadata
    scenes: List[Dict[str, Any]] = []
    pages: List[Dict[str, Any]] = []
    screens: List[Dict[str, Any]] = []
    flows: List[Dict[str, Any]] = []
    routes: List[Dict[str, Any]] = []
    track: Optional[TrackDefinition] = None
    vehicleClasses: List[VehicleClassDefinition] = []
    raceRuleset: Optional[RaceRuleset] = None
    nodes: List[Dict[str, Any]] = []
    status: Optional[Literal["draft", "active", "archived"]] = None


class WorldPatch(BaseModel):
    name: Optional[str] = None
    kind: Optional[Literal["game", "app", "site"]] = None
    metadata: Optional[SchemaMetadata] = None
    scenes: Optional[List[Dict[str, Any]]] = None
    pages: Optional[List[Dict[str, Any]]] = None
    screens: Optional[List[Dict[str, Any]]] = None
    flows: Optional[List[Dict[str, Any]]] = None
    routes: Optional[List[Dict[str, Any]]] = None
    track: Optional[TrackDefinition] = None
    vehicleClasses: Optional[List[VehicleClassDefinition]] = None
    raceRuleset: Optional[RaceRuleset] = None
    nodes: Optional[List[Dict[str, Any]]] = None
    status: Optional[Literal["draft", "active", "archived"]] = None


# ---- identity middleware: x-owner-id is read-only context, key owner stays authoritative ----
async def owner_ctx(request: Request, ctx: dict = Depends(engine_ctx)) -> dict:
    owner = ctx["user"]["id"]
    header_owner = request.headers.get("x-owner-id")
    if header_owner and header_owner != owner and ctx["user"].get("role") != "admin":
        raise HTTPException(status_code=403, detail={"code": "FK-OWNER", "message": "x-owner-id does not match authenticated owner"})
    await _verify_signature(request, ctx)
    return {**ctx, "owner": header_owner if (header_owner and ctx["user"].get("role") == "admin") else owner}


async def _verify_signature(request: Request, ctx: dict):
    """Optional HMAC-SHA256 request signing per secure-runtime SDK: x-api-signature over raw body with the API key."""
    sig = request.headers.get("x-api-signature")
    if not sig:
        return
    key_doc = ctx.get("key")
    if not key_doc:
        raise HTTPException(status_code=401, detail={"code": "FK-SIG", "message": "Signature requires API-key auth"})
    body = await request.body()
    expected = hmac.new(key_doc["key"].encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, sig):
        raise HTTPException(status_code=401, detail={"code": "FK-SIG", "message": "Invalid x-api-signature"})


# ---- envelope / continuity / diagnostics / policy ----
async def _continuity_event(owner: str, event: str, ref: str):
    await db.continuity_state.insert_one({"id": str(uuid.uuid4()), "owner_id": owner,
                                          "event": event, "ref": ref, "ts": _now_ms()})


async def _diagnostics_log(owner: str, component: str, payload: dict):
    await db.wg_diagnostics.insert_one({"id": str(uuid.uuid4()), "owner_id": owner,
                                        "component": component, "payload": payload, "ts": _now_ms()})


async def _policy_check(owner: str, action: str):
    deny = await db.policy_rules.find_one({"owner_id": owner, "rule.action": action, "rule.effect": "deny"})
    if deny:
        raise HTTPException(status_code=403, detail={"code": "FK-POLICY",
                                                     "message": f"Policy enforcement: '{action}' denied for owner"})


async def _audit(owner: str, action: str, world_id: str, ctx: dict):
    await db.wg_audit.insert_one({"id": str(uuid.uuid4()), "owner_id": owner, "action": action,
                                  "world_id": world_id, "key_id": (ctx.get("key") or {}).get("id"),
                                  "ts": _now_ms()})


async def api_envelope(owner: str, payload: Any) -> dict:
    cont = await db.continuity_state.find({"owner_id": owner}, {"_id": 0}).sort("ts", -1).to_list(5)
    diag_count = await db.wg_diagnostics.count_documents({"owner_id": owner})
    rules = await db.policy_rules.find({"owner_id": owner}, {"_id": 0}).to_list(50)
    return {"version": "v1", "owner": owner,
            "continuity": {"recent": cont, "events": len(cont)},
            "diagnostics": {"traces": diag_count},
            "policy": {"rules": rules},
            "payload": payload, "timestamp": _now_ms()}


# ============ /v1/worldgraph — owner-scoped CRUD (WorldDefinition payloads, audit-logged) ============

@router.post("/v1/worldgraph")
async def create_world(world: WorldDefinition, ctx: dict = Depends(owner_ctx)):
    owner = ctx["owner"]
    await _policy_check(owner, "worldgraph.create")
    if await db.worldgraph.find_one({"owner_id": owner, "world.id": world.id}):
        raise HTTPException(status_code=409, detail={"code": "FK-WG", "message": f'World "{world.id}" already exists'})
    doc = {"id": str(uuid.uuid4()), "owner_id": owner, "world": world.model_dump(),
           "status": "active", "created_at": _now_ms(), "updated_at": _now_ms()}
    await db.worldgraph.insert_one(doc)
    await _continuity_event(owner, "worldgraph.created", world.id)
    await _diagnostics_log(owner, "worldgraph", {"op": "create", "world_id": world.id, "kind": world.kind})
    await _audit(owner, "create", world.id, ctx)
    return await api_envelope(owner, {"record": {k: v for k, v in doc.items() if k != "_id"}})


@router.get("/v1/worldgraph")
async def list_worlds(ctx: dict = Depends(owner_ctx)):
    owner = ctx["owner"]
    docs = await db.worldgraph.find({"owner_id": owner}, {"_id": 0}).sort("updated_at", -1).to_list(200)
    return await api_envelope(owner, {"worlds": docs, "count": len(docs)})


async def _get_world_doc(owner: str, world_id: str) -> dict:
    doc = await db.worldgraph.find_one({"owner_id": owner, "world.id": world_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail={"code": "FK-WG", "message": f'World "{world_id}" does not exist'})
    return doc


@router.get("/v1/worldgraph/{world_id}")
async def get_world(world_id: str, ctx: dict = Depends(owner_ctx)):
    return await api_envelope(ctx["owner"], {"record": await _get_world_doc(ctx["owner"], world_id)})


@router.patch("/v1/worldgraph/{world_id}")
async def update_world(world_id: str, patch: WorldPatch, ctx: dict = Depends(owner_ctx)):
    owner = ctx["owner"]
    await _policy_check(owner, "worldgraph.update")
    await _get_world_doc(owner, world_id)
    updates = {f"world.{k}": v for k, v in patch.model_dump(exclude_none=True).items()}
    updates["updated_at"] = _now_ms()
    await db.worldgraph.update_one({"owner_id": owner, "world.id": world_id}, {"$set": updates})
    await _continuity_event(owner, "worldgraph.updated", world_id)
    await _diagnostics_log(owner, "worldgraph", {"op": "update", "world_id": world_id, "fields": list(patch.model_dump(exclude_none=True).keys())})
    await _audit(owner, "update", world_id, ctx)
    return await api_envelope(owner, {"record": await _get_world_doc(owner, world_id)})


@router.delete("/v1/worldgraph/{world_id}")
async def delete_world(world_id: str, ctx: dict = Depends(owner_ctx)):
    owner = ctx["owner"]
    await _policy_check(owner, "worldgraph.delete")
    doc = await _get_world_doc(owner, world_id)
    await db.worldgraph.delete_one({"owner_id": owner, "world.id": world_id})
    await _continuity_event(owner, "worldgraph.deleted", world_id)
    await _audit(owner, "delete", world_id, ctx)
    return await api_envelope(owner, {"deleted": doc})


@router.get("/v1/worldgraph/{world_id}/materialize")
async def materialize_scene(world_id: str, ctx: dict = Depends(owner_ctx)):
    owner = ctx["owner"]
    doc = await _get_world_doc(owner, world_id)
    w = doc["world"]
    native = [{"id": n.get("id"), "kind": n.get("kind", "node"), "label": n.get("label") or n.get("id"),
               "parentId": n.get("parentId"), "tags": n.get("tags") or [], "config": n.get("config") or {}}
              for n in (w.get("nodes") or [])]
    derived = [{"id": s.get("id"), "kind": t, "label": s.get("name") or s.get("title") or s.get("id"),
                "parentId": None, "tags": [], "config": {}}
               for t, items in (("scene", w["scenes"]), ("page", w["pages"]), ("screen", w["screens"]), ("flow", w["flows"]))
               for s in items]
    nodes = native + derived
    nodes.sort(key=lambda n: (n["label"] or ""))
    await _diagnostics_log(owner, "worldgraph", {"op": "materialize", "world_id": world_id})
    return await api_envelope(owner, {"worldId": world_id, "rootId": nodes[0]["id"] if nodes else world_id,
                                      "nodes": nodes, "materializedAt": _now_ms()})


@router.get("/v1/continuity")
async def get_continuity(ctx: dict = Depends(owner_ctx)):
    owner = ctx["owner"]
    events = await db.continuity_state.find({"owner_id": owner}, {"_id": 0}).sort("ts", -1).to_list(100)
    return await api_envelope(owner, {"timeline": events})


# ============ /governance/* — governance-admin key gated ============

async def governance_guard(request: Request, ctx: dict = Depends(engine_ctx)) -> dict:
    gov_key = request.headers.get("x-governance-key", "")
    if ctx["user"].get("role") == "admin":
        return ctx
    if GOVERNANCE_ADMIN_KEY and hmac.compare_digest(gov_key, GOVERNANCE_ADMIN_KEY):
        return ctx
    raise HTTPException(status_code=403, detail={"error": "Forbidden: governance-admin key required"})


@router.get("/governance/diagnostics")
async def governance_diagnostics(owner: Optional[str] = None, ctx: dict = Depends(governance_guard)):
    q = {"owner_id": owner} if owner else {}
    traces = await db.wg_diagnostics.find(q, {"_id": 0}).sort("ts", -1).to_list(200)
    return {"version": "v1", "traces": traces, "count": len(traces), "timestamp": _now_ms()}


@router.get("/governance/continuity")
async def governance_continuity(owner: Optional[str] = None, ctx: dict = Depends(governance_guard)):
    q = {"owner_id": owner} if owner else {}
    events = await db.continuity_state.find(q, {"_id": 0}).sort("ts", -1).to_list(200)
    return {"version": "v1", "timeline": events, "count": len(events), "timestamp": _now_ms()}


class PolicyRule(BaseModel):
    owner_id: str
    rule: Dict[str, Any]


@router.get("/governance/policy")
async def governance_policy_list(owner: Optional[str] = None, ctx: dict = Depends(governance_guard)):
    q = {"owner_id": owner} if owner else {}
    rules = await db.policy_rules.find(q, {"_id": 0}).to_list(200)
    return {"version": "v1", "rules": rules, "timestamp": _now_ms()}


@router.post("/governance/policy/enforce")
async def governance_policy_enforce(body: PolicyRule, ctx: dict = Depends(governance_guard)):
    doc = {"id": str(uuid.uuid4()), "owner_id": body.owner_id, "rule": body.rule, "ts": _now_ms()}
    await db.policy_rules.insert_one(doc)
    await _continuity_event(body.owner_id, "policy.enforced", doc["id"])
    return {"version": "v1", "enforced": {k: v for k, v in doc.items() if k != "_id"}, "timestamp": _now_ms()}


@router.delete("/governance/policy/{rule_id}")
async def governance_policy_remove(rule_id: str, ctx: dict = Depends(governance_guard)):
    doc = await db.policy_rules.find_one({"id": rule_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail={"error": "Policy rule not found"})
    await db.policy_rules.delete_one({"id": rule_id})
    return {"version": "v1", "removed": doc, "timestamp": _now_ms()}
