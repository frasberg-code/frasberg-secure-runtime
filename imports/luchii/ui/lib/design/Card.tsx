import React from "react";
import { tokens } from "../theme/tokens";

export const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      background: tokens.color.surface,
      padding: tokens.spacing(2),
      borderRadius: tokens.radius.md,
      border: `1px solid ${tokens.color.border}`,
      boxShadow: tokens.shadow.md
    }}
  >
    {children}
  </div>
);
