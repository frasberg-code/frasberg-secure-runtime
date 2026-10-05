import { useEffect, useState } from "react";
import { api } from "../api/client";
import { endpoints } from "../api/endpoints";

export type CaseItem = { id: string; title: string; status: string; createdAt: string };

export const useCases = () => {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await api.get<CaseItem[]>(endpoints.cases);
        setCases(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch cases");
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  return { cases, loading, error };
};
