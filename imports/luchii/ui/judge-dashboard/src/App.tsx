import React, { useState } from "react";
import { AppShell } from "../../lib/components/Layout/AppShell";
import { CaseList } from "../../lib/components/Case/CaseList";
import { CaseDetail } from "../../lib/components/Case/CaseDetail";
import { EvidencePanel } from "../../lib/components/Evidence/EvidencePanel";
import { LawPanel } from "../../lib/components/Law/LawPanel";
import { IntegrityPanel } from "../../lib/components/Integrity/IntegrityPanel";
import { AuditPanel } from "../../lib/components/Audit/AuditPanel";
import { useCourtStore } from "../../lib/state/useCourtStore";
import { tokens } from "../../lib/theme/tokens";

export const App = () => {
  const selectedCaseId = useCourtStore((s) => s.selectedCaseId);
  const setCase = useCourtStore((s) => s.setCase);
  const selectedEvidenceIds = useCourtStore((s) => s.selectedEvidenceIds);

  const navItems = [
    { to: "/", label: "Cases" },
    { to: "/schedule", label: "Schedule" },
    { to: "/settings", label: "Settings" }
  ];

  return (
    <AppShell title="Judge Dashboard" navItems={navItems}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: tokens.spacing(2) }}>
        <div>
          <CaseList onSelect={setCase} />
        </div>
        <div>
          {selectedCaseId ? (
            <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacing(2) }}>
              <CaseDetail caseId={selectedCaseId} />
              <EvidencePanel caseId={selectedCaseId} />
              <LawPanel caseId={selectedCaseId} />
              <IntegrityPanel caseId={selectedCaseId} evidenceIds={selectedEvidenceIds} />
              <AuditPanel caseId={selectedCaseId} />
            </div>
          ) : (
            <div style={{ padding: tokens.spacing(3) }}>Select a case to begin</div>
          )}
        </div>
      </div>
    </AppShell>
  );
};
