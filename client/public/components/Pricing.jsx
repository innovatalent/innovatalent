function Pricing() {
  const MP_LINK = 'https://link.mercadopago.com.ar/leonelj';

  const plans = [
    {
      name: 'Starter',
      price: 'Gratis',
      period: '',
      desc: 'Diagnóstico sin costo para tu empresa',
      features: ['1 reunión de diagnóstico', 'Análisis de necesidades', 'Propuesta personalizada', 'Sin compromiso'],
      cta: 'Agendar diagnóstico',
      action: () => window.dispatchEvent(new CustomEvent('open-booking')),
      style: 'ghost',
    },
    {
      name: 'Growth',
      price: 'Consultar',
      period: 'por proyecto',
      desc: 'Enviá tus requerimientos → Reunión → Propuesta → Pago',
      features: ['Búsqueda y evaluación de talento', 'Automatización de procesos', 'Soporte técnico dedicado', 'Garantía de 90 días', 'Dashboard con métricas'],
      cta: 'Solicitar propuesta',
      action: () => window.dispatchEvent(new CustomEvent('open-contact')),
      style: 'primary',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'mensual',
      desc: 'Equipos completos + automatización integral',
      features: ['Equipos dedicados on-demand', 'Automatización end-to-end', 'IA y análisis de datos', 'Account manager exclusivo', 'SLA garantizado', 'Facturación a medida'],
      cta: 'Contactar ventas',
      action: () => window.open('https://wa.me/542616042245?text=Hola%2C%20quiero%20consultar%20por%20el%20plan%20Enterprise', '_blank'),
      style: 'ghost',
    },
  ];

  return (
    <section id="pricing" className="relative py-28 border-t border-line">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <div className="reveal font-mono text-[11px] uppercase tracking-[0.2em] accent mb-4">Planes</div>
          <h2 className="reveal reveal-delay-1 text-[clamp(32px,5vw,56px)] font-semibold tracking-[-0.03em] mb-4">
            Invertí en tu crecimiento
          </h2>
          <p className="reveal reveal-delay-2 text-dim text-[17px] max-w-xl mx-auto">
            Sin retainers. Sin sorpresas. Pagás por resultados.
          </p>
        </div>

        <div className="reveal reveal-delay-3 grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className="card p-7 flex flex-col relative" style={plan.popular ? {borderColor: 'var(--accent)', boxShadow: '0 0 30px rgba(99,102,241,.1)'} : {}}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{background:'var(--accent)', color:'#fff'}}>
                  Popular
                </div>
              )}
              <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-mute mb-2">{plan.name}</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-[32px] font-bold tracking-tight">{plan.price}</span>
                {plan.period && <span className="text-[13px] text-dim">{plan.period}</span>}
              </div>
              <p className="text-dim text-[13px] mb-6">{plan.desc}</p>
              <ul className="flex-1 mb-6 space-y-2.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-[13px]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0 accent"><path d="M4 8.5l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className="text-dim">{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={plan.action}
                className={plan.style === 'primary' ? 'btn-primary justify-center w-full cursor-pointer' : 'btn-ghost justify-center w-full cursor-pointer'}>
                {plan.cta}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          ))}
        </div>

        <div className="reveal reveal-delay-4 mt-8 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg border border-line bg-surface">
            <img src="assets/mercado-pago.png" alt="Mercado Pago" style={{height:'22px'}} />
            <span className="text-[12px] text-mute">Pagos seguros con Mercado Pago</span>
          </div>
        </div>
      </div>
    </section>
  );
}
window.Pricing = Pricing;
