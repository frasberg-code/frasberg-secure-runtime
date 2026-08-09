import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Gamepad2, Radio, Search, Heart, Trophy } from "lucide-react";
import { toast } from "sonner";
import GameCard from "../components/games/GameCard";

const API = process.env.REACT_APP_BACKEND_URL;

export default function GamesLibrary() {
  const [games, setGames] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [stream, setStream] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [signedIn, setSignedIn] = useState(false);
  const [myScores, setMyScores] = useState([]);
  const navigate = useNavigate();

  const toggleFavorite = async (gameId) => {
    try {
      const r = await fetch(`${API}/api/games/player/favorites/${gameId}`, { method: "POST", credentials: "include" });
      if (r.status === 401) { toast.error("Sign in to save favorite games"); return; }
      const d = await r.json();
      setFavorites((prev) => (d.favorited ? [...prev, gameId] : prev.filter((id) => id !== gameId)));
      toast.success(d.favorited ? "Added to favorites" : "Removed from favorites");
    } catch { toast.error("Could not update favorites"); }
  };

  const loadGames = async (attempt = 0) => {
    setLoading(true);
    setLoadError(false);
    try {
      const r = await fetch(`${API}/api/games`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      if (!Array.isArray(d)) throw new Error("bad payload");
      setGames(d);
      setLoading(false);
    } catch {
      if (attempt < 2) {
        setTimeout(() => loadGames(attempt + 1), 1200 * (attempt + 1));
      } else {
        setLoading(false);
        setLoadError(true);
      }
    }
  };

  useEffect(() => {
    document.title = "Frasberg Game Platform";
    loadGames();
    fetch(`${API}/api/games/stream/health`).then((r) => r.json()).then(setStream).catch(() => setStream({ online: false }));
    fetch(`${API}/api/games/player/favorites`, { credentials: "include" })
      .then((r) => { if (r.ok) { setSignedIn(true); return r.json(); } return null; })
      .then((d) => d && setFavorites(d.favorites)).catch(() => {});
    fetch(`${API}/api/games/player/best-scores`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => Array.isArray(d) && setMyScores(d)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const genres = ["All", ...(signedIn ? ["Favorites"] : []), ...Array.from(new Set(games.map((g) => g.genre).filter(Boolean)))];

  const filtered = games.filter((g) => {
    const matchGenre = filter === "All" || (filter === "Favorites" ? favorites.includes(g.id) : g.genre === filter);
    const matchSearch = (g.title || "").toLowerCase().includes(search.toLowerCase());
    return matchGenre && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#0d0d1a] font-mono text-white" data-testid="games-page">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#888] transition-colors hover:text-white" data-testid="games-back-link">
            <ArrowLeft size={15} /> Back to Luchii
          </Link>
          <Link to="/games/profile" className="inline-flex items-center gap-2 rounded-full border border-[#2a2a44] px-4 py-1.5 text-sm text-[#888] transition-colors hover:border-[#6c63ff] hover:text-white" data-testid="games-profile-link">
            <Trophy size={13} className="text-[#8b84ff]" /> My Profile
          </Link>
        </div>

        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-3">
            <Gamepad2 size={34} className="text-[#6c63ff]" />
            <h1 className="text-4xl font-bold tracking-tight text-[#6c63ff] sm:text-5xl">Frasberg Game Platform</h1>
          </div>
          <p className="mt-3 text-sm text-[#666]">Powered by Frasberg</p>
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
            {genres.map((g) => (
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

        {myScores.length > 0 && (
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-[#6c63ff]/25 bg-[#111122] p-4" data-testid="my-best-scores">
            <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.15em] text-[#8b84ff]">
              <Trophy size={13} /> My best scores
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {myScores.map((s) => (
                <span key={s.game_id} className="rounded-full border border-[#2a2a44] px-3 py-1 text-[12px] text-[#aaa]" data-testid={`my-score-${s.game_id}`}>
                  {s.title}: <b className="text-white">{s.score.toLocaleString()}</b>
                </span>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-10 grid gap-6 pb-20 sm:grid-cols-2 lg:grid-cols-3" data-testid="games-loading">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl border border-[#6c63ff]/20 bg-[#1a1a2e]" />
            ))}
          </div>
        ) : loadError ? (
          <div className="py-24 text-center" data-testid="games-load-error">
            <p className="text-[#888]">Couldn't reach the game servers.</p>
            <button
              onClick={() => loadGames()}
              data-testid="games-retry-btn"
              className="mt-5 rounded-full bg-[#6c63ff] px-7 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Retry loading games
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 pb-20 sm:grid-cols-2 lg:grid-cols-3" data-testid="games-grid">
            {filtered.map((game) => (
              <GameCard key={game.id} game={game} onPlay={() => navigate(`/games/play/${game.id}`)}
                favorited={favorites.includes(game.id)} onToggleFavorite={() => toggleFavorite(game.id)} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center" data-testid="games-empty">
                <p className="text-[#555]">
                  {search || filter !== "All" ? "No games match that search." : "No games available right now."}
                </p>
                {(search || filter !== "All") && (
                  <button
                    onClick={() => { setSearch(""); setFilter("All"); }}
                    data-testid="games-clear-filters"
                    className="mt-4 rounded-full border border-[#6c63ff]/60 px-5 py-2 text-[13px] text-[#aaa] transition-colors hover:text-white"
                  >
                    Clear search & filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
