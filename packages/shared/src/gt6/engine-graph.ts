export type EngineId =
  | "game-logic"
  | "video"
  | "music"
  | "voice"
  | "stt"
  | "image";

export interface EngineNode {
  id: EngineId;
  promptFile: string;
  costWeight: number;
  requiresPermission?: string;
}

export interface EngineEdge {
  from: EngineId;
  to: EngineId;
  relation: string;
}

export const ENGINE_NODES: EngineNode[] = [
  {
    id: "game-logic",
    promptFile: "config/emergent/engines/game-logic-engine.prompt.md",
    costWeight: 1
  },
  {
    id: "video",
    promptFile: "config/emergent/engines/video-engine.prompt.md",
    costWeight: 3
  },
  {
    id: "music",
    promptFile: "config/emergent/engines/music-engine.prompt.md",
    costWeight: 2,
    requiresPermission: "music_generation"
  },
  {
    id: "voice",
    promptFile: "config/emergent/engines/voice-engine.prompt.md",
    costWeight: 2,
    requiresPermission: "text_to_speech"
  },
  {
    id: "stt",
    promptFile: "config/emergent/engines/stt-engine.prompt.md",
    costWeight: 2,
    requiresPermission: "speech_to_text"
  },
  {
    id: "image",
    promptFile: "config/emergent/engines/image-engine.prompt.md",
    costWeight: 3,
    requiresPermission: "image_generation"
  }
];

export const ENGINE_EDGES: EngineEdge[] = [
  { from: "game-logic", to: "video", relation: "visualizes" },
  { from: "game-logic", to: "music", relation: "scores" },
  { from: "game-logic", to: "voice", relation: "commentates" },
  { from: "game-logic", to: "image", relation: "renders" },
  { from: "stt", to: "game-logic", relation: "controls" }
];
