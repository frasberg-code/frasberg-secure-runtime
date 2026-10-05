/**
 * Integration test for Field Identity Triad
 * Tests the complete flow from signature to constancy to expression
 */

import { computeFieldSignature } from '../supabase/sofia_core/field_signature/field_signature';
import { maintainFieldConstancy } from '../supabase/sofia_core/field_constancy/field_constancy';
import { expressFieldIdentity } from '../supabase/sofia_core/field_expression/field_expression';
import { fieldIdentity } from '../supabase/sofia_core/sofia_core_runtime';

describe('Field Identity Triad Integration', () => {
  test('complete identity flow: signature -> constancy -> expression', () => {
    // Step 1: Compute identity signature from coherent cores
    const cores = [10, 20, 30];
    const signer = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const validator = (x: number) => x > 0;
    const signature = computeFieldSignature(cores, signer, validator);
    
    expect(signature.valid).toBe(true);
    expect(signature.signature).toBe(60);

    // Step 2: Maintain constancy across cycles
    const comparator = (prev: number | null, curr: number) => prev === null || prev === curr;
    const constancy1 = maintainFieldConstancy(null, signature.signature, comparator);
    expect(constancy1.constant).toBe(true); // First cycle, null previous
    expect(constancy1.identity).toBe(60);

    const constancy2 = maintainFieldConstancy(constancy1.identity, signature.signature, comparator);
    expect(constancy2.constant).toBe(true); // Same identity
    expect(constancy2.identity).toBe(60);

    // Step 3: Express identity outward
    const expressor = (x: number) => x * 2; // Keep same type
    const expression = expressFieldIdentity(constancy2.identity, expressor);
    
    expect(expression.expressed).toBe(true);
    expect(expression.output).toBe(120);
  });

  test('handles identity change detection in flow', () => {
    const signer = (arr: string[]) => arr.join('');
    const validator = (x: string) => x.length > 0;
    
    // First cycle
    const sig1 = computeFieldSignature(['A', 'B'], signer, validator);
    expect(sig1.signature).toBe('AB');
    
    const comparator = (prev: string | null, curr: string) => prev === null || prev === curr;
    const const1 = maintainFieldConstancy(null, sig1.signature, comparator);
    expect(const1.constant).toBe(true); // null comparison passes
    
    // Second cycle with different signature
    const sig2 = computeFieldSignature(['C', 'D'], signer, validator);
    expect(sig2.signature).toBe('CD');
    
    const const2 = maintainFieldConstancy(const1.identity, sig2.signature, comparator);
    expect(const2.constant).toBe(false); // Identity changed!
    expect(const2.identity).toBe('CD');
    
    // Express the new identity
    const expressor = (x: string) => x.toLowerCase();
    const expr = expressFieldIdentity(const2.identity, expressor);
    expect(expr.output).toBe('cd');
  });

  test('runtime exports field identity triad correctly', () => {
    expect(fieldIdentity).toBeDefined();
    expect(fieldIdentity.computeFieldSignature).toBeDefined();
    expect(fieldIdentity.maintainFieldConstancy).toBeDefined();
    expect(fieldIdentity.expressFieldIdentity).toBeDefined();
    
    // Verify they are the actual functions
    expect(typeof fieldIdentity.computeFieldSignature).toBe('function');
    expect(typeof fieldIdentity.maintainFieldConstancy).toBe('function');
    expect(typeof fieldIdentity.expressFieldIdentity).toBe('function');
  });

  test('runtime field identity triad functions work', () => {
    const signer = (arr: number[]) => arr[0];
    const validator = (x: number) => x === 42;
    const sig = fieldIdentity.computeFieldSignature([42], signer, validator);
    expect(sig.valid).toBe(true);
    
    const comparator = (prev: number | null, curr: number) => true;
    const const_ = fieldIdentity.maintainFieldConstancy(null, sig.signature, comparator);
    expect(const_.constant).toBe(true);
    
    const expressor = (x: number) => x * 2;
    const expr = fieldIdentity.expressFieldIdentity(const_.identity, expressor);
    expect(expr.output).toBe(84);
  });

  test('complex object flow through identity triad', () => {
    type Identity = { name: string; version: number };
    
    // Create signature from multiple cores
    const cores: Identity[] = [
      { name: 'sofia', version: 1 },
      { name: 'sofia', version: 2 },
    ];
    
    const signer = (arr: Identity[]) => ({
      name: arr[0].name,
      version: Math.max(...arr.map(c => c.version)),
    });
    
    const validator = (x: Identity) => x.version > 0 && x.name.length > 0;
    const sig = computeFieldSignature(cores, signer, validator);
    
    expect(sig.valid).toBe(true);
    expect(sig.signature).toEqual({ name: 'sofia', version: 2 });
    
    // Maintain constancy
    const comparator = (prev: Identity | null, curr: Identity) =>
      prev === null || (prev.name === curr.name && prev.version === curr.version);
    
    const const_ = maintainFieldConstancy(null, sig.signature, comparator);
    expect(const_.constant).toBe(true); // null comparison
    
    // Express identity
    const expressor = (x: Identity) => ({
      name: x.name.toUpperCase(),
      version: x.version + 1,
    });
    
    const expr = expressFieldIdentity(const_.identity, expressor);
    expect(expr.output).toEqual({ name: 'SOFIA', version: 3 });
  });
});
