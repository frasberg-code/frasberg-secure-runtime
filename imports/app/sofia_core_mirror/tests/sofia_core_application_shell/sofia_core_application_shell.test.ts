/**
 * Application Shell Tests
 * Tests for the Sofia Core Application Shell subsystem
 */

// Import all modules to test
import {
  createContext,
  initializeContext,
  getContext,
  isContextInitialized,
  resetContext,
  registerEngineInContext,
  getEngineFromContext,
  listRegisteredEngines
} from "../../supabase/sofia_core/sofia_core_application_shell/app_shell_context";

import {
  getEngineDescriptors,
  getEngineDescriptor,
  loadEngine,
  getEngineState,
  resetLifecycleState
} from "../../supabase/sofia_core/sofia_core_application_shell/app_shell_lifecycle";

import {
  initializeSofiaAppShell,
  getAppEntry,
  isRuntimeInitialized,
  resolveManifest,
  getEngineRegistry,
  appShellMetadata,
  resetRuntime
} from "../../supabase/sofia_core/sofia_core_application_shell/app_shell_runtime";

import appShell from "../../supabase/sofia_core/sofia_core_application_shell/app_shell_index";

import { bootstrapSofiaCore } from "../../supabase/sofia_core/sofia_core_bootstrap";

describe("Application Shell - Context Management", () => {
  beforeEach(() => {
    resetContext();
    resetLifecycleState();
    resetRuntime();
  });

  test("creates a new context with default values", () => {
    const context = createContext();
    
    expect(context).toBeDefined();
    expect(context.initialized).toBe(false);
    expect(context.startTime).toBeGreaterThan(0);
    expect(context.engines).toBeInstanceOf(Map);
    expect(context.engines.size).toBe(0);
    expect(context.config).toEqual({});
  });

  test("creates context with custom config", () => {
    const customConfig = { feature: "enabled" };
    const context = createContext(customConfig);
    
    expect(context.config).toEqual(customConfig);
  });

  test("initializes global context", () => {
    expect(isContextInitialized()).toBe(false);
    
    const context = initializeContext();
    
    expect(isContextInitialized()).toBe(true);
    expect(context.initialized).toBe(true);
  });

  test("throws error on double initialization", () => {
    initializeContext();
    
    expect(() => {
      initializeContext();
    }).toThrow("Application Shell context already initialized");
  });

  test("gets initialized context", () => {
    const initialContext = initializeContext();
    const retrievedContext = getContext();
    
    expect(retrievedContext).toBe(initialContext);
  });

  test("throws error getting context before initialization", () => {
    expect(() => {
      getContext();
    }).toThrow("Application Shell context not initialized");
  });

  test("registers and retrieves engines", () => {
    initializeContext();
    
    const mockEngine = { name: "test_engine", version: "1.0.0" };
    registerEngineInContext("test_engine", mockEngine);
    
    const retrieved = getEngineFromContext("test_engine");
    expect(retrieved).toBe(mockEngine);
  });

  test("throws error on duplicate engine registration", () => {
    initializeContext();
    
    const mockEngine = { name: "test" };
    registerEngineInContext("test", mockEngine);
    
    expect(() => {
      registerEngineInContext("test", mockEngine);
    }).toThrow("Engine 'test' is already registered");
  });

  test("lists registered engines", () => {
    initializeContext();
    
    registerEngineInContext("engine1", {});
    registerEngineInContext("engine2", {});
    
    const engines = listRegisteredEngines();
    expect(engines).toContain("engine1");
    expect(engines).toContain("engine2");
    expect(engines.length).toBe(2);
  });
});

describe("Application Shell - Lifecycle Management", () => {
  beforeEach(() => {
    resetContext();
    resetLifecycleState();
    resetRuntime();
  });

  test("gets all engine descriptors from manifest", () => {
    const descriptors = getEngineDescriptors();
    
    expect(descriptors).toBeDefined();
    expect(typeof descriptors).toBe("object");
    expect(descriptors.deviation_engine).toBeDefined();
    expect(descriptors.identity_filter).toBeDefined();
    expect(descriptors.membrane_engine).toBeDefined();
    expect(descriptors.tonal_engine).toBeDefined();
  });

  test("gets specific engine descriptor", () => {
    const descriptor = getEngineDescriptor("deviation_engine");
    
    expect(descriptor).toBeDefined();
    expect(descriptor.name).toBe("deviation_engine");
    expect(descriptor.version).toBe("1.0.1");
    expect(descriptor.enabled).toBe(true);
    expect(Array.isArray(descriptor.dependencies)).toBe(true);
  });

  test("throws error for non-existent engine descriptor", () => {
    expect(() => {
      getEngineDescriptor("non_existent_engine");
    }).toThrow("Engine descriptor not found");
  });

  test("tracks engine state after load attempt", async () => {
    initializeContext();
    
    await loadEngine("deviation_engine");
    
    const state = getEngineState("deviation_engine");
    expect(state).toBeDefined();
    expect(state?.loaded).toBe(true);
    expect(state?.initialized).toBe(false);
  });
});

describe("Application Shell - Runtime", () => {
  beforeEach(() => {
    resetContext();
    resetLifecycleState();
    resetRuntime();
  });

  test("resolves manifest correctly", () => {
    const manifest = resolveManifest();
    
    expect(manifest).toBeDefined();
    expect(manifest.engines).toBeDefined();
    expect(manifest.metadata).toBeDefined();
    expect(manifest.metadata.version).toBe("1.0.0");
  });

  test("gets engine registry", () => {
    const registry = getEngineRegistry();
    
    expect(registry).toBeDefined();
    expect(registry.deviation_engine).toBeDefined();
    expect(typeof registry.deviation_engine).toBe("object");
  });

  test("exposes metadata", () => {
    expect(appShellMetadata).toBeDefined();
    expect(appShellMetadata.version).toBe("1.0.0");
    expect(typeof appShellMetadata.maintainer).toBe("string");
  });

  test("initializes Sofia App Shell", async () => {
    expect(isRuntimeInitialized()).toBe(false);
    
    const context = await initializeSofiaAppShell({}, {
      autoLoadEngines: false
    });
    
    expect(context).toBeDefined();
    expect(context.initialized).toBe(true);
    expect(isRuntimeInitialized()).toBe(true);
  });

  test("auto-loads engines when configured", async () => {
    const context = await initializeSofiaAppShell({}, {
      autoLoadEngines: true
    });
    
    expect(context.engines.size).toBeGreaterThan(0);
  });

  test("returns existing context on second initialization", async () => {
    const first = await initializeSofiaAppShell({}, {
      autoLoadEngines: false
    });
    
    const second = await initializeSofiaAppShell({}, {
      autoLoadEngines: false
    });
    
    expect(second).toBe(first);
  });

  test("getAppEntry returns correct interface", () => {
    const entry = getAppEntry();
    
    expect(entry).toBeDefined();
    expect(typeof entry.initializeSofiaAppShell).toBe("function");
    expect(entry.appShellMetadata).toBeDefined();
    expect(typeof entry.resolveManifest).toBe("function");
    expect(typeof entry.getEngineRegistry).toBe("function");
  });
});

describe("Application Shell - Index API", () => {
  beforeEach(() => {
    resetContext();
    resetLifecycleState();
    resetRuntime();
  });

  test("exports initialize function", () => {
    expect(appShell.initialize).toBeDefined();
    expect(typeof appShell.initialize).toBe("function");
  });

  test("exports runtime namespace", () => {
    expect(appShell.runtime).toBeDefined();
    expect(typeof appShell.runtime.isInitialized).toBe("function");
    expect(typeof appShell.runtime.getMetadata).toBe("function");
  });

  test("exports context namespace", () => {
    expect(appShell.context).toBeDefined();
    expect(typeof appShell.context.get).toBe("function");
    expect(typeof appShell.context.isInitialized).toBe("function");
  });

  test("exports engines namespace", () => {
    expect(appShell.engines).toBeDefined();
    expect(typeof appShell.engines.load).toBe("function");
    expect(typeof appShell.engines.getDescriptor).toBe("function");
  });

  test("exports manifest namespace", () => {
    expect(appShell.manifest).toBeDefined();
    expect(typeof appShell.manifest.resolve).toBe("function");
    expect(typeof appShell.manifest.getRegistry).toBe("function");
  });

  test("exports metadata", () => {
    expect(appShell.metadata).toBeDefined();
    expect(appShell.metadata.version).toBe("1.0.0");
  });
});

describe("Bootstrap Integration", () => {
  beforeEach(() => {
    resetContext();
    resetLifecycleState();
    resetRuntime();
  });

  test("bootstrapSofiaCore initializes runtime", async () => {
    const result = await bootstrapSofiaCore();
    
    expect(result).toBeDefined();
    expect(result.initialized).toBe(true);
  });

  test("bootstrapSofiaCore accepts initial context", async () => {
    const initialContext = { userId: "123" };
    const result = await bootstrapSofiaCore(initialContext);
    
    expect(result).toBeDefined();
    expect(result.initialized).toBe(true);
  });

  test("bootstrap loads engines by default", async () => {
    const result = await bootstrapSofiaCore();
    
    expect(result.engines.size).toBeGreaterThan(0);
  });
});
