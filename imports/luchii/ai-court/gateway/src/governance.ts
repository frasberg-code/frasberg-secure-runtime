import { Request, Response, NextFunction } from "express";

export function governanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.cycle2 = {
    authority: "Frasberg",
    article: "IV",
    advisoryOnly: true,
  };

  const forbidden = [/^\/api\/verdicts\b/, /^\/api\/sentencing\b/, /^\/api\/intent\b/];
  const isForbidden = forbidden.some((pattern) => pattern.test(req.path));

  if (isForbidden) {
    return res.status(403).json({
      error:
        "Autonomous adjudication is forbidden under Cycle 2. FLIA is advisory-only.",
      authority: "Frasberg",
    });
  }

  res.set("X-Governance-Authority", "Frasberg");
  res.set("X-Anchor-SHA", "09b70b557e3539fba67249e4951e2373dc33f434");
  next();
}
