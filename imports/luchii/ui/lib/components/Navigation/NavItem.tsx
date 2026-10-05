import React from "react";
import { NavLink } from "react-router-dom";
import { tokens } from "../../theme/tokens";

export const NavItem: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <NavLink
    to={to}
    style={({ isActive }) => ({
      display: "block",
      padding: tokens.spacing(1),
      textDecoration: "none",
      color: isActive ? tokens.color.primary : tokens.color.text,
      fontWeight: isActive ? tokens.font.weight.semibold : tokens.font.weight.regular,
      borderLeft: isActive ? `3px solid ${tokens.color.primary}` : "3px solid transparent",
      paddingLeft: `calc(${tokens.spacing(1)} - 3px)`
    })}
  >
    {label}
  </NavLink>
);
