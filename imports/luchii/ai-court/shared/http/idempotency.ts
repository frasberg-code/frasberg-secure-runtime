import { Request, Response, NextFunction } from "express";

// In production, replace with Redis or database
const seen = new Map<string, { timestamp: number; response: any }>();

export function ensureIdempotency(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const key = req.get("Idempotency-Key");

  if (!key) {
    return res.status(400).json({
      error: "Missing Idempotency-Key header",
    });
  }

  if (seen.has(key)) {
    const cached = seen.get(key)!;
    return res.status(409).json({
      error: "Duplicate request",
      cachedResponse: cached.response,
    });
  }

  const originalSend = res.send;

  res.send = function (data: any) {
    seen.set(key, {
      timestamp: Date.now(),
      response: typeof data === "string" ? JSON.parse(data) : data,
    });

    return originalSend.call(this, data);
  };

  next();
}

export function cleanupOldIdempotencyKeys(maxAgeMs: number = 3600000) {
  const now = Date.now();
  for (const [key, value] of seen.entries()) {
    if (now - value.timestamp > maxAgeMs) {
      seen.delete(key);
    }
  }
}

setInterval(() => cleanupOldIdempotencyKeys(), 600000);
