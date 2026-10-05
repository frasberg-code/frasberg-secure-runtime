/**
 * capabilities.ts
 * Capability declaration for deviation_engine
 * Role: Computes deviation metrics based on resolved identity
 */

import { EngineCapabilities } from '../sofia_core_application_shell/app_shell_capabilities';

export const capabilities: EngineCapabilities = {
  provides: [
    'deviation.compute',
    'deviation.analyze'
  ],
  consumes: [
    'identity.resolve'
  ]
};
