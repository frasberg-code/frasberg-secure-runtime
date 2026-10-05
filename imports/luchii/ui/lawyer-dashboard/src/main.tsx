import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { LawyerRoutes } from "./routes";
import "../../lib/theme/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LawyerRoutes />
    </BrowserRouter>
  </React.StrictMode>
);
