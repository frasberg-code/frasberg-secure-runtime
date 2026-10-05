/**
 * Field Signature - Identity Signature Formation
 * Part of the Field Identity Triad for Sofia Core
 * 
 * Defines the system's unique identity signature.
 * This is the system's "who I am" layer.
 */

/**
 * Represents an identity signature with validation status
 * 
 * @template T - The type of signature being computed
 */
export type IdentitySignature<T> = {
  signature: T;
  valid: boolean;
};

/**
 * Compute field signature from coherent cores
 * 
 * @param cores - Array of coherent field cores to sign
 * @param signer - Function that computes signature from cores
 * @param validator - Function that validates the computed signature
 * @returns IdentitySignature containing signature and validation status
 * @throws Error if no cores are provided
 */
export function computeFieldSignature<T>(
  cores: Array<T>,
  signer: (values: Array<T>) => T,
  validator: (value: T) => boolean
): IdentitySignature<T> {
  if (cores.length === 0) {
    throw new Error('No coherent cores provided for signature computation');
  }
  const signature = signer(cores);
  const valid = validator(signature);
  return { signature, valid };
}
