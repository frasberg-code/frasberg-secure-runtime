import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import WelcomeScreen from '@/components/WelcomeScreen';
import ChatView from '@/components/ChatView';
import VoiceChat from '@/components/VoiceChat';
import VoiceSettings from '@/components/VoiceSettings';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { models, assistantModes } from '@/data/mock';
import { toast } from 'sonner';
import { chatApi, voiceApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { v4 as uuidv4 } from 'uuid';

const ChatPage = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [sessionId, setSessionId] = useState(() => uuidv4());
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [selectedMode, setSelectedMode] = useState(assistantModes[0]);
  const [currentTab, setCurrentTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceChatActive, setVoiceChatActive] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [currentPage, setCurrentPage] = useState('chat');
  const [isMobile, setIsMobile] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [currentVoice, setCurrentVoice] = useState('sofia');
  const [voiceSettings, setVoiceSettings] = useState({
    speed: 1.0,
    pitch: 1.0,
    autoPlay: false,
  });
  
  const audioRef = useRef(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await chatApi.getConversations();
        const formattedConversations = data.map(conv => ({
          id: conv.session_id,
          title: conv.title,
          date: 'today',
        }));
        setConversations(formattedConversations);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };
    loadConversations();
  }, []);

  // Load conversation messages when selected
  useEffect(() => {
    const loadConversation = async () => {
      if (selectedConversation) {
        try {
          const conv = await chatApi.getConversation(selectedConversation);
          setMessages(conv.messages.map((msg, i) => ({
            id: `${selectedConversation}-${i}`,
            role: msg.role,
            content: msg.content,
          })));
          setSessionId(selectedConversation);
        } catch (error) {
          console.error('Failed to load conversation:', error);
        }
      }
    };
    loadConversation();
  }, [selectedConversation]);

  const handleNewChat = () => {
    setSelectedConversation(null);
    setSessionId(uuidv4());
    setMessages([]);
    setAttachedFiles([]);
    setCurrentTab('chat');
  };

  // Extract text from files (simplified - in production use backend)
  const extractFileContents = async (files) => {
    const contents = [];
    for (const file of files) {
      if (file.type === 'text/plain' || file.type === 'text/csv') {
        const text = await file.text();
        contents.push(`[File: ${file.name}]\n${text}`);
      } else if (file.type.startsWith('image/')) {
        contents.push(`[Attached image: ${file.name}]`);
      } else {
        contents.push(`[Attached document: ${file.name} (${file.type})]`);
      }
    }
    return contents.join('\n\n');
  };

  // Check if user is asking to change voice
  const checkVoiceChangeRequest = (message) => {
    const voicePatterns = [
      /change.*voice.*to\s+(\w+)/i,
      /use\s+(\w+)\s+voice/i,
      /switch.*voice.*to\s+(\w+)/i,
      /speak.*like\s+(\w+)/i,
      /sound.*like\s+(\w+)/i,
    ];
    
    for (const pattern of voicePatterns) {
      const match = message.match(pattern);
      if (match) {
        const requestedVoice = match[1].toLowerCase();
        const voiceMap = {
          alloy: 'alloy',
          echo: 'echo',
          fable: 'fable',
          onyx: 'onyx',
          nova: 'nova',
          shimmer: 'shimmer',
          male: 'onyx',
          female: 'nova',
          british: 'fable',
          warm: 'echo',
          friendly: 'nova',
          deep: 'onyx',
          soft: 'shimmer',
        };
        return voiceMap[requestedVoice] || null;
      }
    }
    return null;
  };

  const handleSendMessage = useCallback(async (content) => {
    if (!content.trim() && attachedFiles.length === 0) return;

    // Check for voice change request
    const newVoice = checkVoiceChangeRequest(content);
    if (newVoice) {
      setCurrentVoice(newVoice);
      toast.success(`Voice changed to ${newVoice}`);
    }

    let fullContent = content.trim();
    
    // Add file contents if any
    if (attachedFiles.length > 0) {
      const fileContents = await extractFileContents(attachedFiles);
      fullContent = `${fullContent}\n\n--- Attached Files ---\n${fileContents}`;
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      files: attachedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })),
    };

    setMessages(prev => [...prev, userMessage]);
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(
        sessionId,
        fullContent,
        selectedModel?.id || 'gpt-4o',
        selectedModel?.provider || 'openai'
      );

      const assistantMessage = {
        id: response.id,
        role: 'assistant',
        content: response.message.content,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Auto-play if enabled
      if (voiceSettings.autoPlay) {
        handleSpeak(assistantMessage);
      }

      // Update conversations list
      setConversations(prev => {
        const exists = prev.find(c => c.id === sessionId);
        if (!exists) {
          return [{
            id: sessionId,
            title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
            date: 'today',
          }, ...prev];
        }
        return prev;
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, selectedModel, attachedFiles, voiceSettings.autoPlay]);

  const handleFilesSelected = (files) => {
    setAttachedFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} file(s) attached`);
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion.title);
  };

  const handleVoiceStart = () => {
    setIsRecording(true);
  };

  const handleVoiceStop = () => {
    setIsRecording(false);
  };

  const handleSpeak = async (message) => {
    if (speakingMessageId === message.id) {
      setSpeakingMessageId(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis?.cancel();
      return;
    }

    setSpeakingMessageId(message.id);
    
    try {
      // Use ElevenLabs TTS with current voice settings
      const response = await voiceApi.textToSpeech(message.content, currentVoice);
      
      const audio = new Audio(response.audio_url);
      audioRef.current = audio;
      
      // Apply settings
      audio.playbackRate = voiceSettings.speed;
      
      audio.onended = () => {
        setSpeakingMessageId(null);
        audioRef.current = null;
      };
      audio.onerror = (e) => {
        console.error('Audio error:', e);
        setSpeakingMessageId(null);
        audioRef.current = null;
        // Fallback to Web Speech
        fallbackSpeak(message.content);
      };
      
      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      fallbackSpeak(message.content);
    }
  };

  const fallbackSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceSettings.speed;
      utterance.pitch = voiceSettings.pitch;
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setSpeakingMessageId(null);
      toast.error('Voice not available');
    }
  };

  const handleCopy = (message) => {
    navigator.clipboard.writeText(message.content);
    toast.success('Copied to clipboard');
  };

  const handleRegenerate = async () => {
    if (messages.length < 2) return;
    
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      setMessages(prev => prev.slice(0, -1));
      await handleSendMessage(lastUserMessage.content);
    }
  };

  const handleVoiceMessage = async (audioBlob) => {
    try {
      toast.info('Processing voice...');
      
      const transcription = await voiceApi.speechToText(audioBlob);
      
      if (transcription.transcribed_text) {
        await handleSendMessage(transcription.transcribed_text);
      } else {
        toast.error('Could not transcribe audio');
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      toast.error('Failed to process voice message');
    }
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    if (page === 'sofia-core' && isAdmin) {
      setCurrentTab('sofia-core');
      navigate('/admin/sofia-core');
    } else if (page === 'chat' || page === 'memory' || page === 'audio-studio') {
      setCurrentTab('chat');
    }
  };

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    if (tab === 'sofia-core' && isAdmin) {
      navigate('/admin/sofia-core');
    }
  };

  const showWelcome = messages.length === 0 && currentTab === 'chat';

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#0a0a0b]' : 'bg-white'}`}>
      {/* Desktop Sidebar */}
      {!isMobile && sidebarOpen && (
        <Sidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
          onNewChat={handleNewChat}
          onNavigate={handleNavigate}
          currentPage={currentPage}
          isAdmin={isAdmin}
          user={user}
          onLogout={logout}
          theme={theme}
        />
      )}

      {/* Mobile Sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className={`p-0 w-[280px] ${theme === 'dark' ? 'bg-[#0a0a0b] border-[#1a1a1c]' : 'bg-white border-gray-200'}`}>
          <Sidebar
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
            onNewChat={handleNewChat}
            onNavigate={handleNavigate}
            currentPage={currentPage}
            isMobile={true}
            onClose={() => setMobileSidebarOpen(false)}
            isAdmin={isAdmin}
            user={user}
            onLogout={logout}
            theme={theme}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => isMobile ? setMobileSidebarOpen(true) : setSidebarOpen(!sidebarOpen)}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
          currentTab={currentTab}
          onTabChange={handleTabChange}
          models={models}
          modes={assistantModes}
          isMobile={isMobile}
          isAdmin={isAdmin}
          theme={theme}
          onThemeToggle={toggleTheme}
          voiceSettingsComponent={
            <VoiceSettings
              currentVoice={currentVoice}
              onVoiceChange={setCurrentVoice}
              voiceSettings={voiceSettings}
              onSettingsChange={setVoiceSettings}
            />
          }
        />

        <main className="flex-1 overflow-hidden">
          {showWelcome ? (
            <WelcomeScreen
              onSuggestionClick={handleSuggestionClick}
              onSendMessage={handleSendMessage}
              onVoiceStart={() => setVoiceChatActive(true)}
              onVoiceStop={handleVoiceStop}
              isRecording={isRecording}
              isLoading={isLoading}
              attachedFiles={attachedFiles}
              onFilesSelected={handleFilesSelected}
              onRemoveFile={handleRemoveFile}
              theme={theme}
            />
          ) : (
            <ChatView
              messages={messages}
              onSendMessage={handleSendMessage}
              onVoiceStart={() => setVoiceChatActive(true)}
              onVoiceStop={handleVoiceStop}
              onSpeak={handleSpeak}
              onCopy={handleCopy}
              onRegenerate={handleRegenerate}
              isRecording={isRecording}
              isLoading={isLoading}
              speakingMessageId={speakingMessageId}
              attachedFiles={attachedFiles}
              onFilesSelected={handleFilesSelected}
              onRemoveFile={handleRemoveFile}
              theme={theme}
            />
          )}
        </main>
      </div>

      {/* Voice Chat Modal */}
      <VoiceChat
        isActive={voiceChatActive}
        onClose={() => setVoiceChatActive(false)}
        onSendVoiceMessage={handleVoiceMessage}
      />
    </div>
  );
};

export default ChatPage;
