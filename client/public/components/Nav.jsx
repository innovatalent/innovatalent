function Nav() {
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
          <a href="https://wa.me/5492617172768?text=Hola%2C%20quiero%20info%20sobre%20Innova%20Talent%20Labs" target="_blank" rel="noopener" className="btn-ghost !py-2.5 !px-4 !text-[13px] sm:!text-[14px] cursor-pointer hidden sm:inline-flex" style={{borderColor: 'oklch(0.65 0.16 150 / 0.45)', color: 'oklch(0.85 0.13 150)'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.68-1.63-.93-2.23-.25-.6-.5-.5-.68-.5h-.58c-.2 0-.52.07-.8.37-.28.3-1.07 1.05-1.07 2.55s1.1 2.97 1.25 3.17c.15.2 2.15 3.3 5.22 4.6.73.3 1.3.5 1.74.64.73.23 1.4.2 1.92.12.58-.08 1.78-.72 2.03-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35M12 2C6.48 2 2 6.48 2 12c0 1.74.45 3.38 1.23 4.8L2 22l5.33-1.4A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2"/></svg>
            WhatsApp
          </a>
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
            <a href="https://wa.me/5492617172768?text=Hola%2C%20quiero%20info%20sobre%20Innova%20Talent%20Labs" target="_blank" rel="noopener" onClick={() => setMenuOpen(false)} className="btn-ghost justify-center mt-4 cursor-pointer" style={{borderColor: 'oklch(0.65 0.16 150 / 0.45)', color: 'oklch(0.85 0.13 150)'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.68-1.63-.93-2.23-.25-.6-.5-.5-.68-.5h-.58c-.2 0-.52.07-.8.37-.28.3-1.07 1.05-1.07 2.55s1.1 2.97 1.25 3.17c.15.2 2.15 3.3 5.22 4.6.73.3 1.3.5 1.74.64.73.23 1.4.2 1.92.12.58-.08 1.78-.72 2.03-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35M12 2C6.48 2 2 6.48 2 12c0 1.74.45 3.38 1.23 4.8L2 22l5.33-1.4A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2"/></svg>
              WhatsApp
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
window.Nav = Nav;
