import Marquee from "react-fast-marquee";
import Reveal, { Overline } from "./Reveal";
import { ECOSYSTEM } from "../../data/content";

const LOGOS = [
  { name: "Frasberg AI", slug: "frasberg-ai", src: "/frasberg-emblem.png", spin: true },
  { name: "Luchii", slug: "luchii", src: "/luchii-mark.jpg", spin: true },
  { name: "Python", slug: "python" },
  { name: "JavaScript", slug: "javascript" },
  { name: "Go", slug: "go" },
  { name: "React", slug: "react" },
  { name: "Node.js", slug: "nodedotjs" },
  { name: "Next.js", slug: "nextdotjs" },
  { name: "FastAPI", slug: "fastapi" },
  { name: "LangChain", slug: "langchain" },
  { name: "Hugging Face", slug: "huggingface" },
  { name: "GitHub", slug: "github" },
  { name: "Discord", slug: "discord" },
  { name: "Zapier", slug: "zapier" },
  { name: "Jupyter", slug: "jupyter" },
  { name: "Postman", slug: "postman" },
  { name: "Docker", slug: "docker" },
  { name: "Kubernetes", slug: "kubernetes" },
  { name: "Vercel", slug: "vercel" },
];

export default function Ecosystem() {
  return (
    <section id="ecosystem" className="border-y border-lux-border bg-lux-surface/40">
      <div className="mx-auto max-w-7xl px-5 py-28 sm:px-8">
        <Reveal>
          <Overline>Scale & ecosystem</Overline>
          <h2 className="mt-4 max-w-3xl font-display text-4xl font-700 tracking-tighter text-lux-text sm:text-5xl">
            Built for scale. Ready to connect.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {ECOSYSTEM.pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.07}>
              <div className="h-full rounded-2xl border border-lux-border bg-lux-surface p-8">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-accent">0{i + 1}</span>
                <h3 className="mt-4 font-display text-xl font-600 tracking-tight text-lux-text">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-lux-text2">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-lux-border bg-lux-border sm:grid-cols-4">
            {ECOSYSTEM.stats.map((s) => (
              <div key={s.label} className="bg-lux-surface p-7 text-center">
                <p className="font-display text-4xl font-700 accent-grad">{s.value}</p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-lux-text2">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="relative mt-12" data-testid="integration-logo-marquee">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-lux-bg to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-lux-bg to-transparent" />
            <Marquee speed={36} gradient={false} pauseOnHover autoFill>
              {LOGOS.map((l) => (
                <div
                  key={l.slug}
                  className="group mx-5 flex items-center gap-3 opacity-60 transition-opacity duration-300 hover:opacity-100"
                  data-testid={`integration-logo-${l.slug}`}
                >
                  <img
                    src={l.src || `https://cdn.simpleicons.org/${l.slug}/8B949E`}
                    alt={l.name}
                    loading="lazy"
                    className={l.spin
                      ? "turn-step h-7 w-7 rounded-full"
                      : "h-7 w-7 grayscale transition-all duration-300 group-hover:grayscale-0"}
                    style={l.spin ? undefined : { filter: "grayscale(1)" }}
                  />
                  <span className="font-mono text-xs text-lux-text2 transition-colors duration-300 group-hover:text-lux-text">{l.name}</span>
                </div>
              ))}
            </Marquee>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
