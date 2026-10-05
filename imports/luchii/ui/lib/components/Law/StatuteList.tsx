import React from "react";
import { tokens } from "../../theme/tokens";

export const StatuteList: React.FC<{
  statutes: Array<{ citation: string; reason: string }>;
}> = ({ statutes }) => (
  <ul style={{ listStyle: "none", padding: 0 }}>
    {statutes.map((s) => (
      <li
        key={s.citation}
        style={{
          padding: tokens.spacing(1),
          marginBottom: tokens.spacing(1),
          background: tokens.color.primarySoft,
          borderRadius: tokens.radius.md
        }}
      >
        <strong>{s.citation}</strong>
        <p style={{ margin: tokens.spacing(0.5), color: tokens.color.textLight }}>
          {s.reason}
        </p>
      </li>
    ))}
  </ul>
);
