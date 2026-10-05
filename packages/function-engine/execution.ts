export function buildExecution(role: any) {
  return {
    roleExecution: role.function,
    dynamicsExecution: role.dynamics,
    timestamp: Date.now()
  };
}
