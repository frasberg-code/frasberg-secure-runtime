import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Gamepad2, Radio, Search } from "lucide-react";
import GameCard from "../components/games/GameCard";

const API = process.env.REACT_APP_BACKEND_URL;
const GENRES = ["All", "FPS", "Racing", "Shooter", "Puzzle"];

export default function GamesLibrary() {
  const [games, setGames] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Luchii Game Platform — Frasberg";
    fetch(`${API}/api/games`).then((r) => r.json()).then((d) => { setGames(d); setLoading(false); }).catch(() => setLoading(false));
    fetch(`${API}/api/games/stream/health`).then((r) => r.json()).then(setStream).catch(() => setStream({ online: false }));
  }, []);

  const filtered = games.filter((g) => {
    const matchGenre = filter === "All" || g.genre === filter;
    const matchSearch = g.title.toLowerCase().includes(search.toLowerCase());
    return matchGenre && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#0d0d1a] font-mono text-white" data-testid="games-page">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#888] transition-colors hover:text-white" data-testid="games-back-link">
            <ArrowLeft size={15} /> Back to Luchii
          </Link>
          <span
            data-testid="games-stream-status"
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.15em] ${
              stream?.online ? "border-emerald-500/40 text-emerald-400" : "border-[#6c63ff]/40 text-[#8b84ff]"
            }`}
          >
            <Radio size={11} />
            {stream === null ? "Checking mesh…" : stream.online ? "Cloud stream live" : "Local engine mode"}
          </span>
        </div>

        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-3">
            <Gamepad2 size={34} className="text-[#6c63ff]" />
            <h1 className="text-4xl font-bold tracking-tight text-[#6c63ff] sm:text-5xl">Luchii Game Platform</h1>
          </div>
          <p className="mt-3 text-sm text-[#666]">Powered by Frasberg Mesh — zero-install cloud gaming</p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" />
            <input
              data-testid="games-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games..."
              className="w-full rounded-xl border border-[#6c63ff]/50 bg-[#1a1a2e] py-3 pl-11 pr-5 text-[15px] text-white outline-none placeholder:text-[#555] focus:border-[#6c63ff]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g}
                data-testid={`games-filter-${g.toLowerCase()}`}
                onClick={() => setFilter(g)}
                className={`rounded-full border border-[#6c63ff]/60 px-4 py-1.5 text-[13px] transition-colors ${
                  filter === g ? "bg-[#6c63ff] text-white" : "bg-[#1a1a2e] text-[#aaa] hover:text-white"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center text-[#555]">Loading games…</div>
        ) : (
          <div className="mt-10 grid gap-6 pb-20 sm:grid-cols-2 lg:grid-cols-3" data-testid="games-grid">
            {filtered.map((game) => (
              <GameCard key={game.id} game={game} onPlay={() => navigate(`/games/play/${game.id}`)} />
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-16 text-center text-[#555]" data-testid="games-empty">No games match that search.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
