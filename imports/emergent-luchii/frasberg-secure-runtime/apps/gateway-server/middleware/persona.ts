import crypto from 'crypto';
import { buildPersonaModel } from '../../../packages/persona-engine/model';
import { buildPersonaProjection } from '../../../packages/persona-engine/projection';
import { buildPersonaGraph } from '../../../packages/persona-engine/persona-graph';

export function injectPersona(req: any, res: any, next: any) {
  const identity = req.identity;
  if (!identity) {
    return res
      .status(400)
      .json({ error: 'Missing identity for persona construction' });
  }

  const model = buildPersonaModel(identity);
  const projection = buildPersonaProjection(model);
  const graph = buildPersonaGraph(projection);

  req.persona = {
    personaId: crypto.randomUUID(),
    model,
    projection,
    personaGraph: graph,
    createdAt: Date.now(),
  };

  next();
}
