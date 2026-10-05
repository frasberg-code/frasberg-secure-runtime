import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const VoiceChat = ({ 
  isActive, 
  onClose,
  onSendVoiceMessage,
  isProcessing = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Setup audio analyser for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Animate audio levels
      const updateLevel = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        if (onSendVoiceMessage) {
          await onSendVoiceMessage(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleMicToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-[#6b6b6b] hover:text-white transition-colors"
      >
        <PhoneOff className="h-6 w-6" />
      </button>

      {/* Voice Visualization */}
      <div className="relative mb-8">
        <div className={cn(
          "w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center transition-transform duration-150",
          isRecording && "scale-110"
        )}
        style={{
          transform: isRecording ? `scale(${1 + audioLevel * 0.3})` : 'scale(1)'
        }}>
          <div className="w-28 h-28 rounded-full bg-black/50 flex items-center justify-center">
            {isProcessing ? (
              <Loader2 className="h-12 w-12 text-white animate-spin" />
            ) : isSpeaking ? (
              <Volume2 className="h-12 w-12 text-white animate-pulse" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-12 h-12 text-white" fill="currentColor">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
              </svg>
            )}
          </div>
        </div>
        
        {/* Audio level rings */}
        {isRecording && (
          <>
            <div 
              className="absolute inset-0 rounded-full border-2 border-purple-500/50 animate-ping"
              style={{ animationDuration: '1.5s' }}
            />
            <div 
              className="absolute inset-0 rounded-full border border-purple-500/30"
              style={{ 
                transform: `scale(${1.2 + audioLevel * 0.5})`,
                transition: 'transform 0.1s ease-out'
              }}
            />
          </>
        )}
      </div>

      {/* Status Text */}
      <div className="text-center mb-8">
        <h2 className="text-white text-xl font-medium mb-2">
          {isProcessing ? 'Processing...' : isRecording ? 'Listening...' : isSpeaking ? 'Sofia is speaking...' : 'Tap to speak'}
        </h2>
        {transcript && (
          <p className="text-[#a0a0a0] text-sm max-w-md">{transcript}</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleMicToggle}
          disabled={isProcessing}
          className={cn(
            "w-16 h-16 rounded-full transition-all",
            isRecording 
              ? "bg-red-500 hover:bg-red-600" 
              : "bg-white hover:bg-gray-200"
          )}
        >
          {isRecording ? (
            <MicOff className="h-6 w-6 text-white" />
          ) : (
            <Mic className={cn("h-6 w-6", isRecording ? "text-white" : "text-black")} />
          )}
        </Button>

        <Button
          onClick={onClose}
          variant="outline"
          className="w-12 h-12 rounded-full border-[#3a3a3c] bg-transparent hover:bg-[#1a1a1c]"
        >
          <Phone className="h-5 w-5 text-red-400" />
        </Button>
      </div>

      {/* Hint */}
      <p className="absolute bottom-8 text-[#6b6b6b] text-sm">
        Press and hold to talk • Release to send
      </p>
    </div>
  );
};

export default VoiceChat;
