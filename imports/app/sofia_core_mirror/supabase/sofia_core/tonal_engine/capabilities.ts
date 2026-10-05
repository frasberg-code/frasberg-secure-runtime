/**
 * capabilities.ts
 * Capability declaration for tonal_engine
 * Role: Generates tonal output shaped by identity and membrane filtering
 */

import { EngineCapabilities } from '../sofia_core_application_shell/app_shell_capabilities';

export const capabilities: EngineCapabilities = {
  provides: [
    'tone.generate',
    'tone.adjust'
  ],
  consumes: [
    'identity.normalize',
    'membrane.filter'
  ]
};
