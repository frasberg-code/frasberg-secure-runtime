import React from "react";
import { Routes, Route } from "react-router-dom";
import { App } from "./App";

export const ClerkRoutes = () => (
  <Routes>
    <Route path="/" element={<App />} />
    <Route path="/cases/:caseId" element={<App />} />
  </Routes>
);
