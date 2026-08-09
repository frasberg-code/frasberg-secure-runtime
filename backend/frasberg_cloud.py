import os
import uuid
import random
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/cloud")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

ROLES = ["leader", "worker", "explorer", "healer", "scholar", "artisan", "guardian", "mystic"]
NAMES = ["Aeon", "Vex", "Lyra", "Orin", "Sable", "Nyx", "Kael", "Mira", "Thane", "Zephyr",
         "Iska", "Ravel", "Suna", "Dax", "Elowen", "Bram", "Ciel", "Vora", "Juno", "Riven"]
ARCHETYPES = ["The Wanderer", "The Flame-Bearer", "The Silent Judge", "The Twin Serpents",
              "The Broken Crown", "The First Dreamer", "The Entropy Eater", "The Star-Weaver"]
MORALS = ["unity endures beyond collapse", "power without empathy ruptures worlds",
          "knowledge shared is a universe reborn", "even entropy carries a seed of genesis",
          "trust is the only stable dimension", "ascension begins with a single kindness"]
COMMODITIES = ["energy", "matter", "knowledge", "warp_stabilizer"]
ABSOLUTE_LAWS = [
    {"id": "existence_continuity", "domain": "existence", "axiom": "existence cannot be nullified across all timelines"},
    {"id": "entropy_floor", "domain": "entropy", "axiom": "entropy cannot fall below zero in any universe"},
    {"id": "identity_uniqueness", "domain": "identity", "axiom": "no agent may exist in identical form across parallel timelines"},
    {"id": "causal_integrity", "domain": "causality", "axiom": "no effect may erase its own cause"},
    {"id": "dimensional_bound", "domain": "dimensional", "axiom": "no universe may exceed twelve dimensions"},
]
SAFETY_LIMITS = {"divergence": 0.85, "violations": 10, "entropy": 0.75, "instability": 0.8}
FORMS = ["physical", "energetic", "quantum", "omni"]
PHASES = ["genesis", "growth", "stability", "decay", "collapse", "rebirth"]


def _now():
    return datetime.now(timezone.utc).isoformat()


def _new_agent():
    ess = {k: round(random.random(), 3) for k in ["creation", "destruction", "chaos", "order", "empathy", "ambition"]}
    return {
        "id": str(uuid.uuid4())[:8],
        "name": random.choice(NAMES) + "-" + str(random.randint(10, 99)),
        "role": random.choice(ROLES),
        "reputation": random.randint(35, 65),
        "status": round(random.random(), 3),
        "trust_links": random.randint(0, 4),
        "personality": {k: round(random.random(), 2) for k in ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]},
        "emotions": {k: round(random.random() * 0.4, 3) for k in ["joy", "fear", "anger", "sadness", "anticipation"]},
        "cognition": {"reasoning": round(random.random(), 3), "memoryRetention": round(random.random(), 3), "creativity": round(random.random(), 3)},
        "resilience": round(0.4 + random.random() * 0.5, 3),
        "trauma": 0,
        "skills": random.randint(1, 4),
        "dreams": 0,
        "soul": {
            "essence": ess,
            "alignment": random.choice(["light", "shadow", "neutral"]),
            "karma": 0.0,
            "continuity": round(random.random(), 3),
        },
        "ascension": {"tier": 0, "form": "physical", "resonance": round(random.random() * 0.3, 3)},
        "behavior": "neutral",
        "alive": True,
        "reincarnations": 0,
    }


def _new_civilization():
    return {
        "id": str(uuid.uuid4())[:8],
        "name": random.choice(["Solane", "Vethari", "Ondra", "Kirith", "Halcyon", "Umbra", "Tessel"]) + " " +
                random.choice(["Dominion", "Collective", "Concord", "Ascendancy", "Enclave"]),
        "technologyLevel": round(random.uniform(5, 25), 1),
        "governance": "democracy",
        "expansionRate": round(random.random() * 0.6 + 0.1, 2),
        "population": random.randint(2000, 20000),
        "culture": {"cooperation": round(random.random(), 2), "hierarchy": round(random.random(), 2)},
    }


def _genesis_physics(model: str):
    if model == "standard":
        return {"model": model, "gravity": 1.0, "entropy": 0.1, "tunneling": False}
    if model == "exotic":
        return {"model": model, "gravity": round(random.random() * 2, 2), "entropy": 0.3, "tunneling": False}
    if model == "quantum":
        return {"model": model, "gravity": 1.0, "entropy": 0.5, "tunneling": True}
    return {"model": "chaotic", "gravity": round(random.random() * 6 + 0.5, 2), "entropy": 0.9, "tunneling": random.random() < 0.5}


def create_universe(name, physics_model, terrain, climate, agent_count):
    agents = [_new_agent() for _ in range(min(max(agent_count, 4), 60))]
    civs = [_new_civilization() for _ in range(random.randint(1, 3))]
    physics = _genesis_physics(physics_model)
    return {
        "id": str(uuid.uuid4())[:12],
        "name": name or f"Universe-{random.randint(100, 999)}",
        "created": _now(),
        "tick": 0,
        "phase": "genesis",
        "physics": physics,
        "environment": {"terrain": terrain, "climate": climate, "temperature": 20.0},
        "dimensions": [{"id": str(uuid.uuid4())[:6], "type": "spatial", "magnitude": 3, "stability": 1.0}],
        "fractalLayers": 0,
        "stability": 0.9,
        "energyFlow": 0.5,
        "timelineDensity": 0.1,
        "timelineOverlap": 0.0,
        "informationLeak": 0.0,
        "territory": 1.0,
        "posture": "normal",
        "auditMode": False,
        "evolutionFrozen": False,
        "violations": 0,
        "agents": agents,
        "population": sum(c["population"] for c in civs) + len(agents),
        "civilizations": civs,
        "myths": [],
        "knowledge": 0,
        "singularities": [],
        "collapses": 0,
        "paradoxesResolved": 0,
        "metrics": [],
    }


async def _log(uid, kind, text):
    await db.cloud_events.insert_one({
        "id": str(uuid.uuid4()), "universe_id": uid, "kind": kind, "text": text, "ts": _now()})


def _clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))


def _psych_step(a, events_out, uname):
    e = a["emotions"]
    ev = random.choice(["threat", "loss", "victory", "conflict", "help", "trade_success", "creation", "empathy", "calm"])
    if ev == "threat":
        e["fear"] = _clamp(e["fear"] + 0.3)
    elif ev == "loss":
        e["sadness"] = _clamp(e["sadness"] + 0.4)
        if random.random() < 0.3:
            a["trauma"] += 1
            a["resilience"] = _clamp(a["resilience"] - 0.05)
    elif ev == "victory":
        e["joy"] = _clamp(e["joy"] + 0.5)
    elif ev == "conflict":
        e["anger"] = _clamp(e["anger"] + 0.2)
        a["reputation"] = max(0, a["reputation"] - 4)
    elif ev == "help":
        a["reputation"] = min(100, a["reputation"] + 5)
        a["soul"]["karma"] = round(a["soul"]["karma"] + 0.05, 3)
        a["trust_links"] += 1
    elif ev == "trade_success":
        a["reputation"] = min(100, a["reputation"] + 3)
    elif ev == "creation":
        a["soul"]["essence"]["creation"] = _clamp(a["soul"]["essence"]["creation"] + 0.05)
        a["cognition"]["creativity"] = _clamp(a["cognition"]["creativity"] + 0.02)
    elif ev == "empathy":
        a["soul"]["essence"]["empathy"] = _clamp(a["soul"]["essence"]["empathy"] + 0.04)
    for k in e:
        e[k] = round(_clamp(e[k] - 0.03), 3)
    a["cognition"]["reasoning"] = round(_clamp(a["cognition"]["reasoning"] + a["resilience"] * 0.005), 3)
    a["status"] = round(_clamp(a["reputation"] / 100 * 0.7 + min(a["trust_links"], 10) / 10 * 0.3), 3)
    # dreams integrate the subconscious
    if random.random() < 0.15:
        a["dreams"] += 1
        e["sadness"] = round(e["sadness"] * 0.9, 3)
        e["fear"] = round(e["fear"] * 0.85, 3)
        a["cognition"]["creativity"] = round(_clamp(a["cognition"]["creativity"] + 0.02), 3)
    # education
    if random.random() < 0.2:
        a["skills"] += 1
    # behavior output
    if e["fear"] > 0.7:
        a["behavior"] = "avoidance"
    elif e["anger"] > 0.6:
        a["behavior"] = "aggression"
    elif e["joy"] > 0.6:
        a["behavior"] = "cooperation"
    elif a["personality"]["openness"] > 0.7:
        a["behavior"] = "exploration"
    else:
        a["behavior"] = "neutral"
    # ascension check
    score = (a["cognition"]["creativity"] * 0.3 + e["joy"] * 0.2 +
             a["soul"]["essence"]["creation"] * 0.3 + a["soul"]["continuity"] * 0.2)
    if score > 0.85 and a["ascension"]["tier"] < 10 and random.random() < 0.5:
        a["ascension"]["tier"] += 1
        a["ascension"]["form"] = FORMS[min(3, a["ascension"]["tier"] // 3)]
        a["ascension"]["resonance"] = round(_clamp(a["ascension"]["resonance"] + 0.1), 3)
        events_out.append(("ascension", f"{a['name']} ascended to tier {a['ascension']['tier']} ({a['ascension']['form']} form) in {uname}"))
    # reincarnation on extreme trauma
    if a["trauma"] >= 5:
        a["trauma"] = 0
        a["reincarnations"] += 1
        a["soul"]["continuity"] = round(a["soul"]["continuity"] * 0.9, 3)
        a["soul"]["karma"] = round(a["soul"]["karma"] * 0.5, 3)
        a["emotions"] = {k: 0.1 for k in a["emotions"]}
        events_out.append(("reincarnation", f"{a['name']} reincarnated (cycle {a['reincarnations']}) in {uname}"))


def _detect_collapse(u):
    if u["physics"]["entropy"] > 0.95:
        return "entropy_collapse"
    if u["physics"]["gravity"] > 10 or u["physics"]["gravity"] < 0.01:
        return "physics_collapse"
    if not any(a["alive"] for a in u["agents"]):
        return "agent_extinction"
    if u["environment"]["temperature"] > 200 or u["environment"]["temperature"] < -200:
        return "environmental_collapse"
    return None


def tick_universe(u, events_out):
    u["tick"] += 1
    ph = u["physics"]
    # eternal cycle phase from entropy
    e = ph["entropy"]
    phase = "genesis" if e < 0.2 else "growth" if e < 0.4 else "stability" if e < 0.6 else "decay" if e < 0.8 else "collapse" if e < 0.95 else "rebirth"
    if phase != u["phase"]:
        events_out.append(("phase", f"{u['name']} entered {phase.upper()} phase"))
    u["phase"] = phase
    if phase == "genesis":
        u["energyFlow"] = _clamp(u["energyFlow"] + 0.1)
    elif phase == "growth":
        u["timelineDensity"] = _clamp(u["timelineDensity"] + 0.05)
    elif phase == "stability":
        ph["entropy"] = round(ph["entropy"] * 0.99, 4)
    elif phase == "decay":
        ph["entropy"] = round(min(0.99, ph["entropy"] * 1.02), 4)
    # base entropy drift
    if not u["evolutionFrozen"]:
        ph["entropy"] = round(_clamp(ph["entropy"] + random.uniform(-0.01, 0.025), 0.01, 0.99), 4)
    u["environment"]["temperature"] = round(u["environment"]["temperature"] + random.uniform(-4, 4), 1)
    u["timelineOverlap"] = round(_clamp(u["timelineOverlap"] + random.uniform(-0.05, 0.06)), 3)
    u["informationLeak"] = round(_clamp(u["informationLeak"] + random.uniform(-0.04, 0.05)), 3)
    # agents (psychology, soul, reputation, education, ascension, dreams)
    if not u["evolutionFrozen"]:
        for a in u["agents"]:
            if a["alive"]:
                _psych_step(a, events_out, u["name"])
    # civilizations
    for c in u["civilizations"]:
        c["culture"]["cooperation"] = round(_clamp(c["culture"]["cooperation"] + random.random() * 0.05), 3)
        c["culture"]["hierarchy"] = round(_clamp(c["culture"]["hierarchy"] + random.random() * 0.03), 3)
        c["technologyLevel"] = round(min(100, c["technologyLevel"] + c["expansionRate"] * 2 + random.random()), 1)
        c["governance"] = "technocracy" if c["technologyLevel"] > 80 else ("autocracy" if c["culture"]["hierarchy"] > 0.7 else "democracy")
        c["population"] += int(c["expansionRate"] * 1000)
        u["territory"] = round(u["territory"] + c["expansionRate"] * 0.1, 2)
    u["population"] = sum(c["population"] for c in u["civilizations"]) + sum(1 for a in u["agents"] if a["alive"])
    # mythology
    if random.random() < 0.25 and u["civilizations"]:
        myth = {
            "id": str(uuid.uuid4())[:8],
            "title": random.choice(["The Song of", "The Fall of", "The Rise of", "The Dream of"]) + " " + random.choice(ARCHETYPES),
            "archetypes": random.sample(ARCHETYPES, 2),
            "moral": random.choice(MORALS),
            "impact": round(random.random(), 2),
            "tick": u["tick"],
        }
        u["myths"] = ([myth] + u["myths"])[:20]
        events_out.append(("myth", f"New myth in {u['name']}: \"{myth['title']}\" — {myth['moral']}"))
    # knowledge grows
    u["knowledge"] += random.randint(1, 6)
    # dimensional expansion (rare)
    if random.random() < 0.06 and ph["entropy"] < 0.8 and len(u["dimensions"]) < 12:
        d = {"id": str(uuid.uuid4())[:6], "type": random.choice(["spatial", "temporal", "quantum", "informational"]),
             "magnitude": random.randint(1, 9), "stability": 1.0}
        u["dimensions"].append(d)
        if d["type"] == "quantum":
            ph["tunneling"] = True
        events_out.append(("dimension", f"{u['name']} expanded a new {d['type']} dimension (now {len(u['dimensions'])})"))
    for d in u["dimensions"]:
        d["stability"] = round(_clamp(d["stability"] + (0.2 if d["stability"] < 0.5 else random.uniform(-0.08, 0.03))), 3)
    # fractal expansion (rare)
    if random.random() < 0.05:
        u["fractalLayers"] += 1
    # paradox detection & resolution
    if u["timelineOverlap"] > 0.8:
        u["timelineOverlap"] = 0.2
        u["paradoxesResolved"] += 1
        events_out.append(("paradox", f"Timeline overlap paradox resolved in {u['name']} — timelines separated"))
    if u["informationLeak"] > 0.9:
        u["informationLeak"] = 0.0
        u["paradoxesResolved"] += 1
        events_out.append(("paradox", f"Information paradox sealed in {u['name']}"))
    # singularity birth
    complexity = sum(a["cognition"]["reasoning"] for a in u["agents"]) / max(1, len(u["agents"]))
    if complexity > 0.9 and random.random() < 0.2:
        s = {"id": str(uuid.uuid4())[:6], "type": "cognitive_singularity", "tick": u["tick"]}
        u["singularities"].append(s)
        for a in u["agents"]:
            a["cognition"]["reasoning"] = round(_clamp(a["cognition"]["reasoning"] + 0.05), 3)
        events_out.append(("singularity", f"COGNITIVE SINGULARITY born in {u['name']} — agents enhanced and stabilized"))
    # collapse detection & recovery
    ct = _detect_collapse(u)
    if ct:
        u["collapses"] += 1
        u["violations"] += 1
        if ct == "entropy_collapse":
            ph["entropy"] = round(ph["entropy"] * 0.5, 4)
        elif ct == "physics_collapse":
            ph["gravity"] = 1.0
            ph["entropy"] = round(ph["entropy"] * 0.7, 4)
        elif ct == "agent_extinction":
            u["agents"] = [_new_agent() for _ in range(20)]
        elif ct == "environmental_collapse":
            u["environment"]["temperature"] = 20.0
        events_out.append(("collapse", f"{ct.replace('_', ' ').upper()} in {u['name']} — recovery engine restored stability"))
    # predictive safety + hyper-stability
    instability = round(_clamp(ph["entropy"] * 0.5 + u["timelineOverlap"] * 0.3 + (1 - u["stability"]) * 0.2), 3)
    if ph["entropy"] > SAFETY_LIMITS["entropy"]:
        u["posture"] = "strict"
    elif u["posture"] == "strict" and ph["entropy"] < 0.5:
        u["posture"] = "normal"
    u["auditMode"] = u["violations"] > SAFETY_LIMITS["violations"]
    u["evolutionFrozen"] = instability > SAFETY_LIMITS["instability"]
    u["stability"] = round(_clamp(1 - instability * 0.8), 3)
    # metrics history
    avg_rep = round(sum(a["reputation"] for a in u["agents"]) / max(1, len(u["agents"])), 1)
    u["metrics"] = (u["metrics"] + [{
        "t": u["tick"], "entropy": ph["entropy"], "stability": u["stability"],
        "population": u["population"], "avgReputation": avg_rep,
        "instability": instability}])[-60:]
    return u


class GenesisSpec(BaseModel):
    name: Optional[str] = None
    physicsModel: str = "standard"
    terrainType: str = "mixed"
    climateProfile: str = "temperate"
    agentCount: int = 20


class TickBody(BaseModel):
    steps: int = 1


class MigrateBody(BaseModel):
    source: str
    target: str
    count: int = 5


class SynthesizeBody(BaseModel):
    a: str
    b: str


class TradeBody(BaseModel):
    source: str
    target: str
    commodity: str = "energy"
    amount: int = 100


class ResolutionBody(BaseModel):
    title: str
    content: str = ""


def _summary(u):
    return {k: u[k] for k in ["id", "name", "created", "tick", "phase", "stability", "population",
                              "territory", "posture", "collapses", "paradoxesResolved", "knowledge", "fractalLayers"]} | {
        "entropy": u["physics"]["entropy"], "physicsModel": u["physics"]["model"],
        "dimensions": len(u["dimensions"]), "agents": sum(1 for a in u["agents"] if a["alive"]),
        "civilizations": len(u["civilizations"]), "singularities": len(u["singularities"]),
        "avgReputation": (u["metrics"][-1]["avgReputation"] if u["metrics"] else 50),
        "terrain": u["environment"]["terrain"], "climate": u["environment"]["climate"],
    }


@router.post("/universes")
async def genesis(spec: GenesisSpec):
    count = await db.cloud_universes.count_documents({})
    if count >= 50:
        raise HTTPException(status_code=429, detail="Multiverse capacity reached (50 universes)")
    u = create_universe(spec.name, spec.physicsModel, spec.terrainType, spec.climateProfile, spec.agentCount)
    await db.cloud_universes.insert_one({**u, "_id": u["id"]})
    await _log(u["id"], "genesis", f"Universe {u['name']} born — {u['physics']['model']} physics, {len(u['agents'])} agents, {len(u['civilizations'])} civilizations")
    return _summary(u)


@router.get("/universes")
async def list_universes():
    docs = await db.cloud_universes.find({}).to_list(60)
    return {"universes": [_summary(d) for d in docs]}


@router.get("/universes/{uid}")
async def universe_detail(uid: str):
    u = await db.cloud_universes.find_one({"_id": uid})
    if not u:
        raise HTTPException(status_code=404, detail="Universe not found")
    u.pop("_id", None)
    agents = sorted([a for a in u["agents"] if a["alive"]], key=lambda a: -a["reputation"])[:15]
    events = await db.cloud_events.find({"universe_id": uid}, {"_id": 0}).sort("ts", -1).to_list(30)
    return {"summary": _summary(u), "physics": u["physics"], "environment": u["environment"],
            "dimensions": u["dimensions"], "agents": agents, "civilizations": u["civilizations"],
            "myths": u["myths"][:8], "metrics": u["metrics"], "events": events,
            "singularities": u["singularities"], "flags": {"auditMode": u["auditMode"], "evolutionFrozen": u["evolutionFrozen"]}}


@router.post("/universes/{uid}/tick")
async def tick(uid: str, body: TickBody):
    u = await db.cloud_universes.find_one({"_id": uid})
    if not u:
        raise HTTPException(status_code=404, detail="Universe not found")
    events = []
    for _ in range(min(max(body.steps, 1), 25)):
        tick_universe(u, events)
    for kind, text in events[-12:]:
        await _log(uid, kind, text)
    await db.cloud_universes.replace_one({"_id": uid}, u)
    u.pop("_id", None)
    return {"summary": _summary(u), "events": [{"kind": k, "text": t} for k, t in events[-12:]]}


@router.delete("/universes/{uid}")
async def delete_universe(uid: str):
    res = await db.cloud_universes.delete_one({"_id": uid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Universe not found")
    await db.cloud_events.delete_many({"universe_id": uid})
    return {"deleted": uid}


@router.post("/migrate")
async def migrate(body: MigrateBody):
    src = await db.cloud_universes.find_one({"_id": body.source})
    dst = await db.cloud_universes.find_one({"_id": body.target})
    if not src or not dst:
        raise HTTPException(status_code=404, detail="Universe not found")
    if src["physics"]["entropy"] > 0.9 or dst["stability"] < 0.3:
        raise HTTPException(status_code=409, detail="Migration validation failed — source divergence or target instability too high")
    movers = [a for a in src["agents"] if a["alive"]][:min(max(body.count, 1), 20)]
    if not movers:
        raise HTTPException(status_code=409, detail="No living agents to migrate")
    ids = {a["id"] for a in movers}
    src["agents"] = [a for a in src["agents"] if a["id"] not in ids]
    dst["agents"] = (dst["agents"] + movers)[:60]
    await db.cloud_universes.replace_one({"_id": body.source}, src)
    await db.cloud_universes.replace_one({"_id": body.target}, dst)
    await _log(body.target, "migration", f"{len(movers)} agents migrated from {src['name']} to {dst['name']}")
    return {"migrated": len(movers), "from": src["name"], "to": dst["name"]}


@router.post("/synthesize")
async def synthesize(body: SynthesizeBody):
    ua = await db.cloud_universes.find_one({"_id": body.a})
    ub = await db.cloud_universes.find_one({"_id": body.b})
    if not ua or not ub:
        raise HTTPException(status_code=404, detail="Universe not found")
    merged = create_universe(f"{ua['name']} ⊕ {ub['name']}", "standard", ua["environment"]["terrain"], ub["environment"]["climate"], 0)
    merged["physics"] = {
        "model": "synthesis",
        "gravity": round((ua["physics"]["gravity"] + ub["physics"]["gravity"]) / 2, 3),
        "entropy": round(max(ua["physics"]["entropy"], ub["physics"]["entropy"]), 4),
        "tunneling": ua["physics"].get("tunneling") or ub["physics"].get("tunneling"),
    }
    merged["agents"] = (ua["agents"] + ub["agents"])[:60]
    merged["civilizations"] = (ua["civilizations"] + ub["civilizations"])[:3]
    merged["dimensions"] = (ua["dimensions"] + ub["dimensions"])[:12]
    merged["myths"] = (ua["myths"] + ub["myths"])[:20]
    merged["knowledge"] = ua["knowledge"] + ub["knowledge"]
    merged["population"] = sum(c["population"] for c in merged["civilizations"]) + len(merged["agents"])
    await db.cloud_universes.insert_one({**merged, "_id": merged["id"]})
    await db.cloud_universes.delete_one({"_id": body.a})
    await db.cloud_universes.delete_one({"_id": body.b})
    await _log(merged["id"], "synthesis", f"OMNI-SYNTHESIS: {ua['name']} and {ub['name']} fused into {merged['name']}")
    return _summary(merged)


@router.post("/trade")
async def trade(body: TradeBody):
    src = await db.cloud_universes.find_one({"_id": body.source})
    dst = await db.cloud_universes.find_one({"_id": body.target})
    if not src or not dst:
        raise HTTPException(status_code=404, detail="Universe not found")
    if body.commodity not in COMMODITIES:
        raise HTTPException(status_code=400, detail=f"Commodity must be one of {COMMODITIES}")
    stability = round((src["stability"] + dst["stability"]) / 2, 3)
    if stability < 0.4:
        raise HTTPException(status_code=409, detail="Trade route unstable")
    amount = min(max(body.amount, 1), 10000)
    if body.commodity == "knowledge":
        dst["knowledge"] += amount
    else:
        dst["energyFlow"] = _clamp(dst["energyFlow"] + amount / 10000)
    await db.cloud_universes.replace_one({"_id": body.target}, dst)
    await _log(body.target, "trade", f"{src['name']} delivered {amount} {body.commodity} to {dst['name']} (route stability {stability})")
    return {"delivered": amount, "commodity": body.commodity, "routeStability": stability}


@router.get("/congress")
async def congress():
    doc = await db.cloud_congress.find_one({"_id": "congress"}) or {"resolutions": []}
    universes = await db.cloud_universes.count_documents({})
    return {"memberUniverses": universes, "resolutions": doc.get("resolutions", [])[-20:][::-1]}


@router.post("/congress/resolutions")
async def propose(body: ResolutionBody):
    r = {"id": str(uuid.uuid4())[:8], "title": body.title[:120], "content": body.content[:500],
         "passed": None, "proposed": _now()}
    await db.cloud_congress.update_one({"_id": "congress"}, {"$push": {"resolutions": r}}, upsert=True)
    return r


@router.post("/congress/resolutions/{rid}/vote")
async def vote(rid: str):
    doc = await db.cloud_congress.find_one({"_id": "congress"})
    if not doc:
        raise HTTPException(status_code=404, detail="No congress formed")
    votes = await db.cloud_universes.count_documents({})
    passed = random.random() < (max(votes, 1) / (max(votes, 1) + 5))
    res = await db.cloud_congress.update_one(
        {"_id": "congress", "resolutions.id": rid},
        {"$set": {"resolutions.$.passed": passed, "resolutions.$.voted": _now(), "resolutions.$.votes": votes}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Resolution not found")
    return {"id": rid, "passed": passed, "votes": votes}


@router.get("/kernel")
async def kernel_status():
    docs = await db.cloud_universes.find({}).to_list(60)
    total_agents = sum(sum(1 for a in d["agents"] if a["alive"]) for d in docs)
    ascended = sum(sum(1 for a in d["agents"] if a["ascension"]["tier"] > 0) for d in docs)
    avg_entropy = round(sum(d["physics"]["entropy"] for d in docs) / len(docs), 3) if docs else 0
    avg_stability = round(sum(d["stability"] for d in docs) / len(docs), 3) if docs else 1
    posture = "strict" if any(d["posture"] == "strict" for d in docs) else "normal"
    return {
        "omniIntelligence": "online",
        "universes": len(docs),
        "agents": total_agents,
        "ascendedAgents": ascended,
        "totalPopulation": sum(d["population"] for d in docs),
        "avgEntropy": avg_entropy,
        "avgStability": avg_stability,
        "posture": posture,
        "collapsesRecovered": sum(d["collapses"] for d in docs),
        "paradoxesResolved": sum(d["paradoxesResolved"] for d in docs),
        "singularities": sum(len(d["singularities"]) for d in docs),
        "absoluteLaws": ABSOLUTE_LAWS,
    }
