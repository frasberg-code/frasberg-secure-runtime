import { Request, Response } from "express";
import { LawService } from "./law.service";

export const getStatute = async (req: Request, res: Response) => {
  try {
    const result = await LawService.getStatute(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: "Statute not found" });
  }
};

export const getPrecedent = async (req: Request, res: Response) => {
  try {
    const result = await LawService.getPrecedent(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: "Precedent not found" });
  }
};

export const generateLawMap = async (req: Request, res: Response) => {
  try {
    const result = await LawService.generateLawMap(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
};
