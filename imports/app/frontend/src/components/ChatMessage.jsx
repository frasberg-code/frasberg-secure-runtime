import React from 'react';
import { User, Volume2, VolumeX, Copy, ThumbsUp, ThumbsDown, RotateCcw, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ChatMessage = ({ 
  message, 
  isUser = false, 
  onSpeak, 
  onCopy, 
  onRegenerate,
  isSpeaking = false,
  isLatest = false,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  const getFileIcon = (file) => {
    if (file.type?.startsWith('image/')) return <Image className="h-3 w-3" />;
    return <FileText className="h-3 w-3" />;
  };

  return (
    <div className={cn(
      "flex gap-4 py-4 px-4",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser 
          ? isDark ? "bg-[#2a2a2c]" : "bg-gray-200"
          : "bg-gradient-to-br from-purple-500 to-pink-500"
      )}>
        {isUser ? (
          <User className={cn("h-4 w-4", isDark ? "text-white" : "text-gray-600")} />
        ) : (
          <div className="w-4 h-4 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn(
        "flex-1 max-w-[80%]",
        isUser ? "text-right" : "text-left"
      )}>
        {/* Attached files indicator */}
        {message.files && message.files.length > 0 && (
          <div className={cn(
            "flex flex-wrap gap-1 mb-2",
            isUser ? "justify-end" : "justify-start"
          )}>
            {message.files.map((file, i) => (
              <span
                key={i}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs",
                  isDark ? "bg-[#2a2a2c] text-[#a0a0a0]" : "bg-gray-100 text-gray-600"
                )}
              >
                {getFileIcon(file)}
                {file.name}
              </span>
            ))}
          </div>
        )}

        <div className={cn(
          "inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser 
            ? isDark ? "bg-[#2a2a2c] text-white" : "bg-gray-200 text-gray-900"
            : isDark ? "bg-transparent text-[#e0e0e0]" : "bg-transparent text-gray-700"
        )}>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>

        {/* Actions (for assistant messages) */}
        {!isUser && (
          <div className="flex items-center gap-1 mt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onSpeak}
              className={cn(
                "h-7 w-7",
                isDark 
                  ? "text-[#6b6b6b] hover:text-white hover:bg-[#1a1a1c]"
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCopy}
              className={cn(
                "h-7 w-7",
                isDark 
                  ? "text-[#6b6b6b] hover:text-white hover:bg-[#1a1a1c]"
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7",
                isDark 
                  ? "text-[#6b6b6b] hover:text-white hover:bg-[#1a1a1c]"
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7",
                isDark 
                  ? "text-[#6b6b6b] hover:text-white hover:bg-[#1a1a1c]"
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
            {isLatest && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRegenerate}
                className={cn(
                  "h-7 w-7",
                  isDark 
                    ? "text-[#6b6b6b] hover:text-white hover:bg-[#1a1a1c]"
                    : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
