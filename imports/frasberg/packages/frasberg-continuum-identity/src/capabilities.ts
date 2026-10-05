/**
 * capabilities.ts
 * Capability declaration for identity_filter (Identity Engine)
 * Role: Resolves and normalizes identity inputs for downstream engines
 */

import { EngineCapabilities } from './types';

export const capabilities: EngineCapabilities = {
  provides: [
    'identity.resolve',
    'identity.normalize'
  ],
  consumes: []
};
