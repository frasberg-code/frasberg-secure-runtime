export function buildMotion(navigation: any) {
  return {
    navigationMotion: navigation.decision,
    travelMotion: navigation.travel,
    timestamp: Date.now()
  };
}
