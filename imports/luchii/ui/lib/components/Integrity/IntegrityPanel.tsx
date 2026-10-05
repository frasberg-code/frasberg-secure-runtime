import React from "react";
import { useIntegrity } from "../../hooks/useIntegrity";
import { Card } from "../../design/Card";
import { tokens } from "../../theme/tokens";
import { IntegrityFlag } from "./IntegrityFlag";

export const IntegrityPanel: React.FC<{
  caseId: string;
  evidenceIds: string[];
}> = ({ caseId, evidenceIds }) => {
  const { advisory, loading, error } = useIntegrity(caseId, evidenceIds);

  if (loading) return <Card><div>Analyzing integrity...</div></Card>;
  if (error)
    return (
      <Card>
        <div style={{ color: tokens.color.error }}>Error: {error}</div>
      </Card>
    );
  if (!advisory) return <Card><div>No integrity data available</div></Card>;

  return (
    <Card>
      <h2>Integrity Advisory ({advisory.severity})</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {advisory.flags.map((flag) => (
          <IntegrityFlag key={flag} flag={flag} />
        ))}
      </ul>
      <p style={{ fontSize: tokens.font.size.sm, color: tokens.color.textLight }}>
        {advisory.disclaimer}
      </p>
    </Card>
  );
};
