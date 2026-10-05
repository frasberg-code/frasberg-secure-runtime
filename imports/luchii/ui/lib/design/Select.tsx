import React from "react";
import { tokens } from "../theme/tokens";

type Option = { label: string; value: string };

export const Select: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & { options: Option[] }
> = ({ options, ...props }) => (
  <select
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
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);
