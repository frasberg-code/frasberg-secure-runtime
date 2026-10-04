import express from "express";
import { publicApiMiddleware } from "./middleware";
import { apiEnvelope } from "./envelope";

const router = express.Router();

router.use(publicApiMiddleware);

router.post("/worldgraph", (req, res) => {
  res.json(apiEnvelope({
    owner: req.owner,
    continuity: req.continuity,
    diagnostics: req.diagnostics,
    policy: req.policy,
    payload: { ok: true }
  }));
});

export default router;
