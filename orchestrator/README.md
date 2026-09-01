# Frasberg Orchestrator — Unified Multi-Modal Runtime (v1)

The Frasberg Orchestrator is the unified, multi-modal, multi-agent runtime that coordinates all Frasberg engines: voice, video, audio, 3D, spaces, agents, routing, billing, and governance.

It is the **backbone of the Frasberg Universe**.

---

## 1. What the Orchestrator Does

The Orchestrator manages:
- **Multi-modal pipelines** (voice → video → 3D → spaces)
- **Agent-driven workflows** (Emergent Agent, Frasberg Agents)
- **Multi-region GPU routing** (auto, fixed, fallback)
- **Async job lifecycle** (queued → running → completed)
- **Governance enforcement** (safety, compliance, audit)
- **Billing + credit metering** (per-stage breakdown)
- **CDN asset delivery** (global edge cache)
- **Audit logging** (immutable records)

It is the system that turns **individual engines** into a **coherent universe**.

---

## 2. Core Concepts

### **Job**
A single orchestrated workflow containing multiple stages.

Example:
```json
{
  "job_id": "job_abc123",
  "tenant_id": "tenant_456",
  "status": "running",
  "pipeline": { "stages": [...] },
  "region": "us-west-2"
}
```

### **Pipeline**
A DAG (directed acyclic graph) of stages:
- **TTS** — Text-to-Speech (Echo)
- **STT** — Speech-to-Text
- **Speech-to-Speech** — Voice identity transformation
- **Video generation** — Text-to-video (Frasberg Engine v2)
- **Audio generation** — Sound effects, music
- **3D scene generation** — Spatial scenes
- **Space building** — Interactive metaverse spaces
- **Agent execution** — Agent-driven tasks

### **Stage**
A unit of work executed by a Frasberg engine or agent.

Example:
```json
{
  "id": "tts_1",
  "type": "tts",
  "inputs": { "text": "Hello world", "voice_id": "echo_default" },
  "outputs": { "audio_url": "https://cdn.frasberg.com/audio/tts_1.mp3" },
  "depends_on": []
}
```

### **Region**
A GPU cluster where jobs run.

Available regions:
- `us-west-2` (default)
- `us-east-1`
- `eu-central-1`
- `ap-southeast-1`

### **Governance**
Policy enforcement, safety checks, audit logs.

### **Billing**
Credit estimation + actual usage tracking.

---

## 3. Job Lifecycle

```
1. Create job → POST /orchestrator/v1/jobs
   ↓
2. Orchestrator selects region → based on load, latency, governance
   ↓
3. Stages execute → in dependency order
   ↓
4. Outputs produced → audio, video, 3D scenes, spaces
   ↓
5. Billing + governance applied → credits deducted, audit log created
   ↓
6. Job completes → GET /orchestrator/v1/jobs/{job_id}
```

---

## 4. Pipeline Structure

A pipeline is a DAG with stages and dependencies:

```json
{
  "stages": [
    {
      "id": "tts_1",
      "type": "tts",
      "inputs": { "text": "Hello", "voice_id": "echo_v1" },
      "outputs": {}
    },
    {
      "id": "video_1",
      "type": "video_generate",
      "depends_on": ["tts_1"],
      "inputs": {
        "prompt": "Speaker in a neon studio",
        "audio_stage_id": "tts_1",
        "duration": 5
      },
      "outputs": {}
    }
  ]
}
```

**Supported stage types:**
- `tts` — Text-to-speech
- `stt` — Speech-to-text
- `speech_to_speech` — Voice identity transform
- `audio_generate` — Audio generation
- `video_generate` — Video generation
- `3d_scene` — 3D scene generation
- `space_build` — Space builder
- `agent_run` — Agent execution

---

## 5. Multi-Region Routing

### Routing Modes

**auto** (default)
```json
{
  "region": "auto",
  "routing": {
    "preferred_regions": ["us-west-2", "us-east-1"],
    "forbidden_regions": ["cn-*"],
    "latency_budget_ms": 200
  }
}
```
Orchestrator chooses best region based on:
- GPU load
- Latency
- Tenant constraints
- Governance rules

**fixed**
```json
{
  "region": "eu-central-1"
}
```
Tenant pins region (e.g., for GDPR compliance).

**fallback**
```json
{
  "region": "auto",
  "routing": {
    "fallback_regions": ["us-east-1", "eu-west-1"]
  }
}
```
If primary region degraded, reroute to backup.

### Reroute a Job
```http
POST /orchestrator/v1/jobs/{job_id}/reroute
Content-Type: application/json

{ "target_region": "eu-central-1" }
```

---

## 6. Agent Runtime

Agents are first-class orchestrator clients. They can:
- Construct pipelines
- Modify stages
- Inspect outputs
- Trigger reroutes
- Apply governance overrides (within policy)

### Agent State
```json
{
  "agent_id": "agent_emergent",
  "session_id": "sess_789",
  "memory": {
    "last_jobs": ["job_abc123"],
    "preferences": { "voice_id": "echo_default" }
  }
}
```

### Run an Agent
```http
POST /orchestrator/v1/agents/run
Content-Type: application/json

{
  "agent_id": "agent_emergent",
  "tenant_id": "tenant_123",
  "context": {
    "user_id": "user_456",
    "session_id": "sess_789"
  },
  "pipeline": {
    "stages": [ /* ... */ ]
  }
}
```

Response:
```json
{
  "job_id": "job_abc123",
  "status": "queued"
}
```

---

## 7. Voice / Video / 3D Pipelines

### Voice Pipeline (Echo + TTS)
```json
{
  "stages": [
    {
      "id": "stt_1",
      "type": "stt",
      "inputs": { "audio_url": "https://..." }
    },
    {
      "id": "speech_1",
      "type": "speech_to_speech",
      "depends_on": ["stt_1"],
      "inputs": {
        "target_voice_id": "echo_voice_42",
        "emotion_profile": "calm"
      }
    },
    {
      "id": "tts_1",
      "type": "tts",
      "depends_on": ["speech_1"],
      "inputs": { "text": "Generated speech" }
    }
  ]
}
```

### Video Pipeline
```json
{
  "stages": [
    {
      "id": "video_1",
      "type": "video_generate",
      "inputs": {
        "prompt": "Neon studio, talking avatar",
        "duration": 10,
        "ratio": "16:9",
        "audio_stage_id": "tts_1"
      }
    }
  ]
}
```

### 3D / Spaces Pipeline
```json
{
  "stages": [
    {
      "id": "scene_1",
      "type": "3d_scene",
      "inputs": { "scene_prompt": "Futuristic control room" }
    },
    {
      "id": "space_1",
      "type": "space_build",
      "depends_on": ["scene_1"],
      "inputs": { "scene_id": "scene_1", "interactive": true }
    }
  ]
}
```

---

## 8. Billing + Governance Hooks

### Billing Hooks

**Pre-job:** Estimate credits
```http
POST /orchestrator/v1/billing/estimate
Content-Type: application/json

{ "pipeline": { "stages": [...] } }
```

Response:
```json
{ "estimated_credits": 37.5 }
```

**Post-job:** Record actual usage
```json
{
  "billing": {
    "estimated_credits": 37.5,
    "actual_credits": 42.0,
    "breakdown": {
      "tts": 5.0,
      "video": 30.0,
      "3d_scene": 7.0
    }
  }
}
```

### Governance Hooks

**Pre-job:** Policy evaluation
```http
GET /orchestrator/v1/governance/policies
```

Response:
```json
{
  "tenant_id": "tenant_123",
  "policy_set": "default_video_voice",
  "rules": [
    "no_impersonation",
    "no_disallowed_content",
    "region_restrictions"
  ]
}
```

**During job:** Content scanning, region enforcement

**Post-job:** Audit log
```json
{
  "governance": {
    "policy_set": "default_video_voice",
    "flags": ["no_impersonation"],
    "audit_log_id": "audit_999"
  }
}
```

---

## 9. API Reference

### Job Lifecycle

**Create job:**
```http
POST /orchestrator/v1/jobs
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "tenant_id": "tenant_123",
  "region": "auto",
  "pipeline": { "stages": [...] }
}
```

Response:
```json
{ "job_id": "job_abc123", "status": "queued" }
```

**Get job status:**
```http
GET /orchestrator/v1/jobs/{job_id}
Authorization: Bearer <API_KEY>
```

**Cancel job:**
```http
POST /orchestrator/v1/jobs/{job_id}/cancel
Authorization: Bearer <API_KEY>
```

### Region Management

**List regions:**
```http
GET /orchestrator/v1/regions
```

Response:
```json
{
  "regions": [
    { "name": "us-west-2", "status": "healthy", "gpu_load": 0.34 },
    { "name": "eu-central-1", "status": "degraded", "gpu_load": 0.78 }
  ]
}
```

**Reroute job:**
```http
POST /orchestrator/v1/jobs/{job_id}/reroute

{ "target_region": "eu-central-1" }
```

### Agent Runtime

**Run agent:**
```http
POST /orchestrator/v1/agents/run

{
  "agent_id": "agent_emergent",
  "tenant_id": "tenant_123",
  "context": { "user_id": "user_456" },
  "pipeline": { "stages": [...] }
}
```

---

## 10. Summary

The Frasberg Orchestrator is the engine behind the engines. It unifies:

- **Voice** (Echo, TTS, STT)
- **Video** (text-to-video)
- **Audio** (generation, effects)
- **3D** (scenes, spaces)
- **Spaces** (interactive environments)
- **Agents** (autonomous workflows)
- **Routing** (multi-region, failover)
- **Billing** (credit metering)
- **Governance** (safety, compliance)

into one governed, multi-modal, multi-region runtime.

---

## Next Steps

1. Review pipeline structure and dependencies
2. Implement a test job with TTS + Video
3. Test multi-region routing
4. Integrate governance hooks
5. Set up billing tracking
6. Build agent orchestration

---

## Resources

- **OpenAPI Spec:** `/orchestrator/openapi.yaml`
- **Integration Guide:** `/integrations/luchii-developer-handbook.md`
- **API Reference:** `/integrations/luchii-api-reference.md`
- **Postman Collection:** `/integrations/luchii-postman.json`

---

**Status:** v1 Specification Complete ✅
**Next:** v1 Implementation (Q4 2026)
