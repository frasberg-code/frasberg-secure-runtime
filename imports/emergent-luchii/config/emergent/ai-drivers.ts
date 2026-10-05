import { CarState, RaceState } from "./simulation-state";

export type DriverPersonality = "aggressive" | "defensive" | "calculated";

export interface DriverProfile {
  carId: string;
  personality: DriverPersonality;
  riskTolerance: number; // 0–1
}

export function decideDriverAction(
  profile: DriverProfile,
  car: CarState,
  race: RaceState
): { targetSpeedKph: number; shouldOvertake: boolean; shouldPit: boolean } {
  const baseTarget =
    profile.personality === "aggressive"
      ? 310
      : profile.personality === "defensive"
      ? 280
      : 295;

  const damagePenalty = car.damageLevel * 0.5;
  const fuelPenalty = car.fuelLiters < 5 ? 20 : 0;

  const targetSpeed = Math.max(
    200,
    baseTarget - damagePenalty - fuelPenalty
  );

  const aheadCar = race.cars.find(c => c.position === car.position - 1);
  const shouldOvertake =
    !!aheadCar &&
    profile.riskTolerance > 0.5 &&
    car.speedKph > aheadCar.speedKph + 5;

  const shouldPit =
    car.fuelLiters < 3 ||
    car.damageLevel > 60 ||
    car.tireTempC > 130;

  return {
    targetSpeedKph: targetSpeed,
    shouldOvertake,
    shouldPit
  };
}

export function stepAI(
  profiles: DriverProfile[],
  race: RaceState
): { [carId: string]: { targetSpeedKph: number; shouldOvertake: boolean; shouldPit: boolean } } {
  const result: { [carId: string]: { targetSpeedKph: number; shouldOvertake: boolean; shouldPit: boolean } } = {};

  for (const profile of profiles) {
    const car = race.cars.find(c => c.id === profile.carId);
    if (!car) continue;
    result[profile.carId] = decideDriverAction(profile, car, race);
  }

  return result;
}
