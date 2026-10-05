import React from "react";
import { tokens } from "../../theme/tokens";
import { Sidebar } from "../Navigation/Sidebar";
import { Header } from "./Header";

export const AppShell: React.FC<{
  title: string;
  navItems?: Array<{ to: string; label: string }>;
  children: React.ReactNode;
}> = ({ title, navItems = [], children }) => (
  <div
    style={{
      display: "flex",
      minHeight: "100vh",
      background: tokens.color.bg
    }}
  >
    <Sidebar items={navItems} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Header title={title} />
      <main style={{ flex: 1, padding: tokens.spacing(3), overflow: "auto" }}>
        {children}
      </main>
    </div>
  </div>
);
