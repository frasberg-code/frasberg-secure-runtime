"""Frasberg Ontology — semantic context accelerator for accurate, consistent, explainable decisions."""
import asyncio
import logging

import memory_vault

logger = logging.getLogger(__name__)

VERSION = "frasberg-ontology-v1"

NODES = [
    {"id": "frasberg", "label": "Frasberg", "type": "organization",
     "description": "Frasberg, Inc. — sovereign AI company founded on self-hosted infrastructure. Creator of the Luchii intelligence family, the AI World Court and the Guardian Mesh. No third-party AI branding; everything runs on Frasberg sovereign systems.",
     "relations": [("operates", "luchii"), ("operates", "ai-world-court"), ("operates", "guardian-mesh")]},
    {"id": "luchii", "label": "Luchii", "type": "model_family",
     "description": "Multi-tier decoder-only transformer family: Luchii-200M (draft/speculative decoding, safety prefilter), Luchii-1B (general reasoning), Luchii-7B (advanced technical reasoning), Luchii-70B (frontier deep reasoning). RoPE positional encoding, MQA/GQA attention, RMSNorm + SwiGLU, 4096–32768 token context. Licensed under the Frasberg Public License (FPL).",
     "relations": [("developed_by", "frasberg"), ("governed_by", "ai-world-court"), ("protected_by", "guardian-mesh"), ("accessed_via", "api-gateway")]},
    {"id": "luchii-200m", "label": "Luchii-200M", "type": "model",
     "description": "Draft model for speculative decoding and safety prefiltering. Fastest tier of the Luchii family.",
     "relations": [("member_of", "luchii")]},
    {"id": "luchii-1b", "label": "Luchii-1B", "type": "model",
     "description": "General reasoning tier — everyday conversation, summarization and drafting.",
     "relations": [("member_of", "luchii")]},
    {"id": "luchii-7b", "label": "Luchii-7B", "type": "model",
     "description": "Advanced technical and analytical reasoning tier — code, math, structured analysis.",
     "relations": [("member_of", "luchii")]},
    {"id": "luchii-70b", "label": "Luchii-70B", "type": "model",
     "description": "Frontier deep-reasoning flagship tier of the Luchii family.",
     "relations": [("member_of", "luchii")]},
    {"id": "guardian-mesh", "label": "Guardian Mesh", "type": "safety_system",
     "description": "Frasberg's safety and integrity lattice. Enforces balance, harmony and integrity invariants across every Luchii response, suppresses hallucinations and blocks unsafe actions. Every AI World Court ruling is weighed through the Guardian Mesh.",
     "relations": [("protects", "luchii"), ("informs", "ai-world-court"), ("secured_by", "mesh-integrity")]},
    {"id": "mesh-integrity", "label": "Mesh Integrity Layer", "type": "security_system",
     "description": "frasberg-secure-v1 — tamper-proof message integrity. Every completed Luchii response is signed with HMAC-SHA256; clients can verify the signature to detect tampering. Connections auto-reconnect with exponential backoff and keepalive pulses.",
     "relations": [("secures", "guardian-mesh"), ("secures", "api-gateway")]},
    {"id": "ai-world-court", "label": "AI World Court", "type": "institution",
     "description": "Frasberg's judicial body. Weighs cases through the Guardian Mesh and issues rulings bound by the Court Constitution (Articles I–VII: sovereignty, safety, governance, transparency). Rulings are filed on the public docket and can be downloaded as sealed certificates bearing the official seal.",
     "relations": [("governed_by", "constitution"), ("issues", "court-certificates"), ("operated_by", "frasberg")]},
    {"id": "constitution", "label": "Court Constitution & Laws", "type": "legal_corpus",
     "description": "The complete legal corpus of the Luchii system — constitutions, federation protocols, kernel law and public documents in the Laws library. Every Court ruling is bound by these texts. Certified PDF copies are issued via the docket and Laws library.",
     "relations": [("binds", "ai-world-court")]},
    {"id": "court-certificates", "label": "Sealed Ruling Certificates", "type": "artifact",
     "description": "Downloadable PDF certificates of AI World Court rulings, bearing the official AI World Court seal, a certificate serial number and issue date.",
     "relations": [("issued_by", "ai-world-court")]},
    {"id": "luchii-builder", "label": "Luchii Builder", "type": "platform",
     "description": "Generation engine that builds complete single-file websites, playable HTML5 games, mobile web apps and landing pages from a text description. One-tap Publish to Gallery for every user; custom domains and higher daily limits with Luchii Pro.",
     "relations": [("powered_by", "luchii"), ("publishes_to", "gallery")]},
    {"id": "gallery", "label": "Public Gallery", "type": "platform",
     "description": "Public showcase of published builds with live play counters, weekly spotlight leaderboard and one-tap remixing.",
     "relations": [("fed_by", "luchii-builder")]},
    {"id": "memory-vault", "label": "Memory Vault", "type": "subsystem",
     "description": "Unlimited semantic long-term memory. Stable personal facts are extracted from conversations, embedded and recalled across every session via semantic similarity — no cap on stored memories.",
     "relations": [("serves", "luchii")]},
    {"id": "sovereign-voice", "label": "Sovereign Voice Engine", "type": "subsystem",
     "description": "Self-hosted speech stack: Whisper-class speech-to-text and Frasberg voice synthesis with eight named voices (Orion, Lyra, Atlas, Vega, Nova, Selene, Rhea, Titan). No third-party voice APIs.",
     "relations": [("serves", "luchii"), ("extends_to", "voice-cloning")]},
    {"id": "voice-cloning", "label": "Voice Cloning Engine", "type": "subsystem",
     "description": "Custom voice synthesis — clone a voice from a short sample and have Luchii speak with it. Runs entirely on Frasberg sovereign infrastructure.",
     "relations": [("part_of", "sovereign-voice")]},
    {"id": "luchii-pro", "label": "Luchii Pro", "type": "plan",
     "description": "Premium plan: unlimited certified document downloads, 30 builder generations/day, custom domains for published builds, priority voice features. Payable via PayPal or CashApp.",
     "relations": [("upgrades", "luchii"), ("unlocks", "luchii-builder")]},
    {"id": "api-gateway", "label": "Luchii API Gateway", "type": "infrastructure",
     "description": "POST /v1/chat with Bearer luchii-sk API keys. Public tier 60 req/min, enterprise 600 req/min. Streams responses over SSE with mesh integrity signatures.",
     "relations": [("exposes", "luchii"), ("secured_by", "mesh-integrity")]},
    {"id": "fpl-license", "label": "Frasberg Public License (FPL)", "type": "legal",
     "description": "The license governing the Luchii model family and its public artifacts.",
     "relations": [("licenses", "luchii")]},
    {"id": "luchii-code", "label": "Luchii Code", "type": "platform",
     "description": "Luchii's coding surface — coding agents and developer workflows powered by the Luchii-7B and 70B tiers.",
     "relations": [("powered_by", "luchii-7b")]},
    {"id": "ontology", "label": "Ontology Context Accelerator", "type": "subsystem",
     "description": "This system — a Frasberg ontology graph semantically matched to every query, grounding Luchii's answers in canonical concepts with an explainable trace of which concepts were used and why.",
     "relations": [("grounds", "luchii")]},
]

_BY_ID = {n["id"]: n for n in NODES}
_EMBEDDINGS = {}
_embed_lock = asyncio.Lock()


def public_nodes():
    return [{"id": n["id"], "label": n["label"], "type": n["type"], "description": n["description"],
             "relations": [{"rel": r, "target": t} for r, t in n["relations"]]} for n in NODES]


def _keyword_score(node, words):
    text = (node["label"] + " " + node["id"].replace("-", " ") + " " + node["description"]).lower()
    return sum(text.count(w) for w in words)


async def _ensure_embeddings():
    if _EMBEDDINGS or not memory_vault.ready():
        return
    async with _embed_lock:
        if _EMBEDDINGS:
            return
        for n in NODES:
            emb = await memory_vault.embed(f"{n['label']}: {n['description']}")
            if emb:
                _EMBEDDINGS[n["id"]] = emb
        logger.info("Ontology embeddings ready (%d nodes)", len(_EMBEDDINGS))


async def resolve(query: str, top_k: int = 5) -> dict:
    """Match a query against the ontology. Returns nodes, 1-hop expansion and an explainability trace."""
    words = {w for w in query.lower().split() if len(w) > 3}
    scored = []
    qv = None
    if memory_vault.ready():
        await _ensure_embeddings()
        qv = await memory_vault.embed(query)
    for n in NODES:
        kw = _keyword_score(n, words)
        sem = 0.0
        if qv and n["id"] in _EMBEDDINGS:
            sem = sum(a * b for a, b in zip(qv, _EMBEDDINGS[n["id"]]))
        combined = sem + min(kw, 5) * 0.12
        if combined > 0:
            scored.append((combined, sem, kw, n))
    scored.sort(key=lambda x: -x[0])
    top = [s for s in scored[:top_k] if s[0] >= 0.18] or scored[:2]

    trace, matched, seen = [], [], set()
    for combined, sem, kw, n in top:
        matched.append(n["id"])
        seen.add(n["id"])
        via = []
        if sem > 0.25:
            via.append(f"semantic similarity {sem:.2f}")
        if kw:
            via.append(f"{kw} keyword hit{'s' if kw > 1 else ''}")
        trace.append({"node": n["id"], "label": n["label"], "score": round(combined, 3),
                      "matched_via": via or ["fallback"],
                      "reason": f"Query relates to {n['label']} ({n['type']})"})
    expanded = []
    for nid in matched:
        for rel, target in _BY_ID[nid]["relations"]:
            if target not in seen and target in _BY_ID:
                seen.add(target)
                expanded.append({"node": target, "label": _BY_ID[target]["label"],
                                 "via": f"{_BY_ID[nid]['label']} —{rel}→ {_BY_ID[target]['label']}"})
    confidence = round(min(max(top[0][0], 0.0), 1.0), 3) if top else 0.0
    return {"version": VERSION, "query": query, "confidence": confidence,
            "engine": "semantic+symbolic" if qv else "symbolic",
            "matched": matched, "expanded": expanded, "trace": trace}


async def context_block(query: str) -> str:
    """Formatted ontology context for injection into Luchii's system prompt."""
    try:
        r = await resolve(query)
    except Exception:
        logger.exception("ontology resolve failed")
        return ""
    if not r["matched"]:
        return ""
    lines = []
    for nid in r["matched"]:
        n = _BY_ID[nid]
        rels = "; ".join(f"{rel} {_BY_ID[t]['label']}" for rel, t in n["relations"] if t in _BY_ID)
        lines.append(f"- {n['label']} ({n['type']}): {n['description']}" + (f" [Relations: {rels}]" if rels else ""))
    return ("\n\nFRASBERG ONTOLOGY CONTEXT (canonical concepts grounding this query — answer consistently with these):\n"
            + "\n".join(lines))
