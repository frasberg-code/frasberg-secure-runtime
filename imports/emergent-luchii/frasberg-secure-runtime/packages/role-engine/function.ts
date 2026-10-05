export function buildRoleFunction(character: any) {
  return {
    characterFunction: character.formation,
    expressionFunction: character.expression,
    timestamp: Date.now()
  };
}
