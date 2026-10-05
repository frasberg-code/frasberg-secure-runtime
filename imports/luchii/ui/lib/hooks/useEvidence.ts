import { useEffect, useState } from "react";
import { api } from "../api/client";
import { endpoints } from "../api/endpoints";

export type EvidenceItem = {
  id: string;
  caseId: string;
  type: string;
  metadata: Record<string, unknown>;
};

export const useEvidenceByCase = (caseId: string) => {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }

    const fetchEvidence = async () => {
      try {
        const response = await api.get<EvidenceItem[]>(endpoints.evidenceByCase(caseId));
        setEvidence(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch evidence");
      } finally {
        setLoading(false);
      }
    };

    fetchEvidence();
  }, [caseId]);

  return { evidence, loading, error };
};
