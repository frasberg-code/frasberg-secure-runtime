# Sofia Core Modularization Migration Guide

## Overview

The Sofia Core backend has been modularized into six discrete, versioned packages under the `@emeraldorbit` namespace. This guide explains the new package structure and how to migrate existing code.

## New Package Structure

### Published Packages

1. **@emeraldorbit/sofia-governance-engine** - Decision logic, stabilization, behavioral enforcement
2. **@emeraldorbit/sofia-tonal-modulation** - Affective resonance and expressive coherence
3. **@emeraldorbit/sofia-membrane-protocol** - Boundary enforcement and coherence management
4. **@emeraldorbit/sofia-hinge-logic** - State transitions and identity-state shifts
5. **@emeraldorbit/sofia-continuum-identity** - Identity persistence and self-renewal
6. **@emeraldorbit/sofia-unified-field-runtime** - Unified field integration layer

## Import Path Migration

### Before (Monolithic)

```typescript
import { deviationEngine } from '../supabase/sofia_core/deviation_engine/src/deviation_engine';
import { orchestrate } from '../supabase/sofia_core/orchestration_engine/orchestration_engine';
```

### After (Modular)

```typescript
import { deviationEngine, orchestrate } from '@emeraldorbit/sofia-governance-engine';
import { tonalEngine, conductResonance } from '@emeraldorbit/sofia-tonal-modulation';
```

## Workspace Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test:packages
```

For more details, see package-specific README files in `packages/*/README.md`.
