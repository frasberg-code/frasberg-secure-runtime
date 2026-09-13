import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Gamepad2, AppWindow, ArrowUpRight } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TYPE_META = {
  website: { icon: Globe, hue: "#22d3ee", label: "Website" },
  game: { icon: Gamepad2, hue: "#a78bfa", label: "Game" },
  app: { icon: AppWindow, hue: "#4ade80", label: "App" },
};

const Card = ({ b, testable }) => {
  const meta = TYPE_META[b.type] || TYPE_META.website;
  const Icon = meta.icon;
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <Link to={b.type === "game" ? `/play/${b.slug}` : "/gallery"}
      className="marquee-card group" data-testid={testable ? `marquee-card-${b.slug}` : undefined}>
      <span className="marquee-shot">
        {imgFailed ? (
          <iframe src={`${API}/p/${b.slug}`} title={b.title} sandbox="allow-scripts"
            scrolling="no" tabIndex={-1} loading="lazy" />
        ) : (
          <img src={`/gallery-thumbs/${b.slug}.jpg`} alt={b.title} loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover object-top" />
        )}
      </span>
      <span className="flex items-center justify-between px-3.5 pb-3.5 pt-3">
        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-600 text-lux-text transition-colors group-hover:text-lux-accent">
            {b.title}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[15.5px] uppercase tracking-[0.2em]" style={{ color: meta.hue }}>
            <Icon size={10} /> {meta.label}
            {typeof b.plays === "number" && b.plays > 0 && <span className="text-lux-text2">· {b.plays} plays</span>}
          </span>
        </span>
        {b.featured && <span className="ml-2 shrink-0 rounded-full bg-lux-accent/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-lux-accent">★</span>}
      </span>
    </Link>
  );
};

export const GalleryMarquee = () => {
  const [builds, setBuilds] = useState([]);

  useEffect(() => {
    fetch(`${API}/builder/gallery`)
      .then((r) => r.json())
      .then((d) => {
        const sigOf = (t) => {
          const s = (t || "").toLowerCase();
          if (/tip calc|tip-calc|tipcalc|tiptap/.test(s)) return "tip-calculator";
          if (/pomodoro|focus tim/.test(s)) return "focus-timer";
          if (/color (flip|chang)|color-flip/.test(s)) return "color-flip";
          if (/todo|to-do/.test(s)) return "todo";
          return s.replace(/[^a-z0-9 ]/g, "").split(" ").filter(Boolean).slice(0, 3).join(" ");
        };
        const seen = new Set();
        const unique = [];
        for (const b of [...d.filter((x) => x.featured), ...d.filter((x) => !x.featured)]) {
          const sig = sigOf(b.title);
          if (seen.has(sig)) continue;
          seen.add(sig);
          unique.push(b);
        }
        setBuilds(unique.slice(0, 14));
      })
      .catch(() => {});
  }, []);

  if (builds.length === 0) return null;
  const rowA = builds.filter((_, i) => i % 2 === 0);
  const rowB = builds.filter((_, i) => i % 2 === 1);

  return (
    <section className="relative overflow-hidden border-y border-lux-border py-10" data-testid="gallery-marquee">
      <div className="mx-auto mb-6 flex max-w-7xl items-center justify-between px-5 sm:px-8">
        <p className="font-mono text-[15.5px] uppercase tracking-[0.25em] text-lux-text2">
          Builder Gallery — live sites, apps &amp; games made with Luchii
        </p>
        <Link to="/gallery" data-testid="marquee-gallery-link"
          className="inline-flex items-center gap-1 text-[15px] text-lux-accent hover:underline">
          Open gallery <ArrowUpRight size={12} />
        </Link>
      </div>

      <div className="marquee-mask space-y-4">
        <div className="marquee-track marquee-left" data-testid="marquee-row-1">
          {[...rowA, ...rowA].map((b, i) => <Card key={`a-${b.slug}-${i}`} b={b} testable={i < rowA.length} />)}
        </div>
        <div className="marquee-track marquee-right" data-testid="marquee-row-2">
          {[...rowB, ...rowB].map((b, i) => <Card key={`b-${b.slug}-${i}`} b={b} testable={false} />)}
        </div>
      </div>

      <style>{`
        .marquee-mask {
          overflow: hidden;
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
          mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
        }
        .marquee-track { display: flex; gap: 18px; width: max-content; will-change: transform; }
        .marquee-left { animation: marqueeL 70s linear infinite; }
        .marquee-right { animation: marqueeR 78s linear infinite; }
        .marquee-mask:hover .marquee-track { animation-play-state: paused; }
        .marquee-card {
          width: 300px; flex-shrink: 0; overflow: hidden;
          border: 1px solid var(--lux-border, rgba(128,128,160,0.2));
          border-radius: 18px; background: var(--lux-surface, rgba(128,128,160,0.05));
          transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
        }
        .marquee-card:hover { transform: translateY(-4px); border-color: var(--lux-accent, #4f7cff); box-shadow: 0 12px 40px rgba(0,0,0,0.18); }
        .marquee-shot {
          display: block; position: relative; width: 100%; height: 170px;
          overflow: hidden; background: #0b0e14; pointer-events: none;
        }
        .marquee-shot iframe {
          width: 1200px; height: 680px; border: 0;
          transform: scale(0.25); transform-origin: top left;
          pointer-events: none;
        }
        @keyframes marqueeL {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes marqueeR {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) { .marquee-track { animation: none; } }
      `}</style>
    </section>
  );
};
