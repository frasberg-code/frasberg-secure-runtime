import type { Role } from "./role-model";

export function buildRoleEnvelope(role: Role) {
  return {
    roleId: role.roleId,
    function: role.function,
    dynamics: role.dynamics,
    roleGraph: role.roleGraph,
    timestamp: Date.now()
  };
}
