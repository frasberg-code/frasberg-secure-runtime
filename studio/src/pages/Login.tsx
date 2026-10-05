import { useState } from 'react';
import { setToken } from '../lib/session';

export default function Login() {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    const res = await fetch('/api/creator/assets', { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) return setError(`Key rejected (HTTP ${res.status})`);
    setToken(apiKey);
    window.location.href = '/';
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Studio Login</h2>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Frasberg API key"
      />
      <button onClick={submit} style={{ marginLeft: 8 }}>
        Enter Studio
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}