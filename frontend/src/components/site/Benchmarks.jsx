import Reveal, { Overline } from "./Reveal";
import { BENCHMARKS } from "../../data/content";

const COLS = [
  { key: "1b", label: "Luchii-1B" },
  { key: "7b", label: "Luchii-7B" },
  { key: "70b", label: "Luchii-70B" },
];

export default function Benchmarks() {
  return (
    <section id="benchmarks" className="border-y border-lux-border bg-lux-surface/40">
      <div className="mx-auto max-w-6xl px-5 pt-8 pb-24 sm:px-8">
        <Reveal>
          <Overline>Evaluation</Overline>
          <h2 className="mt-4 font-display text-4xl font-700 tracking-tighter text-lux-text sm:text-5xl">
            Benchmarks, unvarnished.
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-14 overflow-x-auto" data-testid="benchmarks-table">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-lux-border">
                  <th className="py-4 font-mono text-xs uppercase tracking-[0.2em] text-lux-text2">Benchmark</th>
                  {COLS.map((c) => (
                    <th key={c.key} className="py-4 font-mono text-xs uppercase tracking-[0.2em] text-lux-text2">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BENCHMARKS.map((b) => {
                  const max = Math.max(...COLS.map((c) => b.scores[c.key]));
                  return (
                    <tr key={b.name} className="border-b border-lux-border/60">
                      <td className="py-5 font-display text-lg font-500 text-lux-text">{b.name}</td>
                      {COLS.map((c) => (
                        <td key={c.key} className="py-5">
                          <span className={`font-mono text-lg ${b.scores[c.key] === max ? "text-lux-accent" : "text-lux-text2"}`}>
                            {b.scores[c.key]}
                          </span>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Reveal>
        <p className="mt-6 font-mono text-xs text-lux-text2">
          * Representative figures from standard suites — reproducible scripts on request.
        </p>
      </div>
    </section>
  );
}
