import React from 'react';
import { Code, Pencil, Lightbulb, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  code: Code,
  pencil: Pencil,
  lightbulb: Lightbulb,
  document: FileText,
};

const SuggestionCard = ({ suggestion, onClick, theme = 'dark' }) => {
  const Icon = iconMap[suggestion.icon] || Code;
  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => onClick(suggestion)}
      className={cn(
        "flex flex-col items-start p-4 rounded-xl border",
        "hover:border-purple-500/50 transition-all duration-200",
        "text-left w-full min-h-[100px]",
        isDark 
          ? "border-[#2a2a2c] bg-[#0f0f10] hover:bg-[#1a1a1c]" 
          : "border-gray-200 bg-white hover:bg-gray-50"
      )}
    >
      <Icon className={cn("h-5 w-5 mb-3", isDark ? "text-[#8b8b8b]" : "text-gray-400")} />
      <div className={cn("text-sm font-medium mb-1", isDark ? "text-white" : "text-gray-900")}>
        {suggestion.title}
      </div>
      <div className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>
        {suggestion.description}
      </div>
    </button>
  );
};

export default SuggestionCard;
