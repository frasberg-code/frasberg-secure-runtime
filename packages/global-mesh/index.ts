export async function getRegionHealth(region) {
  try {
    const res = await fetch(`https://${region}.frasberg.com/v1/health`);
    const json = await res.json();
    return { region, status: json.status, latency: json.latency || null };
  } catch (_) {
    return { region, status: "down", latency: null };
  }
}

export async function globalMeshStatus(regions) {
  const health = await Promise.all(
    regions.map(r => getRegionHealth(r))
  );

  return {
    regions: health,
    primaryHealth: health[0]?.status,
    failoverAvailable: health.slice(1).some(h => h.status === "up")
  };
}
