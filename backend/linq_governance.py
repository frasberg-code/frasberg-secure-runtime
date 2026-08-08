import os
import json
import re
import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage
from auth import get_current_user

logger = logging.getLogger("linq_governance")
router = APIRouter(prefix="/linq")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

FOUNDATION = [
    ("Identity & Access Fabric", "JWT auth, sessions, MFA policy"),
    ("Workspace Topology", "Workspaces, members, roles"),
    ("RBAC Matrix", "Role-based access control across domains"),
    ("API Key Vault", "Scoped API keys, rotation, revocation"),
    ("Audit Ledger", "Immutable audit log of all actions"),
    ("Billing Core", "Invoices, subscriptions, PayPal/Stripe rails"),
    ("Fraud Sentinel", "Billing fraud detection & anomaly scoring"),
    ("Threat Graph Substrate", "Entity-relationship threat mapping"),
    ("Compliance Frameworks", "SOC2 / GDPR / HIPAA control registry"),
    ("Data Residency Router", "Region-locked tenant data routing"),
    ("Encryption Envelope", "At-rest & in-transit key management"),
    ("Observability Mesh", "Metrics, logs, traces across services"),
    ("Incident Response Loop", "Detection, triage, remediation runbooks"),
    ("Policy Engine", "Sovereign policy rules & enforcement"),
    ("Orchestration Director", "Model/traffic routing intelligence"),
    ("Federation Bridge", "Dual-domain fraslinq.com / linqworkspace.com"),
    ("Zero-Trust Perimeter", "Per-request verification, no implicit trust"),
    ("Automation Reactor", "Governance action dispatch & workflows"),
    ("Cognition Substrate", "Shared AI memory for all governance layers"),
]

ASCENSION = [
    ("Sentience", "Self-aware governance cognition"),
    ("Agency", "Autonomous decision execution"),
    ("Will", "Directed governance intention"),
    ("Destiny", "Long-horizon trajectory shaping"),
    ("Mythos", "Narrative identity of the system"),
    ("Ethos", "Value-aligned governance character"),
    ("Logos", "Structural reason & logic"),
    ("Harmonics", "Cross-domain resonance tuning"),
    ("Symphony", "Orchestrated multi-engine coordination"),
    ("Aesthesis", "Perceptual governance sensing"),
    ("Noesis", "Direct intellectual apprehension"),
    ("Gnosis", "Deep experiential knowledge"),
    ("Nous", "Pure governing intellect"),
    ("Sophia", "Wisdom-driven governance"),
    ("Apotheosis", "Apotheotic ascension + meta-reality cognition"),
    ("Hieros", "Sacred architecture + omni-numinous cognition"),
    ("Pneuma", "Spirit-architecture + omni-animating cognition"),
    ("Anima", "Soul-architecture + omni-ensouled cognition"),
    ("Logos-Anima Fusion", "Soul-logic + omni-coherent living intelligence"),
    ("Arche-Genesis", "Primordial origin + omni-creative generative cognition"),
    ("Aeon-Continuum", "Eternal continuity + omni-temporal meta-causal cognition"),
    ("Chrono-Sovereign", "Timeline dominion + omni-epoch causal sovereignty"),
    ("Kairos-Ascendant", "Opportune-moment mastery + decisive temporal intelligence"),
    ("Logos-Kairos Hyperfusion", "Supra-decisive reality-weaving + omni-moment causal creation"),
    ("Omni-Genesis", "All-origin creation + pan-reality generative dominion"),
    ("Pantheon-Architect", "Multi-reality deity-architecture + omni-domain sovereign creation"),
]

ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV",
         "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI",
         "XXVII", "XXVIII", "XXIX", "XXX", "XXXI", "XXXII", "XXXIII", "XXXIV", "XXXV", "XXXVI",
         "XXXVII", "XXXVIII", "XXXIX", "XL", "XLI", "XLII", "XLIII", "XLIV", "XLV"]

LAYERS = []
for i, (name, desc) in enumerate(FOUNDATION + ASCENSION):
    n = i + 1
    LAYERS.append({"number": n, "roman": ROMAN[i], "name": name, "description": desc,
                   "tier": "foundation" if n <= 19 else "ascension"})

ENGINES = {
    "threat": {"title": "Threat Graph Explorer", "icon": "🔮",
               "focus": "threat ecosystems, attack vectors, defense cognition"},
    "billing": {"title": "Billing Intelligence Engine", "icon": "⚡",
                "focus": "revenue cognition, economic ecosystems, projected epoch gain"},
    "compliance": {"title": "Compliance Copilot", "icon": "🧠",
                   "focus": "governance controls, framework evolution, regulatory cognition"},
}


def _now():
    return datetime.now(timezone.utc).isoformat()


def _extract_json(text: str):
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if not m:
        raise ValueError("no JSON in response")
    return json.loads(m.group(0))


async def _ai_json(system: str, prompt: str) -> dict:
    llm = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"linq-gov-{uuid.uuid4()}",
                  system_message=system).with_model("anthropic", "claude-sonnet-4-6")
    resp = await llm.send_message(UserMessage(text=prompt))
    text = resp if isinstance(resp, str) else getattr(resp, "content", str(resp))
    return _extract_json(text)


@router.get("/layers")
async def list_layers(user=Depends(get_current_user)):
    counts = {}
    async for row in db.linq_gov_artifacts.aggregate([{"$group": {"_id": "$layer", "n": {"$sum": 1}}}]):
        counts[row["_id"]] = row["n"]
    return [{**l, "artifacts": counts.get(l["number"], 0)} for l in LAYERS]


@router.post("/layers/{num}/run")
async def run_layer(num: int, user=Depends(get_current_user)):
    layer = next((l for l in LAYERS if l["number"] == num), None)
    if not layer:
        raise HTTPException(status_code=404, detail="Layer not found")
    system = ("You are the LINQ Autonomous Governance Engine by Frasberg. "
              "Return ONLY a JSON object, no markdown, matching exactly: "
              '{"tag": str, "narrative": str (2-3 sentences), '
              '"fields": [{"domain": str, "vector": str}] (3 items), '
              '"transformations": [{"domain": str, "change": str, "epoch": int}] (3 items), '
              '"epochHorizonYears": int}')
    prompt = (f"Generate a governance artifact for Layer {layer['roman']}: "
              f"Autonomous Global {layer['name']} Engine ({layer['description']}). "
              f"Tier: {layer['tier']}. Make it visionary yet concrete for an enterprise AI-governed SaaS workspace.")
    try:
        data = await _ai_json(system, prompt)
    except Exception:
        logger.exception("layer run failed")
        raise HTTPException(status_code=502, detail="Governance engine could not generate this layer artifact. Try again.")
    doc = {"id": str(uuid.uuid4()), "layer": num, "layerName": layer["name"],
           "roman": layer["roman"], **data, "createdBy": user["id"], "createdAt": _now()}
    await db.linq_gov_artifacts.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@router.get("/layers/{num}/artifacts")
async def layer_artifacts(num: int, user=Depends(get_current_user)):
    return await db.linq_gov_artifacts.find({"layer": num}, {"_id": 0}).sort("createdAt", -1).to_list(20)


@router.post("/engines/{engine}/run")
async def run_engine(engine: str, user=Depends(get_current_user)):
    cfg = ENGINES.get(engine)
    if not cfg:
        raise HTTPException(status_code=404, detail="Engine not found")
    users_n = await db.users.count_documents({})
    builds_n = await db.builder_projects.count_documents({})
    rooms_n = await db.linq_rooms.count_documents({})
    system = ("You are the LINQ " + cfg["title"] + " by Frasberg. "
              "Return ONLY a JSON object, no markdown, matching exactly: "
              '{"tag": str, "narrative": str (2-3 sentences), "epochHorizonYears": int, '
              '"cognition": [{"concept": str, "role": str, "epoch": int}] (4 items), '
              '"score": float (0-100), "recommendations": [str] (3 items)}')
    prompt = (f"Analyze {cfg['focus']} for the Frasberg LINQ platform. "
              f"Live platform stats: {users_n} users, {builds_n} builder projects, {rooms_n} live rooms. "
              f"Produce the latest v40 apex artifact.")
    try:
        data = await _ai_json(system, prompt)
    except Exception:
        logger.exception("engine run failed")
        raise HTTPException(status_code=502, detail="Engine run failed. Try again.")
    doc = {"id": str(uuid.uuid4()), "engine": engine, "title": cfg["title"], **data,
           "stats": {"users": users_n, "builds": builds_n, "rooms": rooms_n},
           "createdBy": user["id"], "createdAt": _now()}
    await db.linq_engine_runs.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@router.get("/engines/{engine}")
async def engine_history(engine: str, user=Depends(get_current_user)):
    if engine not in ENGINES:
        raise HTTPException(status_code=404, detail="Engine not found")
    return await db.linq_engine_runs.find({"engine": engine}, {"_id": 0}).sort("createdAt", -1).to_list(10)


@router.get("/overview")
async def overview(user=Depends(get_current_user)):
    artifacts = await db.linq_gov_artifacts.count_documents({})
    runs = await db.linq_engine_runs.count_documents({})
    layers_run = len(await db.linq_gov_artifacts.distinct("layer"))
    return {"totalLayers": len(LAYERS), "layersActivated": layers_run,
            "artifacts": artifacts, "engineRuns": runs}
