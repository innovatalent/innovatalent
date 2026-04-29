function App() {
  const [tweaks, setTweaks] = React.useState(window.__TWEAKS);
  const [calendlyOpen, setCalendlyOpen] = React.useState(false);
  const [contactOpen, setContactOpen] = React.useState(false);

  const setTweak = (k, v) => setTweaks(prev => ({ ...prev, [k]: v }));

  React.useEffect(() => {
    const hue = tweaks.accentHue;
    document.documentElement.style.setProperty('--accent', `oklch(0.74 0.14 ${hue})`);
    document.documentElement.style.setProperty('--accent-soft', `oklch(0.74 0.14 ${hue} / 0.12)`);
  }, [tweaks.accentHue]);

  React.useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    const reveal = () => {
      document.querySelectorAll('.reveal:not(.in)').forEach(el => observer.observe(el));
    };
    reveal();
    const mo = new MutationObserver(reveal);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); mo.disconnect(); };
  }, []);

  const openCalendly = () => setCalendlyOpen(true);
  const openContact = () => setContactOpen(true);

  return (
    <>
      <Nav onCTA={openContact} onCalendly={openCalendly} />
      <main>
        <Hero onCTA={openContact} onCalendly={openCalendly} showParticles={tweaks.showParticles} />
        <WhatWeDo />
        <Problem />
        <Process />
        <Network density={tweaks.networkDensity} />
        <Team />
        <Results />
        <FinalCTA onCTA={openCalendly} />
      </main>
      <Footer />
      <FloatingWhatsApp />
      <AiChat />
      {contactOpen && <ContactForm onClose={() => setContactOpen(false)} />}
      <CalendlyModal open={calendlyOpen} onClose={() => setCalendlyOpen(false)} calendlyUrl={tweaks.calendlyUrl} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
