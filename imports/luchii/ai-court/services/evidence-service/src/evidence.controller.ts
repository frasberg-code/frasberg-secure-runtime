import { Request, Response } from "express";
import { EvidenceService } from "./evidence.service";

export const createEvidence = async (req: Request, res: Response) => {
  try {
    const result = await EvidenceService.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
};

export const getEvidence = async (req: Request, res: Response) => {
  try {
    const result = await EvidenceService.get(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: "Evidence not found" });
  }
};
