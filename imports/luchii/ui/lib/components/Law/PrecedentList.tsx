import React from "react";
import { tokens } from "../../theme/tokens";

export const PrecedentList: React.FC<{
  precedents: Array<{ caseName: string; reason: string }>;
}> = ({ precedents }) => (
  <ul style={{ listStyle: "none", padding: 0 }}>
    {precedents.map((p) => (
      <li
        key={p.caseName}
        style={{
          padding: tokens.spacing(1),
          marginBottom: tokens.spacing(1),
          background: tokens.color.primarySoft,
          borderRadius: tokens.radius.md
        }}
      >
        <strong>{p.caseName}</strong>
        <p style={{ margin: tokens.spacing(0.5), color: tokens.color.textLight }}>
          {p.reason}
        </p>
      </li>
    ))}
  </ul>
);
