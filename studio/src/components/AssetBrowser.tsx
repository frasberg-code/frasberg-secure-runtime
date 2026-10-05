import { useEffect, useState } from 'react';
import { getAssets } from '../lib/api';

export default function AssetBrowser() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getAssets().then(
      (g) => setNodes(Object.values(g.nodes)),
      (e) => setError(e.message),
    );
  }, []);

  if (error) return <p role="alert">{error}</p>;
  if (!nodes.length) return <p>No assets published yet.</p>;
  return (
    <ul>
      {nodes.map((n) => (
        <li key={n.id}>
          {n.type}: {n.id} {n.url && <a href={n.url}>open</a>}
        </li>
      ))}
    </ul>
  );
}