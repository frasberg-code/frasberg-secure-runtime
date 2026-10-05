import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export const CollapsibleSection = ({ anchor, title, subtitle, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef(null);

  useEffect(() => {
    const check = () => {
      if (anchor && window.location.hash === `#${anchor}`) {
        setOpen(true);
        setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      }
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [anchor]);

  return (
    <section ref={ref} className="border-t border-lux-border scroll-mt-20" id={open ? undefined : anchor}>
      <button
        onClick={() => setOpen((o) => !o)}
        data-testid={`section-toggle-${anchor || title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
        aria-expanded={open}
        className="group mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-7 text-left sm:px-8"
      >
        <div>
          <h2 className="font-display text-xl font-700 tracking-tight text-lux-text sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-lux-text2">{subtitle}</p>}
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-lux-border transition-colors duration-200 group-hover:border-lux-accent group-hover:text-lux-accent ${open ? "text-lux-accent" : "text-lux-text2"}`}>
          <ChevronDown size={18} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <div className={open ? "block" : "hidden"}>{children}</div>
    </section>
  );
};
