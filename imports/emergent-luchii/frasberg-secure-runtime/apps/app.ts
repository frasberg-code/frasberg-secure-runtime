import express from "express";
import { orchestratePlatform } from "../packages/orchestrator";
import publicApiRouter from "../platform/api/router";
import gatewayApp from "./gateway-server/app";
import routerApp from "./runtime-router/app";
import engineApp from "./engine-server/app";

const app = express();

app.use(express.json());

orchestratePlatform();

app.use("/v1", publicApiRouter);
app.use("/gateway", gatewayApp);
app.use("/router", routerApp);
app.use("/engine", engineApp);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    version: "v1",
    region: process.env.AWS_REGION || "local"
  });
});

export default app;
