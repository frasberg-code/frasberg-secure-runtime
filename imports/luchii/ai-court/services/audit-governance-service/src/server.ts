import express, { Request, Response } from "express";
import { AuditService } from "./audit.service";

const app = express();
app.use(express.json());

app.get("/audit/logs/:caseId", async (req: Request, res: Response) => {
  try {
    const logs = await AuditService.getCaseLogs(req.params.caseId);
    res.json(logs);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.post("/audit/events", async (req: Request, res: Response) => {
  try {
    const event = await AuditService.logEvent(req.body);
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.get("/governance/cycle2", async (req: Request, res: Response) => {
  res.json({
    authority: "Frasberg",
    article: "IV",
    phase: 17,
    status: "ACTIVE",
    anchorSHA: "09b70b557e3539fba67249e4951e2373dc33f434",
  });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () =>
  console.log(`Audit & Governance Service running on ${PORT}`)
);
