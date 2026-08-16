/**
 * capabilities.ts
 * Capability declaration for frasberg_api (Frasberg API Engine)
 * Role: Final composition layer that produces the system's external responses
 */

import { EngineCapabilities } from '../frasberg_application_shell/app_shell_capabilities';

export const capabilities: EngineCapabilities = {
  provides: [
    'api.respond',
    'api.compose'
  ],
  consumes: [
    'tone.generate',
    'membrane.transform',
    'identity.resolve'
  ]
};
