import express, { Request, Response } from "express";
import { governanceMiddleware } from "./governance";
import { FLIAClient } from "./fliaClient";

const app = express();
app.use(express.json());
app.use(governanceMiddleware);

const fliaClient = new FLIAClient();

app.post("/integrity/analyze", async (req: Request, res: Response) => {
  try {
    const result = await fliaClient.analyzeEvidence(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.post("/integrity/flags", async (req: Request, res: Response) => {
  try {
    const result = await fliaClient.generateFlags(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`Integrity Service running on ${PORT}`));
