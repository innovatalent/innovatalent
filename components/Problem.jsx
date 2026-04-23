function Problem() {
  const problems = [
    {
      label: 'LENTO',
      stat: '84 días',
      body: 'Tiempo promedio para contratar un ingeniero senior en 2025. Para cuando empieza, tu roadmap ya cambió.',
    },
    {
      label: 'CARO',
      stat: '$34k+',
      body: 'Lo que cuesta un mal hire — reemplazo, salario, onboarding, y los meses de producto estancado.',
    },
    {
      label: 'INCIERTO',
      stat: '1 de 4',
      body: 'Ingenieros senior renuncian en el primer año cuando el equipo, las herramientas o el producto no eran lo que les vendieron.',
    },
  ];

  return (
    <section className="relative py-32 chaos-bg overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-[0.15]" preserveAspectRatio="none">
        <defs>
          <pattern id="xhatch" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
            <line x1="0" y1="40" x2="80" y2="40" stroke="white" strokeWidth=".3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#xhatch)"/>
      </svg>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mb-24">
          <div className="reveal font-mono text-[11px] uppercase tracking-[0.2em] text-mute mb-4" style={{color: 'oklch(0.72 0.15 30)'}}>La realidad</div>
          <h2 className="reveal reveal-delay-1 text-[clamp(32px,4.5vw,60px)] leading-[1.03] font-semibold tracking-[-0.035em] mb-6">
            Contratar talento hoy está <span className="italic font-light text-dim">roto.</span>
          </h2>
          <p className="reveal reveal-delay-2 text-dim text-[18px] leading-[1.6]">
            Los founders pasan el 40% de la semana en entrevistas. Los recruiters genéricos mandan CVs genéricos. Los mejores perfiles no responden mensajes por LinkedIn.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {problems.map((p, i) => (
            <div key={p.label} className={`reveal reveal-delay-${i+1} relative`}>
              <div className="relative p-7 rounded-2xl border border-line overflow-hidden" style={{background: 'oklch(0.14 0.015 20 / 0.6)'}}>
                <div className="font-mono text-[10.5px] tracking-[0.25em] mb-7" style={{color: 'oklch(0.72 0.15 30)'}}>{p.label}</div>
                <div className="text-[56px] font-semibold tracking-[-0.04em] metric-num mb-3 leading-none">{p.stat}</div>
                <p className="text-dim text-[14.5px] leading-[1.55]">{p.body}</p>
                <div className="absolute inset-x-0 bottom-0 h-px" style={{background: 'linear-gradient(to right, transparent, oklch(0.72 0.15 30 / 0.5), transparent)'}}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
window.Problem = Problem;
