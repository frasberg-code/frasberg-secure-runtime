/**
 * Sofia Core Pipeline Orchestration Layer
 * 
 * Provides declarative capability chaining with automatic data flow,
 * error handling, and context propagation.
 */

export interface PipelineStep {
  capability: string;
  transform?: (data: any) => any;
}

export interface PipelineResult {
  success: boolean;
  output?: any;
  error?: string;
  failedStep?: string;
  executedSteps?: string[];
}

export interface PipelineContext {
  call: (capability: string, input: any) => Promise<any>;
  [key: string]: any;
}

/**
 * Executes a pipeline of capability calls sequentially.
 * 
 * @param runtime - Runtime context with call() method
 * @param steps - Array of capability names or step objects
 * @param input - Initial input data
 * @returns Pipeline execution result with success status
 */
export async function runPipeline(
  runtime: PipelineContext,
  steps: (string | PipelineStep)[],
  input: any
): Promise<PipelineResult> {
  let data = input;
  const executedSteps: string[] = [];

  for (const step of steps) {
    const capability = typeof step === 'string' ? step : step.capability;
    const transform = typeof step === 'string' ? undefined : step.transform;

    try {
      // Apply optional transform before calling capability
      const inputData = transform ? transform(data) : data;
      
      // Call the capability
      const result = await runtime.call(capability, inputData);
      
      // Track execution
      executedSteps.push(capability);

      // Check for errors
      if (!result.success) {
        return {
          success: false,
          error: result.error || `Capability ${capability} failed`,
          failedStep: capability,
          executedSteps
        };
      }

      // Pass output to next step
      data = result.output || result.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        failedStep: capability,
        executedSteps
      };
    }
  }

  return {
    success: true,
    output: data,
    executedSteps
  };
}

/**
 * Creates a reusable pipeline from a step definition.
 * 
 * @param steps - Array of capability names or step objects
 * @returns Function that executes the pipeline with given runtime and input
 */
export function createPipeline(steps: (string | PipelineStep)[]) {
  return async (runtime: PipelineContext, input: any): Promise<PipelineResult> => {
    return runPipeline(runtime, steps, input);
  };
}

/**
 * Validates that all capabilities in a pipeline exist in the runtime.
 * 
 * @param runtime - Runtime context with hasCapability() method
 * @param steps - Array of capability names or step objects
 * @returns Validation result with missing capabilities
 */
export function validatePipeline(
  runtime: { hasCapability: (cap: string) => boolean },
  steps: (string | PipelineStep)[]
): { valid: boolean; missingCapabilities: string[] } {
  const missingCapabilities: string[] = [];

  for (const step of steps) {
    const capability = typeof step === 'string' ? step : step.capability;
    if (!runtime.hasCapability(capability)) {
      missingCapabilities.push(capability);
    }
  }

  return {
    valid: missingCapabilities.length === 0,
    missingCapabilities
  };
}

/**
 * Builds a reverse capability index for O(1) provider lookup.
 * 
 * @param graph - Capability graph from runtime
 * @returns Map of capability name to engine ID
 */
function buildProviderIndex(graph: Record<string, { provides: string[]; consumes?: string[] }>): Record<string, string> {
  const providerFor: Record<string, string> = {};
  
  for (const [engineId, caps] of Object.entries(graph)) {
    for (const capability of caps.provides) {
      providerFor[capability] = engineId;
    }
  }
  
  return providerFor;
}

/**
 * Recursively resolves dependencies for a capability.
 * 
 * @param capability - The capability to resolve dependencies for
 * @param graph - Capability graph from runtime
 * @param providerFor - Reverse capability index
 * @param resolved - Set to track resolved capabilities
 * @param seen - Set to prevent infinite loops
 */
function resolveDeps(
  capability: string,
  graph: Record<string, { provides: string[]; consumes?: string[] }>,
  providerFor: Record<string, string>,
  resolved: Set<string>,
  seen: Set<string>
): void {
  if (seen.has(capability)) return; // Prevents infinite loops
  seen.add(capability);

  const provider = providerFor[capability];
  if (!provider) {
    throw new Error(`No provider for capability: ${capability}`);
  }

  const consumes = graph[provider].consumes ?? [];

  // Recursively resolve all dependencies first
  for (const dep of consumes) {
    resolveDeps(dep, graph, providerFor, resolved, new Set(seen));
    resolved.add(dep);
  }
}

/**
 * Automatically expands a pipeline to include all required dependencies.
 * 
 * This function analyzes the capability graph and ensures that all
 * dependencies are included in the correct order before their dependents.
 * 
 * Example:
 *   Input:  ["tone.generate"]
 *   Output: ["identity.resolve", "identity.normalize", "deviation.compute", 
 *            "membrane.filter", "tone.generate"]
 * 
 * @param runtime - Runtime context with getCapabilityGraph() method
 * @param steps - Array of capability names (step objects not supported)
 * @returns Expanded array of capabilities in dependency order
 */
export function expandPipeline(
  runtime: { getCapabilityGraph: () => Record<string, { provides: string[]; consumes?: string[] }> },
  steps: string[]
): string[] {
  const graph = runtime.getCapabilityGraph();
  const providerFor = buildProviderIndex(graph);
  const expanded = new Set<string>();

  // Resolve dependencies for each step
  for (const step of steps) {
    resolveDeps(step, graph, providerFor, expanded, new Set());
    expanded.add(step);
  }

  // Return array maintaining insertion order (Set maintains order)
  return Array.from(expanded);
}

/**
 * Optimizes a pipeline by removing duplicates, enforcing correct ordering,
 * and grouping engine-local steps to reduce context switching.
 * 
 * Optimization strategies:
 * 1. Remove duplicate capabilities
 * 2. Maintain dependency order (dependencies before dependents)
 * 3. Group capabilities from the same engine together when possible
 * 
 * Example:
 *   Input:  ["identity.resolve", "deviation.compute", "identity.normalize", "identity.resolve"]
 *   Output: ["identity.resolve", "identity.normalize", "deviation.compute"]
 * 
 * @param runtime - Runtime context with getCapabilityGraph() and getEngineForCapability() methods
 * @param steps - Array of capability names to optimize
 * @returns Optimized array of capabilities
 */
export function optimizePipeline(
  runtime: {
    getCapabilityGraph: () => Record<string, { provides: string[]; consumes?: string[] }>;
    getEngineForCapability?: (cap: string) => string | undefined;
  },
  steps: string[]
): string[] {
  // Step 1: Remove duplicates while preserving first occurrence
  const seen = new Set<string>();
  const deduplicated: string[] = [];
  
  for (const step of steps) {
    if (!seen.has(step)) {
      seen.add(step);
      deduplicated.push(step);
    }
  }

  // Step 2: Build dependency graph for ordering
  const graph = runtime.getCapabilityGraph();
  const providerFor = buildProviderIndex(graph);
  
  // Build a map of what each capability depends on
  const dependencies = new Map<string, Set<string>>();
  for (const capability of deduplicated) {
    const provider = providerFor[capability];
    if (provider) {
      const deps = new Set<string>();
      const consumes = graph[provider].consumes ?? [];
      for (const dep of consumes) {
        deps.add(dep);
      }
      dependencies.set(capability, deps);
    }
  }

  // Step 3: Group by engine if getEngineForCapability is available
  if (runtime.getEngineForCapability) {
    const engineGroups = new Map<string, string[]>();
    
    for (const capability of deduplicated) {
      const engine = runtime.getEngineForCapability(capability);
      if (engine) {
        if (!engineGroups.has(engine)) {
          engineGroups.set(engine, []);
        }
        engineGroups.get(engine)!.push(capability);
      }
    }

    // Step 4: Topological sort with engine grouping
    const result: string[] = [];
    const completed = new Set<string>();
    
    // Helper function to check if all dependencies are satisfied
    const canExecute = (capability: string): boolean => {
      const deps = dependencies.get(capability);
      if (!deps) return true;
      for (const dep of deps) {
        if (deduplicated.includes(dep) && !completed.has(dep)) {
          return false;
        }
      }
      return true;
    };

    // Process capabilities in engine groups
    const remaining = new Set(deduplicated);
    
    while (remaining.size > 0) {
      let addedAny = false;
      
      // Try to add complete engine groups
      for (const [engine, capabilities] of engineGroups.entries()) {
        const groupCapabilities = capabilities.filter(cap => remaining.has(cap));
        
        // Check if all capabilities in this group can execute
        const allCanExecute = groupCapabilities.every(canExecute);
        
        if (allCanExecute && groupCapabilities.length > 0) {
          // Add all capabilities from this engine group
          for (const cap of groupCapabilities) {
            result.push(cap);
            completed.add(cap);
            remaining.delete(cap);
            addedAny = true;
          }
        }
      }
      
      // If no complete groups can be added, add individual capabilities
      if (!addedAny) {
        for (const capability of remaining) {
          if (canExecute(capability)) {
            result.push(capability);
            completed.add(capability);
            remaining.delete(capability);
            addedAny = true;
            break;
          }
        }
      }
      
      // Safety check: if nothing was added, we have a problem
      if (!addedAny) {
        // Just return remaining in original order to avoid infinite loop
        result.push(...Array.from(remaining));
        break;
      }
    }
    
    return result;
  }

  // Step 4: If no engine grouping available, just return deduplicated in order
  // (dependency order is already maintained by expansion)
  return deduplicated;
}
