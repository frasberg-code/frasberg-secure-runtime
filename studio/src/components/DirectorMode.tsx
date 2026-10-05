import { useEffect, useState } from 'react';
import { getMixed } from '../lib/api';

const CAMERAS = ['static_track', 'chase_cam', 'cockpit', 'drone'];

// Camera choices are edited locally; they are not yet persisted to the backend.
export default function DirectorMode({ raceId }: { raceId: string }) {
  const [frames, setFrames] = useState<any[]>([]);
  const [plan, setPlan] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    getMixed(raceId).then(
      (m) => {
        setFrames(m.frames);
        setPlan(m.cameraPlan);
        setIndex(0);
      },
      (e) => setError(e.message),
    );
  }, [raceId]);

  if (error) return <p role="alert">{error}</p>;
  const frame = frames[index];
  if (!frame) return <p>No frames</p>;
  const cam = plan.find((c) => c.shotId === frame.shot.id);

  return (
    <div>
      <h3>Director Mode</h3>
      <p>
        {new Date(frame.timestamp).toLocaleTimeString()} - {frame.shot.type}
      </p>
      <button onClick={() => setIndex(Math.max(0, index - 1))}>Prev</button>
      <button onClick={() => setIndex(Math.min(frames.length - 1, index + 1))} style={{ marginLeft: 8 }}>
        Next
      </button>
      <h4>Camera: {cam?.camera}</h4>
      {CAMERAS.map((c) => (
        <button
          key={c}
          style={{ marginRight: 8 }}
          onClick={() =>
            setPlan(plan.map((p) => (p.shotId === frame.shot.id ? { ...p, camera: c } : p)))
          }
        >
          {c}
        </button>
      ))}
    </div>
  );
}