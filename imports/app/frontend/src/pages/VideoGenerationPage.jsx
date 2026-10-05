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
  ArrowLeft, Video, Play, Pause, Download, Loader2, Wand2, 
  Clock, Film, Sparkles, Settings2, RefreshCw, Eye
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VideoGenerationPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [settings, setSettings] = useState({
    duration: 5,
    aspectRatio: '16:9',
    quality: 'high',
    style: 'realistic'
  });

  // Style presets
  const styles = [
    { id: 'realistic', name: 'Realistic', icon: '🎬' },
    { id: 'cinematic', name: 'Cinematic', icon: '🎥' },
    { id: 'anime', name: 'Anime', icon: '🎨' },
    { id: 'abstract', name: 'Abstract', icon: '✨' },
    { id: '3d', name: '3D Render', icon: '💎' },
    { id: 'vintage', name: 'Vintage', icon: '📽️' },
  ];

  // Aspect ratios
  const aspectRatios = [
    { id: '16:9', name: 'Landscape (16:9)' },
    { id: '9:16', name: 'Portrait (9:16)' },
    { id: '1:1', name: 'Square (1:1)' },
    { id: '4:3', name: 'Classic (4:3)' },
  ];

  // Example prompts
  const examplePrompts = [
    "A serene sunset over ocean waves with golden light reflections",
    "Futuristic city skyline with flying cars at night",
    "A butterfly emerging from a chrysalis in slow motion",
    "Northern lights dancing over a snowy mountain landscape",
    "A cozy coffee shop interior with steam rising from cups",
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe the video you want to create');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const response = await fetch(`${API_URL}/api/video/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          duration: settings.duration,
          aspect_ratio: settings.aspectRatio,
          quality: settings.quality,
          style: settings.style
        })
      });
      
      if (!response.ok) throw new Error('Generation failed');
      
      const data = await response.json();
      
      const newVideo = {
        id: Date.now(),
        prompt: prompt,
        video_url: data.video_url,
        thumbnail: data.thumbnail,
        duration: settings.duration,
        aspect_ratio: settings.aspectRatio,
        style: settings.style,
        status: 'completed',
        created_at: new Date().toISOString()
      };
      
      setGeneratedVideos(prev => [newVideo, ...prev]);
      setSelectedVideo(newVideo);
      toast.success('Video generated successfully!');
      
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Video generation with Sora 2 is being configured. Please try again later.');
      
      // Add a placeholder for demo
      const demoVideo = {
        id: Date.now(),
        prompt: prompt,
        duration: settings.duration,
        aspect_ratio: settings.aspectRatio,
        style: settings.style,
        status: 'demo',
        created_at: new Date().toISOString()
      };
      setGeneratedVideos(prev => [demoVideo, ...prev]);
    } finally {
      setIsGenerating(false);
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
            Video Generation
          </h1>
          <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
            Powered by Sora 2
          </p>
        </div>
        <div className={cn("px-2 py-1 rounded text-xs", isDark ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-700")}>
          AI Video
        </div>
      </div>
      
      <div className="p-4 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Input */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prompt Input */}
            <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
              <CardHeader>
                <CardTitle className={isDark ? "text-white" : ""}>Create Video</CardTitle>
                <CardDescription>Describe your video in detail for best results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your video scene in detail... e.g., 'A slow motion shot of rain drops falling on a glass window with city lights reflecting in the background'"
                  rows={4}
                  className={cn(
                    "w-full p-3 rounded-lg border resize-none",
                    isDark ? "bg-[#1a1a1c] border-[#2a2a2c] text-white placeholder:text-[#6b6b6b]" : ""
                  )}
                />
                
                {/* Example Prompts */}
                <div>
                  <p className={cn("text-xs mb-2", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>Try an example:</p>
                  <div className="flex flex-wrap gap-2">
                    {examplePrompts.slice(0, 3).map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => setPrompt(ex)}
                        className={cn(
                          "text-xs px-2 py-1 rounded-full border transition-colors",
                          isDark 
                            ? "border-[#2a2a2c] text-[#a0a0a0] hover:border-purple-500 hover:text-purple-400"
                            : "border-gray-200 text-gray-600 hover:border-purple-500 hover:text-purple-600"
                        )}
                      >
                        {ex.slice(0, 40)}...
                      </button>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Video...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate with Sora 2
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            
            {/* Style Selection */}
            <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
              <CardHeader>
                <CardTitle className={isDark ? "text-white" : ""}>Style</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {styles.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSettings(prev => ({ ...prev, style: style.id }))}
                      className={cn(
                        "p-3 rounded-xl text-center transition-all",
                        settings.style === style.id
                          ? "bg-purple-500/20 border-2 border-purple-500"
                          : isDark ? "bg-[#1a1a1c] border-2 border-transparent" : "bg-gray-100 border-2 border-transparent"
                      )}
                    >
                      <span className="text-2xl block mb-1">{style.icon}</span>
                      <span className={cn("text-xs", isDark ? "text-white" : "")}>{style.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Generated Videos */}
            <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
              <CardHeader>
                <CardTitle className={isDark ? "text-white" : ""}>Generated Videos</CardTitle>
              </CardHeader>
              <CardContent>
                {generatedVideos.length === 0 ? (
                  <div className="text-center py-12">
                    <Film className={cn("h-16 w-16 mx-auto mb-4", isDark ? "text-[#3a3a3c]" : "text-gray-300")} />
                    <p className={isDark ? "text-[#6b6b6b]" : "text-gray-500"}>
                      No videos generated yet. Create your first video above!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {generatedVideos.map(video => (
                      <div
                        key={video.id}
                        onClick={() => setSelectedVideo(video)}
                        className={cn(
                          "relative aspect-video rounded-xl overflow-hidden cursor-pointer group",
                          selectedVideo?.id === video.id && "ring-2 ring-purple-500"
                        )}
                      >
                        <div className={cn(
                          "absolute inset-0 flex items-center justify-center",
                          isDark ? "bg-[#1a1a1c]" : "bg-gray-200"
                        )}>
                          <Video className="h-8 w-8 text-purple-500" />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="h-10 w-10 text-white" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-white text-xs truncate">{video.prompt}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-white/70">{video.duration}s</span>
                            <span className="text-[10px] text-white/70">•</span>
                            <span className="text-[10px] text-white/70">{video.style}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Settings & Preview */}
          <div className="space-y-4">
            {/* Settings */}
            <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
              <CardHeader>
                <CardTitle className={cn("text-sm flex items-center gap-2", isDark ? "text-white" : "")}>
                  <Settings2 className="h-4 w-4" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Duration */}
                <div>
                  <label className={cn("text-xs mb-2 block", isDark ? "text-[#a0a0a0]" : "text-gray-600")}>
                    Duration: {settings.duration}s
                  </label>
                  <Slider
                    value={[settings.duration]}
                    min={3}
                    max={60}
                    step={1}
                    onValueChange={([v]) => setSettings(prev => ({ ...prev, duration: v }))}
                  />
                </div>
                
                {/* Aspect Ratio */}
                <div>
                  <label className={cn("text-xs mb-2 block", isDark ? "text-[#a0a0a0]" : "text-gray-600")}>
                    Aspect Ratio
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {aspectRatios.map(ar => (
                      <button
                        key={ar.id}
                        onClick={() => setSettings(prev => ({ ...prev, aspectRatio: ar.id }))}
                        className={cn(
                          "text-xs p-2 rounded-lg border transition-colors",
                          settings.aspectRatio === ar.id
                            ? "bg-purple-500/20 border-purple-500 text-purple-400"
                            : isDark 
                              ? "border-[#2a2a2c] text-[#a0a0a0] hover:border-[#3a3a3c]"
                              : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {ar.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Quality */}
                <div>
                  <label className={cn("text-xs mb-2 block", isDark ? "text-[#a0a0a0]" : "text-gray-600")}>
                    Quality
                  </label>
                  <div className="flex gap-2">
                    {['standard', 'high', 'ultra'].map(q => (
                      <button
                        key={q}
                        onClick={() => setSettings(prev => ({ ...prev, quality: q }))}
                        className={cn(
                          "flex-1 text-xs p-2 rounded-lg border capitalize transition-colors",
                          settings.quality === q
                            ? "bg-purple-500/20 border-purple-500 text-purple-400"
                            : isDark
                              ? "border-[#2a2a2c] text-[#a0a0a0]"
                              : "border-gray-200"
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Preview */}
            {selectedVideo && (
              <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
                <CardHeader>
                  <CardTitle className={cn("text-sm", isDark ? "text-white" : "")}>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "aspect-video rounded-lg flex items-center justify-center mb-4",
                    isDark ? "bg-[#1a1a1c]" : "bg-gray-200"
                  )}>
                    <div className="text-center">
                      <Video className="h-12 w-12 mx-auto mb-2 text-purple-500" />
                      <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
                        {selectedVideo.status === 'demo' ? 'Demo Preview' : 'Click to play'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className={cn("text-sm", isDark ? "text-white" : "")}>{selectedVideo.prompt}</p>
                    <div className="flex gap-2">
                      <span className={cn("text-xs px-2 py-1 rounded", isDark ? "bg-[#1a1a1c] text-[#a0a0a0]" : "bg-gray-100")}>
                        {selectedVideo.duration}s
                      </span>
                      <span className={cn("text-xs px-2 py-1 rounded", isDark ? "bg-[#1a1a1c] text-[#a0a0a0]" : "bg-gray-100")}>
                        {selectedVideo.aspect_ratio}
                      </span>
                      <span className={cn("text-xs px-2 py-1 rounded capitalize", isDark ? "bg-[#1a1a1c] text-[#a0a0a0]" : "bg-gray-100")}>
                        {selectedVideo.style}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="flex-1">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button className="flex-1 bg-purple-600">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerationPage;
