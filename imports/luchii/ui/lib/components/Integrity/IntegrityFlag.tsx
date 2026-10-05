import React from "react";
import { tokens } from "../../theme/tokens";

export const IntegrityFlag: React.FC<{ flag: string }> = ({ flag }) => (
  <li
    style={{
      padding: tokens.spacing(0.75),
      marginBottom: tokens.spacing(0.5),
      background: tokens.color.warning,
      borderRadius: tokens.radius.md,
      color: tokens.color.text
    }}
  >
    {flag}
  </li>
);
