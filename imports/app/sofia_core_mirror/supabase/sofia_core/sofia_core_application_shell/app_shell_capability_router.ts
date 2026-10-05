/**
 * app_shell_capability_router.ts
 * Dynamic capability routing system for Sofia Core engines.
 * Routes capability calls to the correct engine handler functions.
 */

export interface CapabilityHandler {
  (input: any, context?: any): Promise<any>;
}

export interface RoutingTable {
  [capability: string]: {
    engineId: string;
    handler: CapabilityHandler;
  };
}

export interface CapabilityCallResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  engineId?: string;
  capability: string;
}

/**
 * Capability Router
 * Manages capability-to-handler routing and execution
 */
export class CapabilityRouter {
  private routingTable: RoutingTable = {};
  private context: any;

  constructor(context?: any) {
    this.context = context || {};
  }

  /**
   * Registers a capability handler
   */
  register(capability: string, engineId: string, handler: CapabilityHandler): void {
    if (this.routingTable[capability]) {
      throw new Error(
        `Capability "${capability}" is already registered by engine "${this.routingTable[capability].engineId}"`
      );
    }

    this.routingTable[capability] = {
      engineId,
      handler
    };
  }

  /**
   * Registers multiple handlers from an engine
   */
  registerEngine(engineId: string, handlers: { [capability: string]: CapabilityHandler }): void {
    for (const [capability, handler] of Object.entries(handlers)) {
      this.register(capability, engineId, handler);
    }
  }

  /**
   * Calls a capability by name
   */
  async call<T = any>(capability: string, input: any = {}): Promise<CapabilityCallResult<T>> {
    const route = this.routingTable[capability];

    if (!route) {
      return {
        success: false,
        error: `Capability "${capability}" not found`,
        capability
      };
    }

    try {
      const data = await route.handler(input, this.context);
      return {
        success: true,
        data,
        engineId: route.engineId,
        capability
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        engineId: route.engineId,
        capability
      };
    }
  }

  /**
   * Checks if a capability is registered
   */
  hasCapability(capability: string): boolean {
    return capability in this.routingTable;
  }

  /**
   * Gets all registered capabilities
   */
  getCapabilities(): string[] {
    return Object.keys(this.routingTable);
  }

  /**
   * Gets the engine ID for a capability
   */
  getEngineForCapability(capability: string): string | undefined {
    return this.routingTable[capability]?.engineId;
  }

  /**
   * Gets the routing table for inspection
   */
  getRoutingTable(): Readonly<RoutingTable> {
    return Object.freeze({ ...this.routingTable });
  }

  /**
   * Updates the context passed to handlers
   */
  setContext(context: any): void {
    this.context = context;
  }

  /**
   * Gets the current context
   */
  getContext(): any {
    return this.context;
  }

  /**
   * Clears all registered handlers
   */
  clear(): void {
    this.routingTable = {};
  }
}

/**
 * Loads handlers from all engines and builds routing table
 */
export async function buildRoutingTable(context?: any): Promise<CapabilityRouter> {
  const router = new CapabilityRouter(context);

  try {
    // Dynamically import handlers from all engines
    // Note: In a real implementation, this would use dynamic imports
    // For now, we provide a placeholder that can be replaced with actual imports

    // Example structure for when dynamic imports are available:
    // const identityHandlers = await import('../identity_filter/handlers.ts');
    // router.registerEngine('identity_filter', identityHandlers.handlers);

    // Placeholder: Router is built but requires manual registration
    // This can be enhanced with actual dynamic imports when the runtime supports it
  } catch (error) {
    console.error('Error loading engine handlers:', error);
  }

  return router;
}

/**
 * Creates a router with manually registered handlers
 * Useful for testing or when dynamic imports are not available
 */
export function createRouterWithHandlers(
  engineHandlers: Array<{ engineId: string; handlers: { [capability: string]: CapabilityHandler } }>,
  context?: any
): CapabilityRouter {
  const router = new CapabilityRouter(context);

  for (const { engineId, handlers } of engineHandlers) {
    router.registerEngine(engineId, handlers);
  }

  return router;
}
