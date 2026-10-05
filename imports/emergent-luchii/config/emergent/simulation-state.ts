export interface CarState {
  id: string;
  name: string;
  team: string;
  position: number;
  lap: number;
  sector: number;
  speedKph: number;
  gear: number;
  rpm: number;
  tireCompound: "soft" | "medium" | "hard" | "wet";
  tireTempC: number;
  fuelLiters: number;
  damageLevel: number; // 0–100
}

export interface TrackState {
  id: string;
  name: string;
  lengthKm: number;
  weather: "clear" | "cloudy" | "rain";
  trackTempC: number;
  surfaceGrip: number; // 0–1
}

export interface RaceState {
  raceId: string;
  lapCount: number;
  currentLap: number;
  safetyCarActive: boolean;
  yellowFlagSectors: number[];
  cars: CarState[];
  track: TrackState;
  timestampMs: number;
}

export function createInitialRaceState(
  raceId: string,
  track: TrackState,
  cars: CarState[],
  lapCount: number
): RaceState {
  return {
    raceId,
    lapCount,
    currentLap: 1,
    safetyCarActive: false,
    yellowFlagSectors: [],
    cars,
    track,
    timestampMs: Date.now()
  };
}
