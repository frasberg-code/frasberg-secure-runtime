import express from "express";
import { unifiedMiddleware } from "./middleware/unified";
import { injectLaw } from "./middleware/law";
import { injectGroundTruth } from "./middleware/groundtruth";
import { injectBedrock } from "./middleware/bedrock";
import { injectSubstrate } from "./middleware/substrate";
import { injectZeroPoint } from "./middleware/zeropoint";
import governanceRouter from "./routes/governance";

const app = express();

app.use(express.json());
app.use(unifiedMiddleware);
app.use(injectLaw);
app.use(injectGroundTruth);
app.use(injectBedrock);
app.use(injectSubstrate);
app.use(injectZeroPoint);

app.use("/governance", governanceRouter);

export default app;
