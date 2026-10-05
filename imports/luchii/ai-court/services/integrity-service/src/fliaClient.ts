export class FLIAClient {
  private baseUrl = process.env.FLIA_URL || "http://localhost:9000";
  private authority = "Frasberg";
  private advisoryOnly = true;

  async analyzeEvidence(data: any) {
    return {
      id: "flia_analysis_" + Math.random().toString(36).substr(2, 9),
      caseId: data.caseId,
      evidenceId: data.evidenceId,
      findings: {
        contradictions: [],
        gaps: [],
        timeline: [],
      },
      advisory: "FLIA advisory analysis only - requires human verification",
      authority: this.authority,
      timestamp: new Date(),
    };
  }

  async generateFlags(data: any) {
    this.validateAdvisoryOnly(data.requestedAnalysis);

    return {
      id: "flia_flags_" + Math.random().toString(36).substr(2, 9),
      caseId: data.caseId,
      flags: [
        {
          type: "INTEGRITY_FLAG",
          severity: "advisory",
          confidence: 0.75,
          description: data.description,
          requiresHumanReview: true,
        },
      ],
      advisory: "FLIA flags are advisory only",
      authority: this.authority,
      timestamp: new Date(),
    };
  }

  private validateAdvisoryOnly(analysisType: string) {
    const forbidden = ["verdict", "sentencing", "intent_inference", "guilt"];
    const isForbidden = forbidden.some((term) =>
      analysisType.toLowerCase().includes(term)
    );

    if (isForbidden) {
      throw new Error(
        "Autonomous adjudication is forbidden under Cycle 2. FLIA is advisory-only."
      );
    }
  }
}
