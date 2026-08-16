export interface FrasbergSystemConfig {
  ai: {
    provider: 'frasberg';
    apiKeySource: 'github' | 'supabase';
    allowExternalProviders: false;
    fallbackProviders: [];
  };
  imageGeneration: {
    provider: 'frasberg';
    apiKeySource: 'github' | 'supabase';
    allowExternalProviders: false;
    fallbackProviders: [];
  };
  videoGeneration: {
    provider: 'frasberg';
    apiKeySource: 'github' | 'supabase';
    allowExternalProviders: false;
    fallbackProviders: [];
  };
  disabledProviders: Array<
    'openai' | 'anthropic' | 'google-gemini' | 'stability-ai' | 'emergent-llm'
  >;
}
