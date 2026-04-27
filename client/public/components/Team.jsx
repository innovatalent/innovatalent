function Team() {
  const people = [
    { name: 'Mailen Juan',  role: 'Founder — Talent Manager · Psicóloga laboral',          bio: 'Lidera la búsqueda y selección de talento IT. Cada match empieza con una conversación honesta sobre lo que el equipo realmente necesita.', photo: 'assets/mailen.jpg' },
    { name: 'Leonel Juan',  role: 'Co-founder — CEO & Data Analytics', bio: 'Combina data y estrategia para armar equipos técnicos que escalan. Ex-analytics en empresas de producto, hoy al frente de Innova Talent.', photo: 'assets/leonel.jpg', photoPos: 'center 25%' },
  ];

  const gradients = [
    'linear-gradient(135deg, oklch(0.38 0.10 230), oklch(0.22 0.06 260))',
    'linear-gradient(135deg, oklch(0.35 0.09 210), oklch(0.20 0.05 250))',
  ];

  return (
    <section id="team" className="relative py-32 border-t border-line">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid md:grid-cols-[1fr_1.4fr] gap-16 mb-20">
          <div>
            <div className="reveal font-mono text-[11px] uppercase tracking-[0.2em] accent mb-4">El equipo</div>
            <h2 className="reveal reveal-delay-1 text-[clamp(32px,4.3vw,52px)] leading-[1.04] font-semibold tracking-[-0.035em]">
              Recruiters que <span className="italic font-light text-dim">hablan tecnología.</span>
            </h2>
          </div>
          <div className="reveal reveal-delay-2">
            <p className="text-dim text-[18px] leading-[1.65] max-w-xl">
              Innova Talent Labs es un equipo chico y especializado. Conectamos startups y empresas tech con el talento que necesitan — sin intermediarios, sin vueltas, con un partner dedicado de principio a fin.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 max-w-3xl">
          {people.map((p, i) => (
            <div key={p.name} className={`reveal reveal-delay-${(i%4)+1} card card-hover overflow-hidden`}>
              <div className="aspect-[4/5] relative overflow-hidden" style={{ background: gradients[i % gradients.length] }}>
                {p.photo ? (
                  <>
                    <img src={p.photo} alt={p.name} className="absolute inset-0 w-full h-full object-cover" style={{objectPosition: p.photoPos || 'center 20%'}}/>
                    <div className="absolute inset-0" style={{background: 'linear-gradient(180deg, transparent 55%, oklch(0.12 0.008 250 / 0.6) 100%)'}}></div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'repeating-linear-gradient(135deg, oklch(1 0 0 / 0.04) 0px, oklch(1 0 0 / 0.04) 1px, transparent 1px, transparent 14px)',
                    }}></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="font-mono text-[56px] font-light text-white/80 tracking-tight">
                        {p.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
                      [retrato]
                    </div>
                  </>
                )}
                <div className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
                  0{i+1}
                </div>
              </div>
              <div className="p-5">
                <div className="text-[15px] font-medium tracking-tight mb-1">{p.name}</div>
                <div className="font-mono text-[10.5px] uppercase tracking-wider accent mb-3">{p.role}</div>
                <p className="text-dim text-[13px] leading-[1.55]">{p.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
window.Team = Team;
