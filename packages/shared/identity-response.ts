export function identityResponse(owner, payload) {
  return {
    owner,
    continuity: true,
    payload
  };
}
