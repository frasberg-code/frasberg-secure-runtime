import { useState } from "react";
import { Crown, Gamepad2, Heart } from "lucide-react";

const BACKEND = process.env.REACT_APP_BACKEND_URL;

export default function GameCard({ game, onPlay, favorited, onToggleFavorite }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      data-testid={`game-card-${game.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group overflow-hidden rounded-2xl border border-[#1a1a2e] bg-[#111122] shadow-[0_4px_24px_rgba(0,0,0,0.25)] transition-transform duration-200"
      style={{ transform: hovered ? "scale(1.03)" : "scale(1)" }}
    >
      <div className="relative h-44 overflow-hidden bg-[#1a1a2e]">
        {game.community ? (
          <iframe
            src={`${BACKEND}/api/p/${game.slug}`}
            title={game.title}
            sandbox="allow-scripts"
            loading="lazy"
            scrolling="no"
            className="pointer-events-none absolute left-0 top-0 h-[400%] w-[400%] origin-top-left scale-[0.25] border-0 bg-black"
          />
        ) : (
          <img
            src={game.thumbnail}
            alt={game.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
        <span className="absolute right-3 top-3 rounded-full bg-[#6c63ff] px-2.5 py-1 text-[11px] font-bold text-white">
          {game.genre}
        </span>
        {onToggleFavorite && (
          <button
            data-testid={`game-favorite-btn-${game.id}`}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
            className="absolute left-3 top-3 rounded-full bg-black/50 p-2 backdrop-blur transition-transform hover:scale-110"
          >
            <Heart size={15} className={favorited ? "fill-[#ff5c8a] text-[#ff5c8a]" : "text-white/70"} />
          </button>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-white">{game.title}</h3>
        <p className="mt-2 min-h-[3.2rem] text-[13px] leading-relaxed text-[#aaa]">{game.description}</p>
        {game.community ? (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#8b84ff]" data-testid={`game-plays-${game.id}`}>
            <Gamepad2 size={12} /> {game.plays.toLocaleString()} plays
          </p>
        ) : game.champion ? (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-amber-400" data-testid={`game-champion-${game.id}`}>
            <Crown size={12} /> {game.champion.name} · {game.champion.score.toLocaleString()}
            <span className="ml-auto flex items-center gap-1 text-[#8b84ff]" data-testid={`game-plays-${game.id}`}>
              <Gamepad2 size={12} /> {(game.plays || 0).toLocaleString()}
            </span>
          </p>
        ) : (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#555]" data-testid={`game-champion-${game.id}`}>
            <Crown size={12} /> Throne unclaimed — be the first
            <span className="ml-auto flex items-center gap-1 text-[#8b84ff]" data-testid={`game-plays-${game.id}`}>
              <Gamepad2 size={12} /> {(game.plays || 0).toLocaleString()}
            </span>
          </p>
        )}
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#555]">{game.engine}</p>
        <button
          data-testid={`game-play-btn-${game.id}`}
          onClick={onPlay}
          className="mt-4 w-full rounded-xl bg-[#6c63ff] py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-[#857dff]"
        >
          ▶ Play Now
        </button>
      </div>
    </div>
  );
}
