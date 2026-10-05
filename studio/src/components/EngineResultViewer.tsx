import { useEffect, useState } from 'react';
import { useFrasbergClient } from '../hooks/useFrasbergClient';
import { demoAwareness } from '../engine-awareness';

interface EngineResultViewerProps {
  endpoint: string;
  title: string;
  input: string;
}

export default function EngineResultViewer({
  endpoint,
  title,
  input,
}: EngineResultViewerProps) {
  const client = useFrasbergClient();
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    client
      .request(endpoint, { input, awareness: demoAwareness })
      .then((response: any) => {
        if (active) setResult(response.payload);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : String(requestError),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div>Loading {title}...</div>;
  if (error)
    return (
      <div role="alert">
        {title} request failed: {error}
      </div>
    );

  return (
    <div>
      <h3>{title}</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
