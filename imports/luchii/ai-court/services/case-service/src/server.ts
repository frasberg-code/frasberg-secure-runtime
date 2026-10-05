import express, { Request, Response, NextFunction } from "express";
import { governanceMiddleware } from "./governance";
import { createCase, getCase } from "./case.controller";

const app = express();
app.use(express.json());
app.use(governanceMiddleware);

app.post("/cases", createCase);
app.get("/cases/:id", getCase);
app.get("/cases/:id/timeline", async (req: Request, res: Response) => {
  res.json({ caseId: req.params.id, timeline: [] });
});
app.post("/cases/:id/events", async (req: Request, res: Response) => {
  res.status(201).json({ id: "evt_1", caseId: req.params.id });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Case Service running on ${PORT}`));
