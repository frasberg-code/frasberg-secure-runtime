import crypto from "crypto";
import { buildTransport } from "../../../packages/circulation-engine/transport";
import { buildConduit } from "../../../packages/circulation-engine/conduit";
import { buildCirculationGraph } from "../../../packages/circulation-engine/circulation-graph";

export function injectCirculation(req: any, res: any, next: any) {
  const flow = req.flow;

  const transport = buildTransport(flow);
  const conduit = buildConduit(transport);
  const graph = buildCirculationGraph(conduit);

  req.circulation = {
    circulationId: crypto.randomUUID(),
    transport,
    conduit,
    circulationGraph: graph,
    createdAt: Date.now()
  };

  next();
}
