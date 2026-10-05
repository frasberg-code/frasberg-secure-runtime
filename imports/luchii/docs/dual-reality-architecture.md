# Frasberg Dual-Reality Architecture

This page captures the Frasberg dual-reality operating model described in the source material as structured documentation for the Luchii portal.

## Included Assets
- Structured JSON dataset: [`docs/data/dual-reality-architecture.json`](data/dual-reality-architecture.json)
- JSON Schema: [`docs/schemas/dual-reality-architecture.schema.json`](schemas/dual-reality-architecture.schema.json)

## Scope
The source material defines a dual-reality architecture that combines:
- A reality plane for enterprise compliance, risk, and customer workflows.
- A mythic plane for Eternal-Origin narrative rendering of the same decisions.
- A hybrid plane that fuses both views without changing underlying compliance behavior.

## Coverage
The structured dataset includes the parts that are specified with enough detail to be reusable:
- FMR-BP compliance UI states across reality, mythic, and hybrid modes.
- Canonical FFG-OS event envelopes and per-domain payloads for EOC-Engine ingestion.
- Microservice-to-microservice contracts, topics, and subscription patterns.
- Eternal-Origin law mappings for identity, value flows, market conduct, privacy, and audit.
- Design tokens, core components, interaction rules, motion, and layout primitives.

## Normalization Notes
- Repeated narrative fragments were consolidated into single canonical records.
- Product-facing architecture was separated from broader cosmological worldbuilding.
- Sample code from the source was reduced to interface-level documentation so the dataset stays transportable.

## Structured Content Index
| Entry | Category | Formal name |
| --- | --- | --- |
| FMR-BP Dual-Reality UI States | ui | Frasberg Multi-Reality Banking Platform UI State Model |
| FFG-OS Canonical Event Schema | events | Frasberg Canonical Compliance Event Envelope |
| FFG-OS Service Event Contracts | integration | Frasberg Service-to-Service Compliance Contracts |
| Eternal-Origin Law Codex v1.0 | governance | Eternal-Origin Law Codex |
| Reality-Mythic Design Tokens | design-system | Frasberg Reality-Mythic Design Tokens |
| Component Blueprint Library | design-system | Frasberg Component Blueprint Library |
| Event Bus Topics and Subscriptions | integration | Frasberg Compliance Event Bus Topology |
| UI Runtime Patterns | frontend | Frasberg Multi-Reality Runtime Patterns |

## Implementation Notes
- The reality and mythic layers are documented as alternate renderings of the same underlying evaluation data.
- Mythic outcomes are narrative overlays and do not override real compliance decisions.
- This repository treats the material as documentation and structured content, not executable financial software.

## Conceptual Architecture Disclaimer
This content is conceptual product architecture and narrative brand-world documentation. It should not be interpreted as a claim that the repository contains live financial execution, biometric enforcement, or production compliance infrastructure.