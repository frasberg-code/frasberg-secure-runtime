/**
 * @emeraldorbit/sofia-governance-engine
 * 
 * Core governance engine for Sofia Core, including decision logic,
 * stabilization routines, and behavioral enforcement.
 */

export { deviationEngine } from './deviation_engine';
export { orchestrate } from './orchestration_engine';

// Re-export types and utilities
export * from './capabilities';
export * from './handlers';
export * from './lifecycle';
