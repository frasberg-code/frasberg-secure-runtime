import { loadContinuity } from "../../packages/worldgraph-engine/continuity-loader";

export async function injectContinuity(req, res, next) {
  const owner = req.owner;
  req.continuity = await loadContinuity(owner);
  next();
}
