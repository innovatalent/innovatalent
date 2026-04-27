function FloatingWhatsApp() {
  const [show, setShow] = React.useState(false);
  const [mode, setMode] = React.useState('recruitment'); // 'recruitment' | 'automation'

  React.useEffect(() => {
    const t = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    const onScroll = () => {
      const s = document.getElementById('services');
      if (!s) return;
      const r = s.getBoundingClientRect();
      const vh = window.innerHeight;
      // Trigger automation mode when Services section is in the middle of viewport
      const inView = r.top < vh * 0.5 && r.bottom > vh * 0.5;
      setMode(inView ? 'automation' : 'recruitment');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isAutomation = mode === 'automation';
  const href = isAutomation ? 'https://wa.me/542616042245' : 'https://w.app/innovatalentlabs';
  const label = isAutomation ? 'Consultá por automatización · data · web' : 'Hablemos por WhatsApp';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label={label}
      className="fixed z-40 bottom-5 right-5 md:bottom-7 md:right-7 group"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.92)',
        transition: 'opacity .5s ease, transform .5s ease',
      }}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: 'oklch(0.72 0.18 150 / 0.45)',
          animation: 'wa-ping 2.4s cubic-bezier(0,0,0.2,1) infinite',
        }}
      ></span>
      <span
        className="relative flex items-center justify-center w-14 h-14 md:w-15 md:h-15 rounded-full text-white shadow-2xl transition-transform group-hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, oklch(0.72 0.18 150), oklch(0.55 0.18 155))',
          boxShadow: '0 12px 28px -8px oklch(0.55 0.18 155 / 0.6), 0 0 0 1px oklch(0.85 0.1 150 / 0.3) inset',
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.68-1.63-.93-2.23-.25-.6-.5-.5-.68-.5h-.58c-.2 0-.52.07-.8.37-.28.3-1.07 1.05-1.07 2.55s1.1 2.97 1.25 3.17c.15.2 2.15 3.3 5.22 4.6.73.3 1.3.5 1.74.64.73.23 1.4.2 1.92.12.58-.08 1.78-.72 2.03-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35M12 2C6.48 2 2 6.48 2 12c0 1.74.45 3.38 1.23 4.8L2 22l5.33-1.4A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2"/>
        </svg>
      </span>
      <span
        className="wa-tooltip absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-line whitespace-nowrap pointer-events-none"
      >
        <span className="font-mono text-[11px] uppercase tracking-wider text-dim">{label}</span>
      </span>
      <style>{`
        @keyframes wa-ping {
          0% { transform: scale(0.95); opacity: 0.6; }
          80%, 100% { transform: scale(1.6); opacity: 0; }
        }
        .wa-tooltip { opacity: 0; transform: translateX(8px) translateY(-50%); transition: opacity .25s ease, transform .25s ease; }
        .group:hover .wa-tooltip { opacity: 1; transform: translateX(0) translateY(-50%); }
      `}</style>
    </a>
  );
}
window.FloatingWhatsApp = FloatingWhatsApp;
