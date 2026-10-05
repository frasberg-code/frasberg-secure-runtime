import { useCallback, useRef, useState } from 'react';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';

Sound.setCategory('Playback');

export function useMobileVoice() {
  const soundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = useCallback(async (base64Audio, format = 'mp3') => {
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.release();
    }
    const path = `${RNFS.CachesDirectoryPath}/luchii_voice_${Date.now()}.${format}`;
    await RNFS.writeFile(path, base64Audio, 'base64');
    const sound = new Sound(path, '', (error) => {
      if (error) {
        console.error('Sound load error:', error);
        return;
      }
      soundRef.current = sound;
      setIsPlaying(true);
      sound.play(() => {
        setIsPlaying(false);
        sound.release();
        RNFS.unlink(path).catch(() => {});
      });
    });
  }, []);

  const stopAudio = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.stop();
      setIsPlaying(false);
    }
  }, []);

  return { playAudio, stopAudio, isPlaying };
}
