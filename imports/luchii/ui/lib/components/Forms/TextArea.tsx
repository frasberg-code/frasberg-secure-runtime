import React from "react";
import { tokens } from "../../theme/tokens";

export const TextArea: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
> = (props) => (
  <textarea
    {...props}
    style={{
      width: "100%",
      padding: tokens.spacing(1),
      borderRadius: tokens.radius.md,
      border: `1px solid ${tokens.color.border}`,
      fontSize: tokens.font.size.md,
      fontFamily: tokens.font.family,
      color: tokens.color.text,
      boxSizing: "border-box",
      minHeight: "120px",
      ...props.style
    }}
  />
);
