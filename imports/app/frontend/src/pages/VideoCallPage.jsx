import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, Video, VideoOff, Mic, MicOff, Phone, PhoneOff,
  MonitorUp, Users, Settings, Copy, Link2, Loader2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VideoCallPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [callState, setCallState] = useState('idle'); // idle, joining, in-call
  const [roomUrl, setRoomUrl] = useState('');
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callFrameRef = useRef(null);
  const localStreamRef = useRef(null);

  // Initialize local video preview
  useEffect(() => {
    const initLocalVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Failed to access media devices:', error);
        toast.error('Please allow camera and microphone access');
      }
    };
    
    initLocalVideo();
    
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const createRoom = async () => {
    if (!userName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    setCallState('joining');
    
    try {
      const response = await fetch(`${API_URL}/api/calls/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_name: `sofia-call-${Date.now()}`,
          participant_name: userName,
          privacy: 'public'
        })
      });
      
      if (!response.ok) throw new Error('Failed to create room');
      
      const data = await response.json();
      setRoomUrl(data.room_url);
      setRoomName(data.room_name);
      setCallState('in-call');
      
      // Copy room URL to clipboard
      await navigator.clipboard.writeText(data.room_url);
      toast.success('Room created! URL copied to clipboard');
      
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room');
      setCallState('idle');
    }
  };

  const joinRoom = async () => {
    if (!userName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!roomUrl.trim()) {
      toast.error('Please enter a room URL');
      return;
    }
    
    setCallState('joining');
    
    try {
      // Extract room name from URL
      const urlParts = roomUrl.split('/');
      const extractedRoomName = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
      
      const response = await fetch(`${API_URL}/api/calls/rooms/${extractedRoomName}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant_name: userName })
      });
      
      if (!response.ok) throw new Error('Failed to join room');
      
      const data = await response.json();
      setRoomName(data.room_name);
      setCallState('in-call');
      toast.success('Joined room successfully!');
      
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room');
      setCallState('idle');
    }
  };

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      toast.info('Screen sharing stopped');
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        setIsScreenSharing(true);
        toast.success('Screen sharing started');
        
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          toast.info('Screen sharing ended');
        };
      } catch (error) {
        console.error('Screen share error:', error);
        toast.error('Failed to start screen sharing');
      }
    }
  }, [isScreenSharing]);

  const endCall = useCallback(async () => {
    try {
      if (roomName) {
        await fetch(`${API_URL}/api/calls/rooms/${roomName}/end`, {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
    
    setCallState('idle');
    setRoomUrl('');
    setRoomName('');
    setParticipants([]);
    toast.info('Call ended');
  }, [roomName]);

  const copyRoomLink = async () => {
    if (roomUrl) {
      await navigator.clipboard.writeText(roomUrl);
      toast.success('Room link copied!');
    }
  };

  return (
    <div className={cn("min-h-screen", isDark ? "bg-[#0a0a0b]" : "bg-gray-50")}>
      {/* Header */}
      <div className={cn("border-b px-4 py-3 flex items-center gap-4", isDark ? "border-[#1a1a1c]" : "border-gray-200")}>
        <Button variant="ghost" size="icon" onClick={() => navigate('/chat')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className={cn("text-xl font-semibold", isDark ? "text-white" : "text-gray-900")}>
            Video Calling
          </h1>
          <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
            Connect with Sofia or invite others
          </p>
        </div>
        {callState === 'in-call' && (
          <Button variant="outline" size="sm" onClick={copyRoomLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        )}
      </div>
      
      <div className="p-4 max-w-6xl mx-auto">
        {callState === 'idle' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Create New Call */}
            <Card className={cn("", isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : "")}>
              <CardHeader>
                <CardTitle className={isDark ? "text-white" : ""}>Start a Call</CardTitle>
                <CardDescription>Create a new video call room</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className={isDark ? "bg-[#1a1a1c] border-[#2a2a2c] text-white" : ""}
                />
                <Button onClick={createRoom} className="w-full bg-purple-600 hover:bg-purple-700">
                  <Video className="h-4 w-4 mr-2" />
                  Start New Call
                </Button>
              </CardContent>
            </Card>
            
            {/* Join Existing Call */}
            <Card className={cn("", isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : "")}>
              <CardHeader>
                <CardTitle className={isDark ? "text-white" : ""}>Join a Call</CardTitle>
                <CardDescription>Enter a room URL to join</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className={isDark ? "bg-[#1a1a1c] border-[#2a2a2c] text-white" : ""}
                />
                <Input
                  placeholder="Room URL"
                  value={roomUrl}
                  onChange={(e) => setRoomUrl(e.target.value)}
                  className={isDark ? "bg-[#1a1a1c] border-[#2a2a2c] text-white" : ""}
                />
                <Button onClick={joinRoom} variant="outline" className="w-full">
                  <Link2 className="h-4 w-4 mr-2" />
                  Join Call
                </Button>
              </CardContent>
            </Card>
            
            {/* Video Preview */}
            <Card className={cn("md:col-span-2", isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : "")}>
              <CardHeader>
                <CardTitle className={isDark ? "text-white" : ""}>Camera Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden max-w-md mx-auto">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!isVideoOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1c]">
                      <VideoOff className="h-12 w-12 text-[#6b6b6b]" />
                    </div>
                  )}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    <Button
                      size="sm"
                      variant={isVideoOn ? 'secondary' : 'destructive'}
                      onClick={toggleVideo}
                    >
                      {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant={isAudioOn ? 'secondary' : 'destructive'}
                      onClick={toggleAudio}
                    >
                      {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {callState === 'joining' && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
            <p className={cn("text-lg", isDark ? "text-white" : "text-gray-900")}>Connecting...</p>
          </div>
        )}
        
        {callState === 'in-call' && (
          <div className="space-y-4">
            {/* Room Info */}
            <Card className={cn("", isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : "")}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className={isDark ? "text-white" : ""}>In Call: {roomName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#6b6b6b]" />
                  <span className={cn("text-sm", isDark ? "text-[#a0a0a0]" : "text-gray-600")}>
                    {participants.length + 1} participant(s)
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Video Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Local Video */}
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!isVideoOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1c]">
                    <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{userName?.[0]?.toUpperCase() || 'Y'}</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-white text-sm">
                  You
                </div>
              </div>
              
              {/* Remote/Sofia Video */}
              <div className="relative aspect-video bg-[#1a1a1c] rounded-xl overflow-hidden flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-3 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">S</span>
                  </div>
                  <p className={isDark ? "text-white" : ""}>Sofia</p>
                  <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
                    Waiting to connect...
                  </p>
                </div>
              </div>
            </div>
            
            {/* Call Controls */}
            <div className={cn(
              "flex items-center justify-center gap-3 py-4 rounded-xl",
              isDark ? "bg-[#0f0f10]" : "bg-gray-100"
            )}>
              <Button
                size="lg"
                variant={isAudioOn ? 'secondary' : 'destructive'}
                onClick={toggleAudio}
                className="rounded-full h-14 w-14"
              >
                {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
              
              <Button
                size="lg"
                variant={isVideoOn ? 'secondary' : 'destructive'}
                onClick={toggleVideo}
                className="rounded-full h-14 w-14"
              >
                {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
              
              <Button
                size="lg"
                variant={isScreenSharing ? 'default' : 'secondary'}
                onClick={toggleScreenShare}
                className={cn("rounded-full h-14 w-14", isScreenSharing && "bg-purple-600")}
              >
                <MonitorUp className="h-5 w-5" />
              </Button>
              
              <Button
                size="lg"
                variant="destructive"
                onClick={endCall}
                className="rounded-full h-14 w-14"
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCallPage;
