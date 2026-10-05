import crypto from 'crypto';
import { buildCharacterFormation } from '../../../packages/character-engine/formation';
import { buildCharacterExpression } from '../../../packages/character-engine/expression';
import { buildCharacterGraph } from '../../../packages/character-engine/character-graph';

export function injectCharacter(req: any, res: any, next: any) {
  const persona = req.persona;
  if (!persona) {
    return res
      .status(400)
      .json({ error: 'Missing persona for character construction' });
  }

  const formation = buildCharacterFormation(persona);
  const expression = buildCharacterExpression(formation);
  const graph = buildCharacterGraph(expression);

  req.character = {
    characterId: crypto.randomUUID(),
    formation,
    expression,
    characterGraph: graph,
    createdAt: Date.now(),
  };

  next();
}
