import { useEffect, useState } from "react";
import { api } from "../api/client";
import { endpoints } from "../api/endpoints";

export type AuditEvent = {
  id: string;
  caseId: string;
  actor: string;
  action: string;
  timestamp: string;
};

export const useAudit = (caseId: string) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }

    const fetchAuditLog = async () => {
      try {
        const response = await api.get<AuditEvent[]>(endpoints.auditLog(caseId));
        setEvents(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch audit log");
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLog();
  }, [caseId]);

  return { events, loading, error };
};
