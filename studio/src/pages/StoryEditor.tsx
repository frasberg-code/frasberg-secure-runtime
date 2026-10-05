import { useParams } from 'react-router-dom';
import RaceStoryEditor from '../components/RaceStoryEditor';

export default function StoryEditor() {
  const { raceId = '' } = useParams();
  return <RaceStoryEditor raceId={raceId} />;
}