function Process() {
  const steps = [
    {
      n: '01',
      title: 'Sourcing',
      kicker: 'Semana 1',
      body: 'Calibramos tu stack, la forma del equipo y el bar técnico. En 5 días hábiles tenés una shortlist de 8 a 12 ingenieros pre-calificados.',
      detail: ['Definición de perfil y requerimientos', 'Calibración del rol', 'Head hunting', 'Activación de referidos']
    },
    {
      n: '02',
      title: 'Evaluación',
      kicker: 'Semana 2',
      body: 'Especialistas senior de nuestro lado hacen el screen técnico — live coding, system design y fit cultural. Solo ves al top 15%.',
      detail: ['Live coding screen', 'System design', 'Fit cultural', 'Evaluación psicolaboral']
    },
    {
      n: '03',
      title: 'Entrega',
      kicker: 'Semana 3',
      body: 'Manejamos ofertas, negociación y ramp-up. Recibís un equipo listo para shippear — y nos quedamos hasta el mes tres.',
      detail: ['Negociación de oferta', 'Runbook de onboarding', 'Asesoría de perfiles potenciales', 'Garantía de reemplazo']
    },
  ];

  return (
    <section id="process" className="relative py-32 border-t border-line">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mb-24">
          <div className="reveal font-mono text-[11px] uppercase tracking-[0.2em] accent mb-4">El proceso</div>
          <h2 className="reveal reveal-delay-1 text-[clamp(32px,4.5vw,60px)] leading-[1.03] font-semibold tracking-[-0.035em] mb-6">
            Tres semanas. Un equipo. <span className="italic font-light text-dim">Cero vueltas.</span>
          </h2>
          <p className="reveal reveal-delay-2 text-dim text-[18px] leading-[1.6]">
            Una cadencia repetible que corrimos 120+ veces. Sabés exactamente qué está pasando, cuándo, y qué viene después.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-[29px] md:left-[34px] top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-[var(--line)] to-transparent hidden sm:block"></div>

          <div className="space-y-5">
            {steps.map((s, i) => (
              <div key={s.n} className={`reveal reveal-delay-${i+1} relative flex gap-5 md:gap-8`}>
                <div className="relative flex-shrink-0 z-10">
                  <div className="w-[60px] h-[60px] md:w-[70px] md:h-[70px] rounded-full border border-line bg-surface flex items-center justify-center font-mono text-[13px] text-dim">
                    {s.n}
                  </div>
                  <div className="absolute inset-0 rounded-full border border-[var(--accent)] opacity-30 animate-pulse"></div>
                </div>

                <div className="card flex-1 p-5 sm:p-6 md:p-8 grid md:grid-cols-[1fr_1.2fr] gap-4 md:gap-10 items-start">
                  <div>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] accent mb-3">{s.kicker}</div>
                    <h3 className="text-[26px] md:text-[32px] font-medium tracking-[-0.02em] mb-3">{s.title}</h3>
                    <p className="text-dim text-[15px] leading-[1.6]">{s.body}</p>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {s.detail.map(d => (
                      <li key={d} className="flex items-start gap-2 text-[13.5px] text-dim">
                        <svg className="mt-[5px] flex-shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-6" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="reveal mt-16 max-w-4xl mx-auto">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-mute mb-3 flex justify-between">
            <span>Día 0 — Kickoff</span>
            <span className="accent">Día 21 — Equipo shippeando</span>
          </div>
          <div className="h-[3px] rounded-full overflow-hidden bg-surface-2 relative">
            <div className="absolute left-0 top-0 h-full rounded-full" style={{width: '100%', background: 'linear-gradient(to right, var(--accent), oklch(0.78 0.12 60))'}}></div>
          </div>
          <div className="flex justify-between mt-3 font-mono text-[10px] text-mute">
            <span>SOURCING</span>
            <span>EVALUACIÓN</span>
            <span>ENTREGA</span>
          </div>
        </div>
      </div>
    </section>
  );
}
window.Process = Process;
