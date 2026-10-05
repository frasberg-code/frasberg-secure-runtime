export function buildMindspace(cognition: any) {
  return {
    cognitiveMindspace: cognition.architecture,
    dynamicMindspace: cognition.dynamics,
    timestamp: Date.now()
  };
}
