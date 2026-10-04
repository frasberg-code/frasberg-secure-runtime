import crypto from "crypto";
import { buildCognitiveArchitecture } from "../../../packages/cognition-engine/architecture";
import { buildCognitiveDynamics } from "../../../packages/cognition-engine/dynamics";
import { buildCognitionGraph } from "../../../packages/cognition-engine/cognition-graph";

export function injectCognition(req: any, res: any, next: any) {
  const reasoning = req.reasoning;

  const architecture = buildCognitiveArchitecture(reasoning);
  const dynamics = buildCognitiveDynamics(architecture);
  const graph = buildCognitionGraph(dynamics);

  req.cognition = {
    cognitionId: crypto.randomUUID(),
    architecture,
    dynamics,
    cognitionGraph: graph,
    createdAt: Date.now()
  };

  next();
}
