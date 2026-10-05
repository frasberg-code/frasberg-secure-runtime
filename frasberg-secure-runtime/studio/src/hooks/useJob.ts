import { useState, useEffect } from "react";
import { startJob } from "../actions/startJob";
import { pollJob } from "../actions/pollJob";
import { fetchJobResult } from "../actions/fetchJobResult";

export function useJob(type, payload) {
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);

  async function run() {
    const start = await startJob(type, payload);
    setJobId(start.payload.jobId);
    setStatus("queued");
  }

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      const s = await pollJob(jobId);
      setStatus(s.payload.status);

      if (s.payload.status === "completed") {
        const r = await fetchJobResult(jobId);
        setResult(r.payload.result);
        clearInterval(interval);
      }

      if (s.payload.status === "failed") {
        clearInterval(interval);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [jobId]);

  return { run, jobId, status, result };
}
