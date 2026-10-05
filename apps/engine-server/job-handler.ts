import { uploadAsset } from "../../packages/storage/r2-upload";
import { generateShortlink } from "../../packages/publishing/shortlink";
import { generateEmbedCard } from "../../packages/publishing/embed-card";

export async function bindAsset(jobId, buffer, type) {
  const key = `jobs/${jobId}/${Date.now()}.${type}`;
  const url = await uploadAsset(key, buffer, type);
  return url;
}

export async function finalizeJob(jobId, rawOutput) {
  const assetUrl = await bindAsset(jobId, rawOutput.buffer, rawOutput.type);

  return {
    jobId,
    status: "completed",
    result: {
      asset: assetUrl,
      metadata: rawOutput.metadata
    }
  };
}

export async function publishAsset(assetUrl, metadata) {
  const short = generateShortlink(assetUrl);
  const embed = generateEmbedCard(assetUrl, metadata);

  return {
    asset: assetUrl,
    shortlink: short,
    embed
  };
}
