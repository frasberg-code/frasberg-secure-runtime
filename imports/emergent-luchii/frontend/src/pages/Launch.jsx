import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Rocket, ShieldCheck, GitBranch, Globe, Sparkles, Play, X, Volume2, VolumeX } from "lucide-react";
import { ParallaxSky } from "../components/site/ParallaxSky";
import { CognitionPreview } from "../components/site/CognitionPreview";

const STORY = [
  ["Cognition nodes ignite.", 0], ["Region rings pulse.", 1],
  ["Intelligence is evolving.", 2], ["Autonomy is governed.", 2], ["Safety is built in.", 2],
  ["Marketplace v3", 3],
];

function Storyboard({ onClose }) {
  const [i, setI] = useState(0);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef(null);
  useEffect(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const master = ctx.createGain();
      master.gain.value = 0.05;
      master.connect(ctx.destination);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 620;
      filter.connect(master);
      [110, 110.8, 164.8].forEach((f) => {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = 0.5;
        o.connect(g);
        g.connect(filter);
        o.start();
      });
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.09;
      const lg = ctx.createGain();
      lg.gain.value = 0.02;
      lfo.connect(lg);
      lg.connect(master.gain);
      lfo.start();
      audioRef.current = { ctx, master };
      return () => { try { ctx.close(); } catch {} };
    } catch { return undefined; }
  }, []);
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.master.gain.value = muted ? 0 : 0.05;
  }, [muted]);
  useEffect(() => {
    const a = audioRef.current;
    if (!a || muted) return;
    try {
      const { ctx } = a;
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = i >= STORY.length - 1 ? 880 : 440 + i * 65;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 1.1);
    } catch {}
  }, [i, muted]);
  useEffect(() => {
    if (i >= STORY.length - 1) { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }
    const t = setTimeout(() => setI(i + 1), 1900);
    return () => clearTimeout(t);
  }, [i, onClose]);
  const [text, phase] = STORY[i];
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/95 backdrop-blur" data-testid="launch-storyboard">
      <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-white" data-testid="storyboard-close"><X size={22} /></button>
      <button onClick={() => setMuted(!muted)} className="absolute right-16 top-6 text-gray-400 hover:text-white" data-testid="storyboard-mute" title={muted ? "Unmute soundtrack" : "Mute soundtrack"}>
        {muted ? <VolumeX size={21} /> : <Volume2 size={21} />}
      </button>
      <div className="relative grid h-72 w-72 place-items-center">
        {phase === 0 && [0, 1, 2, 3, 4, 5].map((k) => (
          <span key={k} className="absolute h-3 w-3 animate-ping rounded-full bg-cyan-400"
            style={{ left: `${18 + (k * 37) % 70}%`, top: `${15 + (k * 53) % 70}%`, animationDelay: `${k * 0.22}s` }} />
        ))}
        {phase === 1 && [0, 1, 2].map((k) => (
          <span key={k} className="absolute animate-ping rounded-full border-2 border-cyan-400/60"
            style={{ inset: `${k * 34}px`, animationDuration: "1.8s", animationDelay: `${k * 0.4}s` }} />
        ))}
        {phase === 3 && <img src="/frasberg-mark-circle.png" alt="Frasberg" className="h-28 w-28 animate-pulse rounded-full" />}
      </div>
      <p key={i} className="absolute bottom-[22%] px-6 text-center font-display text-3xl font-700 tracking-tight sm:text-4xl"
        style={{ backgroundImage: "linear-gradient(90deg,#4A6CF7,#00D1FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "fadeInUp 0.7s ease both" }}
        data-testid="storyboard-caption">
        {text}
      </p>
      {phase === 3 && <p className="absolute bottom-[15%] font-mono text-[15px] uppercase tracking-[0.3em] text-gray-400">Deploy Intelligence. Safely.</p>}
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

const grad = { backgroundImage: "linear-gradient(90deg,#4A6CF7,#00D1FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" };
const gradBg = { backgroundImage: "linear-gradient(90deg,#4A6CF7,#00D1FF)" };

const CAMPAIGNS = [
  [Rocket, "Deploy Intelligence. Safely.", "A cognition-aware marketplace for autonomous agents — every deployment passes the GSS-2 safety validator before it ships.", "/marketplace/deploy", "Open deploy wizard"],
  [ShieldCheck, "Governed Autonomy.", "Safety isn't optional. It's engineered. Membrane. Hinge. Classifier. Ethics. Governed autonomy starts here.", "/marketplace/safety", "See the safety suite"],
  [GitBranch, "Agents that Grow.", "Agents grow. Lineages expand. Evolution is controlled, safe, and governed — every validated cycle tracked.", "/marketplace/evolution", "Explore lineages"],
  [Globe, "Intelligence Everywhere.", "Regions aren't just servers. They're autonomous zones. They scale, failover, collaborate — and heal themselves.", "/marketplace/regions", "View the global mesh"],
];

const FADE = "transition-all duration-700";

export default function Launch() {
  const [on, setOn] = useState(false);
  const [video, setVideo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 80); return () => clearTimeout(t); }, []);
  const reveal = (i) => `${FADE} ${on ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}` + ` delay-[${i * 150}ms]`;
  return (
    <main className="relative min-h-screen overflow-hidden text-white" style={{ background: "#08090A" }} data-testid="launch-page">
      <ParallaxSky />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[880px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]" style={gradBg} />

      <section className="relative z-10 mx-auto max-w-5xl px-5 pt-28 pb-16 text-center">
        <img src="/frasberg-mark-circle.png" alt="Frasberg" data-testid="launch-hero-logo"
          className={`mx-auto mb-6 h-16 w-16 rounded-full ${reveal(0)}`} style={{ transitionDelay: "0ms", boxShadow: "0 0 44px rgba(0,240,255,0.35)" }} />
        <p className={`font-mono text-[14px] uppercase tracking-[0.35em] text-cyan-300 ${reveal(0)}`} style={{ transitionDelay: "0ms" }}>
          Frasberg presents
        </p>
        <h1 className={`mt-5 font-display text-5xl font-800 leading-[1.05] tracking-tight sm:text-6xl ${reveal(1)}`} style={{ ...grad, transitionDelay: "150ms" }} data-testid="launch-hero-title">
          Deploy Intelligence.<br />Safely.
        </h1>
        <p className={`mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-gray-300 ${reveal(2)}`} style={{ transitionDelay: "300ms" }}>
          Intelligence is evolving. Autonomy is governed. Safety is built in.
          <span className="block mt-1 font-600 text-white">Welcome to Marketplace v3.</span>
        </p>
        <div className={`mx-auto mt-8 max-w-md rounded-2xl border border-white/10 bg-black/30 px-6 py-3 backdrop-blur ${reveal(3)}`} style={{ transitionDelay: "450ms" }}>
          <CognitionPreview seed="marketplace-v3-launch" labels />
        </div>
        <div className={`mt-9 flex flex-wrap justify-center gap-3 ${reveal(4)}`} style={{ transitionDelay: "600ms" }}>
          <Link to="/marketplace" data-testid="launch-cta-marketplace"
            className="flex items-center gap-2 rounded-full px-7 py-3 text-[14.5px] font-700 text-black transition-opacity hover:opacity-85" style={gradBg}>
            Enter the Marketplace <ArrowRight size={15} />
          </Link>
          <Link to="/playground" data-testid="launch-cta-playground"
            className="rounded-full border border-white/25 px-7 py-3 text-[14.5px] font-600 text-gray-200 transition-colors hover:border-cyan-400 hover:text-cyan-300">
            Build a cognition graph
          </Link>
          <button onClick={() => setVideo(true)} data-testid="launch-play-storyboard"
            className="flex items-center gap-2 rounded-full border border-cyan-400/50 px-7 py-3 text-[14.5px] font-600 text-cyan-300 transition-colors hover:border-cyan-300">
            <Play size={14} /> Play storyboard
          </button>
        </div>
      </section>
      {video && <Storyboard onClose={() => setVideo(false)} />}

      <section className="relative z-10 mx-auto max-w-6xl px-5 py-10">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2" data-testid="launch-campaigns">
          {CAMPAIGNS.map(([Icon, title, body, to, cta], i) => (
            <div key={title} className="group rounded-2xl border border-white/10 bg-black/30 p-7 backdrop-blur transition-colors hover:border-cyan-400/40" data-testid={`launch-campaign-${i}`}>
              <Icon size={20} className="text-cyan-300" />
              <h2 className="mt-4 font-display text-2xl font-700 tracking-tight" style={grad}>{title}</h2>
              <p className="mt-3 text-[14px] leading-relaxed text-gray-300">{body}</p>
              <Link to={to} className="mt-5 inline-flex items-center gap-1.5 text-[15.5px] font-600 text-cyan-300 transition-transform group-hover:translate-x-1">
                {cta} <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-5 py-14" data-testid="launch-press-release">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur sm:p-10">
          <p className="font-mono text-[14px] uppercase tracking-[0.3em] text-gray-500">For immediate release</p>
          <h3 className="mt-4 font-display text-2xl font-700 leading-snug tracking-tight sm:text-3xl">
            Frasberg Announces Marketplace v3 — The World's First Cognition-Native Agent Marketplace
          </h3>
          <p className="mt-4 text-[14.5px] leading-relaxed text-gray-300">
            <span className="font-mono text-gray-400">Las Vegas, NV —</span> Frasberg today unveiled Marketplace v3, a cognition-aware platform where autonomous agents can be deployed, evolved, and governed safely across global regions.
          </p>
          <ul className="mt-5 space-y-2">
            {["Cognition Graph v2 visualization", "Safety Suite v3 governance", "Evolution Engine v3 lineage tracking", "AIM v2 multi-region deployment with self-healing mesh", "Fully redesigned UI and motion system"].map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[14px] text-gray-200">
                <Sparkles size={13} className="mt-1 shrink-0 text-cyan-300" /> {f}
              </li>
            ))}
          </ul>
          <blockquote className="mt-7 border-l-2 border-cyan-400 pl-5">
            <p className="font-display text-lg italic text-white/90">"Marketplace v3 is where intelligence becomes deployable."</p>
            <p className="mt-2 font-mono text-[14.5px] text-gray-400">— Mr. Clayton-M. Bernard-Ex., AKA, Frasberg Selassie, creator of Frasberg, Luchii and LINQ</p>
          </blockquote>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-5 pb-24 text-center">
        <h2 className="font-display text-3xl font-700 tracking-tight" style={grad}>Cognition you can trust.</h2>
        <p className="mt-3 text-[14.5px] text-gray-300">Meet the agents that evolve. Safety isn't optional — it's built in.</p>
        <Link to="/marketplace" data-testid="launch-footer-cta"
          className="mt-7 inline-flex items-center gap-2 rounded-full px-8 py-3 text-[14.5px] font-700 text-black transition-opacity hover:opacity-85" style={gradBg}>
          Deploy your first agent <ArrowRight size={15} />
        </Link>
      </section>
    </main>
  );
}
