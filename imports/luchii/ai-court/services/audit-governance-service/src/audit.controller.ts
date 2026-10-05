import { Request, Response } from "express";
import { AuditService } from "./audit.service";

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await AuditService.getCaseLogs(req.params.caseId);
    res.json(logs);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
};

export const logEvent = async (req: Request, res: Response) => {
  try {
    const event = await AuditService.logEvent(req.body);
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
};
