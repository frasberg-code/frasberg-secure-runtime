export interface TelemetryPoint {
  timestamp: number;
  carId: string;
  speedKph: number;
  lap: number;
  position: number;
}

export interface RaceAnalyticsSummary {
  raceId: string;
  topSpeedCarId?: string;
  topSpeedKph?: number;
  averageSpeedByCar: Record<string, number>;
}

// Telemetry carries no lap times, so this reports top and average speed only (no "fastest lap").
export function analyzeRaceTelemetry(
  raceId: string,
  telemetry: TelemetryPoint[],
): RaceAnalyticsSummary {
  const byCar: Record<string, { total: number; count: number; max: number }> = {};
  for (const t of telemetry) {
    const s = (byCar[t.carId] ??= { total: 0, count: 0, max: -Infinity });
    s.total += t.speedKph;
    s.count += 1;
    s.max = Math.max(s.max, t.speedKph);
  }
  const averageSpeedByCar: Record<string, number> = {};
  let topSpeedCarId: string | undefined;
  let topSpeedKph: number | undefined;
  for (const [carId, s] of Object.entries(byCar)) {
    averageSpeedByCar[carId] = s.total / s.count;
    if (topSpeedKph === undefined || s.max > topSpeedKph) {
      topSpeedKph = s.max;
      topSpeedCarId = carId;
    }
  }
  return { raceId, topSpeedCarId, topSpeedKph, averageSpeedByCar };
}