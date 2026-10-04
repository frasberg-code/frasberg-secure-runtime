export function buildCognition(logic: any) {
  return {
    logicCognition: logic.reasoning,
    inferenceCognition: logic.inference,
    timestamp: Date.now()
  };
}
