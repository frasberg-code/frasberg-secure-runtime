// Runway API Key Rotation & Routing Logic
// Supports automatic failover and model-specific routing

export const RUNWAY_KEYS = [
  Deno.env.get("RUNWAY_MODEL_KEY_PRIMARY"),
  Deno.env.get("RUNWAY_MODEL_KEY_SECONDARY"),
  Deno.env.get("RUNWAY_MODEL_KEY_TERTIARY"),
].filter(Boolean) as string[];

// Failover rotation index
let currentIndex = 0;

/**
 * Get next Runway API key with round-robin rotation
 */
export function getRunwayKey(): string {
  if (RUNWAY_KEYS.length === 0) {
    throw new Error("No Runway API keys configured");
  }
  
  const key = RUNWAY_KEYS[currentIndex];
  currentIndex = (currentIndex + 1) % RUNWAY_KEYS.length;
  return key;
}

/**
 * Get Runway API key for specific model type with failover
 */
export function getRunwayKeyFor(model: "chat" | "image" | "video"): string {
  switch (model) {
    case "video":
      return Deno.env.get("RUNWAY_MODEL_KEY_PRIMARY") || getRunwayKey();
    case "image":
      return Deno.env.get("RUNWAY_MODEL_KEY_SECONDARY") || getRunwayKey();
    case "chat":
      return Deno.env.get("RUNWAY_MODEL_KEY_TERTIARY") || getRunwayKey();
    default:
      return getRunwayKey();
  }
}

/**
 * Try calling Runway API with automatic failover
 */
export async function callRunwayWithFailover(
  endpoint: string,
  payload: any,
  modelType?: "chat" | "image" | "video"
): Promise<Response> {
  const maxRetries = RUNWAY_KEYS.length;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const apiKey = modelType ? getRunwayKeyFor(modelType) : getRunwayKey();
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return response;
      }

      // If unauthorized or rate limited, try next key
      if (response.status === 401 || response.status === 429) {
        lastError = new Error(`Runway API error: ${response.status}`);
        continue;
      }

      // For other errors, return the response
      return response;
    } catch (error) {
      lastError = error as Error;
      continue;
    }
  }

  throw lastError || new Error("All Runway API keys failed");
}
