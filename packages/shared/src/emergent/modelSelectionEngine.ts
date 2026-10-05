import { recordModelUsage } from './modelUsageAnalytics';

export type TaskType =
  | 'chat'
  | 'code'
  | 'music'
  | 'video'
  | 'voice'
  | 'image'
  | 'worldgraph';

export interface ModelChoice {
  provider: 'luchii' | 'openai' | 'anthropic' | 'local';
  model: string;
  reason: string;
}

export interface ModelSelectionContext {
  task: TaskType;
  maxCostTier: number; // 1 = cheapest, 3 = premium
  prefersLuchii?: boolean;
}

function choose(ctx: ModelSelectionContext): ModelChoice {
  if (ctx.prefersLuchii) {
    if (ctx.task === 'chat' || ctx.task === 'code') {
      return {
        provider: 'luchii',
        model: ctx.maxCostTier >= 2 ? 'luchii-pro' : 'luchii-lite',
        reason: 'Luchii preferred for core intelligence',
      };
    }
    if (ctx.task === 'music' || ctx.task === 'voice') {
      return {
        provider: 'luchii',
        model: 'luchii-audio',
        reason: 'Luchii audio stack for music/voice',
      };
    }
  }

  switch (ctx.task) {
    case 'video':
      return {
        provider: 'luchii',
        model: 'luchii-video',
        reason: 'Video engine confirmed working',
      };
    case 'image':
      return {
        provider: 'luchii',
        model: 'luchii-image',
        reason: 'Image engine when API-key compatible',
      };
    case 'worldgraph':
      return {
        provider: 'local',
        model: 'frasberg-worldgraph-engine',
        reason: 'Worldgraph is handled by Frasberg runtime',
      };
    default:
      return {
        provider: 'luchii',
        model: 'luchii-lite',
        reason: 'Default low-cost Luchii model',
      };
  }
}

export function selectModel(ctx: ModelSelectionContext): ModelChoice {
  const choice = choose(ctx);
  recordModelUsage(choice.provider, choice.model, ctx.task);
  return choice;
}
