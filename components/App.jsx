function App() {
  const [tweaks, setTweaks] = React.useState(window.__TWEAKS);
  const [modalOpen, setModalOpen] = React.useState(false);

  const setTweak = (k, v) => setTweaks(prev => ({ ...prev, [k]: v }));

  // Apply accent hue to CSS var
  React.useEffect(() => {
    const hue = tweaks.accentHue;
    document.documentElement.style.setProperty('--accent', `oklch(0.74 0.14 ${hue})`);
    document.documentElement.style.setProperty('--accent-soft', `oklch(0.74 0.14 ${hue} / 0.12)`);
  }, [tweaks.accentHue]);

  // Reveal on scroll via IntersectionObserver
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
    // Observe any newly added
    const mo = new MutationObserver(reveal);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); mo.disconnect(); };
  }, []);

  const openCalendly = () => setModalOpen(true);

  return (
    <>
      <Nav onCTA={openCalendly} />
      <main>
        <Hero onCTA={openCalendly} showParticles={tweaks.showParticles} />
        <WhatWeDo />
        <Problem />
        <Process />
        <Network density={tweaks.networkDensity} />
        <Team />
        <Results />
        <FinalCTA onCTA={openCalendly} />
      </main>
      <Footer />
      <CalendlyModal open={modalOpen} onClose={() => setModalOpen(false)} calendlyUrl={tweaks.calendlyUrl} />
      <FloatingWhatsApp />
      <Tweaks tweaks={tweaks} setTweak={setTweak} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
