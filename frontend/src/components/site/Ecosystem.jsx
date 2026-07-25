import Reveal, { Overline } from "./Reveal";
import { ECOSYSTEM } from "../../data/content";

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
          <div className="mt-10 flex flex-wrap gap-3" data-testid="integration-grid">
            {ECOSYSTEM.integrations.map((name) => (
              <span
                key={name}
                className="rounded-full border border-lux-border bg-lux-surface px-4 py-2 font-mono text-xs text-lux-text2 transition-colors duration-200 hover:border-lux-accent hover:text-lux-text"
              >
                {name}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
