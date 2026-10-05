import React from "react";
import { useCase } from "../../hooks/useCase";
import { tokens } from "../../theme/tokens";
import { formatDate } from "../../utils/formatDate";
import { formatStatus } from "../../utils/formatStatus";
import { Card } from "../../design/Card";

export const CaseDetail: React.FC<{ caseId: string }> = ({ caseId }) => {
  const { caseData, loading, error } = useCase(caseId);

  if (loading) return <div>Loading case details...</div>;
  if (error) return <div style={{ color: tokens.color.error }}>Error: {error}</div>;
  if (!caseData) return <div>No case selected</div>;

  return (
    <Card>
      <h2>{caseData.title}</h2>
      <p>
        <strong>Status:</strong> {formatStatus(caseData.status)}
      </p>
      <p>
        <strong>Created:</strong> {formatDate(caseData.createdAt)}
      </p>
      {caseData.description && (
        <p>
          <strong>Description:</strong> {caseData.description}
        </p>
      )}
    </Card>
  );
};
