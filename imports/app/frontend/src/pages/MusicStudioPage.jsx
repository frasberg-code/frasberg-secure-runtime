import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, Music, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Download, Loader2, Wand2, Search, Heart, Plus, ListMusic, Shuffle, Repeat
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MusicStudioPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [activeTab, setActiveTab] = useState('generate');
  const [prompt, setPrompt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [generatedTracks, setGeneratedTracks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  
  const audioRef = useRef(null);

  // Genre presets for quick generation
  const genres = [
    { id: 'reggae', name: 'Reggae', icon: '🎺', color: 'bg-green-500' },
    { id: 'dancehall', name: 'Dancehall', icon: '🔥', color: 'bg-orange-500' },
    { id: 'hiphop', name: 'Hip-Hop', icon: '🎤', color: 'bg-purple-500' },
    { id: 'edm', name: 'EDM', icon: '🎧', color: 'bg-blue-500' },
    { id: 'jazz', name: 'Jazz', icon: '🎷', color: 'bg-yellow-500' },
    { id: 'classical', name: 'Classical', icon: '🎻', color: 'bg-pink-500' },
  ];

  // Sample generated tracks (would come from backend in production)
  const sampleTracks = [
    { id: 1, title: 'Summer Vibes', genre: 'Reggae', duration: 180, bpm: 90 },
    { id: 2, title: 'Night Drive', genre: 'EDM', duration: 240, bpm: 128 },
    { id: 3, title: 'Chill Beats', genre: 'Hip-Hop', duration: 200, bpm: 85 },
  ];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe the music you want to create');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const response = await fetch(`${API_URL}/api/music/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, duration: 30 })
      });
      
      if (!response.ok) throw new Error('Generation failed');
      
      const data = await response.json();
      
      const newTrack = {
        id: Date.now(),
        title: prompt.slice(0, 30),
        genre: 'AI Generated',
        duration: 30,
        bpm: data.bpm || 120,
        audio_url: data.audio_url,
        created_at: new Date().toISOString()
      };
      
      setGeneratedTracks(prev => [newTrack, ...prev]);
      setCurrentTrack(newTrack);
      toast.success('Music generated successfully!');
      
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Music generation is being set up. Please try again later.');
      
      // Add a placeholder track for demo
      const demoTrack = {
        id: Date.now(),
        title: prompt.slice(0, 30) || 'Generated Track',
        genre: 'AI Demo',
        duration: 30,
        bpm: 120,
        created_at: new Date().toISOString()
      };
      setGeneratedTracks(prev => [demoTrack, ...prev]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenreClick = (genre) => {
    setPrompt(`Create a ${genre.name.toLowerCase()} instrumental beat with ${genre.name === 'Dancehall' ? 'Sean Paul style' : 'professional'} production`);
    toast.info(`Selected ${genre.name} - customize your prompt and generate!`);
  };

  const togglePlay = () => {
    if (!currentTrack) {
      toast.error('Select a track to play');
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const toggleFavorite = (track) => {
    const isFavorite = favorites.some(f => f.id === track.id);
    if (isFavorite) {
      setFavorites(prev => prev.filter(f => f.id !== track.id));
      toast.info('Removed from favorites');
    } else {
      setFavorites(prev => [...prev, track]);
      toast.success('Added to favorites');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            Music Studio
          </h1>
          <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
            Generate and play music with AI
          </p>
        </div>
      </div>
      
      <div className="p-4 max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'generate', label: 'Generate', icon: Wand2 },
            { id: 'library', label: 'Library', icon: ListMusic },
            { id: 'favorites', label: 'Favorites', icon: Heart },
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
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'generate' && (
              <>
                {/* Genre Presets */}
                <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
                  <CardHeader>
                    <CardTitle className={isDark ? "text-white" : ""}>Quick Genres</CardTitle>
                    <CardDescription>Click to start with a genre preset</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {genres.map(genre => (
                        <button
                          key={genre.id}
                          onClick={() => handleGenreClick(genre)}
                          className={cn(
                            "p-4 rounded-xl text-center transition-all hover:scale-105",
                            isDark ? "bg-[#1a1a1c] hover:bg-[#252527]" : "bg-gray-100 hover:bg-gray-200"
                          )}
                        >
                          <span className="text-2xl block mb-1">{genre.icon}</span>
                          <span className={cn("text-xs font-medium", isDark ? "text-white" : "")}>{genre.name}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Generation Input */}
                <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
                  <CardHeader>
                    <CardTitle className={isDark ? "text-white" : ""}>Create Music</CardTitle>
                    <CardDescription>Describe the music you want Sofia to generate</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your music... e.g., 'A chill reggae beat with summer vibes, 90 BPM, perfect for a beach sunset'"
                      rows={3}
                      className={cn(
                        "w-full p-3 rounded-lg border resize-none",
                        isDark ? "bg-[#1a1a1c] border-[#2a2a2c] text-white placeholder:text-[#6b6b6b]" : ""
                      )}
                    />
                    <Button 
                      onClick={handleGenerate} 
                      disabled={isGenerating}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generate Music
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
            
            {(activeTab === 'library' || activeTab === 'generate') && (
              <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
                <CardHeader>
                  <CardTitle className={isDark ? "text-white" : ""}>
                    {activeTab === 'generate' ? 'Recent Generations' : 'Your Library'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedTracks.length === 0 ? (
                    <div className="text-center py-8">
                      <Music className={cn("h-12 w-12 mx-auto mb-3", isDark ? "text-[#3a3a3c]" : "text-gray-300")} />
                      <p className={isDark ? "text-[#6b6b6b]" : "text-gray-500"}>
                        No tracks yet. Generate some music!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {generatedTracks.map(track => (
                        <div
                          key={track.id}
                          onClick={() => setCurrentTrack(track)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                            currentTrack?.id === track.id
                              ? "bg-purple-500/20 border border-purple-500/50"
                              : isDark ? "hover:bg-[#1a1a1c]" : "hover:bg-gray-100"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded flex items-center justify-center",
                            isDark ? "bg-[#1a1a1c]" : "bg-gray-200"
                          )}>
                            <Music className="h-5 w-5 text-purple-500" />
                          </div>
                          <div className="flex-1">
                            <p className={cn("font-medium", isDark ? "text-white" : "")}>{track.title}</p>
                            <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
                              {track.genre} • {track.bpm} BPM
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(track); }}
                          >
                            <Heart className={cn("h-4 w-4", favorites.some(f => f.id === track.id) && "fill-red-500 text-red-500")} />
                          </Button>
                          <span className={cn("text-sm", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
                            {formatTime(track.duration)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {activeTab === 'favorites' && (
              <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
                <CardHeader>
                  <CardTitle className={isDark ? "text-white" : ""}>Favorites</CardTitle>
                </CardHeader>
                <CardContent>
                  {favorites.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className={cn("h-12 w-12 mx-auto mb-3", isDark ? "text-[#3a3a3c]" : "text-gray-300")} />
                      <p className={isDark ? "text-[#6b6b6b]" : "text-gray-500"}>
                        No favorites yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {favorites.map(track => (
                        <div
                          key={track.id}
                          onClick={() => setCurrentTrack(track)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer",
                            isDark ? "hover:bg-[#1a1a1c]" : "hover:bg-gray-100"
                          )}
                        >
                          <Music className="h-5 w-5 text-purple-500" />
                          <div className="flex-1">
                            <p className={cn("font-medium", isDark ? "text-white" : "")}>{track.title}</p>
                            <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>{track.genre}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Player Sidebar */}
          <div className="space-y-4">
            <Card className={cn("sticky top-4", isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : "")}>
              <CardContent className="p-6">
                {/* Album Art */}
                <div className={cn(
                  "aspect-square rounded-xl mb-4 flex items-center justify-center",
                  isDark ? "bg-gradient-to-br from-purple-900 to-pink-900" : "bg-gradient-to-br from-purple-200 to-pink-200"
                )}>
                  <Music className={cn("h-20 w-20", isDark ? "text-white/30" : "text-purple-500/50")} />
                </div>
                
                {/* Track Info */}
                <div className="text-center mb-4">
                  <h3 className={cn("font-semibold", isDark ? "text-white" : "")}>
                    {currentTrack?.title || 'No track selected'}
                  </h3>
                  <p className={cn("text-sm", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
                    {currentTrack?.genre || 'Select a track to play'}
                  </p>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <Slider
                    value={[currentTime]}
                    max={currentTrack?.duration || 100}
                    step={1}
                    onValueChange={([v]) => setCurrentTime(v)}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? "text-[#6b6b6b]" : "text-gray-500"}>{formatTime(currentTime)}</span>
                    <span className={isDark ? "text-[#6b6b6b]" : "text-gray-500"}>{formatTime(currentTrack?.duration || 0)}</span>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Button size="icon" variant="ghost">
                    <Shuffle className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={togglePlay}
                    className="h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                  </Button>
                  <Button size="icon" variant="ghost">
                    <SkipForward className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Repeat className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Volume */}
                <div className="flex items-center gap-3">
                  <Button size="icon" variant="ghost" onClick={() => setVolume(volume === 0 ? 80 : 0)}>
                    {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Slider
                    value={[volume]}
                    max={100}
                    onValueChange={([v]) => setVolume(v)}
                    className="flex-1"
                  />
                </div>
                
                {/* Download */}
                {currentTrack && (
                  <Button variant="outline" className="w-full mt-4">
                    <Download className="h-4 w-4 mr-2" />
                    Download MP3
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicStudioPage;
