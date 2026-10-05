export function evolveSync(sync: any) {
  return {
    syncId: sync.syncId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
