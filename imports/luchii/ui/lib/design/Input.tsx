import React from "react";
import { tokens } from "../theme/tokens";

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    style={{
      width: "100%",
      padding: tokens.spacing(0.75),
      borderRadius: tokens.radius.md,
      border: `1px solid ${tokens.color.border}`,
      fontSize: tokens.font.size.md,
      fontFamily: tokens.font.family,
      color: tokens.color.text,
      boxSizing: "border-box",
      ...props.style
    }}
  />
);
