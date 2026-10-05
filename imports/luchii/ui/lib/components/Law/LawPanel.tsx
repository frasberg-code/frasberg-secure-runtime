import React from "react";
import { useLawMapping } from "../../hooks/useLawMapping";
import { Card } from "../../design/Card";
import { tokens } from "../../theme/tokens";
import { StatuteList } from "./StatuteList";
import { PrecedentList } from "./PrecedentList";

export const LawPanel: React.FC<{ caseId: string }> = ({ caseId }) => {
  const { lawData, loading, error } = useLawMapping(caseId);

  if (loading) return <Card><div>Loading law mapping...</div></Card>;
  if (error)
    return (
      <Card>
        <div style={{ color: tokens.color.error }}>Error: {error}</div>
      </Card>
    );

  return (
    <Card>
      <h2>Legal Reference</h2>
      {lawData.statutes.length > 0 && (
        <div style={{ marginBottom: tokens.spacing(2) }}>
          <h3>Statutes</h3>
          <StatuteList statutes={lawData.statutes} />
        </div>
      )}
      {lawData.precedents.length > 0 && (
        <div>
          <h3>Precedents</h3>
          <PrecedentList precedents={lawData.precedents} />
        </div>
      )}
    </Card>
  );
};
