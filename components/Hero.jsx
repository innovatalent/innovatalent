function Hero({ onCTA, showParticles }) {
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
              <span className="font-mono text-[11px] uppercase tracking-wider text-dim">Tomamos búsquedas — Q2 2026</span>
            </div>
          </div>

          <h1 className="reveal reveal-delay-1 text-[clamp(40px,7vw,92px)] leading-[1.02] font-semibold tracking-[-0.035em] mb-6">
            Hire faster.<br/>
            Scale <span className="stroke-gradient italic font-light">smarter.</span>
          </h1>

          <p className="reveal reveal-delay-2 text-dim text-[18px] md:text-[20px] leading-[1.55] max-w-2xl mb-10">
            We build high-performance tech teams. Reclutadores embebidos que buscan, evalúan y entregan equipos de ingeniería senior en <span className="text-ink">21 días</span> — para que los founders dejen de entrevistar y empiecen a shippear.
          </p>

          <div className="reveal reveal-delay-3 flex flex-wrap items-center gap-3 mb-16">
            <button onClick={onCTA} className="btn-primary">
              Agendá una llamada
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <a href="#process" className="btn-ghost">
              Cómo trabajamos
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
