import Marquee from "react-fast-marquee";
import { MARQUEE_TEXT } from "../../data/content";

export default function EditorialMarquee() {
  return (
    <div className="border-y border-lux-border py-6" data-testid="marquee">
      <Marquee speed={38} gradient={false} autoFill>
        {MARQUEE_TEXT.map((t, i) => (
          <span key={i} className="mx-12 inline-flex items-center gap-12">
            <span className="font-display text-2xl font-300 tracking-tight text-lux-text2 sm:text-3xl">
              {t}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-lux-accent" />
          </span>
        ))}
      </Marquee>
    </div>
  );
}
