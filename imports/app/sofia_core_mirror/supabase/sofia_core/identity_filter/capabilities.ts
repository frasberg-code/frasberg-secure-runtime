/**
 * capabilities.ts
 * Capability declaration for identity_filter (Identity Engine)
 * Role: Resolves and normalizes identity inputs for downstream engines
 */

import { EngineCapabilities } from '../sofia_core_application_shell/app_shell_capabilities';

export const capabilities: EngineCapabilities = {
  provides: [
    'identity.resolve',
    'identity.normalize'
  ],
  consumes: []
};
