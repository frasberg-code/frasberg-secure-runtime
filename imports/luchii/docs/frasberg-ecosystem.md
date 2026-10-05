# Frasberg AI Ecosystem Map

This page captures the Frasberg AI repository map, shared repository conventions, and ecosystem-level scaffolding as structured documentation within the current Luchii workspace.

## Included Assets
- Structured JSON dataset: [`docs/data/frasberg-ecosystem.json`](data/frasberg-ecosystem.json)
- JSON Schema: [`docs/schemas/frasberg-ecosystem.schema.json`](schemas/frasberg-ecosystem.schema.json)

## Scope
The source material defines the Frasberg AI ecosystem above the single-engine level, including:
- A proposed GitHub repository map for engines, codices, atlases, web surfaces, APIs, assets, and operations.
- Shared repository conventions such as README templates, contributing rules, and code of conduct guidance.
- Documentation and folder patterns for knowledge repositories.
- Example launch and expansion sequencing for the ecosystem.

## Coverage
The structured dataset includes the parts that are concrete and reusable from an engineering and documentation standpoint:
- Canonical repository map with purpose statements.
- Standard folder layouts for knowledge repositories and code repositories.
- Shared README, contributing, and code-of-conduct templates.
- Suggested issue, project board, and launch-roadmap conventions.

## Normalization Notes
- Repeated repo descriptions were consolidated into one canonical ecosystem registry.
- Repo names were preserved exactly as supplied, even when they do not match conventional GitHub slug style.
- Massive cosmology excerpts were not duplicated here when they were already covered by other docs pages; this page indexes the ecosystem that would contain them.

## Structured Content Index
| Entry | Category | Formal name |
| --- | --- | --- |
| Repository Map | ecosystem | Frasberg AI Repository Map |
| Shared Repo Templates | governance | Frasberg AI Repository Standards |
| Knowledge Repo Layout | structure | Frasberg AI Knowledge Repository Layout |
| Operations Conventions | operations | Frasberg AI Launch and Workflow Conventions |

## Implementation Notes
- This workspace cannot create remote GitHub repositories directly, so the repo map is captured as local source-of-truth documentation.
- The dataset is structured so it can later drive a docs site, seed a monorepo generator, or produce scaffolding in another automation step.
- The current Luchii repo remains the active workspace; the ecosystem map is descriptive, not a live multi-repo checkout.

## Conceptual Architecture Disclaimer
This content documents proposed repository organization, brand structure, and fictional ecosystem canon. It is documentation and planning material, not evidence that the listed external repositories or services already exist.