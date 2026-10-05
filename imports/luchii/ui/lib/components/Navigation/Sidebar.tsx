import React from "react";
import { tokens } from "../../theme/tokens";
import { NavItem } from "./NavItem";

export const Sidebar: React.FC<{ items?: Array<{ to: string; label: string }> }> = ({
  items = []
}) => (
  <aside
    style={{
      width: "250px",
      background: tokens.color.bg,
      borderRight: `1px solid ${tokens.color.border}`,
      padding: tokens.spacing(2),
      overflowY: "auto"
    }}
  >
    <nav>
      {items.map((item) => (
        <NavItem key={item.to} to={item.to} label={item.label} />
      ))}
    </nav>
  </aside>
);
