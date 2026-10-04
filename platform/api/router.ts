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
import { sync } from "../../apps/public-api/sync";
import { rhythm } from "../../apps/public-api/rhythm";
import { flow } from "../../apps/public-api/flow";
import { circulation } from "../../apps/public-api/circulation";
import { conduit } from "../../apps/public-api/conduit";
import { channel } from "../../apps/public-api/channel";
import { path } from "../../apps/public-api/path";
import { route } from "../../apps/public-api/route";

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

router.post("/route", route);
router.post("/path", path);
router.post("/channel", channel);
router.post("/conduit", conduit);
router.post("/circulation", circulation);
router.post("/flow", flow);
router.post("/rhythm", rhythm);
router.post("/sync", sync);
router.post("/coherence", coherence);
router.post("/integrity", integrity);
router.post("/enforcement", enforcement);
router.post("/law", law);
router.post("/groundtruth", groundtruth);
router.post("/bedrock", bedrock);
router.post("/substrate", substrate);
router.post("/zeropoint", zeropoint);

export default router;
