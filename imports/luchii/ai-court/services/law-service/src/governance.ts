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

  const forbidden = ["/verdicts", "/sentencing", "/adjudicate"];
  if (forbidden.some((p) => req.path.startsWith(p))) {
    return res.status(403).json({
      error: "Autonomous adjudication is forbidden under Cycle 2.",
    });
  }

  res.set("X-Governance-Authority", "Frasberg");
  next();
}
