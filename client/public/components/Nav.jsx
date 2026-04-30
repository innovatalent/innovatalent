function Nav({ onCTA, onBooking }) {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const links = [
    { href: '#what', label: 'Servicio' },
    { href: '#process', label: 'Proceso' },
    { href: '#network', label: 'Red' },
    { href: '#team', label: 'Equipo' },
    { href: '#results', label: 'Resultados' },
  ];

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
        <a href="#top" className="text-ink"><Logo /></a>
        <nav className="hidden md:flex items-center gap-8 text-[14px] text-dim">
          {links.map(l => <a key={l.href} href={l.href} className="hover:text-ink transition">{l.label}</a>)}
        </nav>
        <div className="flex items-center gap-3">
          <a href="/auth/login.html" className="hidden sm:inline text-[14px] text-dim hover:text-ink transition">Ingresar</a>
          <button onClick={onBooking} className="btn-primary !py-2.5 !px-4 !text-[13px] sm:!text-[14px] cursor-pointer hidden sm:inline-flex">
            Agendar diagnóstico
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="md:hidden flex items-center justify-center w-10 h-10 text-ink" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
            {menuOpen
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            }
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 nav-blur border-t border-line" style={{background:'var(--bg)'}}>
          <nav className="flex flex-col p-6 gap-1">
            {links.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-[18px] text-dim hover:text-ink transition py-3 border-b border-line">{l.label}</a>
            ))}
            <a href="/auth/login.html" className="text-[18px] text-dim hover:text-ink transition py-3 border-b border-line">Ingresar</a>
            <button onClick={() => { setMenuOpen(false); onBooking(); }} className="btn-primary justify-center mt-4 cursor-pointer">
              Agendar diagnóstico
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
window.Nav = Nav;
