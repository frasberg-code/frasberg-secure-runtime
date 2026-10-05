/**
 * app_shell_capabilities.ts
 * Capability contract system for Sofia Core engines.
 * Defines what each engine provides and consumes for dependency validation.
 */

export interface EngineCapabilities {
  /**
   * Capabilities this engine provides to other engines
   */
  provides: string[];
  
  /**
   * Capabilities this engine requires from other engines (optional)
   */
  consumes?: string[];
}

export interface CapabilityNode {
  engineId: string;
  provides: string[];
  consumes: string[];
  dependencies: string[];
}

export interface CapabilityGraph {
  nodes: Map<string, CapabilityNode>;
  edges: Array<{ from: string; to: string; capability: string }>;
}

export interface CapabilityValidationResult {
  valid: boolean;
  missingProviders: Array<{ engineId: string; capability: string }>;
  circularDependencies: string[][];
  unusedCapabilities: Array<{ engineId: string; capability: string }>;
}

/**
 * Validates capability dependencies across engines
 */
export function validateCapabilities(
  capabilities: Map<string, EngineCapabilities>
): CapabilityValidationResult {
  const result: CapabilityValidationResult = {
    valid: true,
    missingProviders: [],
    circularDependencies: [],
    unusedCapabilities: []
  };

  // Build a map of what capabilities are provided
  const providedCapabilities = new Map<string, string[]>();
  
  for (const [engineId, caps] of capabilities.entries()) {
    for (const capability of caps.provides) {
      if (!providedCapabilities.has(capability)) {
        providedCapabilities.set(capability, []);
      }
      providedCapabilities.get(capability)!.push(engineId);
    }
  }

  // Check for missing providers
  for (const [engineId, caps] of capabilities.entries()) {
    if (!caps.consumes) continue;
    
    for (const capability of caps.consumes) {
      if (!providedCapabilities.has(capability)) {
        result.valid = false;
        result.missingProviders.push({ engineId, capability });
      }
    }
  }

  // Check for unused capabilities
  const consumedCapabilities = new Set<string>();
  for (const caps of capabilities.values()) {
    if (caps.consumes) {
      caps.consumes.forEach(c => consumedCapabilities.add(c));
    }
  }

  for (const [engineId, caps] of capabilities.entries()) {
    for (const capability of caps.provides) {
      if (!consumedCapabilities.has(capability)) {
        result.unusedCapabilities.push({ engineId, capability });
      }
    }
  }

  // Check for circular dependencies
  const circularPaths = findCircularDependencies(capabilities, providedCapabilities);
  if (circularPaths.length > 0) {
    result.valid = false;
    result.circularDependencies = circularPaths;
  }

  return result;
}

/**
 * Finds circular dependency chains in capability graph
 */
function findCircularDependencies(
  capabilities: Map<string, EngineCapabilities>,
  providedCapabilities: Map<string, string[]>
): string[][] {
  const circular: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function visit(engineId: string, path: string[]): void {
    if (recursionStack.has(engineId)) {
      // Found a cycle
      const cycleStart = path.indexOf(engineId);
      if (cycleStart !== -1) {
        circular.push(path.slice(cycleStart).concat(engineId));
      }
      return;
    }

    if (visited.has(engineId)) {
      return;
    }

    visited.add(engineId);
    recursionStack.add(engineId);
    path.push(engineId);

    const caps = capabilities.get(engineId);
    if (caps && caps.consumes) {
      for (const capability of caps.consumes) {
        const providers = providedCapabilities.get(capability) || [];
        for (const provider of providers) {
          if (provider !== engineId) {
            visit(provider, [...path]);
          }
        }
      }
    }

    recursionStack.delete(engineId);
  }

  for (const engineId of capabilities.keys()) {
    if (!visited.has(engineId)) {
      visit(engineId, []);
    }
  }

  return circular;
}

/**
 * Builds a capability graph for visualization and analysis
 */
export function getCapabilityGraph(
  capabilities: Map<string, EngineCapabilities>
): CapabilityGraph {
  const nodes = new Map<string, CapabilityNode>();
  const edges: Array<{ from: string; to: string; capability: string }> = [];

  // Build nodes
  for (const [engineId, caps] of capabilities.entries()) {
    nodes.set(engineId, {
      engineId,
      provides: caps.provides,
      consumes: caps.consumes || [],
      dependencies: []
    });
  }

  // Build provider map
  const providedBy = new Map<string, string[]>();
  for (const [engineId, caps] of capabilities.entries()) {
    for (const capability of caps.provides) {
      if (!providedBy.has(capability)) {
        providedBy.set(capability, []);
      }
      providedBy.get(capability)!.push(engineId);
    }
  }

  // Build edges and dependencies
  for (const [engineId, caps] of capabilities.entries()) {
    if (!caps.consumes) continue;

    const node = nodes.get(engineId)!;
    
    for (const capability of caps.consumes) {
      const providers = providedBy.get(capability) || [];
      for (const provider of providers) {
        if (provider !== engineId) {
          edges.push({
            from: engineId,
            to: provider,
            capability
          });
          
          if (!node.dependencies.includes(provider)) {
            node.dependencies.push(provider);
          }
        }
      }
    }
  }

  return { nodes, edges };
}
