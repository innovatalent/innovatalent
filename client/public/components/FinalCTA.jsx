function FinalCTA() {
  const WaIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.68-1.63-.93-2.23-.25-.6-.5-.5-.68-.5h-.58c-.2 0-.52.07-.8.37-.28.3-1.07 1.05-1.07 2.55s1.1 2.97 1.25 3.17c.15.2 2.15 3.3 5.22 4.6.73.3 1.3.5 1.74.64.73.23 1.4.2 1.92.12.58-.08 1.78-.72 2.03-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35M12 2C6.48 2 2 6.48 2 12c0 1.74.45 3.38 1.23 4.8L2 22l5.33-1.4A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2"/></svg>
  );
  const Arrow = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
  );

  return (
    <section className="relative py-32 overflow-hidden border-t border-line">
      <div className="aurora opacity-70"></div>
      <div className="absolute inset-0 grid-bg opacity-80"></div>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10 text-center">
        <div className="reveal inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-line mb-8">
          <span className="w-1.5 h-1.5 rounded-full" style={{background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)'}}></span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-dim">Cupos limitados este mes</span>
        </div>

        <h2 className="reveal reveal-delay-1 text-[clamp(40px,7vw,96px)] leading-[1.08] font-semibold tracking-[-0.04em] mb-8 pb-2">
          Descubrí cómo hacer crecer<br/>
          <span className="italic font-light stroke-gradient inline-block pb-1" style={{paddingRight: '0.08em'}}>tu empresa con talento y tecnología.</span>
        </h2>

        <p className="reveal reveal-delay-2 text-dim text-[18px] md:text-[20px] leading-[1.55] max-w-2xl mx-auto mb-14">
          Vamos directo al punto: qué querés construir y qué tipo de talento o automatización necesitás para lograrlo.
        </p>

        <div className="reveal reveal-delay-3 grid sm:grid-cols-2 gap-5 mb-12 text-left">
          {/* Talent lane */}
          <div className="card p-7 md:p-8 flex flex-col">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] accent mb-3">01 · Talento</div>
            <div className="text-[20px] md:text-[22px] font-medium tracking-tight mb-2">Reclutamiento IT</div>
            <div className="text-dim text-[14.5px] leading-[1.55] mb-6">Buscamos, evaluamos y entregamos perfiles tech para tu equipo.</div>
            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
              <a href="https://wa.me/5492617172768?text=Hola%2C%20quiero%20info%20sobre%20reclutamiento%20IT" target="_blank" rel="noopener" className="btn-primary !text-[14px] !px-5 !py-3 justify-center flex-1" style={{borderColor: 'oklch(0.65 0.16 150 / 0.45)', color: 'oklch(0.85 0.13 150)'}}>
                <WaIcon size={14} /> Contactar por WhatsApp
              </a>
            </div>
            <a href="mailto:rrhh@innovatalentlabs.com" className="block mt-4 font-mono text-[10.5px] uppercase tracking-wider text-mute hover:text-ink transition">rrhh@innovatalentlabs.com</a>
          </div>

          {/* Tech lane */}
          <div className="card p-7 md:p-8 flex flex-col">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] accent mb-3">02 · Tecnología</div>
            <div className="text-[20px] md:text-[22px] font-medium tracking-tight mb-2">Automatización · Web · Data</div>
            <div className="text-dim text-[14.5px] leading-[1.55] mb-6">Contanos qué querés automatizar primero en tu empresa.</div>
            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
              <a href="https://wa.me/5492617172768?text=Hola%2C%20quiero%20consultar%20por%20automatizaci%C3%B3n%20%2F%20web%20%2F%20data" target="_blank" rel="noopener" className="btn-primary !text-[14px] !px-5 !py-3 justify-center flex-1" style={{borderColor: 'oklch(0.65 0.16 150 / 0.45)', color: 'oklch(0.85 0.13 150)'}}>
                <WaIcon size={14} /> Contactar por WhatsApp
              </a>
            </div>
            <a href="mailto:data@innovatalentlabs.com" className="block mt-4 font-mono text-[10.5px] uppercase tracking-wider text-mute hover:text-ink transition">data@innovatalentlabs.com</a>
          </div>
        </div>

        <div className="reveal reveal-delay-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-line max-w-3xl mx-auto">
          {[
            ['Sin retainers', 'Pagás al contratar'],
            ['Garantía 90 días', 'Reemplazo sin costo'],
            ['Consulta gratuita', 'Sin compromiso'],
            ['Respuesta rápida', 'En menos de 24h'],
          ].map(([a, b]) => (
            <div key={a} className="text-left sm:text-center">
              <div className="text-[14.5px] font-medium mb-1">{a}</div>
              <div className="font-mono text-[10.5px] uppercase tracking-wider text-mute">{b}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
window.FinalCTA = FinalCTA;
