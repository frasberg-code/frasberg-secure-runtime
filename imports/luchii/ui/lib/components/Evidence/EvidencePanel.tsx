import React from "react";
import { useEvidenceByCase } from "../../hooks/useEvidence";
import { Card } from "../../design/Card";
import { tokens } from "../../theme/tokens";
import { EvidenceItem } from "./EvidenceItem";

export const EvidencePanel: React.FC<{
  caseId: string;
  onSelect?: (id: string) => void;
}> = ({ caseId, onSelect }) => {
  const { evidence, loading, error } = useEvidenceByCase(caseId);

  if (loading) return <Card><div>Loading evidence...</div></Card>;
  if (error)
    return (
      <Card>
        <div style={{ color: tokens.color.error }}>Error: {error}</div>
      </Card>
    );

  return (
    <Card>
      <h2>Evidence</h2>
      {evidence.length === 0 ? (
        <p>No evidence for this case</p>
      ) : (
        evidence.map((ev) => (
          <EvidenceItem
            key={ev.id}
            id={ev.id}
            type={ev.type}
            filename={(ev.metadata.filename as string) || undefined}
            onSelect={onSelect}
          />
        ))
      )}
    </Card>
  );
};
