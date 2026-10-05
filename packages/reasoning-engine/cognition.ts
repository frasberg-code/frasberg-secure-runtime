export function buildCognition(logic: any) {
  return {
    logicCognition: logic.reasoning,
    flowCognition: logic.reasoning,
    timestamp: Date.now()
  };
}
