import crypto from "crypto";
import { buildChannel } from "../../../packages/conduit-engine/channel";
import { buildPathway } from "../../../packages/conduit-engine/pathway";
import { buildConduitGraph } from "../../../packages/conduit-engine/conduit-graph";

export function injectConduit(req: any, res: any, next: any) {
  const circulation = req.circulation;

  const channel = buildChannel(circulation);
  const pathway = buildPathway(channel);
  const graph = buildConduitGraph(pathway);

  req.conduit = {
    conduitId: crypto.randomUUID(),
    channel,
    pathway,
    conduitGraph: graph,
    createdAt: Date.now()
  };

  next();
}
