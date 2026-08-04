import "./App.css";
import { ReactLenis } from "lenis/react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
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
import Admin from "./pages/Admin";
import MeshControlCenter from "./pages/MeshControlCenter";
import Laws from "./pages/Laws";
import Pay from "./pages/Pay";
import Builder from "./pages/Builder";
import Gallery from "./pages/Gallery";
import PlayGame from "./pages/PlayGame";
import Downloads from "./pages/Downloads";
import Status from "./pages/Status";
import Software from "./pages/Software";
import GamesLibrary from "./pages/GamesLibrary";
import GamePlayerPage from "./pages/GamePlayerPage";

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

function CourtGate({ children }) {
  const { user } = useAuth();
  if (user === undefined) return null;
  if (!user || user.role !== "admin") return <Navigate to="/" replace />;
  return children;
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
              <Route path="/court" element={<CourtGate><Court /></CourtGate>} />
              <Route path="/brand" element={<Brand />} />
              <Route path="/about" element={<About />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/mesh" element={<MeshControlCenter />} />
              <Route path="/laws" element={<CourtGate><Laws /></CourtGate>} />
              <Route path="/pay" element={<Pay />} />
              <Route path="/website-builder" element={<Builder type="website" />} />
              <Route path="/game-builder" element={<Builder type="game" />} />
              <Route path="/app-builder" element={<Builder type="app" />} />
              <Route path="/landing-builder" element={<Builder type="landing" />} />
              <Route path="/builder" element={<Builder type="website" />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/play/:slug" element={<PlayGame />} />
              <Route path="/downloads" element={<CourtGate><Downloads /></CourtGate>} />
              <Route path="/status" element={<Status />} />
              <Route path="/software" element={<Software />} />
              <Route path="/games" element={<GamesLibrary />} />
              <Route path="/games/play/:gameId" element={<GamePlayerPage />} />
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
