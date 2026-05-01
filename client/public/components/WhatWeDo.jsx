function WhatWeDo() {
  const recruitment = [
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
      desc: 'Desarrolladores (frontend, backend, mobile), data (analistas, ML), infraestructura (DevOps, SRE), producto técnico y liderazgo (CTOs fraccionales). Evaluamos con criterio para asegurar el mejor match.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M4 14l6-6 6 6-6 6-6-6z" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M14 14l6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.4" opacity=".5"/>
        </svg>
      ),
      tags: ['Full-stack', 'Infraestructura', 'ML / AI', 'Mobile']
    },
  ];

  const tech = [
    {
      num: '04',
      title: 'Automatizaciones para empresas',
      desc: 'Optimizamos procesos repetitivos con IA y automatización para ahorrar tiempo y reducir errores.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 3v4M14 21v4M3 14h4M21 14h4M6 6l3 3M19 19l3 3M22 6l-3 3M6 22l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <circle cx="14" cy="14" r="4" stroke="currentColor" strokeWidth="1.4"/>
        </svg>
      ),
      tags: ['WhatsApp automático', 'CRM', 'Integraciones', 'Reportes']
    },
    {
      num: '05',
      title: 'Desarrollo web profesional',
      desc: 'Diseñamos páginas web modernas enfocadas en ventas, confianza y resultados.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="3" y="5" width="22" height="18" rx="2" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M3 10h22" stroke="currentColor" strokeWidth="1.4"/>
          <circle cx="6.5" cy="7.5" r=".7" fill="currentColor"/>
          <circle cx="9" cy="7.5" r=".7" fill="currentColor"/>
        </svg>
      ),
      tags: ['Landing pages', 'Sitios corporativos', 'E-commerce', 'Formularios']
    },
    {
      num: '06',
      title: 'Meta Ads y marketing digital',
      desc: 'Campañas en Facebook e Instagram Ads. Estrategia, segmentación, optimización de conversiones y reportes de rendimiento.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M14 8v6l4 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M8 4l-3 3M20 4l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
      tags: ['Facebook Ads', 'Instagram Ads', 'Segmentación', 'Conversiones']
    },
    {
      num: '07',
      title: 'Ciencia de datos & BI',
      desc: 'Transformamos datos en decisiones — dashboards, KPIs y predicciones que mueven el negocio.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M4 22h20M6 18v-6M11 18v-10M16 18v-3M21 18v-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
      tags: ['Dashboards', 'KPIs', 'Predicciones', 'Insights']
    },
  ];

  const Card = ({ s, delayClass }) => (
    <div className={`reveal ${delayClass} card card-hover p-7 flex flex-col h-full`}>
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
  );

  return (
    <section id="what" className="relative py-32 border-t border-line">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-20">
          <div className="reveal font-mono text-[11px] uppercase tracking-[0.2em] accent mb-4">Servicios</div>
          <h2 className="reveal reveal-delay-1 text-[clamp(32px,4.5vw,56px)] leading-[1.05] font-semibold tracking-[-0.03em] mb-5">
            Talento y tecnología, <span className="italic font-light text-dim">en un mismo partner.</span>
          </h2>
          <p className="reveal reveal-delay-2 text-dim text-[18px] leading-[1.6]">
            Te ayudamos a conseguir los perfiles IT que necesitás — y a impulsar tu empresa con automatización, desarrollo web e inteligencia de datos.
          </p>
        </div>

        {/* Group 1: Recruitment */}
        <div className="mb-20">
          <div className="reveal flex items-center gap-4 mb-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] accent">01 · Talento</div>
            <div className="flex-1 h-px bg-line"></div>
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-mute">Reclutamiento IT</div>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {recruitment.map((s, i) => (
              <Card key={s.num} s={s} delayClass={`reveal-delay-${i+1}`} />
            ))}
          </div>
        </div>

        {/* Group 2: Tech services */}
        <div>
          <div className="reveal flex items-center gap-4 mb-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] accent">02 · Tecnología</div>
            <div className="flex-1 h-px bg-line"></div>
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-mute">Automatización · Web · Ads · Data</div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {tech.map((s, i) => (
              <Card key={s.num} s={s} delayClass={`reveal-delay-${i+1}`} />
            ))}
          </div>

          {/* CTA dedicated to tech services */}
          <div className="reveal mt-8 card p-7 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] accent mb-2">Línea directa · Tecnología</div>
              <div className="text-[19px] md:text-[21px] font-medium tracking-tight mb-1">¿Querés ver qué automatizar primero en tu empresa?</div>
              <div className="text-dim text-[14px]">Diagnóstico sin costo · Respuesta rápida · Cupos limitados esta semana</div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-3 w-full md:w-auto">
              <a href="#top" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-booking')); }} className="btn-primary !text-[14px] !px-5 !py-3 justify-center whitespace-nowrap cursor-pointer">
                Agendar diagnóstico
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
              <a href="https://wa.me/542616042245?text=Hola%2C%20quiero%20consultar%20por%20automatizaci%C3%B3n%20%2F%20web%20%2F%20data" target="_blank" rel="noopener" className="btn-ghost !text-[14px] !px-5 !py-3 justify-center whitespace-nowrap" style={{borderColor: 'oklch(0.65 0.16 150 / 0.45)', color: 'oklch(0.85 0.13 150)'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.68-1.63-.93-2.23-.25-.6-.5-.5-.68-.5h-.58c-.2 0-.52.07-.8.37-.28.3-1.07 1.05-1.07 2.55s1.1 2.97 1.25 3.17c.15.2 2.15 3.3 5.22 4.6.73.3 1.3.5 1.74.64.73.23 1.4.2 1.92.12.58-.08 1.78-.72 2.03-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35M12 2C6.48 2 2 6.48 2 12c0 1.74.45 3.38 1.23 4.8L2 22l5.33-1.4A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2"/></svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
window.WhatWeDo = WhatWeDo;
