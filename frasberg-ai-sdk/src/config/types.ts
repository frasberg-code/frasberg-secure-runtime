export interface FrasbergSystemConfig {
  ai: {
    provider: 'frasberg-ai';
    apiKeySource: 'github' | 'supabase';
    allowExternalProviders: false;
    fallbackProviders: [];
  };
  imageGeneration: {
    provider: 'frasberg-ai';
    apiKeySource: 'github' | 'supabase';
    allowExternalProviders: false;
    fallbackProviders: [];
  };
  videoGeneration: {
    provider: 'frasberg-ai';
    apiKeySource: 'github' | 'supabase';
    allowExternalProviders: false;
    fallbackProviders: [];
  };
  disabledProviders: Array<
    'openai' | 'anthropic' | 'google-gemini' | 'stability-ai' | 'emergent-llm'
  >;
}
