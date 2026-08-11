import "./App.css";
import { ReactLenis } from "lenis/react";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { FontSizeToggle } from "./components/site/FontSizeToggle";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Contact from "./pages/Contact";
import DatabaseManager from "./pages/DatabaseManager";
import Dashboard from "./pages/Dashboard";
import Docs from "./pages/Docs";
import Legal from "./pages/Legal";
import Court from "./pages/Court";
import Brand from "./pages/Brand";
import About from "./pages/About";
import AiModels from "./pages/AiModels";
import LuchiiCode from "./pages/LuchiiCode";
import CodingAgents from "./pages/CodingAgents";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import AgentWorkspace from "./pages/AgentWorkspace";
import WorkspaceHome from "./pages/WorkspaceHome";

function ChatRoute() {
  const [params] = useSearchParams();
  const agent = (params.get("agent") || "").toLowerCase();
  const workspaceAgents = ["architect", "builder", "reviewer", "debugger"];
  return workspaceAgents.includes(agent) ? <AgentWorkspace /> : <Chat />;
}
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
import PlayerProfile from "./pages/PlayerProfile";
import VisualStudio from "./pages/VisualStudio";
import CreatureLibrary from "./pages/CreatureLibrary";
import CharacterCreator from "./pages/CharacterCreator";
import Linq from "./pages/Linq";
import FrasbergCloud from "./pages/FrasbergCloud";
import Marketplace from "./pages/Marketplace";
import MarketplaceV3 from "./pages/MarketplaceV3";
import Playground from "./pages/Playground";
import CloudConsole from "./pages/CloudConsole";
import DevPortal from "./pages/DevPortal";
import Launch from "./pages/Launch";
import OpsCenter from "./pages/OpsCenter";
import Codex from "./pages/Codex";
import ConstellationMap from "./pages/ConstellationMap";
import GlyphGallery from "./pages/GlyphGallery";
import AscensionHistory from "./pages/AscensionHistory";
import VerifiedProvider from "./pages/VerifiedProvider";
import CosmogenicKernels from "./pages/CosmogenicKernels";
import TierBenchmark from "./pages/TierBenchmark";
import { AscensionBanner } from "./components/site/AscensionBanner";
import { CommandPalette } from "./components/site/CommandPalette";
import FrasbergOS from "./pages/FrasbergOS";
import DocsHub from "./pages/DocsHub";

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
            <AscensionBanner />
            <CommandPalette />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/luchii" element={<Landing />} />
              <Route path="/ai-models" element={<AiModels />} />
              <Route path="/luchii-code" element={<LuchiiCode />} />
              <Route path="/coding-agents" element={<CodingAgents />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/court" element={<CourtGate><Court /></CourtGate>} />
              <Route path="/brand" element={<Brand />} />
              <Route path="/about" element={<About />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/chat" element={<ChatRoute />} />
              <Route path="/apps" element={<WorkspaceHome />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/database" element={<DatabaseManager />} />
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
              <Route path="/games/profile" element={<PlayerProfile />} />
              <Route path="/games/play/:gameId" element={<GamePlayerPage />} />
              <Route path="/studio" element={<VisualStudio />} />
              <Route path="/studio/creatures" element={<CreatureLibrary />} />
              <Route path="/studio/characters" element={<CharacterCreator />} />
              <Route path="/linq" element={<Linq />} />
              <Route path="/cloud" element={<FrasbergCloud />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/:page" element={<MarketplaceV3 />} />
              <Route path="/os" element={<FrasbergOS />} />
              <Route path="/playground" element={<Playground />} />
              <Route path="/console" element={<CloudConsole />} />
              <Route path="/developers/portal" element={<DevPortal />} />
              <Route path="/launch" element={<Launch />} />
              <Route path="/ops" element={<OpsCenter />} />
              <Route path="/codex" element={<Codex />} />
              <Route path="/codex/constellation" element={<ConstellationMap />} />
              <Route path="/glyphs" element={<GlyphGallery />} />
              <Route path="/ascensions" element={<AscensionHistory />} />
              <Route path="/verified-provider" element={<VerifiedProvider />} />
              <Route path="/kernels" element={<CosmogenicKernels />} />
              <Route path="/benchmark" element={<TierBenchmark />} />
              <Route path="/developers/docs" element={<DocsHub />} />
              <Route path="/developers/docs/:doc" element={<DocsHub />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-center" richColors />
          <FontSizeToggle />
        </div>
      </ReactLenis>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
