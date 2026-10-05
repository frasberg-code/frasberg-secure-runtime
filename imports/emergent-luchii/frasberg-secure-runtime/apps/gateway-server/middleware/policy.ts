import { loadPolicy } from "../../packages/worldgraph-engine/policy-loader";

export async function injectPolicy(req, res, next) {
  req.policy = await loadPolicy(req.owner);
  next();
}
