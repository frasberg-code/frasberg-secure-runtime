import { Request, Response } from "express";
import { IntegrityService } from "./integrity.service";

export const analyzeIntegrity = async (req: Request, res: Response) => {
  try {
    const result = await IntegrityService.analyze(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
};

export const generateFlags = async (req: Request, res: Response) => {
  try {
    const result = await IntegrityService.generateFlags(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
};
