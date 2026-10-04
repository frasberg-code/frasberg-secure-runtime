import express from "express";
import { unifiedMiddleware } from "./middleware/unified";
import governanceRouter from "./routes/governance";

const app = express();

app.use(express.json());
app.use(unifiedMiddleware);

app.use("/governance", governanceRouter);

export default app;
