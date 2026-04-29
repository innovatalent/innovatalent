function Footer() {
  return (
    <footer className="relative border-t border-line py-14">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="relative w-9 h-9 flex items-center justify-center">
                <img src="assets/innova-logo.png" alt="Innova Talent Labs" className="relative w-9 h-9 object-contain"/>
              </div>
              <span className="font-semibold tracking-tight text-[14px]">Innova Talent <span className="text-dim font-light italic">Labs</span></span>
            </div>
            <p className="text-dim text-[13.5px] max-w-sm leading-[1.55]">
              We build high-performance tech teams. Conectamos talento IT con las startups que están cambiando el mundo.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="https://ar.linkedin.com/in/innova-talent-we-create-your-team-161543239" target="_blank" rel="noopener" className="w-9 h-9 rounded-lg border border-line flex items-center justify-center text-dim hover:text-ink hover:border-[var(--accent)] transition">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M3.5 1a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM1 7h5v8H1V7zm7 0h4.7v1.1h.1c.7-1.2 2.2-1.4 3.4-1.4 3.3 0 3.8 2 3.8 4.7V15h-5v-3.5c0-.8 0-1.9-1.3-1.9s-1.5 1-1.5 1.9V15H8V7z" transform="scale(.9)"/></svg>
              </a>
              <a href="https://www.instagram.com/innovatalent.labs" target="_blank" rel="noopener" className="w-9 h-9 rounded-lg border border-line flex items-center justify-center text-dim hover:text-ink hover:border-[var(--accent)] transition">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="2" y="2" width="12" height="12" rx="3"/><circle cx="8" cy="8" r="3"/><circle cx="11.5" cy="4.5" r=".6" fill="currentColor"/></svg>
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-12">
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-mute mb-4">Empresa</div>
              <ul className="space-y-2.5 text-[13.5px] text-dim">
                <li><a className="hover:text-ink transition" href="#team">Nosotros</a></li>
                <li><a className="hover:text-ink transition" href="#">Trabajá con nosotros</a></li>
                <li><a className="hover:text-ink transition" href="#">Prensa</a></li>
              </ul>
            </div>
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-mute mb-4">Servicio</div>
              <ul className="space-y-2.5 text-[13.5px] text-dim">
                <li><a className="hover:text-ink transition" href="#what">Reclutamiento</a></li>
                <li><a className="hover:text-ink transition" href="#process">Proceso</a></li>
                <li><a className="hover:text-ink transition" href="#results">Casos</a></li>
              </ul>
            </div>
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-mute mb-4">Contacto</div>
              <ul className="space-y-2.5 text-[13.5px] text-dim">
                <li>
                  <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-mute mb-0.5">Reclutamiento</div>
                  <a className="hover:text-ink transition" href="mailto:rrhh@innovatalentlabs.com">rrhh@innovatalentlabs.com</a>
                </li>
                <li>
                  <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-mute mb-0.5 mt-2">Data · Web · Automatizaciones</div>
                  <a className="hover:text-ink transition" href="mailto:data@innovatalentlabs.com">data@innovatalentlabs.com</a>
                </li>
                <li>
                  <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-mute mb-0.5 mt-2">Consultas generales</div>
                  <a className="hover:text-ink transition" href="mailto:consulting@innovatalentlabs.com">consulting@innovatalentlabs.com</a>
                </li>
                <li><a className="hover:text-ink transition" href="https://ar.linkedin.com/in/innova-talent-we-create-your-team-161543239" target="_blank">LinkedIn</a></li>
                <li><a className="hover:text-ink transition" href="https://www.instagram.com/innovatalent.labs" target="_blank">Instagram</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-8 border-t border-line gap-4">
          <div className="font-mono text-[10.5px] text-mute uppercase tracking-wider">© 2026 Innova Talent Labs · Buenos Aires / Remoto</div>
          <div className="flex gap-6 font-mono text-[10.5px] text-mute uppercase tracking-wider">
            <a href="#" className="hover:text-dim transition">Privacidad</a>
            <a href="#" className="hover:text-dim transition">Términos</a>
            <a href="#" className="hover:text-dim transition">Seguridad</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
window.Footer = Footer;
