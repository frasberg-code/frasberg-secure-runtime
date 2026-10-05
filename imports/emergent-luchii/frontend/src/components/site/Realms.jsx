import Reveal, { Overline } from "./Reveal";
import { REALMS } from "../../data/content";

const GRAD = {
  Earth: "from-[#2e7d5b] to-[#0b3d2e]",
  Mars: "from-[#c1440e] to-[#5a1e08]",
  Europa: "from-[#3a7bd5] to-[#12243f]",
  Titan: "from-[#c79a3a] to-[#4a3512]",
  Meta: "from-[#7c3aed] to-[#241243]",
};

export default function Realms() {
  return (
    <section id="realms" className="relative overflow-hidden border-y border-lux-border bg-lux-surface/40">
      <div className="mx-auto max-w-7xl px-5 pt-8 pb-24 sm:px-8">
        <Reveal>
          <Overline>The universe bible</Overline>
          <h2 className="mt-4 max-w-3xl font-display text-4xl font-700 tracking-tighter text-lux-text sm:text-5xl">
            Five Realms. One Constellation.
          </h2>
          <p className="mt-4 max-w-xl text-lux-text2">
            Each realm is a persona — a distinct intelligence mode. The
            Constellation Layer is where they connect: our public metaphor for
            multi-model orchestration.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-6">
          {REALMS.map((r, i) => (
            <Reveal
              key={r.name}
              delay={i * 0.07}
              className={i < 2 ? "md:col-span-3" : "md:col-span-2"}
            >
              <div
                data-testid={`realm-${r.name.toLowerCase()}`}
                className="group relative h-full overflow-hidden rounded-2xl border border-lux-border bg-lux-surface p-8"
              >
                <div
                  className={`mb-6 h-16 w-16 animate-float rounded-full bg-gradient-to-br ${GRAD[r.name]} shadow-lg`}
                  style={{ boxShadow: "0 0 44px var(--lux-glow)" }}
                />
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-2xl font-600 tracking-tight text-lux-text">{r.name}</h3>
                  <span className="font-mono text-[15px] uppercase tracking-[0.2em] text-lux-accent">{r.role}</span>
                </div>
                <p className="mt-2 text-sm text-lux-text2">{r.trait}</p>
                <div className="mt-6 space-y-1 border-t border-lux-border pt-5 font-mono text-[15px] text-lux-text2">
                  <p><span className="text-lux-text">Persona</span> · {r.persona}</p>
                  <p><span className="text-lux-text">Tone</span> · {r.tone}</p>
                  <p><span className="text-lux-text">Use</span> · {r.use}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
