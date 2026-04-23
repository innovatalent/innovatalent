function Results() {
  const metrics = [
    { num: '4.9',  label: 'Rating promedio',          sub: 'Basado en reseñas reales' },
    { num: '100%', label: 'Clientes recurrentes',     sub: 'Vuelven a buscar con nosotros' },
    { num: '21',   label: 'Días promedio de hiring',  sub: 'De kickoff a oferta' },
    { num: '5★',   label: 'LinkedIn & Google',        sub: 'Reseñas verificadas' },
  ];

  const testimonials = [
    {
      quote: 'El proceso de principio a fin con Innova Talent fue una experiencia excelente. Destaco la amabilidad, eficacia y rapidez para dar con los candidatos adecuados según los requerimientos iniciales. Destaco su calidad humana y el seguimiento constante durante todo el proceso. Super recomendable.',
      name: 'Gaston Mora',
      title: 'CEO, Jett Labs',
      rating: 5,
    },
    {
      quote: 'El equipo nos ayudó a encontrar el talento correcto de forma ágil y eficiente. Estamos muy contentos con el acompañamiento cercano durante todo el proceso.',
      name: 'Matías Castillo',
      title: 'Founder, Luxury Hospitality',
      rating: 5,
    },
    {
      quote: 'Trabajé con Innova Talent y fue una excelente experiencia. Siempre mostraron compromiso, creatividad y muy buena disposición para trabajar en equipo. Los recomiendo sin dudas.',
      name: 'Paloma Devesa',
      title: 'CEO, PRAXES',
      rating: 5,
      source: 'LinkedIn · Jul 2025',
    },
    {
      quote: 'Luego de malas experiencias reclutando por mi cuenta, contraté el servicio de Innova Talent y estoy super contenta con el resultado. La persona seleccionada está trabajando muy bien y estamos todos muy conformes. En breve ampliamos el equipo e Innova volverá a estar a cargo de la búsqueda.',
      name: 'Milagros Ricardini',
      title: 'Founder, Velvet',
      rating: 5,
      source: 'LinkedIn · Nov 2023',
    },
  ];

  const Stars = ({n}) => (
    <div className="flex items-center gap-0.5">
      {Array.from({length: n}).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 14 14" fill="currentColor" className="accent">
          <path d="M7 .7l2 4.3 4.7.5-3.5 3.2 1 4.6L7 11l-4.1 2.3 1-4.6L.3 5.5l4.7-.5z"/>
        </svg>
      ))}
    </div>
  );

  return (
    <section id="results" className="relative py-32 border-t border-line">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mb-20">
          <div className="reveal font-mono text-[11px] uppercase tracking-[0.2em] accent mb-4">Resultados</div>
          <h2 className="reveal reveal-delay-1 text-[clamp(32px,4.5vw,60px)] leading-[1.03] font-semibold tracking-[-0.035em] mb-6">
            Clientes que <span className="italic font-light stroke-gradient">vuelven.</span>
          </h2>
          <p className="reveal reveal-delay-2 text-dim text-[18px] leading-[1.6]">
            No publicamos testimonios inventados — cada reseña es verificable en LinkedIn e Instagram.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-b border-line mb-20">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className={`reveal reveal-delay-${i+1} p-8 lg:p-10 ${i < 3 ? 'lg:border-r border-line' : ''} ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b lg:border-b-0 border-line' : ''}`}
            >
              <div className="metric-num text-[clamp(40px,5.5vw,72px)] font-semibold leading-none tracking-[-0.04em] mb-4">
                {m.num}
              </div>
              <div className="text-[14.5px] text-ink mb-1.5">{m.label}</div>
              <div className="font-mono text-[11px] text-mute uppercase tracking-wider">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Featured 4.9 card + first testimonial */}
        <div className="grid md:grid-cols-[0.8fr_1.2fr] gap-5 mb-5">
          <div className="reveal card p-8 md:p-10 flex flex-col justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-40" style={{background: 'radial-gradient(circle at 50% 30%, var(--accent-soft), transparent 70%)'}}></div>
            <div className="relative">
              <div className="metric-num text-[clamp(80px,10vw,140px)] font-semibold leading-none tracking-[-0.05em] mb-4 stroke-gradient">4.9</div>
              <div className="flex justify-center mb-4"><Stars n={5}/></div>
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-dim">Rating promedio</div>
              <div className="font-mono text-[10.5px] uppercase tracking-wider text-mute mt-2">Reseñas en LinkedIn · Instagram · Google</div>
            </div>
          </div>

          {/* First testimonial featured bigger */}
          <div className="reveal reveal-delay-1 card p-8 md:p-10">
            <div className="flex items-center justify-between mb-5">
              <Stars n={testimonials[0].rating}/>
              <div className="font-mono text-[10.5px] uppercase tracking-wider text-mute">Instagram · Mar 2026</div>
            </div>
            <p className="text-[17px] md:text-[18px] leading-[1.55] mb-7 tracking-[-0.005em]">
              "{testimonials[0].quote}"
            </p>
            <div className="flex items-center gap-3 pt-6 border-t border-line">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-[12px] font-medium" style={{
                background: `linear-gradient(135deg, oklch(0.38 0.10 260), oklch(0.22 0.06 290))`
              }}>
                {testimonials[0].name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="text-[14px] font-medium">{testimonials[0].name}</div>
                <div className="font-mono text-[10.5px] text-mute uppercase tracking-wider">{testimonials[0].title}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Other 3 testimonials */}
        <div className="grid md:grid-cols-3 gap-5 mb-20">
          {testimonials.slice(1).map((t, i) => (
            <div key={i} className={`reveal reveal-delay-${i+1} card p-7 flex flex-col`}>
              <div className="flex items-center justify-between mb-4">
                <Stars n={t.rating}/>
                {t.source && <div className="font-mono text-[10px] uppercase tracking-wider text-mute">{t.source}</div>}
              </div>
              <p className="text-[14.5px] leading-[1.6] mb-6 text-dim flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-5 border-t border-line">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-[11px] font-medium" style={{
                  background: `linear-gradient(135deg, oklch(0.35 0.08 ${210 + i*30}), oklch(0.22 0.05 ${240 + i*30}))`
                }}>
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="text-[13px] font-medium">{t.name}</div>
                  <div className="font-mono text-[10px] text-mute uppercase tracking-wider">{t.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Client logos */}
        <div className="reveal">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.25em] text-mute text-center mb-8">Armamos equipos para</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-line border border-line rounded-xl overflow-hidden">
            {[
              { name: 'Emirates Flight Catering', style: 'serif', tag: 'EFC' },
              { name: 'Air Arabia',               style: 'sans',  tag: 'AirArabia' },
              { name: 'Jett Labs',               style: 'mono',  tag: '⏣ JETT' },
              { name: 'Luxury Hospitality',      style: 'script', tag: 'Luxury' },
              { name: 'PRAXES',                  style: 'wide',   tag: 'PRAXES' },
              { name: 'Velvet',                  style: 'italic', tag: 'velvet.' },
            ].map((l) => (
              <div key={l.name} className="bg-surface px-6 py-8 flex flex-col items-center justify-center gap-2 hover:bg-surface-2 transition">
                <div className={
                  l.style === 'serif'  ? 'text-[22px] text-ink/90 tracking-[0.15em]' :
                  l.style === 'sans'   ? 'text-[20px] text-ink/90 font-semibold tracking-[-0.02em]' :
                  l.style === 'mono'   ? 'font-mono text-[18px] text-ink/90 tracking-wider' :
                  l.style === 'script' ? 'text-[22px] text-ink/90 italic font-light tracking-tight' :
                  l.style === 'wide'   ? 'text-[18px] text-ink/90 font-semibold tracking-[0.35em]' :
                                         'text-[22px] text-ink/90 italic font-light'
                } style={l.style === 'serif' ? {fontFamily: 'Georgia, serif'} : {}}>
                  {l.tag}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-mute text-center">{l.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
window.Results = Results;
