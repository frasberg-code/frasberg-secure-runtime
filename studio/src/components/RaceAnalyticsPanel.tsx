import { useEffect, useState } from 'react';
import { getRaceAnalytics } from '../lib/api';

export default function RaceAnalyticsPanel({ raceId }: { raceId: string }) {
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof getRaceAnalytics>>>();
  const [error, setError] = useState('');

  useEffect(() => {
    getRaceAnalytics(raceId).then(setAnalytics, (e) => setError(e.message));
  }, [raceId]);

  if (error) return <p role="alert">{error}</p>;
  if (!analytics) return <p>Loading race analytics…</p>;
  return (
    <section>
      <h3>Race Analytics</h3>
      <p>
        Top observed speed: {analytics.topSpeedKph ?? '—'} kph
        {analytics.topSpeedCarId ? ` (${analytics.topSpeedCarId})` : ''}
      </p>
      <ul>
        {Object.entries(analytics.averageSpeedByCar).map(([carId, speed]) => (
          <li key={carId}>{carId}: {speed.toFixed(1)} kph average</li>
        ))}
      </ul>
    </section>
  );
}
