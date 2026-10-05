import { useCallback, useEffect, useState } from 'react';
import { createRelease, getReleases, type StudioRelease } from '../lib/api';

export default function Releases() {
  const [releases, setReleases] = useState<StudioRelease[]>([]);
  const [version, setVersion] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setError('');
    try {
      setReleases(await getReleases());
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function publish() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const release = await createRelease({ version, name, notes });
      setMessage(`Published ${release.tagName}`);
      setVersion('');
      setName('');
      setNotes('');
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2>GitHub Releases</h2>
      <p>
        Publishing from Studio requires the runtime to have a dedicated GitHub release token.
        If it is not configured, create releases directly on{' '}
        <a href="https://github.com/frasberg-code/frasberg-secure-runtime/releases/new">
          GitHub Releases
        </a>
        .
      </p>
      <section>
        <h3>Publish a release</h3>
        <input
          aria-label="Version"
          placeholder="v1.2.3"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
        />
        <input
          aria-label="Release name"
          placeholder="Release name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ display: 'block', marginTop: 8 }}
        />
        <textarea
          aria-label="Release notes"
          placeholder="Release notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={8}
          style={{ display: 'block', marginTop: 8, width: '100%' }}
        />
        <button disabled={busy || !version || !notes.trim()} onClick={publish}>
          {busy ? 'Publishing…' : 'Publish GitHub Release'}
        </button>
      </section>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
      <ul>
        {releases.map((release) => (
          <li key={release.tagName}>
            <strong>{release.name || release.tagName}</strong>
            {' — '}
            {new Date(release.createdAt).toLocaleString()}
            {' — '}
            <a href={release.url}>notes</a>
            <pre>{release.notes}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
