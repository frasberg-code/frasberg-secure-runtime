import React, { useEffect, useState } from 'react';
import { BroadcastTimelineScrubber } from './BroadcastTimelineScrubber';

export function BroadcastModePanel({ raceId, apiKey }: { raceId: string; apiKey?: string }) {
  const [frames, setFrames] = useState<any[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/gt6/${encodeURIComponent(raceId)}/broadcast`, {
      headers: apiKey ? { authorization: `Bearer ${apiKey}` } : undefined,
    })
      .then((res) => (res.ok ? res.json() : { frames: [] }))
      .then((json) => {
        if (cancelled) return;
        setFrames(json.frames || []);
        setIndex(0);
      })
      .catch(() => !cancelled && setFrames([]));
    return () => {
      cancelled = true;
    };
  }, [raceId, apiKey]);

  useEffect(() => {
    if (!frames.length) return;
    const timer = setTimeout(
      () => setIndex((i) => (i + 1 < frames.length ? i + 1 : i)),
      frames[index]?.shot?.durationMs || 3000,
    );
    return () => clearTimeout(timer);
  }, [frames, index]);

  const frame = frames[index];

  return (
    <div>
      <h3>Broadcast Mode — {raceId}</h3>
      {frame ? (
        <>
          <h4>Shot</h4>
          <pre>{JSON.stringify(frame.shot, null, 2)}</pre>
          <h4>Commentary</h4>
          <p>{frame.commentary}</p>
          <h4>Fusion</h4>
          <pre>{JSON.stringify(frame.fusion, null, 2)}</pre>
        </>
      ) : (
        <p>No broadcast frames</p>
      )}
      <BroadcastTimelineScrubber frames={frames} index={index} onChange={setIndex} />
    </div>
  );
}
