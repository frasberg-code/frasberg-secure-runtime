export default function Footer() {
  return (
    <footer className="border-t border-lux-border" data-testid="site-footer">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <img src="/luchii-logo.webp" alt="Frasberg Luchii" className="h-9 w-9 rounded-full ring-1 ring-lux-accent/40" />
              <span className="font-display text-lg font-700 tracking-tight text-lux-text">Luchii</span>
            </div>
            <p className="mt-4 text-sm text-lux-text2">
              Luchii v12 is not the next version. It is the next era. Built by
              Frasberg.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 font-mono text-sm sm:grid-cols-3">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-lux-text2">Models</p>
              <ul className="space-y-2 text-lux-text2">
                <li><a href="#models" className="hover:text-lux-text">200M</a></li>
                <li><a href="#models" className="hover:text-lux-text">1B</a></li>
                <li><a href="#models" className="hover:text-lux-text">7B</a></li>
                <li><a href="#models" className="hover:text-lux-text">70B</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-lux-text2">Docs</p>
              <ul className="space-y-2 text-lux-text2">
                <li><a href="/dashboard" className="hover:text-lux-text">API</a></li>
                <li><a href="#benchmarks" className="hover:text-lux-text">Benchmarks</a></li>
                <li><a href="#safety" className="hover:text-lux-text">Safety</a></li>
                <li><a href="/court" className="hover:text-lux-text">AI Court</a></li>
                <li><a href="/brand" className="hover:text-lux-text">Brand Kit</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-lux-text2">Contact</p>
              <ul className="space-y-2 text-lux-text2">
                <li><a href="mailto:support@frasberg.ai" className="hover:text-lux-text">support@frasberg.ai</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-lux-border pt-8 font-mono text-xs text-lux-text2 sm:flex-row sm:items-center">
          <span>© 2026 Frasberg · Frasberg Public License</span>
          <span>Constellation Layer · Continuum L12</span>
        </div>
      </div>
    </footer>
  );
}
