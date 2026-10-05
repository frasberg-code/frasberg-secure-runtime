import { Request, Response } from "express";
import { CaseService } from "./case.service";

export const createCase = async (req: Request, res: Response) => {
  try {
    const result = await CaseService.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
};

export const getCase = async (req: Request, res: Response) => {
  try {
    const result = await CaseService.get(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: "Case not found" });
  }
};
