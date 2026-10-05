import { FrasbergTtsProvider } from '../FrasbergTtsProvider';

// Intentionally does not invent a URL: until a real provider is registered, synthesis fails loudly.
export class DefaultTtsProvider implements FrasbergTtsProvider {
  async synthesize(_text: string): Promise<string> {
    throw new Error('No TTS provider configured. Call setTtsProvider() with a real provider.');
  }
}