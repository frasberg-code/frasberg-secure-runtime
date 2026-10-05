import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, Radio, Play, Pause, Mic, MicOff, Volume2, 
  Music, Headphones, Users, Settings, Wifi, Upload, Disc,
  SkipBack, SkipForward, Shuffle, Repeat, ListMusic
} from 'lucide-react';

const BroadcastStudioPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [isLive, setIsLive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [volume, setVolume] = useState(75);
  const [crossfade, setCrossfade] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('mixer');
  
  // Mock playlist
  const playlist = [
    { id: 1, title: 'Summer Vibes', artist: 'Sofia Mix', duration: '3:45', bpm: 128 },
    { id: 2, title: 'Night Groove', artist: 'Sofia Mix', duration: '4:12', bpm: 125 },
    { id: 3, title: 'Reggae Sunset', artist: 'Sofia Mix', duration: '5:30', bpm: 90 },
    { id: 4, title: 'Dance Floor', artist: 'Sofia Mix', duration: '4:00', bpm: 130 },
  ];

  // Mock listeners
  const listenerCount = 1247;

  const goLive = () => {
    setIsLive(!isLive);
    if (!isLive) {
      toast.success('You are now LIVE! Broadcasting to listeners.');
    } else {
      toast.info('Broadcast ended.');
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
            Broadcast Studio
          </h1>
          <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
            DJ Software Integration
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isLive && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-500 font-medium">LIVE</span>
              <span className={cn("text-sm", isDark ? "text-[#a0a0a0]" : "text-gray-600")}>
                {listenerCount.toLocaleString()} listeners
              </span>
            </div>
          )}
          <Button
            onClick={goLive}
            className={isLive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
          >
            <Radio className="h-4 w-4 mr-2" />
            {isLive ? 'End Broadcast' : 'Go Live'}
          </Button>
        </div>
      </div>
      
      <div className="p-4 max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'mixer', label: 'Mixer', icon: Settings },
            { id: 'playlist', label: 'Playlist', icon: ListMusic },
            { id: 'effects', label: 'Effects', icon: Disc },
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'bg-purple-600' : ''}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>
        
        {activeTab === 'mixer' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Deck A */}
            <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", isDark ? "text-white" : "")}>
                  <Disc className="h-5 w-5 text-purple-500" />
                  Deck A
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Turntable Visual */}
                <div className={cn(
                  "aspect-square rounded-full flex items-center justify-center relative",
                  isDark ? "bg-[#1a1a1c]" : "bg-gray-200"
                )}>
                  <div className={cn(
                    "w-3/4 h-3/4 rounded-full flex items-center justify-center",
                    isDark ? "bg-[#2a2a2c]" : "bg-gray-300",
                    isPlaying && "animate-spin"
                  )} style={{ animationDuration: '3s' }}>
                    <div className={cn("w-8 h-8 rounded-full", isDark ? "bg-[#3a3a3c]" : "bg-gray-400")} />
                  </div>
                </div>
                
                {/* Track Info */}
                <div className="text-center">
                  <p className={cn("font-medium", isDark ? "text-white" : "")}>Summer Vibes</p>
                  <p className={cn("text-sm", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>128 BPM</p>
                </div>
                
                {/* Controls */}
                <div className="flex justify-center gap-2">
                  <Button size="icon" variant="outline">
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="outline">
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Volume */}
                <div className="space-y-2">
                  <label className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>Volume</label>
                  <Slider value={[volume]} max={100} onValueChange={([v]) => setVolume(v)} />
                </div>
              </CardContent>
            </Card>
            
            {/* Crossfader & Master */}
            <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
              <CardHeader>
                <CardTitle className={cn("text-center", isDark ? "text-white" : "")}>Master Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Microphone */}
                <div className="text-center">
                  <Button
                    size="lg"
                    onClick={() => setIsMicOn(!isMicOn)}
                    className={cn("rounded-full h-16 w-16", isMicOn ? "bg-red-600" : "bg-[#2a2a2c]")}
                  >
                    {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                  </Button>
                  <p className={cn("text-sm mt-2", isDark ? "text-[#a0a0a0]" : "text-gray-600")}>
                    {isMicOn ? 'Mic ON' : 'Mic OFF'}
                  </p>
                </div>
                
                {/* Crossfader */}
                <div className="space-y-2">
                  <label className={cn("text-xs block text-center", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
                    Crossfader
                  </label>
                  <Slider value={[crossfade]} max={100} onValueChange={([v]) => setCrossfade(v)} />
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? "text-purple-400" : "text-purple-600"}>A</span>
                    <span className={isDark ? "text-blue-400" : "text-blue-600"}>B</span>
                  </div>
                </div>
                
                {/* Master Volume */}
                <div className="space-y-2">
                  <label className={cn("text-xs block text-center", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
                    Master Volume
                  </label>
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-4 w-4 text-purple-500" />
                    <Slider value={[75]} max={100} className="flex-1" />
                  </div>
                </div>
                
                {/* VU Meters */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={cn("text-xs text-center mb-2", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>L</p>
                    <div className="h-24 flex items-end justify-center gap-1">
                      {[60, 75, 85, 95, 85, 70].map((h, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-2 rounded-t transition-all",
                            h > 90 ? "bg-red-500" : h > 70 ? "bg-yellow-500" : "bg-green-500"
                          )}
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className={cn("text-xs text-center mb-2", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>R</p>
                    <div className="h-24 flex items-end justify-center gap-1">
                      {[55, 70, 80, 90, 80, 65].map((h, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-2 rounded-t transition-all",
                            h > 90 ? "bg-red-500" : h > 70 ? "bg-yellow-500" : "bg-green-500"
                          )}
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Broadcast Info */}
                {isLive && (
                  <div className={cn("p-3 rounded-lg text-center", isDark ? "bg-red-500/10" : "bg-red-50")}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Wifi className="h-4 w-4 text-red-500" />
                      <span className="text-red-500 font-medium">Broadcasting</span>
                    </div>
                    <p className={cn("text-xs", isDark ? "text-[#a0a0a0]" : "text-gray-600")}>
                      {listenerCount.toLocaleString()} listeners connected
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Deck B */}
            <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", isDark ? "text-white" : "")}>
                  <Disc className="h-5 w-5 text-blue-500" />
                  Deck B
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Turntable Visual */}
                <div className={cn(
                  "aspect-square rounded-full flex items-center justify-center",
                  isDark ? "bg-[#1a1a1c]" : "bg-gray-200"
                )}>
                  <div className={cn(
                    "w-3/4 h-3/4 rounded-full flex items-center justify-center",
                    isDark ? "bg-[#2a2a2c]" : "bg-gray-300"
                  )}>
                    <div className={cn("w-8 h-8 rounded-full", isDark ? "bg-[#3a3a3c]" : "bg-gray-400")} />
                  </div>
                </div>
                
                {/* Track Info */}
                <div className="text-center">
                  <p className={cn("font-medium", isDark ? "text-white" : "")}>Night Groove</p>
                  <p className={cn("text-sm", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>125 BPM</p>
                </div>
                
                {/* Controls */}
                <div className="flex justify-center gap-2">
                  <Button size="icon" variant="outline">
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Volume */}
                <div className="space-y-2">
                  <label className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>Volume</label>
                  <Slider value={[65]} max={100} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {activeTab === 'playlist' && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
              <CardHeader>
                <CardTitle className={isDark ? "text-white" : ""}>Your Playlist</CardTitle>
                <CardDescription>Drag tracks to reorder</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {playlist.map((track, i) => (
                    <div
                      key={track.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        isDark ? "bg-[#1a1a1c] hover:bg-[#252527]" : "bg-gray-100 hover:bg-gray-200"
                      )}
                    >
                      <span className={cn("text-sm w-6", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>{i + 1}</span>
                      <Music className="h-4 w-4 text-purple-500" />
                      <div className="flex-1">
                        <p className={cn("text-sm font-medium", isDark ? "text-white" : "")}>{track.title}</p>
                        <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>{track.artist}</p>
                      </div>
                      <span className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>{track.bpm} BPM</span>
                      <span className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>{track.duration}</span>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  <Upload className="h-4 w-4 mr-2" />
                  Add Tracks
                </Button>
              </CardContent>
            </Card>
            
            <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
              <CardHeader>
                <CardTitle className={isDark ? "text-white" : ""}>Connect DJ Software</CardTitle>
                <CardDescription>Link with Virtual DJ, Serato, or rekordbox</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'Virtual DJ', status: 'Not connected' },
                  { name: 'Serato DJ', status: 'Not connected' },
                  { name: 'rekordbox', status: 'Not connected' },
                  { name: 'Traktor', status: 'Not connected' },
                ].map(software => (
                  <div
                    key={software.name}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg",
                      isDark ? "bg-[#1a1a1c]" : "bg-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Headphones className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className={cn("font-medium", isDark ? "text-white" : "")}>{software.name}</p>
                        <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>{software.status}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
        
        {activeTab === 'effects' && (
          <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
            <CardHeader>
              <CardTitle className={isDark ? "text-white" : ""}>Audio Effects</CardTitle>
              <CardDescription>Apply real-time effects to your mix</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: 'Echo', value: 30 },
                  { name: 'Reverb', value: 45 },
                  { name: 'Flanger', value: 0 },
                  { name: 'Phaser', value: 20 },
                  { name: 'Filter', value: 50 },
                  { name: 'Delay', value: 25 },
                ].map(effect => (
                  <div key={effect.name} className={cn("p-4 rounded-lg", isDark ? "bg-[#1a1a1c]" : "bg-gray-100")}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={cn("font-medium", isDark ? "text-white" : "")}>{effect.name}</span>
                      <span className={cn("text-sm", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>{effect.value}%</span>
                    </div>
                    <Slider value={[effect.value]} max={100} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BroadcastStudioPage;
