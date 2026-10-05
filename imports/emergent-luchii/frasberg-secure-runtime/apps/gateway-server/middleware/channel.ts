import crypto from "crypto";
import { buildDirection } from "../../../packages/channel-engine/direction";
import { buildRouting } from "../../../packages/channel-engine/routing";
import { buildChannelGraph } from "../../../packages/channel-engine/channel-graph";

export function injectChannel(req: any, res: any, next: any) {
  const conduit = req.conduit;

  const direction = buildDirection(conduit);
  const routing = buildRouting(direction);
  const graph = buildChannelGraph(routing);

  req.channel = {
    channelId: crypto.randomUUID(),
    direction,
    routing,
    channelGraph: graph,
    createdAt: Date.now()
  };

  next();
}
