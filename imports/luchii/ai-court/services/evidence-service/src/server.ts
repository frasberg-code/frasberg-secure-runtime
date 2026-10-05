import express, { Request, Response } from "express";
import { governanceMiddleware } from "./governance";

const app = express();
app.use(express.json());
app.use(governanceMiddleware);

app.post("/evidence", async (req: Request, res: Response) => {
  res.status(201).json({ id: "evd_1", caseId: req.body.caseId });
});

app.get("/evidence/:id", async (req: Request, res: Response) => {
  res.json({ id: req.params.id, caseId: "case_1" });
});

app.get("/evidence/case/:caseId", async (req: Request, res: Response) => {
  res.json({ caseId: req.params.caseId, evidence: [] });
});

app.post("/evidence/:id/chain", async (req: Request, res: Response) => {
  res.status(201).json({ id: "chain_1", evidenceId: req.params.id });
});

app.get("/evidence/:id/integrity", async (req: Request, res: Response) => {
  res.json({ id: req.params.id, integrityStatus: "verified" });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Evidence Service running on ${PORT}`));
