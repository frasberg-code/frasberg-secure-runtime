// Capabilities offered when a user creates a key at /settings/api-keys.
export const PERMISSION_CATALOG: Record<string, string[]> = {
  'Luchii Chat': ['chat.generate'],
  'Luchii Vision': ['image.generate'],
  'Luchii Music': ['music.generate'],
  'GT6 Runtime': ['gt6.run'],
  Agents: ['agents.execute'],
  Memory: ['memory.read', 'memory.write'],
  Checkout: ['checkout.use'],
};

export function hasPermission(granted: string[], required: string): boolean {
  if (granted.includes('*') || granted.includes(required)) return true;
  const [scope] = required.split('.');
  return granted.includes(`${scope}.*`);
}
