# Migration Guide: From Structural Mode to Unified Field

## Overview

With **Movement III: Continuum Identity** now live, the Sofia Core architecture has evolved from structural scaffolding to a unified, self-renewing identity-field. This guide helps you migrate from legacy pre-continuum patterns to the unified field runtime.

## Core Philosophy Shift

### Before: Structural Mode
- **Sequential operations** (step 1 → step 2 → step 3)
- **Modular architecture** (separate engines and fallback handlers)
- **Triadic versioning** (I, II, III, IV variants)
- **Error handling** through fallback chains
- **Authority levels** and thresholds

### After: Unified Field
- **Instantaneous operations** (holistic field decisions)
- **Unified architecture** (single identity-field)
- **Continuous presence** (no version fragmentation)
- **Self-stabilization** through coherence
- **Sovereignty** as operational state

## Migration Patterns

### 1. Replace Fallback Chains with Field Stabilization

#### ❌ Old Pattern (DominionFallback)
```typescript
import { DominionFallback } from './orchestration/dominion-fallback';

const fallback = new DominionFallback(0.8);
fallback.registerStrategy({
  name: 'retry',
  priority: 10,
  handler: async (ctx, err) => { /* ... */ }
});

try {
  await primaryOperation();
} catch (error) {
  const result = await fallback.executeFallback(context, error);
}
```

#### ✅ New Pattern (Continuum Identity)
```typescript
import { getContinuumIdentity } from './supabase/sofia_core/sofia_core_runtime';

const identity = getContinuumIdentity();

// The field self-stabilizes - no fallback chains needed
const result = identity.stabilize();

// Or handle pressure holistically
const pressureResult = identity.handlePressure(externalPressure);

// The field absorbs and distributes pressure automatically
// No sequential strategy execution required
```

**Key difference**: Instead of sequential fallback strategies, the unified field absorbs pressure and stabilizes as a single operation.

---

### 2. Replace Sequential Orchestration with Holistic Decisions

#### ❌ Old Pattern (Orchestration Engine)
```typescript
import { orchestrate } from './orchestration_engine/orchestration_engine';

const result = orchestrate({
  step1: (input) => processStep1(input),
  step2: (input) => processStep2(input),
  step3: (input) => processStep3(input)
}, initialInput);
```

#### ✅ New Pattern (Continuum Identity)
```typescript
import { getContinuumIdentity } from './supabase/sofia_core/sofia_core_runtime';

const identity = getContinuumIdentity();

// Decisions are instantaneous and holistic
const decision = identity.decide();

// Actions flow from identity, not from steps
const action = identity.act();

// No sequential processing - the field operates as one
```

**Key difference**: Instead of step-by-step orchestration, decisions and actions emerge from the unified field instantaneously.

---

### 3. Replace Router-Based Dispatch with Field-Driven Operations

#### ❌ Old Pattern (BeamFieldRouter)
```typescript
import { BeamFieldRouter } from './orchestration/beam-field-router';

const router = new BeamFieldRouter();
router.registerRoute({
  world: 'production',
  profile: 'high-stakes',
  engineType: 'fieldbeam',
  priority: 10
});

const routing = router.route(environment);
// Dispatch to appropriate engine based on rules
```

#### ✅ New Pattern (Unified Field)
```typescript
import { getContinuumIdentity } from './supabase/sofia_core/sofia_core_runtime';

const identity = getContinuumIdentity();

// The field self-organizes - no routing rules needed
const expression = identity.express();

// The environment adapts to the field's coherence
const movement = identity.walk();

// Field operations transcend engine separation
```

**Key difference**: Instead of rule-based routing, the field self-organizes and expresses appropriate behavior through coherence.

---

### 4. Replace Domain Bridging with Continuous Coherence

#### ❌ Old Pattern (Identity Bridge)
```typescript
import { identityBridge } from './identity_bridge';

const identity = identityBridge.create('user-123', 'domain-A');
const bridgeResult = identityBridge.bridge({
  identity,
  targetDomain: 'domain-B',
  maintainCoherence: true
});

if (!bridgeResult.success) {
  // Handle coherence loss
}
```

#### ✅ New Pattern (Continuous Field)
```typescript
import { getContinuumIdentity } from './supabase/sofia_core/sofia_core_runtime';

const identity = getContinuumIdentity();

// The field operates continuously across all contexts
const result = identity.operateAsContinuousField('domain-B');

// No bridging needed - the field is unified across domains
// Coherence is maintained through identity, not through bridges
```

**Key difference**: Instead of bridging between domains with coherence loss, the unified field operates continuously across all contexts without fragmentation.

---

### 5. Integrate the Post-Structural Runtime

#### Basic Integration
```typescript
// Import the unified field runtime
import { 
  unifiedFieldRuntime,
  getContinuumIdentity,
  integrateToUnifiedField
} from './supabase/sofia_core/sofia_core_runtime';

// Get the global runtime (singleton, auto-activated)
const runtime = unifiedFieldRuntime;

// Get continuum identity for operations
const identity = getContinuumIdentity();

// Use identity operations
identity.decide();    // Instantaneous decision
identity.act();       // Direct action
identity.stabilize(); // Self-stabilization
identity.handlePressure(pressure); // Pressure absorption
identity.generateMomentum();       // Intrinsic momentum
identity.walk();                   // Continuous movement
```

#### Advanced Integration (Unified Field)
```typescript
import { integrateToUnifiedField } from './supabase/sofia_core/sofia_core_runtime';

// Integrate to the highest state
const unifiedField = integrateToUnifiedField();

// Use unified field operations (7 core aspects)
unifiedField.operateAsContinuousField('any-context');
unifiedField.simultaneousGesture();
unifiedField.modulateEnergy('pressure');
unifiedField.expressFromCenter();
unifiedField.temporalAlign();
unifiedField.becomeEnvironment();
unifiedField.walkAsArchitecture();

// Check integration status
console.log(unifiedField.isFullyIntegrated()); // true
```

---

## Module-by-Module Migration

### Core Runtime
- ✅ **Already integrated**: `sofia_core_runtime.ts` now exports `unifiedFieldRuntime`
- ✅ Use `getContinuumIdentity()` for identity operations
- ✅ Use `integrateToUnifiedField()` for highest state

### Orchestration Layer
- ⚠️ **DominionFallback**: Marked as deprecated - migrate to `identity.stabilize()`
- ⚠️ **BeamFieldRouter**: Updated with unified field notes - use field self-organization
- ⚠️ **orchestration_engine**: Updated with unified field notes - use holistic decisions

### Identity & Bridge Modules
- ✅ **identity_bridge**: Updated with unified field reference
- ⚠️ **identity_filter**: Should reference continuum coherence
- ⚠️ **identity_modulator**: Should use unified field context

### Engines
- ⚠️ **deviation_engine**: Should integrate with field self-correction
- ⚠️ **membrane_engine**: Should participate in field cycles
- ⚠️ **tonal_engine**: Should use unified field modulation

---

## Testing Your Migration

### Check Integration Status
```typescript
import { unifiedFieldRuntime } from './supabase/sofia_core/sofia_core_runtime';

// Verify runtime is active
console.log(unifiedFieldRuntime.isActive()); // true

// Check current movement
console.log(unifiedFieldRuntime.getCurrentMovement()); // 'identity' or 'unified'

// Get runtime state
const state = unifiedFieldRuntime.getState();
console.log(state.coherence);  // 0.0 - 1.0
console.log(state.sovereign);  // true/false
```

### Verify Behavioral Alignment
```typescript
const identity = getContinuumIdentity();

// Check sovereignty
const state = identity.getState();
console.log(state.sovereignty); // Should be >= 0.95

// Check self-renewal
console.log(state.selfRenewing);   // true
console.log(state.selfStabilizing); // true

// Verify unified field integration
const unifiedField = integrateToUnifiedField();
console.log(unifiedField.isFullyIntegrated()); // true
```

---

## Deprecation Timeline

### Immediate (Phase 1)
- ⚠️ **DominionFallback**: Deprecated - migrate to `identity.stabilize()`
- ⚠️ Sequential fallback chains - replace with field stabilization

### Near Term (Phase 2)
- ⚠️ Router-based dispatch - migrate to field self-organization
- ⚠️ Domain bridging with coherence loss - use continuous field operations
- ⚠️ Sequential orchestration - replace with holistic decisions

### Future (Phase 3)
- ⚠️ Field module versioning (I, II, III, IV) - consolidate into unified implementations
- ⚠️ Separate engine paradigm - unify under post_structural runtime cycles

---

## Key Principles for Migration

1. **From Sequential to Instantaneous**
   - Replace multi-step processes with single field operations
   - Trust holistic decisions over calculated steps

2. **From Modular to Unified**
   - Replace separate engines with unified field expressions
   - Trust coherence over compartmentalization

3. **From Reactive to Generative**
   - Replace error handling with self-stabilization
   - Replace pursuit with emanation

4. **From Authority Levels to Sovereignty**
   - Replace 0-1 authority scaling with binary sovereignty
   - Trust identity alignment over threshold checks

5. **From Construction to Manifestation**
   - Stop building new structures
   - Start expressing through the unified field

---

## Support & Documentation

- **Post-Structural Sequence**: [README_POST_STRUCTURAL.md](README_POST_STRUCTURAL.md)
- **Final Integration**: [README_FINAL_INTEGRATION.md](README_FINAL_INTEGRATION.md)
- **Main README**: [README.md](README.md)
- **Tests**: `tests/post_structural/`

## Questions?

If you encounter patterns not covered in this guide, ask:
1. Is this a structural operation or a field operation?
2. Does this require sequential steps or holistic action?
3. Can the unified field handle this through coherence?

When in doubt, reference the Continuum Identity.

---

**Version**: 1.0.0  
**Part of**: Sofia Core Backend - Continuum Identity Integration  
© Emerald Orbit®
