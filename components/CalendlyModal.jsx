function CalendlyModal({ open, onClose, calendlyUrl }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const isPlaceholder = !calendlyUrl || calendlyUrl.includes('tu-link');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: 'var(--accent-soft)'}}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="accent">
                <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M2 6h12M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="text-[15px] font-medium">Agendá una llamada de intake</div>
              <div className="font-mono text-[11px] text-mute uppercase tracking-wider">30 minutos · Gratis</div>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-surface-2 transition flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="relative h-[calc(100%-65px)]">
          {isPlaceholder ? (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center">
              <div className="w-16 h-16 rounded-2xl mb-6 flex items-center justify-center" style={{background: 'var(--accent-soft)'}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="accent">
                  <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 10h18M8 2v5M16 2v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-[24px] font-medium tracking-tight mb-3">Embed de Calendly</h3>
              <p className="text-dim text-[15px] leading-relaxed max-w-md mb-8">
                Configurá tu URL de Calendly en el panel de Tweaks (abajo a la derecha) y el modal va a cargar tu widget de reservas en vivo.
              </p>
              <div className="w-full max-w-md rounded-xl border border-line bg-surface-2 p-5 text-left">
                <div className="font-mono text-[10.5px] uppercase tracking-wider text-mute mb-2">Placeholder actual</div>
                <div className="font-mono text-[13px] accent break-all mb-4">{calendlyUrl || 'https://calendly.com/tu-link'}</div>
                <div className="font-mono text-[10.5px] uppercase tracking-wider text-mute mb-2">Opciones de integración</div>
                <ol className="font-mono text-[12px] text-dim space-y-1.5 pl-4 list-decimal">
                  <li>Embed con iframe (este modal)</li>
                  <li>Redirección directa — abrir en nueva pestaña</li>
                </ol>
              </div>
              <a
                href={calendlyUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-8 !text-[14px]"
                onClick={(e) => { if (isPlaceholder) e.preventDefault(); }}
              >
                Abrir en nueva pestaña (redirección)
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3h6v6M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </a>
            </div>
          ) : (
            <iframe
              src={calendlyUrl}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              title="Calendly"
            />
          )}
        </div>
      </div>
    </div>
  );
}
window.CalendlyModal = CalendlyModal;
