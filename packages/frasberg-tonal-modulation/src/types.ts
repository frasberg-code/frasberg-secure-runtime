/**
 * Type definitions for Frasberg engine capabilities
 */

export interface EngineCapabilities {
  provides?: string[];
  consumes?: string[];
  optional?: string[];
}

export interface EngineHandlers {
  [key: string]: (input: any) => any;
}

export interface EngineLifecycle {
  init?: () => void | Promise<void>;
  shutdown?: () => void | Promise<void>;
}
