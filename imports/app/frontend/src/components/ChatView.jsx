import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const ChatView = ({ 
  messages, 
  onSendMessage, 
  onVoiceStart, 
  onVoiceStop, 
  onSpeak,
  onCopy,
  onRegenerate,
  isRecording,
  isLoading,
  speakingMessageId,
  attachedFiles = [],
  onFilesSelected,
  onRemoveFile,
  theme = 'dark'
}) => {
  const scrollRef = useRef(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea ref={scrollRef} className="flex-1 px-4">
        <div className="max-w-3xl mx-auto py-4">
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id || index}
              message={message}
              isUser={message.role === 'user'}
              onSpeak={() => onSpeak?.(message)}
              onCopy={() => onCopy?.(message)}
              onRegenerate={() => onRegenerate?.(message)}
              isSpeaking={speakingMessageId === message.id}
              isLatest={index === messages.length - 1 && message.role === 'assistant'}
              theme={theme}
            />
          ))}
          {isLoading && (
            <div className="flex gap-4 py-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                  <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
                </svg>
              </div>
              <div className="flex items-center gap-1">
                <div className={cn("w-2 h-2 rounded-full animate-bounce", isDark ? "bg-[#6b6b6b]" : "bg-gray-400")} style={{ animationDelay: '0ms' }} />
                <div className={cn("w-2 h-2 rounded-full animate-bounce", isDark ? "bg-[#6b6b6b]" : "bg-gray-400")} style={{ animationDelay: '150ms' }} />
                <div className={cn("w-2 h-2 rounded-full animate-bounce", isDark ? "bg-[#6b6b6b]" : "bg-gray-400")} style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className={cn("py-4 border-t", isDark ? "border-[#1a1a1c]" : "border-gray-200")}>
        <ChatInput
          onSendMessage={onSendMessage}
          onVoiceStart={onVoiceStart}
          onVoiceStop={onVoiceStop}
          isRecording={isRecording}
          isLoading={isLoading}
          attachedFiles={attachedFiles}
          onFilesSelected={onFilesSelected}
          onRemoveFile={onRemoveFile}
          theme={theme}
        />
      </div>
    </div>
  );
};

export default ChatView;
