export const mockAuditEvents = [
  {
    id: "audit_001",
    caseId: "case_001",
    actor: "system",
    action: "court.case.created",
    timestamp: "2026-07-13T03:31:00Z"
  },
  {
    id: "audit_002",
    caseId: "case_001",
    actor: "user_judge_001",
    action: "court.evidence.added",
    timestamp: "2026-07-13T03:35:00Z"
  },
  {
    id: "audit_003",
    caseId: "case_001",
    actor: "user_clerk_001",
    action: "court.case.updated",
    timestamp: "2026-07-13T04:00:00Z"
  }
];
