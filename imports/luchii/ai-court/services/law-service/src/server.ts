import express, { Request, Response } from "express";
import { governanceMiddleware } from "./governance";

const app = express();
app.use(express.json());
app.use(governanceMiddleware);

app.get("/law/statutes/:id", async (req: Request, res: Response) => {
  res.json({ id: req.params.id, citation: "42 U.S.C. § 1983" });
});

app.get("/law/statutes", async (req: Request, res: Response) => {
  res.json({ statutes: [] });
});

app.get("/law/precedents/:id", async (req: Request, res: Response) => {
  res.json({ id: req.params.id, caseName: "Marbury v. Madison" });
});

app.get("/law/precedents", async (req: Request, res: Response) => {
  res.json({ precedents: [] });
});

app.post("/law/map", async (req: Request, res: Response) => {
  res.status(201).json({ caseId: req.body.caseId, mapId: "map_1" });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Law Service running on ${PORT}`));
