import express from "express";
import { publicApiMiddleware } from "./middleware";
import { apiEnvelope } from "./envelope";
import { consciousness } from "../../apps/public-api/consciousness";
import { mind } from "../../apps/public-api/mind";
import { cognition } from "../../apps/public-api/cognition";
import { reasoning } from "../../apps/public-api/reasoning";
import { logic } from "../../apps/public-api/logic";
import { design } from "../../apps/public-api/design";
import { blueprint } from "../../apps/public-api/blueprint";
import { architecture } from "../../apps/public-api/architecture";
import { structure } from "../../apps/public-api/structure";
import { pattern } from "../../apps/public-api/pattern";
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
import { navigation } from "../../apps/public-api/navigation";
import { travel } from "../../apps/public-api/travel";
import { motion } from "../../apps/public-api/motion";
import { dynamics } from "../../apps/public-api/dynamics";
import { force } from "../../apps/public-api/force";
import { vector } from "../../apps/public-api/vector";
import { field } from "../../apps/public-api/field";
import { influence } from "../../apps/public-api/influence";
import { interaction } from "../../apps/public-api/interaction";
import { exchange } from "../../apps/public-api/exchange";
import { identity } from "../../apps/public-api/identity";
import { persona } from "../../apps/public-api/persona";
import { character } from "../../apps/public-api/character";
import { role } from "../../apps/public-api/role";
import { func } from "../../apps/public-api/function";
import { task } from "../../apps/public-api/task";
import { action } from "../../apps/public-api/action";
import { behavior } from "../../apps/public-api/behavior";
import { enginePattern } from "../../apps/public-api/engine-pattern";
import { engineStructure } from "../../apps/public-api/engine-structure";
import {
  identityEngineFlow,
  personaEngineFlow,
  characterEngineFlow,
  roleEngineFlow,
  functionEngineFlow,
  taskEngineFlow,
  actionEngineFlow,
  behaviorEngineFlow,
  patternEngineFlow,
  structureEngineFlow
} from "../../apps/gateway-server/middleware/engine-flow";

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

router.post("/v1/consciousness", consciousness);
router.post("/v1/mind", mind);
router.post("/v1/cognition", cognition);
router.post("/v1/reasoning", reasoning);
router.post("/v1/logic", logic);
router.post("/v1/design", design);
router.post("/v1/blueprint", blueprint);
router.post("/v1/architecture", architecture);
router.post("/v1/structure", structure);
router.post("/v1/pattern", pattern);
router.post("/identity", ...identityEngineFlow, identity);
router.post("/persona", ...personaEngineFlow, persona);
router.post("/character", ...characterEngineFlow, character);
router.post("/role", ...roleEngineFlow, role);
router.post("/function", ...functionEngineFlow, func);
router.post("/task", ...taskEngineFlow, task);
router.post("/action", ...actionEngineFlow, action);
router.post("/behavior", ...behaviorEngineFlow, behavior);
router.post("/engine-pattern", ...patternEngineFlow, enginePattern);
router.post("/engine-structure", ...structureEngineFlow, engineStructure);
router.post("/exchange", exchange);
router.post("/interaction", interaction);
router.post("/influence", influence);
router.post("/field", field);
router.post("/vector", vector);
router.post("/force", force);
router.post("/dynamics", dynamics);
router.post("/motion", motion);
router.post("/travel", travel);
router.post("/navigation", navigation);
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
