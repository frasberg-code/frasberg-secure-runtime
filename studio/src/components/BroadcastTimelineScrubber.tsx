import React from 'react';

interface ScrubberFrame {
  timestamp: number;
  shot: unknown;
  commentary: string;
}

export function BroadcastTimelineScrubber({
  frames,
  index,
  onChange,
}: {
  frames: ScrubberFrame[];
  index: number;
  onChange: (i: number) => void;
}) {
  if (!frames.length) return <p>No frames</p>;

  return (
    <div style={{ marginTop: 16 }}>
      <input
        type="range"
        min={0}
        max={frames.length - 1}
        value={index}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span>{new Date(frames[0].timestamp).toLocaleTimeString()}</span>
        <span>{new Date(frames[frames.length - 1].timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
