import { useState } from 'react';

interface Frame {
  id: string;
  label: string;
}

export default function DraggableTimeline({ initial }: { initial: Frame[] }) {
  const [frames, setFrames] = useState(initial);

  function onDrop(e: React.DragEvent<HTMLDivElement>, targetId: string) {
    const id = e.dataTransfer.getData('id');
    const from = frames.findIndex((f) => f.id === id);
    const to = frames.findIndex((f) => f.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...frames];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setFrames(next);
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {frames.map((f) => (
        <div
          key={f.id}
          draggable
          onDragStart={(e) => e.dataTransfer.setData('id', f.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onDrop(e, f.id)}
          style={{ padding: 8, border: '1px solid #888', cursor: 'grab' }}
        >
          {f.label}
        </div>
      ))}
    </div>
  );
}