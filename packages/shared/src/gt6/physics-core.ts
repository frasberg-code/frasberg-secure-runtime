import { CarState, TrackState } from "./simulation-state";

export interface PhysicsParams {
  timeStepSec: number;
}

export function updateCarPhysics(
  car: CarState,
  track: TrackState,
  params: PhysicsParams
): CarState {
  const gripBase = track.surfaceGrip;
  const tireFactor =
    car.tireCompound === "soft"
      ? 1.0
      : car.tireCompound === "medium"
      ? 0.9
      : car.tireCompound === "hard"
      ? 0.8
      : 0.7;

  const grip = gripBase * tireFactor;

  const drag = 0.0004 * car.speedKph * car.speedKph;
  const engineForce = car.rpm > 3000 ? 0.02 * car.rpm : 0.01 * car.rpm;
  const netAccel = (engineForce - drag) * grip;

  const newSpeed = Math.max(0, car.speedKph + netAccel * params.timeStepSec);
  const newFuel = Math.max(0, car.fuelLiters - 0.0005 * newSpeed * params.timeStepSec);
  const newTireTemp = Math.min(
    140,
    car.tireTempC + (newSpeed / 200) * params.timeStepSec
  );

  return {
    ...car,
    speedKph: newSpeed,
    fuelLiters: newFuel,
    tireTempC: newTireTemp
  };
}

export function stepPhysics(
  cars: CarState[],
  track: TrackState,
  params: PhysicsParams
): CarState[] {
  return cars.map(car => updateCarPhysics(car, track, params));
}
