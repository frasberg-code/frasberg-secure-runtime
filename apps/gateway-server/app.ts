import express from "express";
import { unifiedMiddleware } from "./middleware/unified";
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
