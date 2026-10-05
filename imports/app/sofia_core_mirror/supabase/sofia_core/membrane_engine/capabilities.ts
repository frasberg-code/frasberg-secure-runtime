/**
 * capabilities.ts
 * Capability declaration for membrane_engine
 * Role: Applies filtering and transformation rules based on identity and deviation
 */

import { EngineCapabilities } from '../sofia_core_application_shell/app_shell_capabilities';

export const capabilities: EngineCapabilities = {
  provides: [
    'membrane.filter',
    'membrane.transform'
  ],
  consumes: [
    'identity.resolve',
    'deviation.compute'
  ]
};
