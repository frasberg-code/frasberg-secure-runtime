import { useEffect, useState } from "react";
import { api } from "../api/client";
import { endpoints } from "../api/endpoints";

type Statute = { citation: string; reason: string };
type Precedent = { caseName: string; reason: string };

export type LawMappingData = {
  statutes: Statute[];
  precedents: Precedent[];
};

export const useLawMapping = (caseId: string) => {
  const [lawData, setLawData] = useState<LawMappingData>({ statutes: [], precedents: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }

    const fetchLawMapping = async () => {
      try {
        const response = await api.get<LawMappingData>(endpoints.lawMapping(caseId));
        setLawData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch law mapping");
      } finally {
        setLoading(false);
      }
    };

    fetchLawMapping();
  }, [caseId]);

  return { lawData, loading, error };
};
