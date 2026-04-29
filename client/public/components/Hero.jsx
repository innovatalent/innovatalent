function Hero({ onCTA, onCalendly, showParticles }) {
  const particles = React.useMemo(() => {
    if (!showParticles) return [];
    return Array.from({ length: 26 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 14,
      duration: 14 + Math.random() * 16,
      size: Math.random() > 0.8 ? 3 : 2,
    }));
  }, [showParticles]);

  return (
    <section id="top" className="relative min-h-[92vh] flex items-center overflow-hidden pt-24 pb-20">
      <div className="absolute inset-0 grid-bg"></div>
      <div className="aurora"></div>
      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p, i) => (
          <span key={i} className="particle" style={{
            left: `${p.left}%`, bottom: '-10px',
            width: `${p.size}px`, height: `${p.size}px`,
            animationDelay: `-${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }} />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 w-full">
        <div className="max-w-4xl">
          <div className="reveal flex items-center gap-2 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-line">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full opacity-75" style={{background:'var(--accent)', animation:'ping 2s cubic-bezier(0,0,0.2,1) infinite'}}></span>
                <span className="relative inline-flex w-2 h-2 rounded-full" style={{background:'var(--accent)'}}></span>
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-dim">Cupos limitados esta semana · Diagnóstico sin costo</span>
            </div>
          </div>

          <h1 className="reveal reveal-delay-1 text-[clamp(40px,7vw,92px)] leading-[1.02] font-semibold tracking-[-0.035em] mb-6">
            Hire faster.<br/>
            Scale <span className="stroke-gradient italic font-light">smarter.</span>
          </h1>

          <p className="reveal reveal-delay-2 text-dim text-[18px] md:text-[20px] leading-[1.55] max-w-2xl mb-10">
            We build high-performance tech teams. Reclutadores embebidos que buscan, evalúan y entregan equipos de ingeniería senior en <span className="text-ink">21 días</span> — para que los founders dejen de entrevistar y empiecen a shippear.
          </p>

          <div className="reveal reveal-delay-3 flex flex-col-reverse sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-16">
            <button onClick={onCTA} className="btn-primary justify-center cursor-pointer">
              Contanos tu necesidad
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={onCalendly} className="btn-ghost justify-center cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              Agendar diagnóstico
            </button>
            <a href="https://w.app/innovatalentlabs" target="_blank" rel="noopener" className="btn-ghost justify-center" style={{borderColor: 'oklch(0.65 0.16 150 / 0.4)', color: 'oklch(0.85 0.13 150)'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.68-1.63-.93-2.23-.25-.6-.5-.5-.68-.5h-.58c-.2 0-.52.07-.8.37-.28.3-1.07 1.05-1.07 2.55s1.1 2.97 1.25 3.17c.15.2 2.15 3.3 5.22 4.6.73.3 1.3.5 1.74.64.73.23 1.4.2 1.92.12.58-.08 1.78-.72 2.03-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35M12 2C6.48 2 2 6.48 2 12c0 1.74.45 3.38 1.23 4.8L2 22l5.33-1.4A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2"/></svg>
              WhatsApp
            </a>
          </div>

          {/* Trust row */}
          <div className="reveal reveal-delay-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute mb-5">Empresas que confían en nosotros</div>
            <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
              {['Emirates Flight Catering', 'Air Arabia', 'JETT LABS', 'Luxury Hospitality', 'PRAXES', 'Velvet'].map((l) => (
                <div key={l} className="font-mono text-[13px] text-mute hover:text-dim transition tracking-wider">{l}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="reveal reveal-delay-5 absolute bottom-6 right-6 lg:right-10 hidden md:flex flex-col items-end gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Scrolleá</div>
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>
        </div>
      </div>
      <style>{`@keyframes ping { 75%, 100% { transform: scale(2.2); opacity: 0; }}`}</style>
    </section>
  );
}
window.Hero = Hero;
