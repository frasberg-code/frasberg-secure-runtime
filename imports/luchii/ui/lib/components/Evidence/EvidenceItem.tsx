import React from "react";
import { tokens } from "../../theme/tokens";

export const EvidenceItem: React.FC<{
  id: string;
  type: string;
  filename?: string;
  onSelect?: (id: string) => void;
}> = ({ id, type, filename, onSelect }) => (
  <div
    onClick={() => onSelect?.(id)}
    style={{
      padding: tokens.spacing(1),
      marginBottom: tokens.spacing(1),
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.border}`,
      borderRadius: tokens.radius.md,
      cursor: "pointer"
    }}
  >
    <strong>{type}</strong>
    {filename && <p style={{ margin: tokens.spacing(0.5) }}>{filename}</p>}
  </div>
);
