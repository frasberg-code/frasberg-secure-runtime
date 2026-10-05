/**
 * app_shell_index.ts
 * Public initialization entrypoint for Sofia Core Application Shell.
 * Exposes the primary API for bootstrapping and managing the Sofia Core runtime.
 */

import {
  initializeSofiaAppShell,
  getAppEntry,
  getRuntimeInfo,
  isRuntimeInitialized,
  resolveManifest,
  getEngineRegistry,
  appShellMetadata,
  RuntimeConfig
} from './app_shell_runtime';

import {
  getContext,
  isContextInitialized,
  listRegisteredEngines,
  getEngineFromContext,
  AppShellContext
} from './app_shell_context';

import {
  loadEngine,
  initializeEngine,
  getEngineState,
  getAllEngineStates,
  getEngineDescriptor,
  EngineDescriptor,
  EngineLifecycleState
} from './app_shell_lifecycle';

/**
 * Primary initialization function - bootstraps the entire Sofia Core
 */
export async function initialize(
  context: Record<string, any> = {},
  config: RuntimeConfig = {}
): Promise<AppShellContext> {
  return await initializeSofiaAppShell(context, config);
}

/**
 * Gets the application entry point (for bootstrap compatibility)
 */
export { getAppEntry };

/**
 * Runtime information and status
 */
export const runtime = {
  getInfo: getRuntimeInfo,
  isInitialized: isRuntimeInitialized,
  getMetadata: () => appShellMetadata
};

/**
 * Context management
 */
export const context = {
  get: getContext,
  isInitialized: isContextInitialized,
  listEngines: listRegisteredEngines,
  getEngine: getEngineFromContext
};

/**
 * Engine lifecycle operations
 */
export const engines = {
  load: loadEngine,
  initialize: initializeEngine,
  getState: getEngineState,
  getAllStates: getAllEngineStates,
  getDescriptor: getEngineDescriptor
};

/**
 * Manifest operations
 */
export const manifest = {
  resolve: resolveManifest,
  getRegistry: getEngineRegistry
};

/**
 * Export metadata for external use
 */
export { appShellMetadata };

/**
 * Export types
 */
export type {
  AppShellContext,
  RuntimeConfig,
  EngineDescriptor,
  EngineLifecycleState
};

/**
 * Default export - the primary API surface
 */
export default {
  initialize,
  getAppEntry,
  runtime,
  context,
  engines,
  manifest,
  metadata: appShellMetadata
};
