import Reveal, { Overline } from "./Reveal";
import { MODELS } from "../../data/content";

function Card({ m, i }) {
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <Reveal delay={i * 0.08}>
      <div
        onMouseMove={onMove}
        data-testid={`model-card-${m.id}`}
        className="tracing-card group h-full rounded-2xl border border-lux-border bg-lux-surface p-7 transition-transform duration-300 hover:-translate-y-1.5"
      >
        <div className="flex items-start justify-between">
          <span className="font-mono text-[15px] uppercase tracking-[0.2em] text-lux-accent">{m.tier}</span>
          <span className="font-mono text-[15px] text-lux-text2">{m.ctx} ctx</span>
        </div>
        <h3 className="mt-5 font-display text-2xl font-600 tracking-tight text-lux-text">{m.name}</h3>
        <p className="mt-1 font-mono text-[15px] text-lux-text2">{m.params} params</p>
        <p className="mt-4 text-sm leading-relaxed text-lux-text2">{m.blurb}</p>
        <ul className="mt-6 space-y-1.5 border-t border-lux-border pt-5">
          {m.specs.map((s) => (
            <li key={s} className="flex items-center gap-2 font-mono text-[15px] text-lux-text2">
              <span className="h-1 w-1 rounded-full bg-lux-accent" /> {s}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

export default function Models() {
  return (
    <section id="models" className="mx-auto max-w-7xl px-5 py-28 sm:px-8">
      <Reveal>
        <Overline>The family</Overline>
        <h2 className="mt-4 max-w-2xl font-display text-4xl font-700 tracking-tighter text-lux-text sm:text-5xl">
          Four tiers. One continuum.
        </h2>
        <p className="mt-4 max-w-xl text-lux-text2">
          Scale from a lightning draft model to frontier-class cognition — same
          tokenizer, same alignment, seamless routing.
        </p>
      </Reveal>
      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {MODELS.map((m, i) => <Card key={m.id} m={m} i={i} />)}
      </div>
    </section>
  );
}
