import express from "express";
import { unifiedRouterMiddleware } from "./middleware/unified";

const app = express();

app.use(express.json());
app.use(unifiedRouterMiddleware);

export default app;
