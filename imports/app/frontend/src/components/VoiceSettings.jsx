import React, { useState, useEffect } from 'react';
import { Volume2, Mic, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const VOICES = [
  { id: 'sofia', name: 'Sofia', description: 'Default - Young, warm, expressive' },
  { id: 'shimmer', name: 'Shimmer', description: 'Soft and expressive feminine voice' },
  { id: 'nova', name: 'Nova', description: 'Friendly and upbeat' },
  { id: 'alloy', name: 'Alloy', description: 'Warm and professional' },
  { id: 'fable', name: 'Fable', description: 'British feminine accent' },
  { id: 'echo', name: 'Echo', description: 'Deep masculine voice' },
  { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
];

const VoiceSettings = ({ currentVoice, onVoiceChange, voiceSettings, onSettingsChange }) => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(voiceSettings || {
    speed: 1.0,
    pitch: 1.0,
    autoPlay: true,
  });

  const handleVoiceChange = (voiceId) => {
    onVoiceChange?.(voiceId);
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[#6b6b6b] hover:text-white hover:bg-[#1a1a1c]"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0f0f10] border-[#2a2a2c] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Voice Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Voice Selection */}
          <div className="space-y-2">
            <Label className="text-[#a0a0a0]">Sofia's Voice</Label>
            <Select value={currentVoice} onValueChange={handleVoiceChange}>
              <SelectTrigger className="bg-[#1a1a1c] border-[#2a2a2c]">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1c] border-[#2a2a2c]">
                {VOICES.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <div className="flex flex-col">
                      <span>{voice.name}</span>
                      <span className="text-xs text-[#6b6b6b]">{voice.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#6b6b6b]">
              You can ask Sofia to change her voice anytime during conversation
            </p>
          </div>

          {/* Speed Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[#a0a0a0]">Speaking Speed</Label>
              <span className="text-xs text-[#6b6b6b]">{settings.speed.toFixed(1)}x</span>
            </div>
            <Slider
              value={[settings.speed]}
              onValueChange={([v]) => handleSettingChange('speed', v)}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Pitch Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[#a0a0a0]">Voice Pitch</Label>
              <span className="text-xs text-[#6b6b6b]">{settings.pitch.toFixed(1)}x</span>
            </div>
            <Slider
              value={[settings.pitch]}
              onValueChange={([v]) => handleSettingChange('pitch', v)}
              min={0.5}
              max={1.5}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Auto-play toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Auto-play responses</Label>
              <p className="text-xs text-[#6b6b6b]">Automatically speak Sofia's responses</p>
            </div>
            <button
              onClick={() => handleSettingChange('autoPlay', !settings.autoPlay)}
              className={`w-10 h-6 rounded-full transition-colors ${
                settings.autoPlay ? 'bg-purple-500' : 'bg-[#2a2a2c]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${
                settings.autoPlay ? 'translate-x-4' : ''
              }`} />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceSettings;
