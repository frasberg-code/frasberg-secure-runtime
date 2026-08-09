import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Cloud, Cpu, Maximize2, Wifi } from "lucide-react";
import confetti from "canvas-confetti";
import StreamPlayer from "../components/games/StreamPlayer";

const API = process.env.REACT_APP_BACKEND_URL;

export default function GamePlayerPage() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [mode, setMode] = useState("checking"); // checking | stream | local
  const [streamCfg, setStreamCfg] = useState(null);
  const [latency, setLatency] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const frameRef = useRef(null);
  const bestRef = useRef(null);

  // Playtime heartbeat + personal-best celebration (signed-in players)
  useEffect(() => {
    let alive = true;
    fetch(`${API}/api/games/player/best-scores`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !Array.isArray(d)) return;
        const mine = d.find((s) => s.game_id === gameId);
        bestRef.current = mine ? mine.score : 0;
      }).catch(() => {});

    const checkBest = async () => {
      if (bestRef.current === null) return;
      try {
        const r = await fetch(`${API}/api/games/player/best-scores`, { credentials: "include" });
        if (!r.ok) return;
        const d = await r.json();
        const mine = d.find((s) => s.game_id === gameId);
        if (mine && mine.score > bestRef.current) {
          bestRef.current = mine.score;
          setCelebration(mine.score);
          confetti({ particleCount: 160, spread: 90, origin: { y: 0.35 }, colors: ["#6c63ff", "#8b84ff", "#ff5c8a", "#ffd166"] });
          setTimeout(() => confetti({ particleCount: 90, spread: 120, origin: { y: 0.5 } }), 400);
          setTimeout(() => setCelebration(null), 4500);
        }
      } catch { /* ignore */ }
    };
    const beat = () => {
      fetch(`${API}/api/games/player/playtime`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ game_id: gameId, seconds: 30 }),
      }).catch(() => {});
    };
    const iv = setInterval(() => { beat(); checkBest(); }, 30000);
    const scoreIv = setInterval(checkBest, 10000);
    return () => { alive = false; clearInterval(iv); clearInterval(scoreIv); };
  }, [gameId]);

  useEffect(() => {
    fetch(`${API}/api/games/${gameId}`).then((r) => (r.ok ? r.json() : null)).then(setGame).catch(() => {});
    fetch(`${API}/api/games/${gameId}/play-count`, { method: "POST" }).catch(() => {});
    fetch(`${API}/api/games/stream/health`)
      .then((r) => r.json())
      .then((h) => {
        if (h.online && h.ws_url) { setStreamCfg(h); setMode("stream"); }
        else setMode("local");
      })
      .catch(() => setMode("local"));
  }, [gameId]);

  useEffect(() => {
    let alive = true;
    const ping = async () => {
      const t0 = performance.now();
      try {
        await fetch(`${API}/api/health`, { cache: "no-store" });
        if (alive) setLatency(Math.round(performance.now() - t0));
      } catch { if (alive) setLatency(null); }
    };
    ping();
    const iv = setInterval(ping, 5000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  const goFullscreen = useCallback(() => {
    frameRef.current?.requestFullscreen?.().catch(() => {});
  }, []);

  const fallbackToLocal = useCallback(() => setMode("local"), []);

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d1a] font-mono text-white" data-testid="game-player-page">
      <div className="flex items-center justify-between border-b border-[#1a1a2e] px-5 py-3">
        <Link to="/games" className="inline-flex items-center gap-2 text-sm text-[#888] transition-colors hover:text-white" data-testid="game-player-exit">
          <ArrowLeft size={15} /> Library
        </Link>
        <div className="min-w-0 px-3 text-center">
          <span className="block truncate text-sm font-bold text-white" data-testid="game-player-title">{game?.title || gameId}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-[#1a1a2e] px-3 py-1 text-[10px] text-[#888] sm:inline-flex" data-testid="game-player-latency">
            <Wifi size={11} className="text-[#6c63ff]" /> {latency === null ? "—" : `${latency} ms`}
          </span>
          <button
            onClick={goFullscreen}
            data-testid="game-player-fullscreen"
            aria-label="Fullscreen"
            className="grid h-8 w-8 place-items-center rounded-full border border-[#1a1a2e] text-[#888] transition-colors hover:border-[#6c63ff] hover:text-white"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      <div ref={frameRef} className="relative flex-1 bg-black">
        {celebration !== null && (
          <div className="pointer-events-none absolute inset-x-0 top-8 z-50 flex justify-center" data-testid="personal-best-banner">
            <div className="animate-bounce rounded-2xl border border-[#ffd166]/60 bg-[#111122]/95 px-8 py-4 text-center shadow-[0_8px_40px_rgba(255,209,102,0.25)] backdrop-blur">
              <p className="text-lg font-bold text-[#ffd166]">🏆 New personal best!</p>
              <p className="mt-1 text-sm text-[#ccc]">{celebration.toLocaleString()} points</p>
            </div>
          </div>
        )}
        {mode === "checking" && (
          <div className="absolute inset-0 grid place-items-center text-sm text-[#666]">
            Connecting to Frasberg stream node…
          </div>
        )}
        {mode === "stream" && streamCfg && (
          <StreamPlayer wsUrl={streamCfg.ws_url} gameId={gameId} onFallback={fallbackToLocal} />
        )}
        {mode === "local" && (
          <iframe
            data-testid="game-frame"
            title={game?.title || gameId}
            src={`${API}/api/games/${gameId}/play`}
            className="absolute inset-0 h-full w-full border-0"
            allow="fullscreen; pointer-lock; gamepad"
          />
        )}
      </div>

      <div className="border-t border-[#1a1a2e] px-5 py-2 text-center text-[11px] text-[#555]" data-testid="game-player-controls-hint">
        {game?.controls || ""}
      </div>
    </div>
  );
}
