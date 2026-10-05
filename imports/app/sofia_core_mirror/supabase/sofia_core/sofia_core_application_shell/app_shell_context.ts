/**
 * app_shell_context.ts
 * Shared runtime context for the Sofia Core Application Shell.
 * Manages state and configuration across the engine lifecycle.
 */

export interface AppShellContext {
  initialized: boolean;
  startTime: number;
  engines: Map<string, any>;
  config: Record<string, any>;
  metadata: {
    version: string;
    maintainer: string;
  };
  lifecycle?: {
    engines: Array<{ id: string; [key: string]: any }>;
  };
}

let globalContext: AppShellContext | null = null;

/**
 * Creates a new application shell context
 */
export function createContext(config: Record<string, any> = {}): AppShellContext {
  return {
    initialized: false,
    startTime: Date.now(),
    engines: new Map(),
    config,
    metadata: {
      version: "1.0.0",
      maintainer: "Emerald Estates® — Sofia Core Governance"
    },
    ...config  // Merge custom properties into root context
  };
}

/**
 * Initializes the global application shell context
 */
export function initializeContext(config: Record<string, any> = {}): AppShellContext {
  if (globalContext) {
    throw new Error("Application Shell context already initialized");
  }
  
  globalContext = createContext(config);
  globalContext.initialized = true;
  
  return globalContext;
}

/**
 * Gets the current global context
 */
export function getContext(): AppShellContext {
  if (!globalContext) {
    throw new Error("Application Shell context not initialized. Call initializeContext() first.");
  }
  
  return globalContext;
}

/**
 * Checks if context is initialized
 */
export function isContextInitialized(): boolean {
  return globalContext !== null && globalContext.initialized;
}

/**
 * Resets the global context (useful for testing)
 */
export function resetContext(): void {
  globalContext = null;
}

/**
 * Updates context configuration
 */
export function updateContextConfig(updates: Record<string, any>): void {
  const context = getContext();
  context.config = { ...context.config, ...updates };
}

/**
 * Registers an engine in the context
 */
export function registerEngineInContext(name: string, engine: any): void {
  const context = getContext();
  
  if (context.engines.has(name)) {
    throw new Error(`Engine '${name}' is already registered in context`);
  }
  
  context.engines.set(name, engine);
}

/**
 * Gets a registered engine from context
 */
export function getEngineFromContext(name: string): any {
  const context = getContext();
  
  if (!context.engines.has(name)) {
    throw new Error(`Engine '${name}' not found in context`);
  }
  
  return context.engines.get(name);
}

/**
 * Lists all registered engine names
 */
export function listRegisteredEngines(): string[] {
  const context = getContext();
  return Array.from(context.engines.keys());
}
