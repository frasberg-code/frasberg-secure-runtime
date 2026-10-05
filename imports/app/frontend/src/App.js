import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ChatPage from '@/pages/ChatPage';
import LoginPage from '@/pages/LoginPage';
import SofiaCorePage from '@/pages/SofiaCorePage';
import HardwareControlPage from '@/pages/HardwareControlPage';
import LearningModulesPage from '@/pages/LearningModulesPage';
import DataAnalysisPage from '@/pages/DataAnalysisPage';
import VideoCallPage from '@/pages/VideoCallPage';
import MusicStudioPage from '@/pages/MusicStudioPage';
import VideoGenerationPage from '@/pages/VideoGenerationPage';
import CryptoWalletPage from '@/pages/CryptoWalletPage';
import TradingPlatformPage from '@/pages/TradingPlatformPage';
import BroadcastStudioPage from '@/pages/BroadcastStudioPage';

// Protected Route wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isLoading, isAdmin } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/chat" replace />;
  }
  
  return children;
};

// Public Route wrapper (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/chat" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hardware"
        element={
          <ProtectedRoute>
            <HardwareControlPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learning"
        element={
          <ProtectedRoute>
            <LearningModulesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/data-analysis"
        element={
          <ProtectedRoute>
            <DataAnalysisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sofia-core"
        element={
          <ProtectedRoute adminOnly>
            <SofiaCorePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/video-call"
        element={
          <ProtectedRoute>
            <VideoCallPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/music"
        element={
          <ProtectedRoute>
            <MusicStudioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/video-gen"
        element={
          <ProtectedRoute>
            <VideoGenerationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <CryptoWalletPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trading"
        element={
          <ProtectedRoute>
            <TradingPlatformPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/broadcast"
        element={
          <ProtectedRoute>
            <BroadcastStudioPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <Toaster position="top-right" theme="dark" />
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
