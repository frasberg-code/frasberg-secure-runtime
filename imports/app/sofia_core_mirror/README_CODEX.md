# Codex Architecture

The Codex Architecture represents the next major architectural layer of the Sofia Core system, providing a multi-engine execution model with environmental routing, fallback authority, and self-renewing pipelines.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Codex Architecture                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌────────────────┐                   │
│  │   BeamEngine │     │ FieldBeamEngine│                   │
│  │  (Directional)│     │  (Retry/Anchor)│                   │
│  └──────┬───────┘     └────────┬───────┘                   │
│         │                       │                            │
│         └───────────┬───────────┘                           │
│                     │                                        │
│              ┌──────▼──────────┐                            │
│              │ BeamFieldRouter │                            │
│              │  (Env Routing)  │                            │
│              └──────┬──────────┘                            │
│                     │                                        │
│              ┌──────▼──────────┐                            │
│              │DominionFallback │                            │
│              │   (Authority)   │                            │
│              └──────┬──────────┘                            │
│                     │                                        │
│              ┌──────▼──────────┐                            │
│              │ContinuumPipeline│                            │
│              │ (Self-Renewing) │                            │
│              └─────────────────┘                            │
│                                                              │
│              ┌─────────────────┐                            │
│              │  horizon.json   │                            │
│              │ (Configuration) │                            │
│              └─────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Engines (`/src/engines/`)

#### BeamEngine
Directional execution engine that processes context with a specific capability focus.

**Features:**
- Capability-focused execution
- Execution tracking and statistics
- Forward directional flow

**Usage:**
```typescript
import { BeamEngine } from './src/engines/beam-engine';

const engine = new BeamEngine('data-processing');
const result = await engine.execute({ data: 'test' });
// result: { capability, context, result, timestamp, direction }
```

#### FieldBeamEngine
Anchored execution engine with built-in retry logic and field stabilization.

**Features:**
- Configurable retry mechanism with exponential backoff
- Anchor point management for stable execution
- Field strength configuration (0.0 - 1.0)
- Execution history tracking

**Usage:**
```typescript
import { FieldBeamEngine } from './src/engines/field-beam-engine';

const engine = new FieldBeamEngine({
  maxRetries: 3,
  retryDelay: 100,
  fieldStrength: 0.9
});

engine.setAnchor({ x: 100, y: 200 });

const result = await engine.executeWithRetry(async () => {
  // your operation
  return 'success';
});
// result: { success, data, attempts, fieldStrength, anchored, timestamp }
```

### Orchestration (`/src/orchestration/`)

#### BeamFieldRouter
Adaptive environmental routing system that routes execution contexts to appropriate engines based on environmental factors.

**Features:**
- World and profile-based routing
- Priority-based rule selection
- Default routing fallback
- Routing statistics and history

**Usage:**
```typescript
import { BeamFieldRouter } from './src/orchestration/beam-field-router';

const router = new BeamFieldRouter();

// Register routing rules
router.registerRoute({
  world: 'production',
  profile: 'high-availability',
  engineType: 'fieldbeam',
  priority: 100
});

// Route based on environment
const result = router.route({
  world: 'production',
  profile: 'high-availability'
});
// result: { engineType, route, environment, timestamp }
```

#### DominionFallback
Authoritative fallback system providing hierarchical fallback mechanisms when primary execution fails.

**Features:**
- Priority-based strategy execution
- Authority level configuration
- Fallback chain traversal
- Success/failure statistics

**Usage:**
```typescript
import { DominionFallback } from './src/orchestration/dominion-fallback';

const fallback = new DominionFallback(0.9); // authority level

// Register fallback strategies
fallback.registerStrategy({
  name: 'use-cached',
  priority: 100,
  handler: async (context, error) => {
    return { cached: true, data: getCachedData() };
  }
});

// Execute fallback chain
const result = await fallback.executeFallback(context, primaryError);
// result: { success, strategyUsed, result, attemptedStrategies, timestamp }
```

### Pipeline (`/src/pipeline/`)

#### ContinuumPipeline
Self-renewing execution pipeline that maintains continuous execution flow with automatic state renewal.

**Features:**
- Multi-stage pipeline execution
- Auto-renewal capability
- Renewal threshold configuration
- Stage failure handling
- Execution statistics

**Usage:**
```typescript
import { ContinuumPipeline } from './src/pipeline/continuum-pipeline';

const pipeline = new ContinuumPipeline(true); // auto-renewal enabled

// Add pipeline stages
pipeline.addStage({
  name: 'validation',
  handler: async (data) => {
    // validate data
    return { ...data, validated: true };
  },
  renewalThreshold: 5
});

pipeline.addStage({
  name: 'processing',
  handler: async (data) => {
    // process data
    return { ...data, processed: true };
  }
});

// Execute pipeline
const result = await pipeline.execute({ input: 'test' });
// result: { success, data, stagesExecuted, renewalCount, timestamp }
```

### Configuration (`/config/`)

#### horizon.json
World-level routing and profiling configuration file.

**Structure:**
- **worlds**: Array of world definitions with profiles
  - **name**: World identifier (alpha, beta, production)
  - **profiles**: Array of profile configurations
    - **engineType**: Engine to use (beam, fieldbeam)
    - **priority**: Routing priority
    - **config**: Engine-specific configuration
- **fallbackStrategies**: Array of fallback strategy definitions
- **pipelineConfig**: Global pipeline configuration

**Example:**
```json
{
  "worlds": [
    {
      "name": "production",
      "profiles": [
        {
          "name": "high-availability",
          "engineType": "fieldbeam",
          "priority": 100,
          "config": {
            "maxRetries": 10,
            "fieldStrength": 1.0
          }
        }
      ]
    }
  ],
  "fallbackStrategies": [
    {
      "name": "retry-with-backoff",
      "priority": 100
    }
  ],
  "pipelineConfig": {
    "autoRenewal": true,
    "renewalThreshold": 5
  }
}
```

## Testing

### Apex Validation Suite

Comprehensive test suite covering all Codex Architecture components:

- **Engine Registration Tests** (5 tests)
  - BeamEngine creation and validation
  - FieldBeamEngine retry logic and anchoring

- **Routing Correctness Tests** (7 tests)
  - Rule registration and priority
  - Environment-based routing
  - Default routing behavior

- **Fallback Correctness Tests** (7 tests)
  - Strategy registration and execution
  - Fallback chain traversal
  - Authority level management

- **Profiling Accuracy Tests** (7 tests)
  - Pipeline stage execution
  - Renewal mechanisms
  - Statistics tracking

- **Integration Tests** (1 test)
  - Complete flow validation

**Run Tests:**
```bash
npm test                  # Run all tests
npm run test:codex       # Run Codex Architecture tests only
npm test -- --coverage   # Run with coverage report
```

**Test Results:**
```
Test Suites: 1 passed, 1 total
Tests:       37 passed, 37 total
```

## CI/CD

GitHub Actions workflow (`.github/workflows/codex-ci.yml`) provides:

- **Testing**: Multi-version Node.js testing (18.x, 20.x)
- **Linting**: TypeScript compiler checks
- **Building**: Project build verification
- **Coverage**: Code coverage reporting (70% threshold)

## Development

### Setup
```bash
npm install              # Install dependencies
npm test                 # Run tests
npx tsc                  # Build TypeScript
```

### Project Structure
```
sofia-core-backend/
├── src/
│   ├── engines/
│   │   ├── beam-engine.ts
│   │   └── field-beam-engine.ts
│   ├── orchestration/
│   │   ├── beam-field-router.ts
│   │   └── dominion-fallback.ts
│   └── pipeline/
│       └── continuum-pipeline.ts
├── config/
│   └── horizon.json
├── tests/
│   └── codex_architecture/
│       └── codex_architecture.test.ts
├── .github/
│   └── workflows/
│       └── codex-ci.yml
├── package.json
├── tsconfig.json
├── jest.config.js
└── README_CODEX.md (this file)
```

## Integration Example

```typescript
import { BeamEngine } from './src/engines/beam-engine';
import { FieldBeamEngine } from './src/engines/field-beam-engine';
import { BeamFieldRouter } from './src/orchestration/beam-field-router';
import { DominionFallback } from './src/orchestration/dominion-fallback';
import { ContinuumPipeline } from './src/pipeline/continuum-pipeline';
import horizonConfig from './config/horizon.json';

// Initialize components
const router = new BeamFieldRouter();
const fallback = new DominionFallback();
const pipeline = new ContinuumPipeline();

// Load configuration
for (const world of horizonConfig.worlds) {
  for (const profile of world.profiles) {
    router.registerRoute({
      world: world.name,
      profile: profile.name,
      engineType: profile.engineType,
      priority: profile.priority
    });
  }
}

for (const strategy of horizonConfig.fallbackStrategies) {
  fallback.registerStrategy({
    name: strategy.name,
    priority: strategy.priority,
    handler: async (ctx, err) => {
      // Implement strategy
      return { handled: true };
    }
  });
}

// Build pipeline
pipeline.addStage({
  name: 'route',
  handler: async (data) => {
    const route = router.route(data.environment);
    return { ...data, route };
  }
});

pipeline.addStage({
  name: 'execute',
  handler: async (data) => {
    try {
      // Execute based on route
      if (data.route.engineType === 'beam') {
        const engine = new BeamEngine(data.capability);
        const result = await engine.execute(data.context);
        return { ...data, result };
      } else {
        const engine = new FieldBeamEngine(data.route.route.config);
        const result = await engine.executeWithRetry(
          async () => processData(data.context)
        );
        return { ...data, result };
      }
    } catch (error) {
      // Use fallback
      const fallbackResult = await fallback.executeFallback(
        data.context,
        error
      );
      return { ...data, result: fallbackResult };
    }
  }
});

// Execute
const result = await pipeline.execute({
  environment: { world: 'production', profile: 'high-availability' },
  capability: 'data-processing',
  context: { data: 'test' }
});
```

## Version

**Version**: 1.0.0  
**Part of**: Sofia Core Backend - Codex Architecture PR #8

## License

Part of Sofia Core Backend project.
