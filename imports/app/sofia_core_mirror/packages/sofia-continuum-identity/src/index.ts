/**
 * @emeraldorbit/sofia-continuum-identity
 * 
 * Continuum Identity engine for Sofia Core, governing identity persistence,
 * recursion, and self-renewal.
 */

export { filterIdentity } from './identity_filter';
export { modulateIdentity } from './identity_modulator';
export { bridgeState } from './continuum_bridge';

// Re-export utilities
export * from './capabilities';
export * from './handlers';
export * from './lifecycle';
