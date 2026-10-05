import crypto from 'crypto';
import { buildRoleFunction } from '../../../packages/role-engine/function';
import { buildRoleDynamics } from '../../../packages/role-engine/dynamics';
import { buildRoleGraph } from '../../../packages/role-engine/role-graph';

export function injectRole(req: any, res: any, next: any) {
  const character = req.character;
  if (!character) {
    return res
      .status(400)
      .json({ error: 'Missing character for role construction' });
  }

  const func = buildRoleFunction(character);
  const dynamics = buildRoleDynamics(func);
  const graph = buildRoleGraph(dynamics);

  req.role = {
    roleId: crypto.randomUUID(),
    function: func,
    dynamics,
    roleGraph: graph,
    createdAt: Date.now(),
  };

  next();
}
