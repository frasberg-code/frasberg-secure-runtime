export function buildExecution(role) {
  return {
    roleExecution: role.function,
    dynamicsExecution: role.dynamics,
    timestamp: Date.now()
  };
}
