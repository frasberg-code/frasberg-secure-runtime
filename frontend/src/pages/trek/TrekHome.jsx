import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Star, Clock, TrendingUp, MapPin, Loader2 } from "lucide-react";
import { TrekNav, TrekFooter } from "../../components/trek/TrekNav";
import Seo from "../../components/site/Seo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api/trek`;

const DIFF_COLORS = {
  Easy: "bg-emerald-100 text-emerald-800",
  Moderate: "bg-amber-100 text-amber-800",
  Challenging: "bg-orange-100 text-orange-800",
  Extreme: "bg-red-100 text-red-800",
};

export default function TrekHome() {
  const [treks, setTreks] = useState(null);
  const [countries, setCountries] = useState([]);
  const [difficulties, setDifficulties] = useState([]);
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [country, setCountry] = useState("");
  const [sort, setSort] = useState("rating");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (difficulty) params.set("difficulty", difficulty);
    if (country) params.set("country", country);
    if (sort) params.set("sort", sort);
    try {
      const res = await fetch(`${API}/treks?${params}`);
      const data = await res.json();
      setTreks(data.treks || []);
      setCountries(data.countries || []);
      setDifficulties(data.difficulties || []);
    } catch {
      setTreks([]);
    }
  }, [q, difficulty, country, sort]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  return (
    <main className="min-h-screen bg-[#f6f3ec] text-[#1f2a24]" data-testid="trek-home-page">
      <Seo title="Frasberg Treks — Book World-Class Trekking Expeditions" description="Book Everest Base Camp, Annapurna, Kilimanjaro, Inca Trail and more. Guided trekking expeditions by Frasberg Treks." />
      <TrekNav />

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-8 sm:pt-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#c2701e]">Expeditions · 2026 Season</p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-700 leading-[1.05] tracking-tighter sm:text-5xl lg:text-6xl">
              The world's greatest trails, <span className="text-[#2d5a3d]">booked in minutes.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-[#4a5a50] sm:text-lg">
              Hand-crafted guided treks across the Himalaya, Andes, Alps and Africa —
              permits, guides, meals and mountain lodging all included.
            </p>
          </motion.div>

          <div className="mt-10 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-[#e4ddd0] bg-white px-5 transition-colors focus-within:border-[#2d5a3d]">
              <Search size={17} className="shrink-0 text-[#7a8a80]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search treks, regions…"
                data-testid="trek-search-input"
                className="w-full bg-transparent py-3.5 text-base outline-none placeholder:text-[#9aa8a0]"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} data-testid="trek-filter-difficulty"
                className="rounded-2xl border border-[#e4ddd0] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#2d5a3d]">
                <option value="">All difficulties</option>
                {difficulties.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={country} onChange={(e) => setCountry(e.target.value)} data-testid="trek-filter-country"
                className="rounded-2xl border border-[#e4ddd0] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#2d5a3d]">
                <option value="">All countries</option>
                {countries.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value)} data-testid="trek-sort-select"
                className="rounded-2xl border border-[#e4ddd0] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#2d5a3d]">
                <option value="rating">Top rated</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="duration">Shortest first</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-8">
        {treks === null ? (
          <div className="grid place-items-center py-24"><Loader2 size={28} className="animate-spin text-[#2d5a3d]" /></div>
        ) : treks.length === 0 ? (
          <div className="rounded-3xl border border-[#e4ddd0] bg-white p-12 text-center text-[#4a5a50]" data-testid="trek-empty-state">
            No treks match your filters — try clearing your search.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="trek-grid">
            {treks.map((t, i) => (
              <motion.div key={t.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.05 }}>
                <Link
                  to={`/trek/${t.slug}`}
                  data-testid={`trek-card-${t.slug}`}
                  className="group block overflow-hidden rounded-3xl border border-[#e4ddd0] bg-white transition-shadow duration-300 hover:shadow-xl"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img src={t.image} alt={t.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-600 ${DIFF_COLORS[t.difficulty] || "bg-white"}`}>
                      {t.difficulty}
                    </span>
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-600 text-[#1f2a24]">
                      <Star size={11} className="fill-amber-400 text-amber-400" /> {t.rating}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#c2701e]">
                      <MapPin size={11} /> {t.region}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-700 tracking-tight">{t.name}</h3>
                    <div className="mt-3 flex items-center gap-4 text-xs text-[#4a5a50]">
                      <span className="inline-flex items-center gap-1"><Clock size={12} /> {t.duration_days} days</span>
                      <span className="inline-flex items-center gap-1"><TrendingUp size={12} /> {t.max_altitude_m.toLocaleString()} m</span>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between border-t border-[#efeadf] pt-4">
                      <span className="text-sm text-[#7a8a80]">from</span>
                      <span className="font-display text-2xl font-700 text-[#2d5a3d]">${t.price_usd.toLocaleString()}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <TrekFooter />
    </main>
  );
}
