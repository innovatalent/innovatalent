function Network({ density }) {
  const scrollRef = React.useRef(null);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const onScroll = () => {
      const el = scrollRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress from 0 when section enters to 1 when section mostly leaves
      const total = rect.height - vh;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(total > 0 ? scrolled / total : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Profile pool
  const allProfiles = [
    { initials: 'JM', role: 'Backend Senior',  stack: 'Go • Postgres',    x: 10, y: 18, t: 0.05 },
    { initials: 'AR', role: 'Staff Frontend',  stack: 'React • TS',       x: 62, y: 12, t: 0.12 },
    { initials: 'PK', role: 'Platform Eng',    stack: 'K8s • Terraform',  x: 78, y: 48, t: 0.22 },
    { initials: 'SC', role: 'ML Engineer',     stack: 'PyTorch • CUDA',   x: 22, y: 62, t: 0.32 },
    { initials: 'DV', role: 'Tech Lead',       stack: 'Full-stack',       x: 46, y: 38, t: 0.42, hub: true },
    { initials: 'LN', role: 'Mobile iOS',      stack: 'Swift • SwiftUI',  x: 70, y: 78, t: 0.52 },
    { initials: 'RF', role: 'Staff SRE',       stack: 'Observabilidad',   x: 6,  y: 80, t: 0.60 },
    { initials: 'EM', role: 'Android Senior',  stack: 'Kotlin',           x: 40, y: 82, t: 0.68 },
    { initials: 'TO', role: 'Data Engineer',   stack: 'Snowflake • dbt',  x: 88, y: 24, t: 0.75 },
  ];

  const densityCount = density === 'low' ? 5 : density === 'high' ? 9 : 7;
  const profiles = allProfiles.slice(0, densityCount);

  // Active count based on progress (profiles appear sequentially as you scroll)
  // Map progress 0.1..0.7 to 0..profiles.length
  const activeCount = Math.min(profiles.length, Math.max(0, Math.floor(((progress - 0.08) / 0.55) * profiles.length) + 1));
  const visible = profiles.map((p, i) => ({ ...p, on: i < activeCount }));

  // Lines after all (or most) profiles are visible
  const linesOn = progress > 0.55;
  const teamFormed = progress > 0.78;

  // Build connections: star to hub + a few lateral
  const hubIndex = visible.findIndex(p => p.hub);
  const connections = [];
  if (hubIndex >= 0) {
    visible.forEach((p, i) => { if (i !== hubIndex && p.on) connections.push([hubIndex, i]); });
    // lateral
    const laterals = [[0,1],[2,8],[3,6],[5,7],[1,8]];
    laterals.forEach(([a,b]) => { if (visible[a]?.on && visible[b]?.on) connections.push([a,b]); });
  }

  return (
    <section id="network" ref={scrollRef} className="relative border-t border-line" style={{height: '180vh'}}>
      <div className="sticky top-0 h-screen overflow-hidden flex items-center">
        <div className="absolute inset-0 grid-bg opacity-60"></div>

        {/* Text column */}
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 w-full grid md:grid-cols-[1fr_1.3fr] gap-10 items-center">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] accent mb-4">La red</div>
            <h2 className="text-[clamp(32px,4.3vw,52px)] leading-[1.05] font-semibold tracking-[-0.035em] mb-5">
              {progress < 0.3 && <span>Encontramos a los <span className="italic font-light stroke-gradient">candidatos correctos.</span></span>}
              {progress >= 0.3 && progress < 0.65 && <span>Los <span className="italic font-light stroke-gradient">conectamos.</span></span>}
              {progress >= 0.65 && <span>Tenés un <span className="italic font-light stroke-gradient">equipo shippeando.</span></span>}
            </h2>
            <p className="text-dim text-[17px] leading-[1.6] max-w-md">
              {progress < 0.3 && 'Evaluados e interesados. Cada perfil es revisado quirúrgicamente por nuestro equipo.'}
              {progress >= 0.3 && progress < 0.65 && 'Mapeamos skills, zonas horarias y estilo de trabajo — ensamblando la forma de equipo que tu roadmap necesita.'}
              {progress >= 0.65 && 'Onboarded, pareados y alineados. Una unidad que shippea junta, no nueve extraños en Slack.'}
            </p>

            <div className="mt-10 flex items-center gap-4">
              <div className="font-mono text-[11px] text-mute uppercase tracking-wider">
                <div>{Math.min(activeCount, profiles.length)} / {profiles.length} perfiles</div>
                <div className="mt-1">{connections.length} conexiones</div>
              </div>
              <div className="flex-1 h-px bg-line"></div>
              <div className="font-mono text-[11px] accent uppercase tracking-wider">{teamFormed ? 'Equipo listo' : linesOn ? 'Formándose' : 'Sourcing'}</div>
            </div>
          </div>

          {/* Network canvas */}
          <div className="relative aspect-[1.1/1] md:aspect-[1.2/1] w-full">
            {/* SVG connections */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {connections.map(([a, b], i) => {
                const A = visible[a], B = visible[b];
                return (
                  <line
                    key={i}
                    x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                    className="connect-line"
                    style={{
                      opacity: linesOn ? (teamFormed ? 0.9 : 0.6) : 0,
                      transition: 'opacity 1s ease',
                      strokeWidth: 0.25,
                      stroke: teamFormed ? 'var(--accent)' : 'oklch(0.74 0.14 230 / 0.6)',
                    }}
                  />
                );
              })}
            </svg>

            {/* Hub glow */}
            {visible.map((p, i) => p.hub && (
              <div key={'glow-'+i} className="absolute rounded-full pointer-events-none" style={{
                left: `${p.x}%`, top: `${p.y}%`,
                width: '240px', height: '240px',
                transform: 'translate(-50%,-50%)',
                background: 'radial-gradient(circle, oklch(0.74 0.14 230 / 0.25) 0%, transparent 70%)',
                opacity: teamFormed ? 1 : 0.3,
                transition: 'opacity 1s',
              }}></div>
            ))}

            {/* Profile cards */}
            {visible.map((p, i) => (
              <div
                key={p.initials}
                className={`profile-card ${p.on ? 'in' : ''}`}
                style={{
                  left: `${p.x}%`, top: `${p.y}%`,
                  transform: p.on ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.7)',
                  borderColor: p.hub && teamFormed ? 'var(--accent)' : undefined,
                  boxShadow: p.hub && teamFormed ? '0 0 0 1px var(--accent), 0 20px 40px -10px oklch(0.74 0.14 230 / 0.4)' : undefined,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center font-mono text-[11px] font-semibold" style={{
                    background: `linear-gradient(135deg, oklch(0.35 0.08 ${200 + i*15}), oklch(0.25 0.05 ${200 + i*15}))`,
                  }}>{p.initials}</div>
                  <div>
                    <div className="text-[12px] font-medium leading-tight">{p.role}</div>
                    <div className="font-mono text-[10px] text-mute mt-0.5">{p.stack}</div>
                  </div>
                  <span className="dot ml-1"></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {[0, 1, 2].map(i => (
            <span key={i} className="h-1 rounded-full transition-all duration-500" style={{
              width: progress > i * 0.33 ? '40px' : '16px',
              background: progress > i * 0.33 ? 'var(--accent)' : 'var(--line)',
            }}/>
          ))}
        </div>
      </div>
    </section>
  );
}
window.Network = Network;
