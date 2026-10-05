import React, { useState, useRef } from 'react';
import { 
  Paperclip, Search, BookOpen, Image, Video, Music, Mic, ArrowUp, 
  MicOff, X, FileText, File as FileIcon, ChevronDown, Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

// Mode definitions - Copilot-style
const MODES = {
  ATTACH: 'attach',
  SEARCH: 'search',
  STUDY: 'study',
  IMAGE: 'create-image',
  VIDEO: 'video',
  MUSIC: 'music',
};

const modeOptions = [
  { id: MODES.ATTACH, label: 'Attach', icon: Paperclip, description: 'Upload files' },
  { id: MODES.SEARCH, label: 'Search', icon: Search, description: 'Web search' },
  { id: MODES.STUDY, label: 'Study', icon: BookOpen, description: 'Research mode' },
  { id: MODES.IMAGE, label: 'Create image', icon: Image, description: 'Generate images' },
  { id: MODES.VIDEO, label: 'Video', icon: Video, description: 'Video creation' },
  { id: MODES.MUSIC, label: 'Music', icon: Music, description: 'Audio generation' },
];

const ChatInput = ({ 
  onSendMessage, 
  onVoiceStart, 
  onVoiceStop, 
  isRecording = false,
  isLoading = false,
  disabled = false,
  attachedFiles = [],
  onFilesSelected,
  onRemoveFile,
  theme = 'dark'
}) => {
  const [message, setMessage] = useState('');
  const [selectedMode, setSelectedMode] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const isDark = theme === 'dark';

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((message.trim() || attachedFiles.length > 0) && !isLoading && !disabled) {
      // Prepend mode context if selected
      let finalMessage = message.trim();
      if (selectedMode && selectedMode !== MODES.ATTACH) {
        const modeContext = {
          [MODES.SEARCH]: '[Search] ',
          [MODES.STUDY]: '[Study Mode] ',
          [MODES.IMAGE]: '[Create Image] ',
          [MODES.VIDEO]: '[Video] ',
          [MODES.MUSIC]: '[Music] ',
        };
        if (modeContext[selectedMode]) {
          finalMessage = modeContext[selectedMode] + finalMessage;
        }
      }
      onSendMessage(finalMessage);
      setMessage('');
      setSelectedMode(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      onVoiceStop?.();
    } else {
      onVoiceStart?.();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`File type not supported: ${file.name}`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File too large: ${file.name} (max 10MB)`);
        return false;
      }
      return true;
    });
    
    if (files.length > 0 && onFilesSelected) {
      onFilesSelected(files);
    }
    e.target.value = '';
    setSelectedMode(null);
  };

  const handleModeSelect = (mode) => {
    if (mode === MODES.ATTACH) {
      fileInputRef.current?.click();
    } else {
      setSelectedMode(mode);
      // Set placeholder/prefix based on mode
      const prefixes = {
        [MODES.SEARCH]: 'Search for: ',
        [MODES.STUDY]: 'Research topic: ',
        [MODES.IMAGE]: 'Create an image of: ',
        [MODES.VIDEO]: 'Generate video: ',
        [MODES.MUSIC]: 'Create music: ',
      };
      if (prefixes[mode] && !message) {
        setMessage(prefixes[mode]);
        textareaRef.current?.focus();
      } else {
        textareaRef.current?.focus();
      }
      toast.info(`${modeOptions.find(m => m.id === mode)?.label} mode activated`);
    }
  };

  const getFileIcon = (file) => {
    if (file.type?.startsWith('image/')) return <Image className="h-3 w-3" />;
    if (file.type === 'application/pdf') return <FileText className="h-3 w-3 text-red-400" />;
    if (file.type?.includes('word')) return <FileText className="h-3 w-3 text-blue-400" />;
    return <FileIcon className="h-3 w-3" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const currentModeInfo = selectedMode ? modeOptions.find(m => m.id === selectedMode) : null;

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Attached Files */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachedFiles.map((file, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
                isDark ? "bg-[#1a1a1c] border-[#2a2a2c]" : "bg-gray-100 border-gray-200"
              )}
            >
              {getFileIcon(file)}
              <span className={cn("text-xs truncate max-w-[120px]", isDark ? "text-white" : "text-gray-900")}>
                {file.name}
              </span>
              <span className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
                {formatFileSize(file.size)}
              </span>
              <button
                onClick={() => onRemoveFile?.(index)}
                className={cn(
                  "transition-colors",
                  isDark ? "text-[#6b6b6b] hover:text-red-400" : "text-gray-400 hover:text-red-500"
                )}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Active Mode Indicator */}
      {currentModeInfo && (
        <div className={cn(
          "flex items-center gap-2 mb-2 px-3 py-2 rounded-lg border",
          isDark 
            ? "bg-purple-500/10 border-purple-500/30 text-purple-400" 
            : "bg-purple-50 border-purple-200 text-purple-600"
        )}>
          <currentModeInfo.icon className="h-4 w-4" />
          <span className="text-sm font-medium">{currentModeInfo.label} Mode</span>
          <button 
            onClick={() => setSelectedMode(null)}
            className="ml-auto hover:text-purple-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Copilot-Style Input Area with Embedded Dropdown */}
      <form onSubmit={handleSubmit} className="relative">
        <div className={cn(
          "relative rounded-2xl border transition-all sofia-input-container",
          isDark 
            ? "bg-[#0d0d0d] border-[#2a2a2c] focus-within:border-[#3a3a3c] focus-within:shadow-[0_0_0_2px_rgba(139,92,246,0.15)]"
            : "bg-white border-gray-200 focus-within:border-gray-400 focus-within:shadow-[0_0_0_2px_rgba(139,92,246,0.1)]"
        )}>
          {/* Top row: Dropdown + Input */}
          <div className="flex items-start">
            {/* Mode Dropdown - Copilot Style */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 px-3 py-3 text-sm font-medium transition-colors border-r flex-shrink-0",
                    isDark 
                      ? "text-[#a0a0a0] hover:text-white border-[#2a2a2c] hover:bg-[#1a1a1c]"
                      : "text-gray-500 hover:text-gray-900 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <Wand2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Actions</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className={cn(
                  "w-56",
                  isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : "bg-white border-gray-200"
                )}
              >
                {modeOptions.map((mode, index) => (
                  <React.Fragment key={mode.id}>
                    <DropdownMenuItem
                      onClick={() => handleModeSelect(mode.id)}
                      className={cn(
                        "flex items-center gap-3 py-2.5 cursor-pointer",
                        isDark 
                          ? "text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1c] focus:bg-[#1a1a1c]"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 focus:bg-gray-50"
                      )}
                    >
                      <mode.icon className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{mode.label}</div>
                        <div className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-400")}>
                          {mode.description}
                        </div>
                      </div>
                    </DropdownMenuItem>
                    {index === 0 && <DropdownMenuSeparator className={isDark ? "bg-[#2a2a2c]" : "bg-gray-200"} />}
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Text Input */}
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Sofia..."
              disabled={disabled || isLoading}
              className={cn(
                "flex-1 min-h-[52px] max-h-[200px] bg-transparent border-0 resize-none focus-visible:ring-0 py-3.5 px-3",
                isDark ? "text-white placeholder:text-[#6b6b6b]" : "text-gray-900 placeholder:text-gray-400"
              )}
              rows={1}
            />
          </div>

          {/* Bottom row: Actions */}
          <div className={cn(
            "flex items-center justify-between px-3 py-2 border-t",
            isDark ? "border-[#1a1a1c]" : "border-gray-100"
          )}>
            {/* Left side quick actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isDark 
                    ? "text-[#6b6b6b] hover:text-white hover:bg-[#1a1a1c]"
                    : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                )}
                title="Attach files"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleModeSelect(MODES.IMAGE)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  selectedMode === MODES.IMAGE
                    ? "text-purple-400 bg-purple-500/10"
                    : isDark 
                      ? "text-[#6b6b6b] hover:text-white hover:bg-[#1a1a1c]"
                      : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                )}
                title="Create image"
              >
                <Image className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleModeSelect(MODES.SEARCH)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  selectedMode === MODES.SEARCH
                    ? "text-purple-400 bg-purple-500/10"
                    : isDark 
                      ? "text-[#6b6b6b] hover:text-white hover:bg-[#1a1a1c]"
                      : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                )}
                title="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            {/* Right side: Voice + Send */}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleVoiceToggle}
                className={cn(
                  "h-9 w-9 rounded-full transition-colors",
                  isRecording 
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                    : isDark 
                      ? "text-[#6b6b6b] hover:text-white hover:bg-[#2a2a2c]"
                      : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                type="submit"
                size="icon"
                disabled={(!message.trim() && attachedFiles.length === 0) || isLoading || disabled}
                className={cn(
                  "h-9 w-9 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all",
                  isDark
                    ? "bg-purple-600 hover:bg-purple-500 text-white"
                    : "bg-purple-600 hover:bg-purple-500 text-white"
                )}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Disclaimer */}
      <div className="text-center mt-3 space-y-1">
        <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
          Sofia can make mistakes. Please double-check responses.
        </p>
        <p className={cn("text-[10px]", isDark ? "text-[#4a4a4a]" : "text-gray-400")}>
          End to End Encryption
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
