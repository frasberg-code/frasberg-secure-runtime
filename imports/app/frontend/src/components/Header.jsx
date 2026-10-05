import React from 'react';
import { Menu, ChevronDown, Settings, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const Header = ({ 
  onToggleSidebar, 
  selectedModel, 
  onModelChange, 
  selectedMode, 
  onModeChange,
  currentTab,
  onTabChange,
  models,
  modes,
  isMobile = false,
  isAdmin = false,
  theme = 'dark',
  onThemeToggle,
  voiceSettingsComponent
}) => {
  const isDark = theme === 'dark';

  return (
    <header className={cn(
      "flex items-center justify-between px-4 py-2 border-b",
      isDark ? "bg-[#0a0a0b] border-[#1a1a1c]" : "bg-white border-gray-200"
    )}>
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className={cn(
            "h-8 w-8",
            isDark 
              ? "text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1c]"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          )}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Model Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-8 px-3 text-sm gap-1",
                isDark 
                  ? "text-white hover:bg-[#1a1a1c]"
                  : "text-gray-900 hover:bg-gray-100"
              )}
            >
              {selectedModel?.name || 'Sofia 3 Moon'}
              <ChevronDown className={cn("h-4 w-4", isDark ? "text-[#6b6b6b]" : "text-gray-400")} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={isDark ? "bg-[#1a1a1c] border-[#2a2a2c]" : "bg-white border-gray-200"}>
            {models.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onModelChange(model)}
                className={cn(
                  "text-sm cursor-pointer",
                  selectedModel?.id === model.id 
                    ? isDark ? "text-white bg-[#2a2a2c]" : "text-gray-900 bg-gray-100"
                    : isDark ? "text-[#a0a0a0]" : "text-gray-600"
                )}
              >
                {model.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mode Selector */}
        {!isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-8 px-3 text-sm gap-1",
                  isDark 
                    ? "text-white hover:bg-[#1a1a1c]"
                    : "text-gray-900 hover:bg-gray-100"
                )}
              >
                {selectedMode?.name || 'Assistant Mode'}
                <ChevronDown className={cn("h-4 w-4", isDark ? "text-[#6b6b6b]" : "text-gray-400")} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={isDark ? "bg-[#1a1a1c] border-[#2a2a2c]" : "bg-white border-gray-200"}>
              {modes.map((mode) => (
                <DropdownMenuItem
                  key={mode.id}
                  onClick={() => onModeChange(mode)}
                  className={cn(
                    "text-sm cursor-pointer",
                    selectedMode?.id === mode.id 
                      ? isDark ? "text-white bg-[#2a2a2c]" : "text-gray-900 bg-gray-100"
                      : isDark ? "text-[#a0a0a0]" : "text-gray-600"
                  )}
                >
                  {mode.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Tabs - Only show Sofia Core tab to admins */}
        <div className={cn(
          "flex items-center rounded-lg p-0.5",
          isDark ? "bg-[#1a1a1c]" : "bg-gray-100"
        )}>
          <button
            onClick={() => onTabChange('chat')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              currentTab === 'chat'
                ? isDark ? "bg-[#2a2a2c] text-white" : "bg-white text-gray-900 shadow-sm"
                : isDark ? "text-[#6b6b6b] hover:text-white" : "text-gray-500 hover:text-gray-900"
            )}
          >
            Chat
          </button>
          {isAdmin && (
            <button
              onClick={() => onTabChange('sofia-core')}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                currentTab === 'sofia-core'
                  ? isDark ? "bg-[#2a2a2c] text-white" : "bg-white text-gray-900 shadow-sm"
                  : isDark ? "text-[#6b6b6b] hover:text-white" : "text-gray-500 hover:text-gray-900"
              )}
            >
              Sofia Core
            </button>
          )}
        </div>

        {/* Voice Settings */}
        {voiceSettingsComponent}

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onThemeToggle}
          className={cn(
            "h-8 w-8",
            isDark 
              ? "text-[#6b6b6b] hover:text-white hover:bg-[#1a1a1c]"
              : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
          )}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8",
            isDark 
              ? "text-[#6b6b6b] hover:text-white hover:bg-[#1a1a1c]"
              : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
          )}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
