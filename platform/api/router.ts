import express from "express";
import { publicApiMiddleware } from "./middleware";
import { apiEnvelope } from "./envelope";
import { zeropoint } from "../../apps/public-api/zeropoint";
import { substrate } from "../../apps/public-api/substrate";
import { bedrock } from "../../apps/public-api/bedrock";
import { groundtruth } from "../../apps/public-api/groundtruth";
import { law } from "../../apps/public-api/law";
import { enforcement } from "../../apps/public-api/enforcement";
import { integrity } from "../../apps/public-api/integrity";
import { coherence } from "../../apps/public-api/coherence";

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

router.post("/coherence", coherence);
router.post("/integrity", integrity);
router.post("/enforcement", enforcement);
router.post("/law", law);
router.post("/groundtruth", groundtruth);
router.post("/bedrock", bedrock);
router.post("/substrate", substrate);
router.post("/zeropoint", zeropoint);

export default router;
