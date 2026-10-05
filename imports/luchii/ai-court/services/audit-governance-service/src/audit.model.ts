export interface AuditEvent {
  id: string;
  caseId?: string;
  actor: string;
  action: string;
  payload: Record<string, any>;
  timestamp: Date;
}
