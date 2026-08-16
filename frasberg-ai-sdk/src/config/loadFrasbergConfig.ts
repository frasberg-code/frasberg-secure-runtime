import type { FrasbergSystemConfig } from './types';

export function loadFrasbergConfig(): FrasbergSystemConfig {
  const required = (name: string): string => {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
  };

  return {
    ai: {
      provider: 'frasberg',
      apiKeySource: required('AI_API_KEY_SOURCE') as 'github' | 'supabase',
      allowExternalProviders: false,
      fallbackProviders: []
    },
    imageGeneration: {
      provider: 'frasberg',
      apiKeySource: required('IMAGE_API_KEY_SOURCE') as 'github' | 'supabase',
      allowExternalProviders: false,
      fallbackProviders: []
    },
    videoGeneration: {
      provider: 'frasberg',
      apiKeySource: required('VIDEO_API_KEY_SOURCE') as 'github' | 'supabase',
      allowExternalProviders: false,
      fallbackProviders: []
    },
    disabledProviders: [
      'openai',
      'anthropic',
      'google-gemini',
      'stability-ai',
      'emergent-llm'
    ]
  };
}
