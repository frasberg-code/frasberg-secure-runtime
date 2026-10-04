export function buildInvariants(laws: any) {
  return {
    immutability: laws.immutability,
    determinism: laws.determinism,
    consistency: laws.consistency,
    checksum: Math.random().toString(36).slice(2)
  };
}
