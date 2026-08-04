import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Cloud, Cpu, Maximize2, Wifi } from "lucide-react";
import StreamPlayer from "../components/games/StreamPlayer";

const API = process.env.REACT_APP_BACKEND_URL;

export default function GamePlayerPage() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [mode, setMode] = useState("checking"); // checking | stream | local
  const [streamCfg, setStreamCfg] = useState(null);
  const [latency, setLatency] = useState(null);
  const frameRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/games/${gameId}`).then((r) => (r.ok ? r.json() : null)).then(setGame).catch(() => {});
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
          <span className="hidden text-[10px] uppercase tracking-[0.2em] text-[#555] sm:block">{game?.engine}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            data-testid="game-player-status"
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.15em] ${
              mode === "stream" ? "border-emerald-500/40 text-emerald-400" : "border-[#6c63ff]/40 text-[#8b84ff]"
            }`}
          >
            {mode === "checking" ? <Wifi size={11} /> : mode === "stream" ? <Cloud size={11} /> : <Cpu size={11} />}
            {mode === "checking" ? "Connecting…" : mode === "stream" ? "Cloud Stream" : "Local Engine"}
          </span>
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
        {game?.controls || ""} · Frasberg Mesh {mode === "stream" ? "cloud session" : "renders on your device"}
      </div>
    </div>
  );
}
