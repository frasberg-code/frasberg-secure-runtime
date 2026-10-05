export interface Evidence {
  id: string;
  caseId: string;
  type: string;
  metadata: Record<string, any>;
  storagePath: string;
  createdAt: Date;
}

export interface ChainOfCustody {
  id: string;
  evidenceId: string;
  actor: string;
  action: string;
  timestamp: Date;
}
