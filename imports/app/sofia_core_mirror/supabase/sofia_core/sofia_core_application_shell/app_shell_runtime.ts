/**
 * app_shell_runtime.ts
 * Engine loader and manifest resolver for Sofia Core Application Shell.
 * This is the core orchestration layer that coordinates engine loading and lifecycle.
 */

import manifest from './app_shell_manifest.json';
import { 
  initializeContext, 
  getContext, 
  isContextInitialized,
  AppShellContext 
} from './app_shell_context';
import { 
  loadAllEngines, 
  initializeEngine, 
  getEngineDescriptors,
  EngineDescriptor,
  shutdownAllEngines
} from './app_shell_lifecycle';

/**
 * Runtime configuration options
 */
export interface RuntimeConfig {
  autoLoadEngines?: boolean;
  initializeOnLoad?: boolean;
  customConfig?: Record<string, any>;
  audit?: boolean;
  testMode?: boolean;
}

let runtimeInitialized = false;

/**
 * Gets the application shell metadata
 */
export const appShellMetadata = {
  version: manifest.metadata.version,
  maintainer: manifest.metadata.maintainer,
  description: manifest.metadata.description
};

/**
 * Resolves the engine manifest
 */
export function resolveManifest(): typeof manifest {
  return manifest;
}

/**
 * Gets engine descriptors from the manifest
 */
export function getEngineRegistry(): Record<string, EngineDescriptor> {
  return getEngineDescriptors();
}

/**
 * Validates the manifest structure
 */
function validateManifest(): void {
  if (!manifest.engines || !Array.isArray(manifest.engines)) {
    throw new Error('Invalid manifest: missing or invalid engines definition');
  }
  
  if (!manifest.metadata || typeof manifest.metadata !== 'object') {
    throw new Error('Invalid manifest: missing or invalid metadata');
  }
  
  // Validate each engine entry
  for (const engine of manifest.engines) {
    if (!engine.id || typeof engine.id !== 'string') {
      throw new Error(`Invalid engine entry: missing or invalid id`);
    }
    
    if (!engine.name || typeof engine.name !== 'string') {
      throw new Error(`Invalid engine entry '${engine.id}': missing or invalid name`);
    }
    
    if (!engine.version || typeof engine.version !== 'string') {
      throw new Error(`Invalid engine '${engine.id}': missing or invalid version`);
    }
    
    if (!Array.isArray(engine.dependencies)) {
      throw new Error(`Invalid engine '${engine.id}': dependencies must be an array`);
    }
  }
}

/**
 * Initializes the Sofia Application Shell runtime
 */
export async function initializeSofiaAppShell(
  initialContext: Record<string, any> = {},
  config: RuntimeConfig = {}
): Promise<AppShellContext> {
  if (runtimeInitialized && isContextInitialized()) {
    console.warn('Sofia Application Shell already initialized, returning existing context');
    return getContext();
  }
  
  // Validate the manifest first
  validateManifest();
  
  // Initialize context
  const context = initializeContext(initialContext);
  
  // Auto-load engines if configured
  if (config.autoLoadEngines !== false) {
    try {
      // Pass context to engines if in test mode
      const loadedEngines = await loadAllEngines(config.testMode ? context : undefined);
      
      // Optionally initialize engines immediately
      if (config.initializeOnLoad) {
        for (const engineName of loadedEngines.keys()) {
          try {
            initializeEngine(engineName, config.customConfig || {});
          } catch (error) {
            console.error(`Failed to initialize engine '${engineName}':`, error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load engines:', error);
      throw error;
    }
  }
  
  // Add lifecycle information for audit mode
  if (config.audit) {
    context.lifecycle = {
      engines: Array.from(context.engines.entries()).map(([id, engine]) => ({
        id,
        ...engine
      }))
    };
  }
  
  runtimeInitialized = true;
  
  return context;
}

/**
 * Gets the application entry point (for bootstrap compatibility)
 */
export function getAppEntry() {
  return {
    initializeSofiaAppShell,
    appShellMetadata,
    resolveManifest,
    getEngineRegistry
  };
}

/**
 * Checks if the runtime is initialized
 */
export function isRuntimeInitialized(): boolean {
  return runtimeInitialized && isContextInitialized();
}

/**
 * Gets runtime information
 */
export function getRuntimeInfo() {
  if (!isRuntimeInitialized()) {
    throw new Error('Runtime not initialized');
  }
  
  const context = getContext();
  const manifest = resolveManifest();
  
  return {
    version: appShellMetadata.version,
    maintainer: appShellMetadata.maintainer,
    initialized: context.initialized,
    startTime: context.startTime,
    uptime: Date.now() - context.startTime,
    engines: {
      total: manifest.engines.length,
      enabled: manifest.engines.filter(e => e.enabled).length,
      loaded: context.engines.size
    }
  };
}

/**
 * Resets the runtime (useful for testing)
 */
export function resetRuntime(): void {
  runtimeInitialized = false;
}

/**
 * Shuts down the Sofia Application Shell runtime
 */
export async function shutdownSofiaAppShell(): Promise<void> {
  if (!runtimeInitialized) {
    throw new Error('Runtime not initialized');
  }
  
  try {
    const context = getContext();
    await shutdownAllEngines(context);
    runtimeInitialized = false;
  } catch (error) {
    console.error('Error during shutdown:', error);
    throw error;
  }
}
