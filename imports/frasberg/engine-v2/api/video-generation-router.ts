/**
 * Frasberg Engine v2 model router.
 * Maps internal model names to region-specific endpoints.
 */

export type FrasbergVideoModel =
  | "frasberg-engine"
  | "frasberg-engine-turbo"
  | "frasberg-engine-cinema"
  | "frasberg-engine-veo";

export type FrasbergRegion = "us-west" | "us-east" | "eu-west" | "ap-southeast";

export type GPUClass = "gpu-small" | "gpu-medium" | "gpu-large";

export interface FrasbergEngineTarget {
  model: FrasbergVideoModel;
  endpoint: string;
  region: FrasbergRegion;
  gpuClass: GPUClass;
  creditsPerSecond: number;
}

const REGION_BASES: Record<FrasbergRegion, string> = {
  "us-west": "https://video-us-west.frasberg.com",
  "us-east": "https://video-us-east.frasberg.com",
  "eu-west": "https://video-eu-west.frasberg.com",
  "ap-southeast": "https://video-ap-southeast.frasberg.com",
};

const MODEL_MAP: Record<
  FrasbergVideoModel,
  {
    path: string;
    defaultRegion: FrasbergRegion;
    gpuClass: GPUClass;
    creditsPerSecond: number;
  }
> = {
  "frasberg-engine": {
    path: "/v1/generate",
    defaultRegion: "us-west",
    gpuClass: "gpu-medium",
    creditsPerSecond: 1,
  },
  "frasberg-engine-turbo": {
    path: "/v1/generate-turbo",
    defaultRegion: "us-west",
    gpuClass: "gpu-small",
    creditsPerSecond: 0.5,
  },
  "frasberg-engine-cinema": {
    path: "/v1/generate-cinema",
    defaultRegion: "us-east",
    gpuClass: "gpu-large",
    creditsPerSecond: 2,
  },
  "frasberg-engine-veo": {
    path: "/v1/generate-veo",
    defaultRegion: "eu-west",
    gpuClass: "gpu-large",
    creditsPerSecond: 3,
  },
};

const SECONDARY_REGIONS: Record<FrasbergRegion, FrasbergRegion> = {
  "us-west": "us-east",
  "us-east": "eu-west",
  "eu-west": "us-west",
  "ap-southeast": "us-west",
};

/**
 * Resolve a model to its target endpoint and metadata.
 * Uses primary region by default, falls back to secondary if specified.
 */
export function resolveFrasbergEngineTarget(
  model: FrasbergVideoModel,
  regionOverride?: FrasbergRegion
): FrasbergEngineTarget {
  const entry = MODEL_MAP[model];
  if (!entry) {
    throw new Error(`Unknown Frasberg video model: ${model}`);
  }

  const region = regionOverride ?? entry.defaultRegion;
  const base = REGION_BASES[region];

  if (!base) {
    throw new Error(`Unknown region: ${region}`);
  }

  return {
    model,
    endpoint: `${base}${entry.path}`,
    region,
    gpuClass: entry.gpuClass,
    creditsPerSecond: entry.creditsPerSecond,
  };
}

/**
 * Get the secondary region for failover.
 */
export function getSecondaryRegion(region: FrasbergRegion): FrasbergRegion {
  return SECONDARY_REGIONS[region] ?? "us-west";
}

/**
 * Estimate credits for a task.
 */
export function estimateCredits(
  model: FrasbergVideoModel,
  durationSeconds: number
): number {
  const entry = MODEL_MAP[model];
  if (!entry) {
    throw new Error(`Unknown Frasberg video model: ${model}`);
  }
  return Math.ceil(durationSeconds * entry.creditsPerSecond);
}
