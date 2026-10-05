import React from "react";
import { tokens } from "../../theme/tokens";

export const Header: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle
}) => (
  <header
    style={{
      background: tokens.color.primary,
      color: tokens.color.surface,
      padding: tokens.spacing(2),
      borderBottom: `1px solid ${tokens.color.border}`
    }}
  >
    <h1 style={{ margin: 0, fontSize: tokens.font.size.xl }}>{title}</h1>
    {subtitle ? <p style={{ margin: tokens.spacing(0.5), fontSize: tokens.font.size.sm }}>{subtitle}</p> : null}
  </header>
);
