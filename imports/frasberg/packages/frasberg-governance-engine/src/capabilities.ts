/**
 * capabilities.ts
 * Capability declaration for deviation_engine
 * Role: Computes deviation metrics based on resolved identity
 */

import { EngineCapabilities } from './types';

export const capabilities: EngineCapabilities = {
  provides: [
    'deviation.compute',
    'deviation.analyze'
  ],
  consumes: [
    'identity.resolve'
  ]
};
