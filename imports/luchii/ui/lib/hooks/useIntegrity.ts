import { useEffect, useState } from "react";
import { api } from "../api/client";
import { endpoints } from "../api/endpoints";

export type IntegrityAdvisory = {
  severity: "LOW" | "MEDIUM" | "HIGH";
  flags: string[];
  disclaimer: string;
};

export const useIntegrity = (caseId: string, evidenceIds: string[]) => {
  const [advisory, setAdvisory] = useState<IntegrityAdvisory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId || evidenceIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchAdvisory = async () => {
      try {
        const response = await api.get<IntegrityAdvisory>(
          endpoints.integrityAdvisory(caseId, evidenceIds)
        );
        setAdvisory(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch integrity advisory");
      } finally {
        setLoading(false);
      }
    };

    fetchAdvisory();
  }, [caseId, evidenceIds]);

  return { advisory, loading, error };
};
