import Reveal, { Overline } from "./Reveal";
import { SAFETY_POINTS } from "../../data/content";

export default function Safety() {
  return (
    <section id="safety" className="border-t border-lux-border">
      <div className="mx-auto max-w-4xl px-5 pt-8 pb-24 sm:px-8">
        <Reveal>
          <Overline>Safety & governance</Overline>
          <h2 className="mt-6 font-display text-3xl font-300 leading-tight tracking-tight text-lux-text sm:text-4xl lg:text-5xl">
            Luchii avoids harm, refuses the unsafe, and{" "}
            <span className="accent-grad">keeps balance across every realm.</span>
          </h2>
        </Reveal>

        <div className="mt-12 flex flex-wrap gap-3">
          {SAFETY_POINTS.map((p, i) => (
            <Reveal key={p} delay={i * 0.05}>
              <span
                data-testid={`safety-${i}`}
                className="inline-block rounded-full border border-lux-border px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-lux-text2"
              >
                {p}
              </span>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2}>
          <p className="mt-10 max-w-2xl text-lux-text2">
            User controls include temperature, max tokens and a safety-mode
            toggle. Not a medical or legal advisor — a safety layer is required
            in production.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
