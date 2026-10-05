import { useEffect, useState } from 'react';
import { exportMp4, exportStatus } from '../lib/api';

export default function Mp4ExportPanel({ raceId }: { raceId: string }) {
  const [jobId, setJobId] = useState<string>();
  const [state, setState] = useState<{ status: string; mp4Url?: string; error?: string }>();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!jobId) return;
    const timer = setInterval(async () => {
      try {
        const s = await exportStatus(jobId);
        setState(s);
        if (s.status === 'completed' || s.status === 'failed') clearInterval(timer);
      } catch (e) {
        setError((e as Error).message);
        clearInterval(timer);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [jobId]);

  async function start() {
    setError('');
    setState(undefined);
    try {
      setJobId((await exportMp4(raceId)).jobId);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div>
      <button onClick={start}>Export MP4</button>
      {state && <p>Status: {state.status}</p>}
      {state?.mp4Url && <a href={state.mp4Url}>Download MP4</a>}
      {state?.status === 'completed' && !state.mp4Url && <p>Rendered on the server; no public URL configured.</p>}
      {state?.error && <p role="alert">{state.error}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}