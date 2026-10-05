import { useParams } from 'react-router-dom';
import TimelineEditor from '../components/TimelineEditor';
import { BroadcastModePanel } from '../components/BroadcastModePanel';
import { getToken } from '../lib/session';

export default function RaceReplay() {
  const { raceId = '' } = useParams();
  return (
    <div>
      <h2>Race Replay</h2>
      <BroadcastModePanel raceId={raceId} apiKey={getToken() ?? undefined} />
      <TimelineEditor raceId={raceId} />
    </div>
  );
}