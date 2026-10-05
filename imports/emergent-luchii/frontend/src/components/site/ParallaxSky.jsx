import Starfield from "./Starfield";

// Same interactive starfield as the homepage — stars drift and link to the
// user's cursor with accent constellation lines. No background tint.
export const ParallaxSky = () => (
  <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true" data-testid="parallax-sky">
    <Starfield />
  </div>
);
