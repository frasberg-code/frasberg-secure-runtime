import { useState } from 'react';
import { runBroadcastAutomation } from '../lib/api';

export default function BroadcastAutomationPanel({ raceId }: { raceId: string }) {
  const [result, setResult] = useState<Awaited<ReturnType<typeof runBroadcastAutomation>>>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function run() {
    setError('');
    setLoading(true);
    try {
      setResult(await runBroadcastAutomation(raceId));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h3>Broadcast Automation</h3>
      <button onClick={run} disabled={loading}>
        {loading ? 'Preparing…' : 'Prepare Broadcast'}
      </button>
      {error && <p role="alert">{error}</p>}
      {result && (
        <>
          <p>Export job: {result.exportJobId}</p>
          <p>{result.note}</p>
          <pre>{JSON.stringify({ mode: result.mode, cameraPlan: result.cameraPlan }, null, 2)}</pre>
        </>
      )}
    </section>
  );
}
