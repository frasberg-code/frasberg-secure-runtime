export function buildRoleFunction(character) {
  return {
    characterFunction: character.formation,
    expressionFunction: character.expression,
    timestamp: Date.now()
  };
}
