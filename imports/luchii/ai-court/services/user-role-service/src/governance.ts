import { Request, Response, NextFunction } from "express";

export function governanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.set("X-Governance-Authority", "Frasberg");
  res.set("X-Anchor-SHA", "09b70b557e3539fba67249e4951e2373dc33f434");
  next();
}
