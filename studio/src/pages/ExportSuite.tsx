import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Mp4ExportPanel from '../components/Mp4ExportPanel';
import DirectorMode from '../components/DirectorMode';
import DraggableTimeline from '../components/DraggableTimeline';
import LiveDirectorMode from '../components/LiveDirectorMode';
import { getBroadcast, getRaceStory } from '../lib/api';
import CinematicAIAssistant from '../components/CinematicAIAssistant';
import BroadcastAutomationPanel from '../components/BroadcastAutomationPanel';
import RaceAnalyticsPanel from '../components/RaceAnalyticsPanel';

export default function ExportSuite() {
  const { raceId = 'demo-race' } = useParams();
  const [frames, setFrames] = useState<{ id: string; label: string }[]>([]);
  const [beats, setBeats] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    getBroadcast(raceId).then(
      (b) => setFrames(b.frames.map((f, i) => ({ id: `${i}-${f.shot?.id}`, label: f.shot?.type ?? 'shot' }))),
      (e) => setError(e.message),
    );
    getRaceStory(raceId).then(
      (s) => setBeats(s.beats),
      (e) => setError(e.message),
    );
  }, [raceId]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
      <div>
        <h2>Cinematic Control Room - {raceId}</h2>
        {error && <p role="alert">{error}</p>}
        <h3>Timeline</h3>
        {/* key remounts the list when frames load, since it keeps its own state */}
        <DraggableTimeline key={`${raceId}-${frames.length}`} initial={frames} />
        <h3 style={{ marginTop: 24 }}>Offline Director Mode</h3>
        <DirectorMode raceId={raceId} />
        <h3 style={{ marginTop: 24 }}>Race Story</h3>
        <ul>
          {beats.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
        <h3 style={{ marginTop: 24 }}>Cinematic Plan</h3>
        <CinematicAIAssistant raceId={raceId} />
        <h3 style={{ marginTop: 24 }}>Race Analytics</h3>
        <RaceAnalyticsPanel raceId={raceId} />
      </div>
      <div>
        <h3>Live Director Mode</h3>
        <LiveDirectorMode raceId={raceId} />
        <h3 style={{ marginTop: 24 }}>MP4 Export</h3>
        <Mp4ExportPanel raceId={raceId} />
        <h3 style={{ marginTop: 24 }}>Broadcast Automation</h3>
        <BroadcastAutomationPanel raceId={raceId} />
      </div>
    </div>
  );
}