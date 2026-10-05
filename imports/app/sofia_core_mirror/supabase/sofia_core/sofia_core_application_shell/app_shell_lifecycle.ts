/**
 * app_shell_lifecycle.ts
 * Engine lifecycle manager for Sofia Core Application Shell.
 * Handles loading, initialization, and state management of engines.
 */

import manifest from './app_shell_manifest.json';
import { 
  getContext, 
  registerEngineInContext, 
  getEngineFromContext 
} from './app_shell_context';
import {
  EngineCapabilities,
  validateCapabilities,
  getCapabilityGraph,
  CapabilityGraph,
  CapabilityValidationResult
} from './app_shell_capabilities';

export interface EngineDescriptor {
  id: string;
  name: string;
  version: string;
  path: string;
  registration_key: string;
  description: string;
  dependencies: string[];
  enabled: boolean;
}

export interface EngineLifecycleState {
  loaded: boolean;
  initialized: boolean;
  error: string | null;
}

export interface LifecycleLogEntry {
  type: 'init' | 'shutdown' | 'error';
  engineId: string;
  timestamp: number;
  message?: string;
  context?: any;
}

const engineStates = new Map<string, EngineLifecycleState>();
const lifecycleLogs: LifecycleLogEntry[] = [];
const engineErrorSimulations = new Map<string, string>();
let initOrder: string[] = [];
let shutdownOrder: string[] = [];

/**
 * Gets all engine descriptors from the manifest
 */
export function getEngineDescriptors(): Record<string, EngineDescriptor> {
  // Convert array format to object format for backward compatibility
  const descriptorsMap: Record<string, EngineDescriptor> = {};
  for (const engine of manifest.engines) {
    descriptorsMap[engine.id] = engine;
  }
  return descriptorsMap;
}

/**
 * Gets a specific engine descriptor
 */
export function getEngineDescriptor(name: string): EngineDescriptor {
  const descriptors = getEngineDescriptors();
  
  if (!descriptors[name]) {
    throw new Error(`Engine descriptor not found for: ${name}`);
  }
  
  return descriptors[name];
}

/**
 * Validates engine dependencies are met
 */
function validateDependencies(descriptor: EngineDescriptor): void {
  for (const dep of descriptor.dependencies) {
    const depState = engineStates.get(dep);
    
    if (!depState) {
      throw new Error(
        `Missing dependency '${dep}' for engine '${descriptor.name}'`
      );
    }
    
    if (!depState.loaded) {
      throw new Error(
        `Dependency '${dep}' not loaded for engine '${descriptor.name}'`
      );
    }
  }
}

/**
 * Loads an engine dynamically
 */
export async function loadEngine(name: string, context?: any): Promise<any> {
  const descriptor = getEngineDescriptor(name);
  
  if (!descriptor.enabled) {
    throw new Error(`Engine '${name}' is disabled in manifest`);
  }
  
  // Check if already loaded
  if (engineStates.has(name) && engineStates.get(name)!.loaded) {
    return getEngineFromContext(name);
  }
  
  // Validate dependencies first
  validateDependencies(descriptor);
  
  // Initialize state
  engineStates.set(name, {
    loaded: false,
    initialized: false,
    error: null
  });
  
  // Check for simulated errors in test mode
  if (engineErrorSimulations.has(name)) {
    const errorMsg = engineErrorSimulations.get(name)!;
    const state = engineStates.get(name)!;
    state.error = errorMsg;
    
    lifecycleLogs.push({
      type: 'error',
      engineId: name,
      timestamp: Date.now(),
      message: errorMsg,
      context
    });
    
    throw new Error(`Engine '${name}' failed: ${errorMsg}`);
  }
  
  try {
    // NOTE: This is a placeholder implementation for the initial Application Shell.
    // In a production environment, this would use dynamic imports to load actual engine modules:
    //
    //   const engineModule = await import(descriptor.path);
    //   const engine = engineModule.default || engineModule[descriptor.registration_key];
    //
    // For now, we register a descriptor-based placeholder that provides the engine
    // metadata and allows the Application Shell infrastructure to function correctly.
    // Actual engine functionality should be wired through the integration layer.
    const enginePlaceholder = {
      id: descriptor.id,
      name: descriptor.name,
      version: descriptor.version,
      descriptor,
      // Add lifecycle hooks for testing
      init: async (ctx: any) => {
        lifecycleLogs.push({
          type: 'init',
          engineId: descriptor.id,
          timestamp: Date.now(),
          context: ctx
        });
        initOrder.push(descriptor.id);
      },
      shutdown: async (ctx: any) => {
        lifecycleLogs.push({
          type: 'shutdown',
          engineId: descriptor.id,
          timestamp: Date.now(),
          context: ctx
        });
        shutdownOrder.push(descriptor.id);
      }
    };
    
    registerEngineInContext(name, enginePlaceholder);
    
    const state = engineStates.get(name)!;
    state.loaded = true;
    
    // Call init hook if context provided
    if (context && enginePlaceholder.init) {
      await enginePlaceholder.init(context);
    }
    
    return enginePlaceholder;
  } catch (error) {
    const state = engineStates.get(name)!;
    state.error = error instanceof Error ? error.message : String(error);
    
    lifecycleLogs.push({
      type: 'error',
      engineId: name,
      timestamp: Date.now(),
      message: state.error,
      context
    });
    
    throw error;
  }
}

/**
 * Initializes a loaded engine
 */
export function initializeEngine(name: string, initConfig: any = {}): any {
  const state = engineStates.get(name);
  
  if (!state) {
    throw new Error(`Engine '${name}' not loaded. Call loadEngine() first.`);
  }
  
  if (!state.loaded) {
    throw new Error(`Engine '${name}' failed to load: ${state.error}`);
  }
  
  if (state.initialized) {
    return getEngineFromContext(name);
  }
  
  try {
    const engine = getEngineFromContext(name);
    
    // If engine has an initialize method, call it
    if (engine.initialize && typeof engine.initialize === 'function') {
      engine.initialize(initConfig);
    }
    
    state.initialized = true;
    return engine;
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error);
    throw error;
  }
}

/**
 * Loads all enabled engines in dependency order
 */
export async function loadAllEngines(context?: any): Promise<Map<string, any>> {
  const descriptors = getEngineDescriptors();
  const loaded = new Map<string, any>();
  const toLoad = new Set(
    Object.keys(descriptors).filter(name => descriptors[name].enabled)
  );
  
  // Simple dependency resolution: keep loading until all are loaded
  while (toLoad.size > 0) {
    const before = toLoad.size;
    
    for (const name of Array.from(toLoad)) {
      const descriptor = descriptors[name];
      
      // Check if all dependencies are loaded
      const depsLoaded = descriptor.dependencies.every(dep => loaded.has(dep));
      
      if (depsLoaded) {
        try {
          const engine = await loadEngine(name, context);
          loaded.set(name, engine);
          toLoad.delete(name);
        } catch (error) {
          console.error(`Failed to load engine '${name}':`, error);
          lifecycleLogs.push({
            type: 'error',
            engineId: name,
            timestamp: Date.now(),
            message: error instanceof Error ? error.message : String(error),
            context
          });
          throw error; // Propagate error to stop loading chain
        }
      }
    }
    
    // If no progress was made, we have circular dependencies or missing deps
    if (toLoad.size === before && toLoad.size > 0) {
      const remaining = Array.from(toLoad).join(', ');
      throw new Error(
        `Cannot resolve dependencies for engines: ${remaining}`
      );
    }
  }
  
  return loaded;
}

/**
 * Gets the lifecycle state of an engine
 */
export function getEngineState(name: string): EngineLifecycleState | null {
  return engineStates.get(name) || null;
}

/**
 * Gets all engine states
 */
export function getAllEngineStates(): Map<string, EngineLifecycleState> {
  return new Map(engineStates);
}

/**
 * Resets lifecycle state (useful for testing)
 */
export function resetLifecycleState(): void {
  engineStates.clear();
  lifecycleLogs.length = 0;
  engineErrorSimulations.clear();
  initOrder.length = 0;
  shutdownOrder.length = 0;
}

/**
 * Gets lifecycle logs (for testing and debugging)
 */
export function getLifecycleLogs(): LifecycleLogEntry[] {
  return [...lifecycleLogs];
}

/**
 * Gets initialization order (for testing)
 */
export function getInitOrder(): string[] {
  return [...initOrder];
}

/**
 * Gets shutdown order (for testing)
 */
export function getShutdownOrder(): string[] {
  return [...shutdownOrder];
}

/**
 * Sets error simulation for testing
 */
export function setEngineErrorSimulation(engineId: string, errorMessage: string): void {
  engineErrorSimulations.set(engineId, errorMessage);
}

/**
 * Clears error simulations
 */
export function clearEngineErrorSimulations(): void {
  engineErrorSimulations.clear();
}

/**
 * Shuts down all engines in reverse init order
 */
export async function shutdownAllEngines(context?: any): Promise<void> {
  const engines = [...initOrder].reverse();
  
  for (const engineId of engines) {
    try {
      const engine = getEngineFromContext(engineId);
      if (engine && engine.shutdown && typeof engine.shutdown === 'function') {
        await engine.shutdown(context);
      }
    } catch (error) {
      console.error(`Error shutting down engine '${engineId}':`, error);
      lifecycleLogs.push({
        type: 'error',
        engineId,
        timestamp: Date.now(),
        message: error instanceof Error ? error.message : String(error),
        context
      });
    }
  }
}

/**
 * Loads engine capabilities from all engines
 */
export async function loadEngineCapabilities(): Promise<Map<string, EngineCapabilities>> {
  const capabilities = new Map<string, EngineCapabilities>();
  const descriptors = getEngineDescriptors();

  for (const [engineId, descriptor] of Object.entries(descriptors)) {
    if (!descriptor.enabled) continue;

    try {
      // In a real implementation, this would dynamically import the capabilities
      // For now, we'll use a placeholder that matches the structure
      // const capModule = await import(`${descriptor.path}/capabilities`);
      // capabilities.set(engineId, capModule.capabilities);
      
      // Placeholder capabilities based on engine structure
      const placeholderCaps = getPlaceholderCapabilities(engineId);
      capabilities.set(engineId, placeholderCaps);
    } catch (error) {
      console.warn(`Could not load capabilities for engine '${engineId}':`, error);
      // Default to empty capabilities
      capabilities.set(engineId, { provides: [], consumes: [] });
    }
  }

  return capabilities;
}

/**
 * Gets placeholder capabilities for an engine (used until dynamic import is enabled)
 */
function getPlaceholderCapabilities(engineId: string): EngineCapabilities {
  const capabilitiesMap: Record<string, EngineCapabilities> = {
    'identity_filter': {
      provides: ['identity.resolve', 'identity.normalize'],
      consumes: []
    },
    'deviation_engine': {
      provides: ['deviation.compute', 'deviation.analyze'],
      consumes: ['identity.resolve']
    },
    'membrane_engine': {
      provides: ['membrane.filter', 'membrane.transform'],
      consumes: ['identity.resolve', 'deviation.compute']
    },
    'tonal_engine': {
      provides: ['tone.generate', 'tone.adjust'],
      consumes: ['identity.normalize', 'membrane.filter']
    },
    'sofia_api': {
      provides: ['api.respond', 'api.compose'],
      consumes: ['tone.generate', 'membrane.transform', 'identity.resolve']
    }
  };

  return capabilitiesMap[engineId] || { provides: [], consumes: [] };
}

/**
 * Validates engine capabilities
 */
export async function validateEngineCapabilities(): Promise<CapabilityValidationResult> {
  const capabilities = await loadEngineCapabilities();
  return validateCapabilities(capabilities);
}

/**
 * Gets the capability graph for all engines
 */
export async function getEngineCapabilityGraph(): Promise<CapabilityGraph> {
  const capabilities = await loadEngineCapabilities();
  return getCapabilityGraph(capabilities);
}
