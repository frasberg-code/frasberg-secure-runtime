import React from "react";
import { tokens } from "../theme/tokens";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export const Button: React.FC<Props> = ({ children, variant = "primary", ...props }) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: tokens.color.primary,
      color: tokens.color.surface
    },
    secondary: {
      background: tokens.color.primarySoft,
      color: tokens.color.primary
    },
    danger: {
      background: tokens.color.error,
      color: tokens.color.surface
    }
  };

  return (
    <button
      {...props}
      style={{
        padding: `${tokens.spacing(0.75)} ${tokens.spacing(1.5)}`,
        borderRadius: tokens.radius.md,
        border: "none",
        cursor: "pointer",
        fontSize: tokens.font.size.md,
        fontWeight: tokens.font.weight.medium,
        ...variantStyles[variant]
      }}
    >
      {children}
    </button>
  );
};
