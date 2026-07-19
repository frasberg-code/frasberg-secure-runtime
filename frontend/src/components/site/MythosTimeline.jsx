import Reveal, { Overline } from "./Reveal";
import { TIMELINE } from "../../data/content";

export default function MythosTimeline() {
  return (
    <section id="mythos" className="mx-auto max-w-5xl px-5 py-28 sm:px-8">
      <Reveal>
        <Overline>Mythos timeline</Overline>
        <h2 className="mt-4 font-display text-4xl font-700 tracking-tighter text-lux-text sm:text-5xl">
          The evolution of listening.
        </h2>
      </Reveal>

      <div className="relative mt-16 border-l border-lux-border pl-8 sm:pl-14">
        {TIMELINE.map((t, i) => (
          <Reveal key={t.phase} delay={i * 0.04}>
            <div className="group relative pb-14 last:pb-0" data-testid={`timeline-${t.phase}`}>
              <span className="absolute -left-[41px] top-2 h-3 w-3 rounded-full border border-lux-accent bg-lux-bg transition-colors duration-300 group-hover:bg-lux-accent sm:-left-[65px]" />
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
                <span className="font-display text-5xl font-300 leading-none text-lux-text2/40 sm:text-6xl">
                  {t.phase}
                </span>
                <div>
                  <h3 className="font-display text-xl font-600 tracking-tight text-lux-text">{t.title}</h3>
                  <p className="mt-1 text-sm text-lux-text2">{t.desc}</p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
