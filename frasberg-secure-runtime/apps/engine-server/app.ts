import express from "express";
import { unifiedEnforce } from "./unified-enforce";

const app = express();

app.use(express.json());

export default app;
