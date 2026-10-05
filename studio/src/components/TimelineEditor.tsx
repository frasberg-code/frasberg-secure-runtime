import { useEffect, useState } from 'react';
import { BroadcastTimelineScrubber } from './BroadcastTimelineScrubber';
import { getBroadcast, getKeyframes } from '../lib/api';

export default function TimelineEditor({ raceId }: { raceId: string }) {
  const [frames, setFrames] = useState<any[]>([]);
  const [keys, setKeys] = useState<{ index: number; label: string }[]>([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    getBroadcast(raceId).then((b) => setFrames(b.frames), (e) => setError(e.message));
    getKeyframes(raceId).then((k) => setKeys(k.keyframes), () => {});
  }, [raceId]);

  if (error) return <p role="alert">{error}</p>;
  const frame = frames[index];

  return (
    <div>
      <BroadcastTimelineScrubber frames={frames} index={index} onChange={setIndex} />
      <div style={{ marginTop: 8 }}>
        {keys.map((k) => (
          <button key={k.index} onClick={() => setIndex(k.index)} style={{ marginRight: 8 }}>
            {k.label}
          </button>
        ))}
      </div>
      {frame && (
        <>
          <p>
            {frame.shot?.type} - {frame.commentary}
          </p>
        </>
      )}
    </div>
  );
}