import { planEngines } from "./planner";
import { RaceState, createInitialRaceState } from "./simulation-state";
import { stepPhysics } from "./physics-core";
import { stepAI, DriverProfile } from "./ai-drivers";

export interface OrchestratorRequest {
  intent: {
    wantsVideo?: boolean;
    wantsMusic?: boolean;
    wantsVoice?: boolean;
    wantsSTT?: boolean;
    wantsImage?: boolean;
  };
  permissions: {
    music_generation?: boolean;
    audio_native?: boolean;
    speech_to_text?: boolean;
    text_to_speech?: boolean;
    image_generation?: boolean;
  };
  maxCostWeight: number;
  raceConfig: {
    raceId: string;
    track: any;
    cars: any[];
    lapCount: number;
    driverProfiles: DriverProfile[];
  };
}

export interface OrchestratorResponse {
  enginesUsed: string[];
  raceState: RaceState;
  aiDecisions: any;
  physicsStep: any;
}

export function runGT6Orchestrator(req: OrchestratorRequest): OrchestratorResponse {
  // 1. PLAN ENGINES
  const planned = planEngines({
    intent: req.intent,
    maxCostWeight: req.maxCostWeight,
    permissions: req.permissions
  });

  const enginesUsed = planned.map(p => p.id);

  // 2. INIT RACE STATE
  const raceState = createInitialRaceState(
    req.raceConfig.raceId,
    req.raceConfig.track,
    req.raceConfig.cars,
    req.raceConfig.lapCount
  );

  // 3. AI DECISIONS
  const aiDecisions = stepAI(req.raceConfig.driverProfiles, raceState);

  // 4. PHYSICS STEP
  const physicsStep = stepPhysics(
    raceState.cars,
    raceState.track,
    { timeStepSec: 0.1 }
  );

  raceState.cars = physicsStep;

  // 5. RETURN FULL ORCHESTRATION OUTPUT
  return {
    enginesUsed,
    raceState,
    aiDecisions,
    physicsStep
  };
}
