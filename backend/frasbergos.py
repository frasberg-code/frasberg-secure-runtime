import random
import time
from datetime import datetime, timezone

from fastapi import APIRouter

db = None
router = APIRouter(prefix="/os")

NODES = ["percept", "ctx", "mem", "plan", "reason", "safety", "tools", "mutate", "evolve", "out"]
EDGES = [
    ("percept", "ctx"), ("ctx", "mem"), ("mem", "plan"), ("ctx", "plan"),
    ("plan", "reason"), ("reason", "safety"), ("safety", "tools"), ("tools", "reason"),
    ("reason", "out"), ("safety", "out"), ("reason", "mutate"), ("mutate", "evolve"), ("evolve", "plan"),
]
AGENT_SEED = [
    {"pid": 101, "name": "luchii-builder", "role": "Builder"},
    {"pid": 102, "name": "luchii-realtime", "role": "Realtime"},
    {"pid": 103, "name": "zion-support", "role": "Support"},
    {"pid": 104, "name": "gss2-auditor", "role": "Safety"},
    {"pid": 105, "name": "mutation-classifier", "role": "Evolution"},
    {"pid": 106, "name": "kernel-scheduler", "role": "Kernel"},
]
REGION_SEED = [
    {"id": "us-west", "name": "US West", "x": 130, "y": 158},
    {"id": "us-east", "name": "US East", "x": 225, "y": 148},
    {"id": "eu-central", "name": "EU Central", "x": 415, "y": 108},
    {"id": "ap-south", "name": "AP South", "x": 590, "y": 215},
]
STATES = ["running", "running", "running", "waiting", "evolving", "sandboxed"]
EVENT_TEMPLATES = [
    "reason→safety: plan #{n} cleared (score 0.{s})",
    "safety-membrane: tool call quarantined — delegation depth exceeded",
    "mutation-classifier: candidate v{v} accepted (+{d}% benchmark)",
    "mutation-classifier: candidate v{v} rejected (regression detected)",
    "kernel: rebalanced {q} agent quanta across scheduler ring",
    "memory-vault: consolidated {q} episodic traces into semantic store",
    "evolution-engine: lineage checkpoint written (GSS-2 band verified)",
    "percept→ctx: multimodal frame ingested ({q}ms latency)",
    "identity-membrane: cross-agent message signed and verified",
    "tools: sandboxed execution completed — {q} side effects audited",
]


SCENARIOS = {
    "threat_surge": {
        "label": "Threat surge", "duration": 8,
        "boost": ["safety", "mutate"], "agent_state": "sandboxed", "load": 0.18,
        "events": [
            "THREAT: hinge logic closed {q} intents — anomalous delegation pattern",
            "safety-membrane: {q} tool calls quarantined under surge protocol",
            "classifier-v3: risk spike 0.{s} — cognition edges throttled",
            "identity-membrane: impersonation attempt blocked and fingerprinted",
            "kernel: threat surge active — non-critical agents sandboxed",
        ]},
    "evolution_burst": {
        "label": "Evolution burst", "duration": 8,
        "boost": ["mutate", "evolve", "plan"], "agent_state": "evolving", "load": 0.10,
        "events": [
            "evolution-engine: burst cycle — {q} mutation candidates queued",
            "mutation-classifier: candidate v{v} accepted (+{d}% benchmark)",
            "evolution-engine: lineage checkpoint v{v} written (GSS-2 verified)",
            "mutation-classifier: candidate v{v} rejected — determinism invariant violated",
            "kernel: evolution burst — validated improvement cycles accelerated",
        ]},
    "region_failover": {
        "label": "Region failover", "duration": 8,
        "boost": ["ctx", "mem"], "agent_state": "waiting", "load": 0.22,
        "events": [
            "AIM v2: us-west degraded — rerouting {q} tasks to us-east",
            "memoryfs-v4: replication verified — {q} shards synced to failover region",
            "federation: region handshake complete — identity verified",
            "kernel: region lock engaged — cognition graph redistributed",
            "AIM v2: failover routing stable ({q}ms cross-region latency)",
        ]},
}


def setup(database):
    global db
    db = database


def _fresh_regions():
    return [{**r, "status": "healthy", "load": round(random.uniform(0.2, 0.5), 2),
             "safety": random.randint(88, 98), "agents": random.randint(40, 220)} for r in REGION_SEED]


def _fresh_state():
    return {
        "id": "global",
        "kernel": {"version": "v4", "tick": 0, "scheduler": "preemptive-fair", "membrane": "GSS-2 enforced",
                   "region": "us-west", "load": 0.31, "started_at": time.time()},
        "nodes": {n: round(random.uniform(0.2, 0.6), 2) for n in NODES},
        "pulses": [],
        "agents": [{**a, "state": "running", "cpu": round(random.uniform(4, 30), 1),
                    "mem": round(random.uniform(80, 400)), "msgs": random.randint(10, 200)} for a in AGENT_SEED],
        "events": [],
        "scenario": None,
        "node_stats": {n: {"traffic": 0, "safety": random.randint(82, 98), "last_pulse_tick": None} for n in NODES},
        "regions": _fresh_regions(),
    }


def _tick(state):
    k = state["kernel"]
    k["tick"] += 1
    sc = state.get("scenario")
    spec = SCENARIOS.get(sc["name"]) if sc else None
    stats = state.setdefault("node_stats", {n: {"traffic": 0, "safety": random.randint(82, 98), "last_pulse_tick": None} for n in NODES})
    regions = state.setdefault("regions", _fresh_regions())
    failover_active = bool(spec and sc["name"] == "region_failover")
    for r in regions:
        bias = 0
        if failover_active:
            if r["id"] == "us-west":
                r["status"] = "degraded"
                bias = 0.12
            elif r["id"] == "us-east":
                r["status"] = "failover"
                bias = 0.18
            else:
                r["status"] = "healthy"
        else:
            r["status"] = "healthy"
        r["load"] = round(min(0.97, max(0.08, r["load"] + random.uniform(-0.06, 0.06) + bias * 0.4)), 2)
        r["safety"] = min(99, max(60, r["safety"] + (-random.randint(0, 2) if r["status"] == "degraded" else random.choice([-1, 0, 1]))))
        r["agents"] = max(10, r["agents"] + random.randint(-6, 8))
    load_bias = spec["load"] if spec else 0
    k["load"] = round(min(0.95, max(0.05, k["load"] + random.uniform(-0.08, 0.08) + load_bias * 0.4)), 2)
    if spec and sc["name"] == "region_failover":
        k["region"] = "us-east (failover)"
    for n in NODES:
        drift = random.uniform(-0.15, 0.15)
        if spec and n in spec["boost"]:
            drift += 0.22
        state["nodes"][n] = round(min(1.0, max(0.05, state["nodes"][n] + drift)), 2)
        if spec and sc["name"] == "threat_surge" and n not in spec["boost"]:
            stats[n]["safety"] = max(55, stats[n]["safety"] - random.randint(0, 3))
        elif random.random() < 0.2:
            stats[n]["safety"] = min(99, max(55, stats[n]["safety"] + random.choice([-1, 1])))
    if spec:
        boosted = [i for i, (a, b) in enumerate(EDGES) if a in spec["boost"] or b in spec["boost"]]
        state["pulses"] = random.sample(boosted, k=min(len(boosted), random.randint(3, 5)))
    else:
        state["pulses"] = random.sample(range(len(EDGES)), k=random.randint(2, 4))
    for i in state["pulses"]:
        a, b = EDGES[i]
        state["nodes"][b] = round(min(1.0, state["nodes"][b] + 0.1), 2)
        stats[b]["traffic"] += 1
        stats[b]["last_pulse_tick"] = k["tick"]
        stats[a]["traffic"] += 1
    for ag in state["agents"]:
        if ag["name"] == "kernel-scheduler":
            ag["state"] = "running"
        elif spec and random.random() < 0.5:
            ag["state"] = spec["agent_state"]
        elif random.random() < 0.3:
            ag["state"] = random.choice(STATES)
        ag["cpu"] = round(min(98, max(1, ag["cpu"] + random.uniform(-8, 8) + (10 if spec else 0))), 1)
        ag["mem"] = round(min(900, max(60, ag["mem"] + random.uniform(-30, 30))))
        ag["msgs"] += random.randint(0, 14)
    tmpl = random.choice(spec["events"]) if spec else random.choice(EVENT_TEMPLATES)
    evt = tmpl.format(n=random.randint(100, 999), s=random.randint(80, 99),
                      v=f"1.{random.randint(0, 4)}.{random.randint(1, 9)}",
                      d=random.randint(2, 18), q=random.randint(2, 48))
    events = [{"at": datetime.now(timezone.utc).isoformat(), "tick": k["tick"], "text": evt}]
    if spec:
        sc["remaining"] -= 1
        if sc["remaining"] <= 0:
            state["scenario"] = None
            k["region"] = "us-west"
            events.insert(0, {"at": datetime.now(timezone.utc).isoformat(), "tick": k["tick"],
                              "text": f"kernel: {spec['label'].lower()} resolved — steady state restored"})
    state["events"] = (events + state["events"])[:40]
    return state


async def _load():
    state = await db.os_sim.find_one({"id": "global"}, {"_id": 0})
    if not state:
        state = _fresh_state()
        await db.os_sim.insert_one({**state})
    return state


def _public(state):
    k = dict(state["kernel"])
    k["uptime_s"] = int(time.time() - k.pop("started_at", time.time()))
    sc = state.get("scenario")
    scenario = {"name": sc["name"], "label": SCENARIOS[sc["name"]]["label"], "remaining": sc["remaining"]} if sc else None
    return {"kernel": k, "nodes": state["nodes"], "pulses": state["pulses"],
            "edges": EDGES, "agents": state["agents"], "events": state["events"],
            "scenario": scenario,
            "node_stats": state.get("node_stats", {}),
            "regions": state.get("regions", _fresh_regions())}


@router.get("/state")
async def get_state():
    return _public(await _load())


@router.post("/tick")
async def tick():
    state = _tick(await _load())
    await db.os_sim.replace_one({"id": "global"}, state, upsert=True)
    return _public(state)


@router.post("/reset")
async def reset():
    state = _fresh_state()
    await db.os_sim.replace_one({"id": "global"}, state, upsert=True)
    return _public(state)


from pydantic import BaseModel, Field


class ScenarioBody(BaseModel):
    name: str = Field(pattern=r"^(threat_surge|evolution_burst|region_failover)$")


@router.post("/scenario")
async def start_scenario(body: ScenarioBody):
    state = await _load()
    spec = SCENARIOS[body.name]
    state["scenario"] = {"name": body.name, "remaining": spec["duration"]}
    if body.name != "region_failover":
        state["kernel"]["region"] = "us-west"
    state["events"] = ([{"at": datetime.now(timezone.utc).isoformat(), "tick": state["kernel"]["tick"],
                         "text": f"kernel: SCENARIO INJECTED — {spec['label'].lower()} ({spec['duration']} ticks)"}]
                       + state["events"])[:40]
    state = _tick(state)
    await db.os_sim.replace_one({"id": "global"}, state, upsert=True)
    return _public(state)
