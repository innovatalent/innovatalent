function Services() {
  const WA_AUTOMATION = 'https://wa.me/542616042245';
  const openBooking = () => window.dispatchEvent(new CustomEvent('open-booking'));
  const services = [
    {
      num: '01',
      title: 'Automatizaciones para empresas',
      desc: 'Optimizamos procesos repetitivos con IA y automatización para ahorrar tiempo y reducir errores.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 3v4M14 21v4M3 14h4M21 14h4M6 6l3 3M19 19l3 3M22 6l-3 3M6 22l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <circle cx="14" cy="14" r="4" stroke="currentColor" strokeWidth="1.4"/>
        </svg>
      ),
      tags: ['WhatsApp automático', 'CRM', 'Seguimiento de leads', 'Integraciones', 'Reportes']
    },
    {
      num: '02',
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
      tags: ['Landing pages', 'Sitios corporativos', 'E-commerce', 'Formularios inteligentes']
    },
    {
      num: '03',
      title: 'Ciencia de datos & BI',
      desc: 'Transformamos datos en decisiones estratégicas — dashboards, KPIs y predicciones que mueven el negocio.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M4 22h20M6 18v-6M11 18v-10M16 18v-3M21 18v-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
      tags: ['Dashboards', 'KPIs', 'Predicciones', 'Análisis de ventas', 'Insights de clientes']
    },
  ];

  const metrics = [
    { num: '+40%',  label: 'Productividad' },
    { num: '−60%',  label: 'Tareas manuales' },
    { num: '+25%',  label: 'Conversiones web' },
  ];

  return (
    <section id="services" className="relative py-32 border-t border-line">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mb-20">
          <div className="reveal font-mono text-[11px] uppercase tracking-[0.2em] accent mb-4">Servicios adicionales</div>
          <h2 className="reveal reveal-delay-1 text-[clamp(32px,4.5vw,56px)] leading-[1.05] font-semibold tracking-[-0.03em] mb-5">
            Impulsamos empresas con <span className="italic font-light text-dim">automatización, web e inteligencia de datos.</span>
          </h2>
          <p className="reveal reveal-delay-2 text-dim text-[18px] leading-[1.6]">
            Ayudamos a empresas a vender más, ahorrar tiempo y tomar mejores decisiones con tecnología.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-20">
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

        <div className="reveal grid grid-cols-3 border border-line rounded-xl overflow-hidden mb-12">
          {metrics.map((m, i) => (
            <div key={m.label} className={`p-7 lg:p-9 ${i < 2 ? 'border-r border-line' : ''} text-center`}>
              <div className="metric-num text-[clamp(32px,4.5vw,56px)] font-semibold leading-none tracking-[-0.04em] mb-3">{m.num}</div>
              <div className="font-mono text-[11px] text-mute uppercase tracking-wider">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Dedicated CTA for automations / data / web */}
        <div className="reveal card p-7 md:p-9 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] accent mb-2">Línea directa · Automatización · Data · Web</div>
            <div className="text-[20px] md:text-[22px] font-medium tracking-tight mb-1">¿Querés ver qué automatizar primero en tu empresa?</div>
            <div className="text-dim text-[14.5px]">Diagnóstico sin costo · Respuesta rápida · Cupos limitados esta semana</div>
            <a href="mailto:data@innovatalentlabs.com" className="inline-block mt-2 font-mono text-[11px] uppercase tracking-wider text-mute hover:text-ink transition">data@innovatalentlabs.com</a>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-3 w-full md:w-auto">
            <a href="#top" onClick={(e) => { e.preventDefault(); openBooking(); }} className="btn-primary !text-[14px] !px-5 !py-3 justify-center whitespace-nowrap cursor-pointer">
              Reservar reunión
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
            <a href={WA_AUTOMATION} target="_blank" rel="noopener" className="btn-ghost !text-[14px] !px-5 !py-3 justify-center whitespace-nowrap" style={{borderColor: 'oklch(0.65 0.16 150 / 0.45)', color: 'oklch(0.85 0.13 150)'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.68-1.63-.93-2.23-.25-.6-.5-.5-.68-.5h-.58c-.2 0-.52.07-.8.37-.28.3-1.07 1.05-1.07 2.55s1.1 2.97 1.25 3.17c.15.2 2.15 3.3 5.22 4.6.73.3 1.3.5 1.74.64.73.23 1.4.2 1.92.12.58-.08 1.78-.72 2.03-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35M12 2C6.48 2 2 6.48 2 12c0 1.74.45 3.38 1.23 4.8L2 22l5.33-1.4A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2"/></svg>
              WhatsApp Data
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
window.Services = Services;
