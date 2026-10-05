import express from "express";
import { governanceGuard } from "../middleware/governance-guard";

const router = express.Router();

router.use(governanceGuard);

router.get("/diagnostics", (req, res) => {
  res.json({ diagnostics: "ok" });
});

router.get("/continuity", (req, res) => {
  res.json({ continuity: "ok" });
});

router.post("/policy/enforce", (req, res) => {
  res.json({ policy: "enforced" });
});

export default router;
