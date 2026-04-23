function WhatWeDo() {
  const services = [
    {
      num: '01',
      title: 'Reclutamiento IT',
      desc: 'Sourcing profundo en LATAM, EE.UU. y Europa. Llegamos al 70% de los perfiles Tech que no están en job boards.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M16 16l6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <circle cx="11" cy="11" r="2.5" fill="currentColor"/>
        </svg>
      ),
      tags: ['Sourcing', 'Head hunting', 'Red de referidos', 'Outreach dirigido']
    },
    {
      num: '02',
      title: 'Armado de equipos',
      desc: 'No solo llenamos vacantes. Diseñamos la forma del equipo — líderes, seniors, especialistas — para tu roadmap.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4"/>
          <circle cx="20" cy="8" r="3" stroke="currentColor" strokeWidth="1.4"/>
          <circle cx="14" cy="20" r="3" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M10.5 10L17.5 10M9.5 10.5L12.5 17.5M18.5 10.5L15.5 17.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
      tags: ['Diseño organizacional', 'Mapeo de roles', 'Plan de capacidad']
    },
    {
      num: '03',
      title: 'Perfiles IT',
      desc: 'Desde desarrolladores (frontend, backend, mobile), hasta data (analistas, data engineers, ML), infraestructura (DevOps, SRE), producto técnico y liderazgo (CTOs fraccionales), entre otros. Evaluamos el talento con criterio — considerando experiencia, stack, contexto y potencial para asegurar el mejor match con tu equipo.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M4 14l6-6 6 6-6 6-6-6z" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M14 14l6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.4" opacity=".5"/>
        </svg>
      ),
      tags: ['Full-stack', 'Infraestructura', 'ML / AI', 'Mobile']
    },
  ];

  return (
    <section id="what" className="relative py-32 border-t border-line">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-20">
          <div className="reveal font-mono text-[11px] uppercase tracking-[0.2em] accent mb-4">Qué hacemos</div>
          <h2 className="reveal reveal-delay-1 text-[clamp(32px,4.5vw,56px)] leading-[1.05] font-semibold tracking-[-0.03em] mb-5">
            Todo tu staff listo para comenzar.
          </h2>
          <p className="reveal reveal-delay-2 text-dim text-[18px] leading-[1.6]">
            Desde el primer requerimiento y armado del rol técnico hasta su contratación, nos ocupamos de todo el proceso de hiring para que tu equipo pueda enfocarse en el producto.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {services.map((s, i) => (
            <div key={s.num} className={`reveal reveal-delay-${i+1} card card-hover p-7 flex flex-col h-full`}>
              <div className="flex items-start justify-between mb-8">
                <div className="accent">{s.icon}</div>
                <div className="font-mono text-[11px] text-mute tracking-wider">{s.num}</div>
              </div>
              <h3 className="text-[22px] font-medium mb-3 tracking-tight">{s.title}</h3>
              <p className="text-dim text-[15px] leading-[1.55] mb-6 flex-1">{s.desc}</p>
              <div className="flex flex-wrap gap-1.5 pt-5 border-t border-line">
                {s.tags.map(t => (
                  <span key={t} className="font-mono text-[10.5px] uppercase tracking-wider text-mute px-2 py-1 rounded bg-surface-2">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
window.WhatWeDo = WhatWeDo;
