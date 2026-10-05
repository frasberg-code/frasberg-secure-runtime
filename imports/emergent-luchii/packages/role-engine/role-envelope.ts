export function buildRoleEnvelope(role) {
  return {
    roleId: role.roleId,
    function: role.function,
    dynamics: role.dynamics,
    roleGraph: role.roleGraph,
    timestamp: Date.now()
  };
}
