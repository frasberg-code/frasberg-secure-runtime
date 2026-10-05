import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, Brain, Cpu, Radio, Users, ChevronDown, ChevronRight, Plus,
  MoreHorizontal, Trash2, BookOpen, BarChart3, Home, Settings,
  Video, Music, Film, Wallet, TrendingUp
} from 'lucide-react';

const Sidebar = ({ 
  conversations, 
  activeConversation, 
  onNewChat, 
  onSelectConversation, 
  onDeleteConversation 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const isDark = theme === 'dark';
  const [hoveredItem, setHoveredItem] = useState(null);
  const [recentChatsOpen, setRecentChatsOpen] = useState(true);
  
  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
    { id: 'video-call', label: 'Video Call', icon: Video, path: '/video-call' },
    { id: 'music', label: 'Music Studio', icon: Music, path: '/music' },
    { id: 'video-gen', label: 'Video Gen', icon: Film, path: '/video-gen' },
    { id: 'hardware', label: 'Hardware', icon: Cpu, path: '/hardware' },
    { id: 'learning', label: 'Learning', icon: BookOpen, path: '/learning' },
    { id: 'data', label: 'Data Analysis', icon: BarChart3, path: '/data-analysis' },
    { id: 'wallet', label: 'Crypto Wallet', icon: Wallet, path: '/wallet' },
    { id: 'trading', label: 'Trading', icon: TrendingUp, path: '/trading' },
    { id: 'broadcast', label: 'Broadcast', icon: Radio, path: '/broadcast' },
  ];
  
  const adminNavItems = [
    { id: 'sofia-core', label: 'Sofia Core', icon: Brain, path: '/admin/sofia-core', adminOnly: true },
  ];

  return (
    <div className={cn(
      "w-64 h-full flex flex-col border-r",
      isDark ? "bg-[#0f0f10] border-[#1a1a1c]" : "bg-white border-gray-200"
    )}>
      {/* Header */}
      <div className={cn("p-3 border-b", isDark ? "border-[#1a1a1c]" : "border-gray-200")}>
        <div className={cn("font-semibold text-sm mb-3", isDark ? "text-white" : "text-gray-900")}>
          Sofia
        </div>
        
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
            isDark 
              ? "bg-[#1a1a1c] hover:bg-[#252527] text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-900"
          )}
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </button>
      </div>
      
      {/* Navigation */}
      <div className={cn("p-2 border-b", isDark ? "border-[#1a1a1c]" : "border-gray-200")}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mb-1",
              location.pathname === item.path
                ? isDark ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-700"
                : isDark 
                  ? "text-[#a0a0a0] hover:bg-[#1a1a1c] hover:text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </button>
        ))}
        
        {/* Admin Items */}
        {isAdmin && adminNavItems.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mb-1",
              location.pathname === item.path
                ? isDark ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-700"
                : isDark 
                  ? "text-[#a0a0a0] hover:bg-[#1a1a1c] hover:text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
            {item.adminOnly && (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                Admin
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Conversations List - Collapsible Dropdown */}
      <div className="flex-1 overflow-y-auto p-2">
        <button
          onClick={() => setRecentChatsOpen(!recentChatsOpen)}
          className={cn(
            "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors mb-1",
            isDark 
              ? "text-[#a0a0a0] hover:bg-[#1a1a1c] hover:text-white" 
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          )}
        >
          <span className="flex items-center gap-2">
            {recentChatsOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            Recent Chats
          </span>
          {conversations.length > 0 && (
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full",
              isDark ? "bg-[#2a2a2c] text-[#a0a0a0]" : "bg-gray-200 text-gray-600"
            )}>
              {conversations.length}
            </span>
          )}
        </button>
        
        {recentChatsOpen && (
          <div className="ml-2">
            {conversations.length === 0 ? (
              <div className={cn("text-xs text-center py-4", isDark ? "text-[#4a4a4c]" : "text-gray-400")}>
                No conversations yet
              </div>
            ) : (
              conversations.slice(0, 15).map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
                  onMouseEnter={() => setHoveredItem(conv.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors mb-1",
                    activeConversation?.id === conv.id
                      ? isDark ? "bg-[#1a1a1c] text-white" : "bg-gray-100 text-gray-900"
                      : isDark 
                        ? "text-[#a0a0a0] hover:bg-[#1a1a1c]"
                        : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate flex-1">
                    {conv.title || conv.messages?.[0]?.content?.substring(0, 30) || 'New Chat'}
                  </span>
                  {(hoveredItem === conv.id || activeConversation?.id === conv.id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className={cn(
                        "p-1 rounded hover:bg-red-500/20 transition-colors",
                        isDark ? "text-[#6b6b6b] hover:text-red-400" : "text-gray-400 hover:text-red-500"
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className={cn("p-3 border-t", isDark ? "border-[#1a1a1c]" : "border-gray-200")}>
        <div className={cn("text-xs", isDark ? "text-[#4a4a4c]" : "text-gray-400")}>
          Sofia v2.0 · 168 Emerald Estates LLC
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
