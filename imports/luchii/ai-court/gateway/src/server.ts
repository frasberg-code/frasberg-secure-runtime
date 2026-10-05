import express, { Request, Response, NextFunction } from "express";
import { createProxyMiddleware } from "express-http-proxy";
import { governanceMiddleware } from "./governance";

const app = express();
app.use(express.json());
app.use(governanceMiddleware);

const services = {
  CASE_URL: process.env.CASE_URL || "http://localhost:3001",
  EVIDENCE_URL: process.env.EVIDENCE_URL || "http://localhost:3002",
  LAW_URL: process.env.LAW_URL || "http://localhost:3003",
  INTEGRITY_URL: process.env.INTEGRITY_URL || "http://localhost:3004",
  AUDIT_URL: process.env.AUDIT_URL || "http://localhost:3005",
  USER_URL: process.env.USER_URL || "http://localhost:3006",
};

app.use("/api/cases", createProxyMiddleware(services.CASE_URL));
app.use("/api/evidence", createProxyMiddleware(services.EVIDENCE_URL));
app.use("/api/law", createProxyMiddleware(services.LAW_URL));
app.use("/api/integrity", createProxyMiddleware(services.INTEGRITY_URL));
app.use("/api/audit", createProxyMiddleware(services.AUDIT_URL));
app.use("/api/users", createProxyMiddleware(services.USER_URL));

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    services: Object.keys(services),
    authority: "Frasberg",
    phase: 17,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Gateway running on ${PORT}`));
