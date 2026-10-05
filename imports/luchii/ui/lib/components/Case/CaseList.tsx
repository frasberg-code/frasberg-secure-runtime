import React from "react";
import { useCases } from "../../hooks/useCases";
import { tokens } from "../../theme/tokens";
import { formatDate } from "../../utils/formatDate";

export const CaseList: React.FC<{ onSelect?: (id: string) => void }> = ({
  onSelect
}) => {
  const { cases, loading, error } = useCases();

  if (loading) return <div>Loading cases...</div>;
  if (error) return <div style={{ color: tokens.color.error }}>Error: {error}</div>;

  return (
    <div>
      <h2>Cases</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {cases.map((c) => (
          <li
            key={c.id}
            onClick={() => onSelect?.(c.id)}
            style={{
              padding: tokens.spacing(1.5),
              marginBottom: tokens.spacing(1),
              background: tokens.color.surface,
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = tokens.color.primarySoft;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = tokens.color.surface;
            }}
          >
            <strong>{c.title}</strong> ({c.status})
            <br />
            <small>{formatDate(c.createdAt)}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};
