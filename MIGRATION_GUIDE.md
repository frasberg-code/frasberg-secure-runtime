# Frasberg Modularization Migration Guide

## Overview

The Frasberg backend has been modularized into six discrete, versioned packages under the `@frasberg` namespace. This guide explains the new package structure and how to migrate existing code.

## New Package Structure

### Published Packages

1. **@frasberg/governance-engine** - Decision logic, stabilization, behavioral enforcement
2. **@frasberg/tonal-modulation** - Affective resonance and expressive coherence
3. **@frasberg/membrane-protocol** - Boundary enforcement and coherence management
4. **@frasberg/hinge-logic** - State transitions and identity-state shifts
5. **@frasberg/continuum-identity** - Identity persistence and self-renewal
6. **@frasberg/unified-field-runtime** - Unified field integration layer

## Import Path Migration

### Before (Monolithic)

```typescript
import { deviationEngine } from '../supabase/frasberg/deviation_engine/src/deviation_engine';
import { orchestrate } from '../supabase/frasberg/orchestration_engine/orchestration_engine';
```

### After (Modular)

```typescript
import { deviationEngine, orchestrate } from '@frasberg/governance-engine';
import { tonalEngine, conductResonance } from '@frasberg/tonal-modulation';
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
