import { useEffect, useState } from "react";
import { api } from "../api/client";
import { endpoints } from "../api/endpoints";

export type CaseDetailData = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  description?: string;
};

export const useCase = (caseId: string) => {
  const [caseData, setCaseData] = useState<CaseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }

    const fetchCase = async () => {
      try {
        const response = await api.get<CaseDetailData>(endpoints.caseById(caseId));
        setCaseData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch case");
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [caseId]);

  return { caseData, loading, error };
};
