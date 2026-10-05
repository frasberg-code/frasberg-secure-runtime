import { ENGINE_NODES, EngineId } from "./engine-graph";

export interface Permissions {
  music_generation?: boolean;
  audio_native?: boolean;
  speech_to_text?: boolean;
  text_to_speech?: boolean;
  image_generation?: boolean;
}

export interface PlannerContext {
  intent: {
    wantsVideo?: boolean;
    wantsMusic?: boolean;
    wantsVoice?: boolean;
    wantsSTT?: boolean;
    wantsImage?: boolean;
  };
  maxCostWeight: number;
  permissions: Permissions;
}

export interface PlannedEngine {
  id: EngineId;
  promptFile: string;
}

export function planEngines(ctx: PlannerContext): PlannedEngine[] {
  const selected: PlannedEngine[] = [];

  // Always start from game-logic
  const gameLogic = ENGINE_NODES.find(n => n.id === "game-logic")!;
  selected.push({ id: gameLogic.id, promptFile: gameLogic.promptFile });

  let remainingBudget = ctx.maxCostWeight - gameLogic.costWeight;

  function maybeAdd(id: EngineId, wants: boolean | undefined) {
    if (!wants) return;
    const node = ENGINE_NODES.find(n => n.id === id);
    if (!node) return;

    if (node.requiresPermission) {
      const permKey = node.requiresPermission as keyof Permissions;
      if (!ctx.permissions[permKey]) return;
    }

    if (remainingBudget - node.costWeight < 0) return;

    selected.push({ id: node.id, promptFile: node.promptFile });
    remainingBudget -= node.costWeight;
  }

  maybeAdd("video", ctx.intent.wantsVideo);
  maybeAdd("music", ctx.intent.wantsMusic);
  maybeAdd("voice", ctx.intent.wantsVoice);
  maybeAdd("stt", ctx.intent.wantsSTT);
  maybeAdd("image", ctx.intent.wantsImage);

  return selected;
}
