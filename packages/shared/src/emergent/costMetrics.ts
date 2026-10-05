// The orchestrator names its always-on engine "game-logic"; costs treat it as "logic".
export const ENGINE_COSTS: Record<string, number> = {
  logic: 1,
  'game-logic': 1,
  video: 3,
  music: 2,
  voice: 2,
  stt: 2,
  image: 3,
};

export function computeCost(enginesUsed: string[]) {
  const perEngine: Record<string, number> = {};
  let total = 0;

  for (const engine of enginesUsed) {
    const cost = ENGINE_COSTS[engine] || 0;
    perEngine[engine] = cost;
    total += cost;
  }

  return { total, perEngine };
}
