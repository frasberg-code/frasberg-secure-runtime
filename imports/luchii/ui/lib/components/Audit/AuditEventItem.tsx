import React from "react";
import { formatDate } from "../../utils/formatDate";
import { tokens } from "../../theme/tokens";

export const AuditEventItem: React.FC<{
  actor: string;
  action: string;
  timestamp: string;
}> = ({ actor, action, timestamp }) => (
  <li
    style={{
      padding: tokens.spacing(1),
      marginBottom: tokens.spacing(1),
      background: tokens.color.surface,
      border: `1px solid ${tokens.color.border}`,
      borderRadius: tokens.radius.md
    }}
  >
    <strong>{action}</strong>
    <br />
    <small>
      {actor} — {formatDate(timestamp)}
    </small>
  </li>
);
