function App() {
  const [tweaks, setTweaks] = React.useState(window.__TWEAKS);
  const [bookingOpen, setBookingOpen] = React.useState(false);
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

  const openBooking = () => setBookingOpen(true);
  const openContact = () => setContactOpen(true);

  React.useEffect(() => {
    const handler = () => setBookingOpen(true);
    window.addEventListener('open-booking', handler);
    return () => window.removeEventListener('open-booking', handler);
  }, []);

  return (
    <>
      <Nav onCTA={openContact} onBooking={openBooking} />
      <main>
        <Hero onCTA={openContact} onBooking={openBooking} showParticles={tweaks.showParticles} />
        <WhatWeDo />
        <Problem />
        <Process />
        <Network density={tweaks.networkDensity} />
        <Team />
        <Results />
        <FinalCTA onCTA={openBooking} />
      </main>
      <Footer />
      <FloatingWhatsApp />
      <AiChat />
      {contactOpen && <ContactForm onClose={() => setContactOpen(false)} />}
      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
