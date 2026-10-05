export interface CaseEvent {
  id: string;
  caseId: string;
  type: string;
  payload: Record<string, any>;
  timestamp: Date;
}

export const EventTypes = {
  CASE_CREATED: "case.created",
  EVIDENCE_ADDED: "evidence.added",
  LAW_ANALYZED: "law.analyzed",
  INTEGRITY_FLAG: "integrity.flag",
  AUDIT_LOG: "audit.log",
} as const;
