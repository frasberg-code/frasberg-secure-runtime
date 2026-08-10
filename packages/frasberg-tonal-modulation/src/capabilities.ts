/**
 * capabilities.ts
 * Capability declaration for frasberg_engine
 * Role: Generates tonal output shaped by identity and membrane filtering
 */

import { EngineCapabilities } from './types';

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
