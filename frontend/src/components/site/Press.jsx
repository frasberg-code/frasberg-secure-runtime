import Reveal, { Overline } from "./Reveal";
import { CAMPAIGN } from "../../data/content";

export default function Press() {
  return (
    <section id="press" className="border-t border-lux-border">
      <div className="mx-auto max-w-7xl px-5 py-28 sm:px-8">
        <Reveal>
          <Overline>Launch campaign</Overline>
          <h2 className="mt-4 max-w-3xl font-display text-4xl font-700 tracking-tighter text-lux-text sm:text-5xl">
            {CAMPAIGN.slogan}
          </h2>
        </Reveal>

        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
          {CAMPAIGN.lines.map((l, i) => (
            <Reveal key={l} delay={i * 0.05}>
              <span className="font-display text-lg font-300 text-lux-text2">“{l}”</span>
            </Reveal>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CAMPAIGN.pillars.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.06}>
              <div className="h-full rounded-2xl border border-lux-border bg-lux-surface p-7">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-accent">
                  0{i + 1}
                </span>
                <h3 className="mt-4 font-display text-2xl font-600 tracking-tight text-lux-text">{p.name}</h3>
                <p className="mt-2 text-sm text-lux-text2">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-14 flex flex-col gap-4 rounded-2xl border border-lux-border bg-lux-surface/40 p-8 sm:flex-row sm:items-center sm:justify-between">
            {CAMPAIGN.timeline.map((t, i) => (
              <div key={t.week} className="flex items-center gap-4">
                <span className="font-mono text-xs text-lux-accent">{t.week}</span>
                <span className="font-display text-lg text-lux-text">{t.label}</span>
                {i < CAMPAIGN.timeline.length - 1 && (
                  <span className="hidden h-px w-10 bg-lux-border sm:inline-block" />
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
