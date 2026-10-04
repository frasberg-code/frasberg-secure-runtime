import express from "express";
import { unifiedMiddleware } from "./middleware/unified";
import { injectRoute } from "./middleware/route";
import { injectPath } from "./middleware/path";
import { injectChannel } from "./middleware/channel";
import { injectConduit } from "./middleware/conduit";
import { injectCirculation } from "./middleware/circulation";
import { injectFlow } from "./middleware/flow";
import { injectRhythm } from "./middleware/rhythm";
import { injectSync } from "./middleware/sync";
import { injectCoherence } from "./middleware/coherence";
import { injectIntegrity } from "./middleware/integrity";
import { injectEnforcement } from "./middleware/enforcement";
import { injectLaw } from "./middleware/law";
import { injectGroundTruth } from "./middleware/groundtruth";
import { injectBedrock } from "./middleware/bedrock";
import { injectSubstrate } from "./middleware/substrate";
import { injectZeroPoint } from "./middleware/zeropoint";
import governanceRouter from "./routes/governance";

const app = express();

app.use(express.json());
app.use(unifiedMiddleware);
app.use(injectRoute);
app.use(injectPath);
app.use(injectChannel);
app.use(injectConduit);
app.use(injectCirculation);
app.use(injectFlow);
app.use(injectRhythm);
app.use(injectSync);
app.use(injectCoherence);
app.use(injectIntegrity);
app.use(injectEnforcement);
app.use(injectLaw);
app.use(injectGroundTruth);
app.use(injectBedrock);
app.use(injectSubstrate);
app.use(injectZeroPoint);

app.use("/governance", governanceRouter);

export default app;
