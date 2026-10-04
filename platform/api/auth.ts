import crypto from "crypto";

export function verifySignature(key, signature, body) {
  const computed = crypto
    .createHmac("sha256", key)
    .update(JSON.stringify(body))
    .digest("hex");

  return computed === signature;
}
