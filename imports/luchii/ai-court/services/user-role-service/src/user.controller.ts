import { Request, Response } from "express";
import { UserService } from "./user.service";

export const createUser = async (req: Request, res: Response) => {
  try {
    const result = await UserService.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const result = await UserService.get(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: "User not found" });
  }
};

export const assignRole = async (req: Request, res: Response) => {
  try {
    const result = await UserService.assignRole(req.body.userId, req.body.role);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
};
