import { useState } from 'react';
import { setLiveCamera } from '../lib/api';

const CAMERAS = ['static_track', 'chase_cam', 'cockpit', 'drone'];

// Records the selected camera on the gateway. No WebRTC/LiveKit stream is connected yet.
export default function LiveDirectorMode({ raceId }: { raceId: string }) {
  const [camera, setCamera] = useState<string>();
  const [error, setError] = useState('');

  async function switchCamera(next: string) {
    setError('');
    try {
      await setLiveCamera(raceId, next);
      setCamera(next);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div>
      <p>No live video stream connected (LiveKit not configured).</p>
      {CAMERAS.map((c) => (
        <button key={c} onClick={() => switchCamera(c)} style={{ marginRight: 8 }}>
          {c}
        </button>
      ))}
      {camera && <p>Active camera: {camera}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}