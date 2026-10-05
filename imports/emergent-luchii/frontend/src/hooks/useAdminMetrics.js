import { useEffect, useState, useCallback } from "react";
import {
  fetchOverview, fetchMeshMetrics, fetchRegions,
  fetchClients, fetchQueueStats, fetchVoiceStats,
} from "../api/adminApi";

export function useAdminMetrics(intervalMs = 8000) {
  const [overview, setOverview] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [regions, setRegions] = useState([]);
  const [clients, setClients] = useState([]);
  const [voiceStats, setVoiceStats] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [ov, mt, reg, cl, vs, qs] = await Promise.all([
        fetchOverview(), fetchMeshMetrics(), fetchRegions(),
        fetchClients(), fetchVoiceStats(), fetchQueueStats(),
      ]);
      setOverview(ov);
      setMetrics(mt);
      setRegions(reg.regions || []);
      setClients(cl.clients || []);
      setVoiceStats(vs);
      setQueueStats(qs);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, intervalMs);
    return () => clearInterval(timer);
  }, [refresh, intervalMs]);

  return { overview, metrics, regions, clients, voiceStats, queueStats, loading, error, refresh };
}
