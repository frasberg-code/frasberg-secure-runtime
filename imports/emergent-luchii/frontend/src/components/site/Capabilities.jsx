import Reveal, { Overline } from "./Reveal";
import { CAPABILITIES } from "../../data/content";

export default function Capabilities() {
  return (
    <section id="capabilities" className="mx-auto max-w-7xl px-5 pt-8 pb-24 sm:px-8">
      <Reveal>
        <Overline>Capabilities</Overline>
        <h2 className="mt-4 max-w-2xl font-display text-4xl font-700 tracking-tighter text-lux-text sm:text-5xl">
          Built to reason across worlds.
        </h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
        {CAPABILITIES.map((c, i) => (
          <Reveal key={c.title} delay={i * 0.05} className={c.span}>
            <div
              data-testid={`capability-${i}`}
              className="group h-full rounded-2xl border border-lux-border bg-lux-surface p-8 transition-colors duration-300 hover:border-lux-accent"
            >
              <h3 className="font-display text-xl font-600 tracking-tight text-lux-text">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-lux-text2">{c.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
