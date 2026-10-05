import { Logic } from "./logic-model";

export function buildLogicEnvelope(logic: Logic) {
  return {
    logicId: logic.logicId,
    reasoning: logic.reasoning,
    inference: logic.inference,
    logicGraph: logic.logicGraph,
    timestamp: Date.now()
  };
}
