import { ENGINE_COSTS } from './costMetrics';

export function enforceCostCeiling(plan: any, ceiling: number) {
  const total = plan.enginesUsed.reduce(
    (sum: number, id: string) => sum + (ENGINE_COSTS[id] || 0),
    0,
  );

  if (total > ceiling) {
    return {
      ...plan,
      enginesUsed: ['logic', 'video'],
    };
  }

  return plan;
}
