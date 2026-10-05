import { useState } from 'react';
import { getCinematicPlan } from '../lib/api';

export default function CinematicAIAssistant({ raceId }: { raceId: string }) {
  const [result, setResult] = useState<Awaited<ReturnType<typeof getCinematicPlan>>>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setError('');
    try {
      setResult(await getCinematicPlan(raceId));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h3>Cinematic Plan Assistant</h3>
      <p>Rule-based GT6 planning; this does not call an AI/ML model.</p>
      <button onClick={generate} disabled={loading}>
        {loading ? 'Generating…' : 'Generate Plan'}
      </button>
      {error && <p role="alert">{error}</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </section>
  );
}
