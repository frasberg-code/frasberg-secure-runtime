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


def setup(database):
    global db
    db = database


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
    }


def _tick(state):
    k = state["kernel"]
    k["tick"] += 1
    k["load"] = round(min(0.95, max(0.05, k["load"] + random.uniform(-0.08, 0.08))), 2)
    for n in NODES:
        state["nodes"][n] = round(min(1.0, max(0.05, state["nodes"][n] + random.uniform(-0.15, 0.15))), 2)
    state["pulses"] = random.sample(range(len(EDGES)), k=random.randint(2, 4))
    for i in state["pulses"]:
        a, b = EDGES[i]
        state["nodes"][b] = round(min(1.0, state["nodes"][b] + 0.1), 2)
    for ag in state["agents"]:
        if random.random() < 0.3:
            ag["state"] = "running" if ag["name"] == "kernel-scheduler" else random.choice(STATES)
        ag["cpu"] = round(min(98, max(1, ag["cpu"] + random.uniform(-8, 8))), 1)
        ag["mem"] = round(min(900, max(60, ag["mem"] + random.uniform(-30, 30))))
        ag["msgs"] += random.randint(0, 14)
    tmpl = random.choice(EVENT_TEMPLATES)
    evt = tmpl.format(n=random.randint(100, 999), s=random.randint(80, 99),
                      v=f"1.{random.randint(0, 4)}.{random.randint(1, 9)}",
                      d=random.randint(2, 18), q=random.randint(2, 48))
    state["events"] = ([{"at": datetime.now(timezone.utc).isoformat(), "tick": k["tick"], "text": evt}]
                       + state["events"])[:40]
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
    return {"kernel": k, "nodes": state["nodes"], "pulses": state["pulses"],
            "edges": EDGES, "agents": state["agents"], "events": state["events"]}


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
