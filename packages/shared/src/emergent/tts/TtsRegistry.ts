import { FrasbergTtsProvider } from './FrasbergTtsProvider';
import { DefaultTtsProvider } from './providers/DefaultTtsProvider';

let activeProvider: FrasbergTtsProvider = new DefaultTtsProvider();

export function setTtsProvider(provider: FrasbergTtsProvider) {
  activeProvider = provider;
}

export function getTtsProvider(): FrasbergTtsProvider {
  return activeProvider;
}