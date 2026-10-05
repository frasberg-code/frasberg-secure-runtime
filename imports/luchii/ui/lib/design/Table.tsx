import React from "react";
import { tokens } from "../theme/tokens";

export const Table: React.FC<{
  columns: string[];
  rows: Record<string, unknown>[];
}> = ({ columns, rows }) => (
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      background: tokens.color.surface,
      fontSize: tokens.font.size.sm
    }}
  >
    <thead>
      <tr>
        {columns.map((col) => (
          <th
            key={col}
            style={{
              textAlign: "left",
              padding: tokens.spacing(1),
              borderBottom: `1px solid ${tokens.color.border}`,
              fontWeight: tokens.font.weight.semibold,
              background: tokens.color.bg
            }}
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, i) => (
        <tr key={i}>
          {columns.map((col) => (
            <td
              key={col}
              style={{
                padding: tokens.spacing(1),
                borderBottom: `1px solid ${tokens.color.border}`,
                color: tokens.color.text
              }}
            >
              {String(row[col] || "")}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);
