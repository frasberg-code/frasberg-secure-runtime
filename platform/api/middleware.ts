import { verifySignature } from "./auth";

export function publicApiMiddleware(req, res, next) {
  const key = req.headers["x-api-key"];
  const signature = req.headers["x-api-signature"];

  if (!key || !signature) {
    return res.status(401).json({ error: "Missing API credentials" });
  }

  if (!verifySignature(key, signature, req.body)) {
    return res.status(403).json({ error: "Invalid signature" });
  }

  next();
}
