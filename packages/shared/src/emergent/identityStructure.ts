export function enrichWithIdentityStructure(
  request: any,
  identity: any,
  structure: any,
) {
  return {
    ...request,
    identity,
    structure,
  };
}
