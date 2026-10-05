import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Gamepad2, Heart, Trophy, User } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";

const API = process.env.REACT_APP_BACKEND_URL;

function fmtTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

export default function PlayerProfile() {
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | unauth | error
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Player Profile — Frasberg Game Platform";
    fetch(`${API}/api/games/player/profile`, { credentials: "include" })
      .then((r) => {
        if (r.status === 401) { setStatus("unauth"); return null; }
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => { if (d) { setProfile(d); setStatus("ok"); } })
      .catch(() => setStatus("error"));
    fetch(`${API}/api/games/player/achievements`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setAchievements(d)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d1a] font-mono text-white" data-testid="player-profile-page">
      <ParallaxSky />
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <Link to="/games" className="inline-flex items-center gap-2 text-sm text-[#b3bac7] transition-colors hover:text-white" data-testid="profile-back-link">
          <ArrowLeft size={15} /> Game Library
        </Link>

        <div className="mt-10 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#6c63ff]/20 text-[#6c63ff]">
            <User size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Player Profile</h1>
            {status === "ok" && (
              <p className="text-sm text-[#a3abbd]" data-testid="profile-total-playtime">
                Total playtime: <span className="text-[#8b84ff]">{fmtTime(profile.total_seconds)}</span>
              </p>
            )}
          </div>
        </div>

        {status === "loading" && <p className="mt-12 text-sm text-[#9aa3b8]">Loading your profile…</p>}

        {status === "unauth" && (
          <div className="mt-12 rounded-2xl border border-[#1a1a2e] bg-[#111122] p-8 text-center" data-testid="profile-signin-prompt">
            <p className="text-[#b3bac7]">Sign in to keep your scores, favorites and playtime across sessions.</p>
            <button
              onClick={() => navigate("/auth?mode=login")}
              data-testid="profile-signin-btn"
              className="mt-5 rounded-full bg-[#6c63ff] px-7 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Sign in
            </button>
          </div>
        )}

        {status === "error" && <p className="mt-12 text-sm text-[#a55]">Couldn't load your profile. Try again shortly.</p>}

        {status === "ok" && (
          <div className="mt-10 grid gap-6 pb-20 md:grid-cols-2">
            {achievements && (
              <section className="rounded-2xl border border-[#1a1a2e] bg-[#111122] p-6 md:col-span-2" data-testid="profile-achievements">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-[#ffd166]">
                  🏅 Achievements <span className="text-[#a3abbd]">({achievements.earned}/{achievements.badges.length})</span>
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {achievements.badges.map((b) => (
                    <div key={b.id} data-testid={`badge-${b.id}`}
                      className={`rounded-xl border p-3 text-center transition-opacity ${b.earned ? "border-[#ffd166]/50 bg-[#ffd166]/5" : "border-[#1a1a2e] opacity-40"}`}>
                      <p className="text-2xl">{b.icon}</p>
                      <p className={`mt-1 text-[15px] font-bold ${b.earned ? "text-[#ffd166]" : "text-[#a3abbd]"}`}>{b.title}</p>
                      <p className="mt-0.5 text-[15.5px] text-[#a3abbd]">{b.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <section className="rounded-2xl border border-[#1a1a2e] bg-[#111122] p-6" data-testid="profile-best-scores">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-amber-400">
                <Trophy size={14} /> Best scores
              </h2>
              <div className="mt-4 space-y-2">
                {profile.best_scores.length === 0 && <p className="text-sm text-[#9aa3b8]">No scores yet — go set a record!</p>}
                {profile.best_scores.map((s) => (
                  <div key={s.game_id} className="flex items-center justify-between rounded-xl border border-[#1a1a2e] px-4 py-2.5" data-testid={`profile-score-${s.game_id}`}>
                    <span className="text-sm text-[#ccc]">{s.title}</span>
                    <span className="text-sm font-bold text-white">{s.score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#1a1a2e] bg-[#111122] p-6" data-testid="profile-favorites">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-[#ff5c8a]">
                <Heart size={14} /> Favorite games
              </h2>
              <div className="mt-4 space-y-2">
                {profile.favorites.length === 0 && <p className="text-sm text-[#9aa3b8]">No favorites yet — tap the ♥ on any game.</p>}
                {profile.favorites.map((f) => (
                  <button
                    key={f.game_id}
                    onClick={() => navigate(`/games/play/${f.game_id}`)}
                    data-testid={`profile-favorite-${f.game_id}`}
                    className="flex w-full items-center justify-between rounded-xl border border-[#1a1a2e] px-4 py-2.5 text-left transition-colors hover:border-[#6c63ff]"
                  >
                    <span className="text-sm text-[#ccc]">{f.title}</span>
                    <Gamepad2 size={14} className="text-[#6c63ff]" />
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#1a1a2e] bg-[#111122] p-6 md:col-span-2" data-testid="profile-playtime">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-[#8b84ff]">
                <Clock size={14} /> Playtime by game
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.playtime.length === 0 && <p className="text-sm text-[#9aa3b8]">Play any game while signed in and your time will show up here.</p>}
                {profile.playtime.map((p) => (
                  <span key={p.game_id} className="rounded-full border border-[#2a2a44] px-4 py-1.5 text-sm text-[#c6ccd6]" data-testid={`profile-playtime-${p.game_id}`}>
                    {p.title}: <b className="text-white">{fmtTime(p.seconds)}</b>
                  </span>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
