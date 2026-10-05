import type { Role } from "./role-model";

export function evolveRole(role: Role) {
  return {
    roleId: role.roleId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
