import express from "express";
import { publicApiMiddleware } from "./middleware";
import { apiEnvelope } from "./envelope";
import { zeropoint } from "../../apps/public-api/zeropoint";
import { substrate } from "../../apps/public-api/substrate";
import { bedrock } from "../../apps/public-api/bedrock";

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

router.post("/bedrock", bedrock);
router.post("/substrate", substrate);
router.post("/zeropoint", zeropoint);

export default router;
