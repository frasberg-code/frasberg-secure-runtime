import React from "react";
import { useAudit } from "../../hooks/useAudit";
import { Card } from "../../design/Card";
import { tokens } from "../../theme/tokens";
import { AuditEventItem } from "./AuditEventItem";

export const AuditPanel: React.FC<{ caseId: string }> = ({ caseId }) => {
  const { events, loading, error } = useAudit(caseId);

  if (loading) return <Card><div>Loading audit log...</div></Card>;
  if (error)
    return (
      <Card>
        <div style={{ color: tokens.color.error }}>Error: {error}</div>
      </Card>
    );

  return (
    <Card>
      <h2>Audit Log</h2>
      {events.length === 0 ? (
        <p>No audit events</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {events.map((evt) => (
            <AuditEventItem
              key={evt.id}
              actor={evt.actor}
              action={evt.action}
              timestamp={evt.timestamp}
            />
          ))}
        </ul>
      )}
    </Card>
  );
};
