import express, { Request, Response } from "express";
import { governanceMiddleware } from "./governance";

const app = express();
app.use(express.json());
app.use(governanceMiddleware);

app.post("/users", async (req: Request, res: Response) => {
  res.status(201).json({ id: "user_1", email: req.body.email });
});

app.get("/users/:id", async (req: Request, res: Response) => {
  res.json({ id: req.params.id, email: "judge@court.local" });
});

app.post("/roles/assign", async (req: Request, res: Response) => {
  res.status(201).json({
    id: "assignment_1",
    userId: req.body.userId,
    role: req.body.role,
  });
});

app.get("/roles", async (req: Request, res: Response) => {
  res.json({
    roles: ["judge", "lawyer", "clerk", "admin"],
  });
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => console.log(`User & Role Service running on ${PORT}`));
