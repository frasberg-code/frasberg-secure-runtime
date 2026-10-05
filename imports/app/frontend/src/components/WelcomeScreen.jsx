import React from 'react';
import SuggestionCard from './SuggestionCard';
import ChatInput from './ChatInput';
import { suggestions } from '@/data/mock';
import { cn } from '@/lib/utils';

const WelcomeScreen = ({ 
  onSuggestionClick, 
  onSendMessage, 
  onVoiceStart, 
  onVoiceStop, 
  isRecording,
  isLoading,
  attachedFiles = [],
  onFilesSelected,
  onRemoveFile,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
      {/* Sofia Avatar */}
      <div className="w-20 h-20 mb-6 rounded-full overflow-hidden border-2 border-purple-500/50 shadow-lg shadow-purple-500/20">
        <img 
          src="/sofia-avatar.jpg" 
          alt="Sofia" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Welcome Text */}
      <h1 className={cn(
        "text-3xl md:text-4xl font-semibold mb-3 text-center",
        isDark ? "text-white" : "text-gray-900"
      )}>
        How can I help you today?
      </h1>
      <p className={cn("text-sm mb-2 text-center", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
        Start a conversation or try one of these suggestions
      </p>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mb-8">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onClick={onSuggestionClick}
            theme={theme}
          />
        ))}
      </div>

      {/* Input Area */}
      <div className="w-full max-w-3xl">
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

export default WelcomeScreen;
