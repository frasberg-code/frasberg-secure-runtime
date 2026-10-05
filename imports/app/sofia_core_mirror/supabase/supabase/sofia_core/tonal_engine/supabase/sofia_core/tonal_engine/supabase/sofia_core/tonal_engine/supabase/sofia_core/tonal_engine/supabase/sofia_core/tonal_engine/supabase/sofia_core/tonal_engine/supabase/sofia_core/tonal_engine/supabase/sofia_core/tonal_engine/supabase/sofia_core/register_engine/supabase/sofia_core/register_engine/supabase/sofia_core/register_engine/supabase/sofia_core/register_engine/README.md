# Register Engine — Sofia Core Governance

## Purpose
The Register Engine governs Sofia’s temporal register: **ceremonial**, **operational**, and **conceptual**.  
It ensures that outputs remain aligned with the correct register and that transitions between registers follow the defined governance rules.

## Modules

| File                          | Purpose                                                   |
|------------------------------|-----------------------------------------------------------|
| `register_engine_spec.json`  | Defines register types, defaults, and transition rules    |
| `register_engine_runtime.ts` | Enforces register presence and transition validity        |
| `register_engine.test.ts`    | Verifies enforcement logic and transition correctness     |

## Enforcement Logic
- Ensures a valid register is always present  
- Validates transitions between registers  
- Rejects restricted transitions  
- Logs transitions when enabled  

## Activation
Once all modules are committed and tests pass, the Register Engine becomes active within Sofia Core’s output pipeline.

## Maintainer
Emerald Estates® — Sofia Core Governance
