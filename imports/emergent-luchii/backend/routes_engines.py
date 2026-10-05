import time
import uuid
import random
import logging
from typing import Optional, Dict, Any, List

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

import auth as auth_module
from core import db

logger = logging.getLogger(__name__)
router = APIRouter()

# ============ FRASBERG ENGINE STACK (Stages 80-89, Option 1 parallel flow) ============
# Runs IN PARALLEL to the existing pattern/structure pipeline — nothing existing is replaced.

CORE_PATH = [
    "awarenessSelf", "consciousnessPerception", "mindAwareness", "cognitiveMindspace",
    "reasoningArchitecture", "logicCognition", "designReasoning", "blueprintLogic",
    "architecturePlan", "structureBlueprint", "patternArchitecture", "exchangeStructure",
    "interactionFlow", "influenceExchange", "fieldPropagation", "vectorInfluence",
    "forceDirection", "dynamicsVector", "motionForce", "travelKinetics",
    "navigationMotion", "routeDecision", "pathNavigation", "directionMap",
    "pathwayDirection", "structuralPathway",
]


def _now_ms() -> int:
    return int(time.time() * 1000)


def _checksum() -> str:
    return uuid.uuid4().hex[:12]


def _build_self() -> dict:
    node: Any = "open"
    for key in reversed(CORE_PATH):
        node = {key: node}
    return node


def _pathway_open(root: dict) -> bool:
    node: Any = root
    for key in CORE_PATH:
        if not isinstance(node, dict) or key not in node:
            return False
        node = node[key]
    return node == "open"


def build_chain() -> Dict[str, dict]:
    """Identity -> Persona -> Character -> Role -> Function -> Task -> Action -> Behavior -> Pattern -> Structure."""
    ts = _now_ms()
    self_model = _build_self()
    integration = {"harmonyIntegration": "stable", "checksum": _checksum()}
    identity = {
        "identityId": str(uuid.uuid4()), "self": self_model, "integration": integration,
        "identityGraph": {
            "nodes": [{"id": "self", "weight": 1},
                      {"id": "integration", "weight": 1 if integration["harmonyIntegration"] == "stable" else 0}],
            "edges": [{"from": "self", "to": "integration", "relation": "integrates"}]},
        "createdAt": ts,
    }

    # persona
    p_model = {"identityModel": self_model, "integrationModel": integration, "timestamp": ts}
    p_proj = {"structuralProjection": "expressed" if _pathway_open(self_model) else "suppressed",
              "harmonyProjection": "coherent" if integration["harmonyIntegration"] == "stable" else "unstable",
              "checksum": _checksum()}
    persona = {"personaId": str(uuid.uuid4()), "model": p_model, "projection": p_proj,
               "personaGraph": {"nodes": [{"id": "model", "weight": 1 if p_proj["structuralProjection"] == "expressed" else 0},
                                          {"id": "projection", "weight": 1 if p_proj["harmonyProjection"] == "coherent" else 0}],
                                "edges": [{"from": "model", "to": "projection", "relation": "projects"}]},
               "createdAt": ts}
    # character
    c_form = {"personaFormation": p_model, "projectionFormation": p_proj, "timestamp": ts}
    c_expr = {"structuralExpression": "manifested" if _pathway_open(p_model["identityModel"]) else "latent",
              "harmonyExpression": "stable" if p_proj["harmonyProjection"] == "coherent" else "unstable",
              "checksum": _checksum()}
    character = {"characterId": str(uuid.uuid4()), "formation": c_form, "expression": c_expr,
                 "characterGraph": {"nodes": [{"id": "formation", "weight": 1 if c_expr["structuralExpression"] == "manifested" else 0},
                                              {"id": "expression", "weight": 1 if c_expr["harmonyExpression"] == "stable" else 0}],
                                    "edges": [{"from": "formation", "to": "expression", "relation": "expresses"}]},
                 "createdAt": ts}
    # role
    r_func = {"characterFunction": c_form, "expressionFunction": c_expr, "timestamp": ts}
    r_dyn = {"structuralRoleDynamics": "active" if _pathway_open(c_form["personaFormation"]["identityModel"]) else "dormant",
             "harmonyRoleDynamics": "coherent" if c_expr["harmonyExpression"] == "stable" else "unstable",
             "checksum": _checksum()}
    role = {"roleId": str(uuid.uuid4()), "function": r_func, "dynamics": r_dyn,
            "roleGraph": {"nodes": [{"id": "function", "weight": 1 if r_dyn["structuralRoleDynamics"] == "active" else 0},
                                    {"id": "dynamics", "weight": 1 if r_dyn["harmonyRoleDynamics"] == "coherent" else 0}],
                          "edges": [{"from": "function", "to": "dynamics", "relation": "drives"}]},
            "createdAt": ts}
    # function
    f_exec = {"roleExecution": r_func, "dynamicsExecution": r_dyn, "timestamp": ts}
    f_dyn = {"structuralFunctionalDynamics": "operational" if r_dyn["structuralRoleDynamics"] == "active" else "inactive",
             "harmonyFunctionalDynamics": "stable" if r_dyn["harmonyRoleDynamics"] == "coherent" else "unstable",
             "checksum": _checksum()}
    func = {"functionId": str(uuid.uuid4()), "execution": f_exec, "dynamics": f_dyn,
            "functionGraph": {"nodes": [{"id": "execution", "weight": 1 if f_dyn["structuralFunctionalDynamics"] == "operational" else 0},
                                        {"id": "dynamics", "weight": 1 if f_dyn["harmonyFunctionalDynamics"] == "stable" else 0}],
                              "edges": [{"from": "execution", "to": "dynamics", "relation": "produces"}]},
            "createdAt": ts}
    # task
    t_action = {"functionAction": f_exec, "dynamicsAction": f_dyn, "timestamp": ts}
    t_dyn = {"structuralTaskDynamics": "engaged" if f_dyn["structuralFunctionalDynamics"] == "operational" else "idle",
             "harmonyTaskDynamics": "coherent" if f_dyn["harmonyFunctionalDynamics"] == "stable" else "unstable",
             "checksum": _checksum()}
    task = {"taskId": str(uuid.uuid4()), "action": t_action, "dynamics": t_dyn,
            "taskGraph": {"nodes": [{"id": "action", "weight": 1 if t_dyn["structuralTaskDynamics"] == "engaged" else 0},
                                    {"id": "dynamics", "weight": 1 if t_dyn["harmonyTaskDynamics"] == "coherent" else 0}],
                          "edges": [{"from": "action", "to": "dynamics", "relation": "drives"}]},
            "createdAt": ts}
    # action
    a_motion = {"taskMotion": t_action, "dynamicsMotion": t_dyn, "timestamp": ts}
    a_dyn = {"structuralActionDynamics": "in_motion" if t_dyn["structuralTaskDynamics"] == "engaged" else "static",
             "harmonyActionDynamics": "stable" if t_dyn["harmonyTaskDynamics"] == "coherent" else "unstable",
             "checksum": _checksum()}
    action = {"actionId": str(uuid.uuid4()), "motion": a_motion, "dynamics": a_dyn,
              "actionGraph": {"nodes": [{"id": "motion", "weight": 1 if a_dyn["structuralActionDynamics"] == "in_motion" else 0},
                                        {"id": "dynamics", "weight": 1 if a_dyn["harmonyActionDynamics"] == "stable" else 0}],
                              "edges": [{"from": "motion", "to": "dynamics", "relation": "drives"}]},
              "createdAt": ts}
    # behavior
    b_pattern = {"actionPattern": a_motion, "dynamicsPattern": a_dyn, "timestamp": ts}
    b_dyn = {"structuralBehaviorDynamics": "emergent" if a_dyn["structuralActionDynamics"] == "in_motion" else "suppressed",
             "harmonyBehaviorDynamics": "coherent" if a_dyn["harmonyActionDynamics"] == "stable" else "unstable",
             "checksum": _checksum()}
    behavior = {"behaviorId": str(uuid.uuid4()), "pattern": b_pattern, "dynamics": b_dyn,
                "behaviorGraph": {"nodes": [{"id": "pattern", "weight": 1 if b_dyn["structuralBehaviorDynamics"] == "emergent" else 0},
                                            {"id": "dynamics", "weight": 1 if b_dyn["harmonyBehaviorDynamics"] == "coherent" else 0}],
                                  "edges": [{"from": "pattern", "to": "dynamics", "relation": "produces"}]},
                "createdAt": ts}
    # pattern
    pt_struct = {"behaviorStructure": b_pattern, "dynamicsStructure": b_dyn, "timestamp": ts}
    pt_dyn = {"structuralPatternDynamics": "patterned" if b_dyn["structuralBehaviorDynamics"] == "emergent" else "dispersed",
              "harmonyPatternDynamics": "stable" if b_dyn["harmonyBehaviorDynamics"] == "coherent" else "unstable",
              "checksum": _checksum()}
    pattern = {"patternId": str(uuid.uuid4()), "structure": pt_struct, "dynamics": pt_dyn,
               "patternGraph": {"nodes": [{"id": "structure", "weight": 1 if pt_dyn["structuralPatternDynamics"] == "patterned" else 0},
                                          {"id": "dynamics", "weight": 1 if pt_dyn["harmonyPatternDynamics"] == "stable" else 0}],
                                "edges": [{"from": "structure", "to": "dynamics", "relation": "shapes"}]},
               "createdAt": ts}
    # structure
    s_form = {"patternFormation": pt_struct, "dynamicsFormation": pt_dyn, "timestamp": ts}
    s_dyn = {"structuralStructuralDynamics": "structured" if pt_dyn["structuralPatternDynamics"] == "patterned" else "collapsed",
             "harmonyStructuralDynamics": "coherent" if pt_dyn["harmonyPatternDynamics"] == "stable" else "unstable",
             "checksum": _checksum()}
    structure = {"structureId": str(uuid.uuid4()), "formation": s_form, "dynamics": s_dyn,
                 "structureGraph": {"nodes": [{"id": "formation", "weight": 1 if s_dyn["structuralStructuralDynamics"] == "structured" else 0},
                                              {"id": "dynamics", "weight": 1 if s_dyn["harmonyStructuralDynamics"] == "coherent" else 0}],
                                    "edges": [{"from": "formation", "to": "dynamics", "relation": "stabilizes"}]},
                 "createdAt": ts}
    return {"identity": identity, "persona": persona, "character": character, "role": role,
            "function": func, "task": task, "action": action, "behavior": behavior,
            "pattern": pattern, "structure": structure}


# ---- Auth: frb_live_ API key (parallel to session auth, x-owner-id respected read-only) ----
async def engine_ctx(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    key_val = request.headers.get("xi-api-key") or request.headers.get("X-API-Key")
    if not key_val and auth_header.startswith("Bearer frb_"):
        key_val = auth_header[7:]
    if key_val:
        doc = await db.api_keys.find_one({"key": key_val, "status": {"$ne": "revoked"}}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=401, detail={"code": "FK-001", "message": "Invalid API key"})
        u = await db.users.find_one({"id": doc["user_id"]}, {"_id": 0, "password": 0})
        if not u:
            raise HTTPException(status_code=401, detail={"code": "FK-001", "message": "Invalid API key"})
        return {"user": u, "key": doc}
    u = await auth_module.get_current_user(request)
    return {"user": u, "key": None}


class EngineInput(BaseModel):
    input: str = ""


async def _log_execution(kind: str, ctx: dict, result_id: str):
    try:
        await db.engine_executions.insert_one({
            "id": str(uuid.uuid4()), "engine": kind, "result_id": result_id,
            "user_id": ctx["user"]["id"], "key_id": (ctx["key"] or {}).get("id"),
            "ts": _now_ms()})
    except Exception:
        logger.warning("engine execution log failed")


def _evolve(id_key: str, id_val: str) -> dict:
    return {id_key: id_val, "evolutionScore": random.random(), "evolvedAt": _now_ms()}


@router.post("/v1/behavior")
async def behavior_endpoint(body: EngineInput, ctx: dict = Depends(engine_ctx)):
    b = build_chain()["behavior"]
    await _log_execution("behavior", ctx, b["behaviorId"])
    return {"behaviorId": b["behaviorId"], "evolution": _evolve("behaviorId", b["behaviorId"]),
            "output": f"Behavior processed: {body.input}",
            "envelope": {"behaviorId": b["behaviorId"], "pattern": b["pattern"], "dynamics": b["dynamics"],
                         "behaviorGraph": b["behaviorGraph"], "timestamp": _now_ms()}}


@router.post("/v1/pattern")
async def pattern_endpoint(body: EngineInput, ctx: dict = Depends(engine_ctx)):
    p = build_chain()["pattern"]
    await _log_execution("pattern", ctx, p["patternId"])
    return {"patternId": p["patternId"], "evolution": _evolve("patternId", p["patternId"]),
            "output": f"Pattern processed: {body.input}",
            "envelope": {"patternId": p["patternId"], "structure": p["structure"], "dynamics": p["dynamics"],
                         "patternGraph": p["patternGraph"], "timestamp": _now_ms()}}


@router.post("/v1/structure")
async def structure_endpoint(body: EngineInput, ctx: dict = Depends(engine_ctx)):
    s = build_chain()["structure"]
    await _log_execution("structure", ctx, s["structureId"])
    return {"structureId": s["structureId"], "evolution": _evolve("structureId", s["structureId"]),
            "output": f"Structure processed: {body.input}",
            "envelope": {"structureId": s["structureId"], "formation": s["formation"], "dynamics": s["dynamics"],
                         "structureGraph": s["structureGraph"], "timestamp": _now_ms()}}


# ============ GT6 ORCHESTRATOR (cost-aware planner + physics + AI drivers) ============

ENGINE_NODES = [
    {"id": "game-logic", "promptFile": "config/emergent/engines/game-logic-engine.prompt.md", "costWeight": 1, "perms": ()},
    {"id": "video", "promptFile": "config/emergent/engines/video-engine.prompt.md", "costWeight": 3, "perms": ("video_generation", "image_video_generation")},
    {"id": "music", "promptFile": "config/emergent/engines/music-engine.prompt.md", "costWeight": 2, "perms": ("music_generation",)},
    {"id": "voice", "promptFile": "config/emergent/engines/voice-engine.prompt.md", "costWeight": 2, "perms": ("text_to_speech",)},
    {"id": "stt", "promptFile": "config/emergent/engines/stt-engine.prompt.md", "costWeight": 2, "perms": ("speech_to_text",)},
    {"id": "image", "promptFile": "config/emergent/engines/image-engine.prompt.md", "costWeight": 3, "perms": ("image_generation", "image_video_generation")},
]

ENGINE_EDGES = [
    {"from": "game-logic", "to": "video", "relation": "visualizes"},
    {"from": "game-logic", "to": "music", "relation": "scores"},
    {"from": "game-logic", "to": "voice", "relation": "commentates"},
    {"from": "game-logic", "to": "image", "relation": "renders"},
    {"from": "stt", "to": "game-logic", "relation": "controls"},
]


def _perm_granted(node: dict, key_doc: Optional[dict]) -> bool:
    if not node["perms"]:
        return True
    if key_doc is None:
        return True  # owner session auth
    perms = key_doc.get("permissions") or {}
    return any(perms.get(p) not in (None, "no_access") for p in node["perms"])


def plan_engines(intent: Dict[str, bool], max_cost_weight: int, key_doc: Optional[dict]) -> dict:
    game_logic = ENGINE_NODES[0]
    selected = [{"id": game_logic["id"], "promptFile": game_logic["promptFile"]}]
    declined: List[dict] = []
    budget = max_cost_weight - game_logic["costWeight"]
    wants_map = {"video": "wantsVideo", "music": "wantsMusic", "voice": "wantsVoice",
                 "stt": "wantsSTT", "image": "wantsImage"}
    for node in ENGINE_NODES[1:]:
        if not intent.get(wants_map[node["id"]]):
            continue
        if not _perm_granted(node, key_doc):
            declined.append({"id": node["id"], "reason": f"missing permission: {node['perms'][0]}"})
            continue
        if budget - node["costWeight"] < 0:
            declined.append({"id": node["id"], "reason": "cost budget exceeded — charges and fees protected"})
            continue
        selected.append({"id": node["id"], "promptFile": node["promptFile"]})
        budget -= node["costWeight"]
    return {"engines": selected, "declined": declined, "remaining_budget": budget}


DEFAULT_TRACK = {"id": "lv-speedway", "name": "Vybz Speedway Las Vegas", "lengthKm": 4.2,
                 "weather": "clear", "trackTempC": 38, "surfaceGrip": 0.92}

DEFAULT_CARS = [
    {"id": "car-1", "name": "Luchii GT-R", "team": "Frasberg Works", "position": 1, "lap": 1, "sector": 1,
     "speedKph": 220, "gear": 5, "rpm": 7200, "tireCompound": "soft", "tireTempC": 88, "fuelLiters": 40, "damageLevel": 0},
    {"id": "car-2", "name": "Orion V12", "team": "Frasberg Works", "position": 2, "lap": 1, "sector": 1,
     "speedKph": 215, "gear": 5, "rpm": 7000, "tireCompound": "medium", "tireTempC": 84, "fuelLiters": 42, "damageLevel": 5},
    {"id": "car-3", "name": "Vegas Phantom", "team": "LV Racing", "position": 3, "lap": 1, "sector": 1,
     "speedKph": 210, "gear": 4, "rpm": 6800, "tireCompound": "hard", "tireTempC": 78, "fuelLiters": 45, "damageLevel": 10},
    {"id": "car-4", "name": "Street Vybz S", "team": "LV Racing", "position": 4, "lap": 1, "sector": 1,
     "speedKph": 205, "gear": 4, "rpm": 6500, "tireCompound": "soft", "tireTempC": 90, "fuelLiters": 38, "damageLevel": 2},
]

DEFAULT_PROFILES = [
    {"carId": "car-1", "personality": "aggressive", "riskTolerance": 0.8},
    {"carId": "car-2", "personality": "calculated", "riskTolerance": 0.6},
    {"carId": "car-3", "personality": "defensive", "riskTolerance": 0.3},
    {"carId": "car-4", "personality": "aggressive", "riskTolerance": 0.7},
]

TIRE_FACTORS = {"soft": 1.0, "medium": 0.9, "hard": 0.8, "wet": 0.7}


def update_car_physics(car: dict, track: dict, time_step_sec: float) -> dict:
    grip = track["surfaceGrip"] * TIRE_FACTORS.get(car["tireCompound"], 0.7)
    drag = 0.0004 * car["speedKph"] * car["speedKph"]
    engine_force = 0.02 * car["rpm"] if car["rpm"] > 3000 else 0.01 * car["rpm"]
    net_accel = (engine_force - drag) * grip
    new_speed = max(0, car["speedKph"] + net_accel * time_step_sec)
    return {**car,
            "speedKph": round(new_speed, 2),
            "fuelLiters": round(max(0, car["fuelLiters"] - 0.0005 * new_speed * time_step_sec), 3),
            "tireTempC": round(min(140, car["tireTempC"] + (new_speed / 200) * time_step_sec), 2)}


def decide_driver_action(profile: dict, car: dict, cars: List[dict]) -> dict:
    base = {"aggressive": 310, "defensive": 280, "calculated": 295}[profile["personality"]]
    target = max(200, base - car["damageLevel"] * 0.5 - (20 if car["fuelLiters"] < 5 else 0))
    ahead = next((c for c in cars if c["position"] == car["position"] - 1), None)
    should_overtake = bool(ahead) and profile["riskTolerance"] > 0.5 and car["speedKph"] > (ahead["speedKph"] + 5 if ahead else 0)
    should_pit = car["fuelLiters"] < 3 or car["damageLevel"] > 60 or car["tireTempC"] > 130
    return {"targetSpeedKph": target, "shouldOvertake": should_overtake, "shouldPit": should_pit}


class GT6Request(BaseModel):
    intent: Dict[str, bool] = {}
    max_cost_weight: int = 8
    steps: int = 10
    race_config: Optional[Dict[str, Any]] = None


@router.get("/v1/engines")
async def list_engines(ctx: dict = Depends(engine_ctx)):
    key_doc = ctx["key"]
    nodes = [{**{k: v for k, v in n.items() if k != "perms"},
              "requiresPermission": n["perms"][0] if n["perms"] else None,
              "granted": _perm_granted(n, key_doc)} for n in ENGINE_NODES]
    return {"nodes": nodes, "edges": ENGINE_EDGES,
            "auth": "api_key" if key_doc else "session",
            "cost_discipline": "engines gated by key permissions and cost budget — no accidental spend"}


@router.post("/v1/gt6/orchestrate")
async def gt6_orchestrate(req: GT6Request, ctx: dict = Depends(engine_ctx)):
    plan = plan_engines(req.intent or {}, req.max_cost_weight, ctx["key"])
    cfg = req.race_config or {}
    track = cfg.get("track") or DEFAULT_TRACK
    cars = cfg.get("cars") or [dict(c) for c in DEFAULT_CARS]
    profiles = cfg.get("driverProfiles") or DEFAULT_PROFILES
    lap_count = int(cfg.get("lapCount") or 12)
    steps = max(1, min(int(req.steps or 10), 600))
    for _ in range(steps):
        cars = [update_car_physics(c, track, 0.1) for c in cars]
    ai_decisions = {p["carId"]: decide_driver_action(p, c, cars)
                    for p in profiles for c in cars if c["id"] == p["carId"]}
    race_state = {"raceId": cfg.get("raceId") or f"race-{uuid.uuid4().hex[:8]}",
                  "lapCount": lap_count, "currentLap": 1, "safetyCarActive": False,
                  "yellowFlagSectors": [], "cars": cars, "track": track, "timestampMs": _now_ms()}
    await _log_execution("gt6-orchestrator", ctx, race_state["raceId"])
    return {"enginesUsed": [e["id"] for e in plan["engines"]],
            "enginesDeclined": plan["declined"],
            "remainingCostBudget": plan["remaining_budget"],
            "physicsStepsSimulated": steps,
            "raceState": race_state,
            "aiDecisions": ai_decisions}
