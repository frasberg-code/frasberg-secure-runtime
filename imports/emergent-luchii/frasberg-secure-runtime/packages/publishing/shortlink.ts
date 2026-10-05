import crypto from "crypto";

export function generateShortlink(url) {
  const id = crypto.randomBytes(4).toString("hex");
  return `${process.env.PUBLIC_BASE_URL}/a/${id}`;
}

export function generateEmbedCard(assetUrl, metadata) {
  return {
    type: "frasberg-embed",
    asset: assetUrl,
    title: metadata.title || "Frasberg Asset",
    description: metadata.description || "",
    createdAt: Date.now()
  };
}
