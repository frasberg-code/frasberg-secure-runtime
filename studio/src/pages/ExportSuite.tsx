import { useParams } from 'react-router-dom';
import Mp4ExportPanel from '../components/Mp4ExportPanel';
import DirectorMode from '../components/DirectorMode';

export default function ExportSuite() {
  const { raceId = '' } = useParams();
  return (
    <div>
      <h2>Cinematic Export Suite</h2>
      <Mp4ExportPanel raceId={raceId} />
      <DirectorMode raceId={raceId} />
    </div>
  );
}