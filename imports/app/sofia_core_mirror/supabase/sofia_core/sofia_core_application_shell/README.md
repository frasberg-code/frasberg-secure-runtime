# Sofia Core Application Shell

The Application Shell is the top-level orchestration layer for Sofia Core. It provides a unified runtime that manages engine loading, lifecycle, and coordination across the entire system.

## Architecture

The Application Shell consists of six primary modules:

### 1. `app_shell_manifest.json`
**Declarative Engine Registry**

A JSON manifest that defines all available engines, their versions, paths, dependencies, and enabled state. This provides a single source of truth for the engine ecosystem.

```json
{
  "engines": {
    "deviation_engine": {
      "name": "deviation_engine",
      "version": "1.0.1",
      "path": "../deviation_engine",
      "dependencies": [],
      "enabled": true
    }
  }
}
```

### 2. `app_shell_context.ts`
**Shared Runtime Context**

Manages global state and configuration across the application lifecycle:
- Engine registry (runtime instances)
- Configuration values
- Initialization state
- Metadata (version, maintainer)

**Key Functions:**
- `initializeContext()` - Creates and initializes global context
- `getContext()` - Retrieves current context
- `registerEngineInContext()` - Registers a loaded engine
- `getEngineFromContext()` - Retrieves a registered engine
- `listRegisteredEngines()` - Lists all registered engine names

### 3. `app_shell_lifecycle.ts`
**Engine Lifecycle Manager**

Handles engine loading, initialization, and dependency resolution:
- Validates engine dependencies
- Loads engines in correct dependency order
- Tracks lifecycle state (loaded, initialized, error)
- Provides bulk operations for all engines

**Key Functions:**
- `loadEngine(name)` - Loads a single engine
- `initializeEngine(name, config)` - Initializes a loaded engine
- `loadAllEngines()` - Loads all enabled engines in dependency order
- `getEngineDescriptor(name)` - Gets manifest data for an engine
- `getEngineState(name)` - Gets lifecycle state for an engine

### 4. `app_shell_runtime.ts`
**Engine Loader + Manifest Resolver**

The core orchestration layer that coordinates all operations:
- Manifest validation and resolution
- Runtime initialization
- Auto-loading and auto-initialization
- Runtime status and information

**Key Functions:**
- `initializeSofiaAppShell(context, config)` - Main initialization entry point
- `getAppEntry()` - Returns entry point for bootstrap compatibility
- `resolveManifest()` - Returns the resolved manifest
- `getEngineRegistry()` - Returns engine descriptors
- `getRuntimeInfo()` - Returns runtime status and metrics

### 5. `app_shell_index.ts`
**Public Initialization Entrypoint**

The public API surface that external code uses to interact with the Application Shell:
- Simplified initialization API
- Organized namespaces for runtime, context, engines, manifest
- Type exports
- Default export with full API

**Usage:**
```typescript
import appShell from './app_shell_index';

// Initialize the runtime
const context = await appShell.initialize({}, {
  autoLoadEngines: true,
  initializeOnLoad: true
});

// Get runtime info
const info = appShell.runtime.getInfo();

// Load a specific engine
const engine = await appShell.engines.load('deviation_engine');
```

### 6. `README.md` (This File)
**Architecture and Integration Documentation**

Comprehensive documentation of the Application Shell architecture, integration patterns, and usage guidelines.

## Integration with Bootstrap

The Application Shell fulfills the contract expected by `sofia_core_bootstrap.ts`:

```typescript
// sofia_core_bootstrap.ts
import { getAppEntry } from './sofia_core_application_shell/app_shell_runtime';

export function bootstrapSofiaCore(initialContext: object = {}) {
  const entry = getAppEntry();
  return entry.initializeSofiaAppShell(initialContext);
}
```

The `getAppEntry()` function returns an object with:
- `initializeSofiaAppShell` - Main initialization function
- `appShellMetadata` - Version and maintainer information
- `resolveManifest` - Manifest resolution function
- `getEngineRegistry` - Engine descriptor access

## Engine Registration

All engines are declared in `app_shell_manifest.json`:

1. **Deviation Engine** - Foundational stability signal (no dependencies)
2. **Identity Filter** - Identity enforcement (depends on deviation_engine)
3. **Membrane Engine** - Boundary control (depends on deviation_engine)
4. **Tonal Engine** - Tone modulation (depends on deviation_engine, identity_filter)
5. **Sofia API** - Public API interface (no dependencies)

## Lifecycle Flow

```
1. Bootstrap calls getAppEntry()
2. Bootstrap calls initializeSofiaAppShell()
3. Runtime validates manifest
4. Runtime initializes context
5. Runtime loads engines (if autoLoadEngines=true)
   - Resolves dependencies
   - Loads in correct order
   - Registers in context
6. Runtime initializes engines (if initializeOnLoad=true)
7. Returns initialized context
```

## Configuration Options

```typescript
interface RuntimeConfig {
  autoLoadEngines?: boolean;      // Auto-load all enabled engines (default: true)
  initializeOnLoad?: boolean;     // Auto-initialize after loading (default: false)
  customConfig?: Record<string, any>;  // Custom config passed to engines
}
```

## Error Handling

The Application Shell provides comprehensive error handling:

- **Manifest validation errors** - Thrown during initialization if manifest is invalid
- **Missing dependency errors** - Thrown if an engine's dependencies aren't met
- **Load errors** - Captured in engine lifecycle state
- **Initialization errors** - Captured in engine lifecycle state
- **Context errors** - Thrown if operations are attempted before initialization

## Implementation Notes

### Engine Loading Strategy

The current implementation uses a **placeholder-based engine loading** approach. When `loadEngine()` is called, it registers engine metadata (name, version, descriptor) rather than dynamically importing actual engine modules. This design decision:

1. **Allows the Application Shell infrastructure to function immediately** without requiring complex module resolution
2. **Provides a working contract** that `sofia_core_bootstrap.ts` can depend on
3. **Enables dependency validation and lifecycle management** without module imports
4. **Simplifies testing** by avoiding filesystem and import dependencies

### Future Enhancement Path

In a production deployment, `loadEngine()` should be enhanced to perform actual dynamic imports:

```typescript
// Future implementation
const engineModule = await import(descriptor.path);
const engine = engineModule.default || engineModule[descriptor.registration_key];
registerEngineInContext(name, engine);
```

This would enable runtime engine hot-swapping and true modular loading. The current implementation provides the foundation for this enhancement.

## Testing

Each module can be tested independently:

```typescript
import { resetContext } from './app_shell_context';
import { resetLifecycleState } from './app_shell_lifecycle';
import { resetRuntime } from './app_shell_runtime';

// Reset state between tests
beforeEach(() => {
  resetContext();
  resetLifecycleState();
  resetRuntime();
});
```

## Version

**Current Version:** 1.0.0

This is the initial implementation of the Application Shell subsystem, completing the architecture described in Sofia Core v1.0.1.

## Maintainer

**Emerald Estates® — Sofia Core Governance**

---

## API Reference

### Initialization

```typescript
import appShell from './app_shell_index';

// Basic initialization
await appShell.initialize();

// With custom context and config
await appShell.initialize(
  { userId: '123', sessionId: 'abc' },
  { autoLoadEngines: true, initializeOnLoad: true }
);
```

### Runtime Operations

```typescript
// Check if initialized
appShell.runtime.isInitialized(); // boolean

// Get runtime info
appShell.runtime.getInfo(); // { version, uptime, engines: { total, enabled, loaded } }

// Get metadata
appShell.runtime.getMetadata(); // { version, maintainer, description }
```

### Context Operations

```typescript
// Get context
const ctx = appShell.context.get();

// Check initialization
appShell.context.isInitialized(); // boolean

// List engines
appShell.context.listEngines(); // string[]

// Get specific engine
const engine = appShell.context.getEngine('deviation_engine');
```

### Engine Operations

```typescript
// Load an engine
await appShell.engines.load('deviation_engine');

// Initialize an engine
appShell.engines.initialize('deviation_engine', { config: 'value' });

// Get engine state
appShell.engines.getState('deviation_engine'); // { loaded, initialized, error }

// Get all states
appShell.engines.getAllStates(); // Map<string, EngineLifecycleState>

// Get engine descriptor
appShell.engines.getDescriptor('deviation_engine'); // EngineDescriptor
```

### Manifest Operations

```typescript
// Resolve full manifest
const manifest = appShell.manifest.resolve();

// Get engine registry
const registry = appShell.manifest.getRegistry(); // Record<string, EngineDescriptor>
```

## Future Enhancements

As outlined in the Sofia Core roadmap (v1.0.2), the Application Shell will evolve to support:

1. **Engine Loader Refactor** - Enhanced validation and version compatibility checking
2. **Manifest Consolidation** - Integration with VERSION_MAP.json and ENGINE_MANIFEST.md
3. **Hot Reloading** - Dynamic engine reload without full restart
4. **Plugin System** - Third-party engine registration
5. **Performance Metrics** - Engine load times, initialization times, resource usage
6. **Dependency Graphs** - Visual dependency mapping and validation

---

This Application Shell subsystem completes the orchestration layer for Sofia Core and provides a solid foundation for future architectural enhancements.
