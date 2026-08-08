# FrasbergAI Enterprise Contract
Version 1.0 — August 2026

This Enterprise Contract ("Contract") governs the use of FrasbergAI's Luchii model family, dedicated infrastructure, and enterprise services.

## 1. Scope
FrasbergAI provides enterprise access to:
- Luchii-6-Plus (chat) · Luchii-6-Mini (chat) · Luchii-6-Embed (embeddings)
- Dedicated clusters · Multi-region failover · Enterprise SLA guarantees

## 2. Authentication
Enterprise tenants authenticate using: `Authorization: Bearer {FRASBERG_LLM_KEY}`
API base: https://api.frasberg.com/v1

## 3. Data Privacy
- No prompt retention · No output retention · Metadata-only logging
- AES-256 encryption at rest · TLS 1.3 in transit · Memory scrubbing after inference

## 4. Residency
Enterprise tenants may enforce: US-only · EU-only · APAC-only · Custom residency rules

## 5. SLA
- 99.99% uptime · <300ms latency · <0.2% error rate · Multi-region failover

## 6. Support
- Critical: 15 minutes · High: 1 hour · Medium: 4 hours · Low: 24 hours

## 7. Term
This Contract remains in effect until terminated by either party.

## 8. Governing Law
Nevada, United States.

---

# FrasbergAI Dedicated Cluster Agreement
Version 1.0 — August 2026

## 1. Cluster Types
Dedicated Standard · Dedicated Premium · Dedicated Enterprise · Dedicated Global Mesh

## 2. Isolation
Private routing fabric · Private autoscaling · Private GPU pools · Private replicas · No shared queues

## 3. Regions
us-west-1 · us-east-1 · eu-central-1 · ap-southeast-1

## 4. Failover
Secondary region failover · Optional tertiary DR region

## 5. Billing
GPU hours · Replica hours · Region multipliers

## 6. SLA
99.995% uptime · <250ms latency · <0.1% error rate

## 7. Termination
FrasbergAI may deprovision clusters after contract termination.
