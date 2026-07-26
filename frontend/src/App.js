import "./App.css";
import { ReactLenis } from "lenis/react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Court from "./pages/Court";
import Brand from "./pages/Brand";
import About from "./pages/About";
import AiModels from "./pages/AiModels";
import LuchiiCode from "./pages/LuchiiCode";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";

function ScrollToHash() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 350);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <ReactLenis root options={{ lerp: 0.09, smoothWheel: true }}>
        <div className="App grain">
          <BrowserRouter>
            <ScrollToHash />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/luchii" element={<Landing />} />
              <Route path="/ai-models" element={<AiModels />} />
              <Route path="/luchii-code" element={<LuchiiCode />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/court" element={<Court />} />
              <Route path="/brand" element={<Brand />} />
              <Route path="/about" element={<About />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-center" richColors />
        </div>
      </ReactLenis>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
