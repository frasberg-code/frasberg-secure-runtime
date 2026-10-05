import { useEffect, useState } from 'react';
import { getRaceStory, saveRaceStory } from '../lib/api';

export default function RaceStoryEditor({ raceId }: { raceId: string }) {
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    getRaceStory(raceId).then(
      (s) => setText(s.beats.join('\n')),
      (e) => setMessage(e.message),
    );
  }, [raceId]);

  async function save() {
    try {
      await saveRaceStory(raceId, text.split('\n'));
      setMessage('Saved');
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  return (
    <div>
      <h3>Race Story - {raceId}</h3>
      <textarea rows={10} cols={80} value={text} onChange={(e) => setText(e.target.value)} />
      <br />
      <button onClick={save}>Save</button>
      {message && <p>{message}</p>}
    </div>
  );
}