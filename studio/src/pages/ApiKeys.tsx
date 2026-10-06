import { useCallback, useEffect, useState } from 'react';
import {
  createApiKey,
  getApiKeyCatalog,
  listApiKeys,
  revokeApiKey,
  type ApiKeyRecord,
} from '../lib/api';

export default function ApiKeys() {
  const [catalog, setCatalog] = useState<Record<string, string[]>>({});
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [newKey, setNewKey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setError('');
    try {
      const [cat, list] = await Promise.all([getApiKeyCatalog(), listApiKeys()]);
      setCatalog(cat.catalog);
      setKeys(list.keys);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = (scopes: string[]) =>
    setSelected((current) =>
      scopes.every((s) => current.includes(s))
        ? current.filter((s) => !scopes.includes(s))
        : [...new Set([...current, ...scopes])],
    );

  async function create() {
    setBusy(true);
    setError('');
    setNewKey('');
    try {
      const created = await createApiKey({ name, scopes: selected });
      setNewKey(created.key);
      setName('');
      setSelected([]);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    setError('');
    try {
      await revokeApiKey(id);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div>
      <h2>API Keys</h2>
      {error && <p role="alert">{error}</p>}

      <section>
        <h3>Create Key</h3>
        <input
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name"
        />
        <div>
          {Object.entries(catalog).map(([label, scopes]) => (
            <label key={label} style={{ display: 'block' }}>
              <input
                type="checkbox"
                checked={scopes.every((s) => selected.includes(s))}
                onChange={() => toggle(scopes)}
              />{' '}
              {label} <code>({scopes.join(', ')})</code>
            </label>
          ))}
        </div>
        <button onClick={create} disabled={busy || !name.trim() || selected.length === 0}>
          Create Key
        </button>
        {newKey && (
          <p>
            Copy this key now. It will not be shown again: <code>{newKey}</code>
          </p>
        )}
      </section>

      <section>
        <h3>Your keys</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Status</th>
              <th>Permissions</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id}>
                <td>{k.name}</td>
                <td>
                  <code>{k.prefix ?? 'luc_live_'}…</code>
                </td>
                <td>{k.status}</td>
                <td>{k.permissions.join(', ')}</td>
                <td>
                  {k.status === 'active' && (
                    <button onClick={() => revoke(k.id)}>Revoke</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}