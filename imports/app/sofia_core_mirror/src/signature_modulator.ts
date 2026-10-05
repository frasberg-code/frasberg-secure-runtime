/**
 * Signature Modulator - Adaptive Identity Shaping
 * Part of the Bridge Triad for Sofia Core
 * 
 * Provides adaptive identity shaping through signature modulation,
 * allowing identity to adjust while maintaining coherence.
 */

export interface IdentitySignature {
  base: string;
  modulation: number;
  coherence: number;
}

export interface ModulationInput {
  signature: IdentitySignature;
  target: number;
  adaptive: boolean;
}

export interface ModulationResult {
  signature: IdentitySignature;
  delta: number;
  converged: boolean;
}

export interface ShapingResult {
  shaped: boolean;
  signature: IdentitySignature;
  fidelity: number;
}

export const signatureModulator = {
  /**
   * Create a new identity signature
   */
  create(base: string): IdentitySignature {
    return {
      base,
      modulation: 0.0,
      coherence: 1.0
    };
  },

  /**
   * Modulate signature toward target value
   */
  modulate(input: ModulationInput): ModulationResult {
    const { signature, target, adaptive } = input;
    
    // Calculate adjustment based on adaptive mode
    const maxDelta = adaptive ? 0.2 : 0.1;
    const diff = target - signature.modulation;
    const delta = Math.sign(diff) * Math.min(Math.abs(diff), maxDelta);
    
    const newModulation = signature.modulation + delta;
    const converged = Math.abs(target - newModulation) < 0.01;

    // Adjust coherence based on modulation magnitude
    const newCoherence = Math.max(0.5, 1.0 - Math.abs(newModulation) * 0.2);

    return {
      signature: {
        base: signature.base,
        modulation: newModulation,
        coherence: newCoherence
      },
      delta,
      converged
    };
  },

  /**
   * Shape identity signature based on context
   */
  shape(signature: IdentitySignature, context: string): ShapingResult {
    // Simple context-based shaping
    const contextFactor = context.length / 100;
    const shapingAmount = Math.min(0.3, contextFactor);
    
    const newModulation = signature.modulation + shapingAmount * 0.5;
    const fidelity = 1.0 - Math.abs(shapingAmount);

    return {
      shaped: shapingAmount > 0.1,
      signature: {
        base: signature.base,
        modulation: newModulation,
        coherence: signature.coherence * fidelity
      },
      fidelity
    };
  },

  /**
   * Verify signature coherence
   */
  verifyCoherence(signature: IdentitySignature, threshold: number = 0.7): boolean {
    return signature.coherence >= threshold;
  },

  /**
   * Reset signature to base state
   */
  reset(signature: IdentitySignature): IdentitySignature {
    return {
      base: signature.base,
      modulation: 0.0,
      coherence: 1.0
    };
  },

  /**
   * Blend two signatures
   */
  blend(sig1: IdentitySignature, sig2: IdentitySignature, ratio: number = 0.5): IdentitySignature {
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    
    return {
      base: sig1.base, // Keep base from first signature
      modulation: sig1.modulation * (1 - clampedRatio) + sig2.modulation * clampedRatio,
      coherence: sig1.coherence * (1 - clampedRatio) + sig2.coherence * clampedRatio
    };
  }
};
