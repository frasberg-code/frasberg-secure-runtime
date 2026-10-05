export function buildCirculation(pulse: any) {
  return {
    pulseCirculation: pulse.signal,
    distributionCirculation: pulse.distribution,
    timestamp: Date.now()
  };
}
