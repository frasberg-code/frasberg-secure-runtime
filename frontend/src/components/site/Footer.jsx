export default function Footer() {
  return (
    <footer className="border-t border-lux-border" data-testid="site-footer">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <img src="/luchii-mark-circle.png" alt="Frasberg Luchii" className="h-9 w-9 rounded-full" />
              <span className="font-display text-lg font-700 tracking-tight text-lux-text">Luchii</span>
            </div>
            <p className="mt-4 text-sm text-lux-text2">
              Luchii is not the next version. It is the next era. Built by Frasberg.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 font-mono text-sm sm:grid-cols-3">
            <div>
              <p className="mb-3 text-[15px] uppercase tracking-[0.2em] text-lux-text2">Models</p>
              <ul className="space-y-2 text-lux-text2">
                <li><a href="#models" className="hover:text-lux-text">Luchii 200M</a></li>
                <li><a href="#models" className="hover:text-lux-text">Luchii 1B</a></li>
                <li><a href="#models" className="hover:text-lux-text">Luchii 7B</a></li>
                <li><a href="#models" className="hover:text-lux-text">Luchii 70B</a></li>
                <li><span className="cursor-default">Luchii Earth 7 <span className="ml-1 rounded bg-lux-gold/15 px-1.5 py-0.5 text-[15.5px] uppercase tracking-widest text-lux-gold">Soon</span></span></li>
                <li><span className="cursor-default">Frasberg <span className="ml-1 rounded bg-lux-gold/15 px-1.5 py-0.5 text-[15.5px] uppercase tracking-widest text-lux-gold">New · Soon</span></span></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-[15px] uppercase tracking-[0.2em] text-lux-text2">Docs</p>
              <ul className="space-y-2 text-lux-text2">
                <li><a href="/dashboard" className="hover:text-lux-text">API</a></li>
                <li><a href="/ai-models" className="hover:text-lux-text" data-testid="footer-ai-models-link">AI Models</a></li>
                <li><a href="/chat" className="hover:text-lux-text" data-testid="footer-luchii-chat-link">Chat</a></li>
                <li><a href="/luchii-code" className="hover:text-lux-text" data-testid="footer-luchii-code-link">Luchii Code</a></li>
                <li><a href="/coding-agents" className="hover:text-lux-text" data-testid="footer-coding-agents-link">AI Coding Agents</a></li>
                <li><a href="/website-builder" className="hover:text-lux-text" data-testid="footer-website-builder-link">Website Builder</a></li>
                <li><a href="/app-builder" className="hover:text-lux-text" data-testid="footer-app-builder-link">App Builder</a></li>
                <li><a href="/game-builder" className="hover:text-lux-text" data-testid="footer-game-builder-link">Game Builder</a></li>
                <li><a href="/games" className="hover:text-lux-text" data-testid="footer-games-link">Games</a></li>
                <li><a href="/#benchmarks" className="hover:text-lux-text">Benchmarks</a></li>
                <li><a href="/#safety" className="hover:text-lux-text">Safety</a></li>
                <li><a href="/software" className="hover:text-lux-text" data-testid="footer-software-link">Software</a></li>
                <li><a href="/cloud" className="hover:text-lux-text" data-testid="footer-cloud-link">Frasberg Cloud</a></li>
                <li><a href="/brand" className="hover:text-lux-text">Brand Kit</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-[15px] uppercase tracking-[0.2em] text-lux-text2">Company</p>
              <ul className="space-y-2 text-lux-text2">
                <li><a href="/about" className="hover:text-lux-text" data-testid="footer-about-link">About Frasberg</a></li>
                <li><a href="/contact" className="hover:text-lux-text" data-testid="footer-contact-link">Contact Us</a></li>
                <li><a href="/database" className="hover:text-lux-text" data-testid="footer-database-link">Database Manager</a></li>
                <li><a href="/verified-provider" className="hover:text-lux-text" data-testid="footer-verified-link">Verified LLM Provider</a></li>
                <li><a href="/legal?doc=license" className="hover:text-lux-text" data-testid="footer-license-link">MIT License</a></li>
                <li><a href="/legal?doc=trademarks" className="hover:text-lux-text" data-testid="footer-trademarks-link">Trademarks</a></li>
                <li><a href="/legal?doc=safety" className="hover:text-lux-text" data-testid="footer-safety-link">Safety Charter</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-lux-border pt-8 font-mono text-[15px] text-lux-text2 sm:flex-row sm:items-center">
          <span>Copyright © 2003-2026 <a href="/about" className="hover:text-lux-text" data-testid="footer-copyright-company-link">FRASBERG, INC</a>., All Rights Reserved.</span>
        </div>
      </div>
    </footer>
  );
}
