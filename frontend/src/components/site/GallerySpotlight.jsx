import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gamepad2, ArrowUpRight, Hammer } from "lucide-react";
import Reveal, { Overline } from "./Reveal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ROTATE_MS = 9000;

export const GallerySpotlight = () => {
  const [builds, setBuilds] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetch(`${API}/builder/gallery`)
      .then((r) => r.json())
      .then((d) => setBuilds([...d.filter((b) => b.featured), ...d.filter((b) => !b.featured)].slice(0, 5)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (builds.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % builds.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [builds.length]);

  const b = builds[idx];
  if (!b) return null;

  return (
    <section className="relative mx-auto max-w-6xl px-5 pt-8 pb-20 sm:px-8" data-testid="gallery-spotlight">
      <Reveal>
        <Overline>From the Gallery — built by Luchii</Overline>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <h2 className="max-w-xl font-display text-3xl font-700 tracking-tighter sm:text-4xl">
            Don't take our word for it. <span className="text-lux-accent">Play it.</span>
          </h2>
          <div className="flex gap-1.5" data-testid="spotlight-dots">
            {builds.map((x, i) => (
              <button key={x.slug} onClick={() => setIdx(i)} aria-label={`Show ${x.title}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-7 bg-lux-accent" : "w-3 bg-lux-border hover:bg-lux-text2"}`} />
            ))}
          </div>
        </div>
      </Reveal>

      <div className="mt-8 overflow-hidden rounded-3xl border border-lux-border bg-lux-surface/60">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lux-border px-5 py-3">
          <p className="flex items-center gap-2 font-mono text-[15.5px] uppercase tracking-[0.2em] text-lux-text2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            {b.title} · live {b.type}
            {typeof b.plays === "number" && b.plays > 0 && <span className="opacity-60">· {b.plays} plays</span>}
          </p>
          <div className="flex gap-2">
            {b.type === "game" && (
              <Link to={`/play/${b.slug}`} data-testid="spotlight-play-link"
                className="inline-flex items-center gap-1.5 rounded-full bg-lux-accent px-4 py-1.5 text-[15px] font-600 text-lux-bg transition-transform hover:-translate-y-0.5">
                <Gamepad2 size={12} /> Play fullscreen
              </Link>
            )}
            <Link to={`/${b.type === "game" ? "game" : "website"}-builder`} data-testid="spotlight-build-link"
              className="inline-flex items-center gap-1.5 rounded-full border border-lux-border px-4 py-1.5 text-[15px] text-lux-text2 transition-colors hover:border-lux-accent hover:text-lux-text">
              <Hammer size={12} /> Build your own <ArrowUpRight size={11} />
            </Link>
          </div>
        </div>
        <iframe key={b.slug} title={b.title} src={`${API}/p/${b.slug}`} sandbox="allow-scripts allow-modals"
          data-testid="spotlight-iframe" className="h-[480px] w-full border-0 bg-[#07090f]" loading="lazy" />
      </div>
    </section>
  );
};
