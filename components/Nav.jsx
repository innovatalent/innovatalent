function Nav({ onCTA }) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const Logo = () => (
    <div className="flex items-center gap-2.5">
      <div className="relative w-9 h-9 flex items-center justify-center">
        <img src="assets/innova-logo.png" alt="Innova Talent Labs" className="relative w-9 h-9 object-contain"/>
      </div>
      <span className="font-semibold tracking-tight text-[15px]">Innova Talent <span className="font-light text-dim italic">Labs</span></span>
    </div>
  );

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all ${scrolled ? 'nav-blur border-b border-line' : ''}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <a href="#top" className="text-ink"><Logo /></a>
        <nav className="hidden md:flex items-center gap-8 text-[14px] text-dim">
          <a href="#what" className="hover:text-ink transition">Servicio</a>
          <a href="#process" className="hover:text-ink transition">Proceso</a>
          <a href="#network" className="hover:text-ink transition">Red</a>
          <a href="#team" className="hover:text-ink transition">Equipo</a>
          <a href="#results" className="hover:text-ink transition">Resultados</a>
        </nav>
        <div className="flex items-center gap-3">
          <a href="#" className="hidden sm:inline text-[14px] text-dim hover:text-ink transition">Ingresar</a>
          <a href="https://calendly.com/innovatalent/30min" target="_blank" rel="noopener" className="btn-primary !py-2.5 !px-4 !text-[14px]">
            Agendar diagnóstico
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>
      </div>
    </header>
  );
}
window.Nav = Nav;
