export interface Case {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseEvent {
  id: string;
  caseId: string;
  type: string;
  payload: Record<string, any>;
  timestamp: Date;
}
