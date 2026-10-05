export const endpoints = {
  cases: "/cases",
  caseById: (id: string) => `/cases/${id}`,
  caseTimeline: (id: string) => `/cases/${id}/timeline`,
  evidenceByCase: (caseId: string) => `/evidence/case/${caseId}`,
  evidenceUpload: "/evidence/upload",
  lawMapping: (caseId: string) => `/law/case/${caseId}`,
  integrityAdvisory: (caseId: string, evidenceIds: string[]) =>
    `/integrity/advisory?caseId=${caseId}&evidenceIds=${evidenceIds.join(",")}`,
  auditLog: (caseId: string) => `/audit/case/${caseId}`
};
