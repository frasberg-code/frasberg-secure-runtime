import React from "react";
import { AppShell } from "../../lib/components/Layout/AppShell";
import { CaseList } from "../../lib/components/Case/CaseList";
import { CaseDetail } from "../../lib/components/Case/CaseDetail";
import { EvidencePanel } from "../../lib/components/Evidence/EvidencePanel";
import { LawPanel } from "../../lib/components/Law/LawPanel";
import { useCourtStore } from "../../lib/state/useCourtStore";
import { tokens } from "../../lib/theme/tokens";

export const App = () => {
  const selectedCaseId = useCourtStore((s) => s.selectedCaseId);
  const setCase = useCourtStore((s) => s.setCase);

  const navItems = [
    { to: "/", label: "Cases" },
    { to: "/motions", label: "Motions" },
    { to: "/precedents", label: "Precedents" },
    { to: "/settings", label: "Settings" }
  ];

  return (
    <AppShell title="Lawyer Dashboard" navItems={navItems}>
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
            </div>
          ) : (
            <div style={{ padding: tokens.spacing(3) }}>Select a case to begin</div>
          )}
        </div>
      </div>
    </AppShell>
  );
};
