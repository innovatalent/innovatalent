function BookingModal({ open, onClose }) {
  const [step, setStep] = React.useState(1);
  const [selectedDate, setSelectedDate] = React.useState('');
  const [slots, setSlots] = React.useState([]);
  const [selectedSlot, setSelectedSlot] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', email: '', notes: '' });
  const [result, setResult] = React.useState(null);

  React.useEffect(() => {
    if (!open) { setStep(1); setSelectedDate(''); setSlots([]); setSelectedSlot(''); setForm({ name: '', email: '', notes: '' }); setResult(null); }
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const loadSlots = async (date) => {
    setSelectedDate(date);
    setSelectedSlot('');
    setLoading(true);
    try {
      const res = await fetch(`${window.__API}/meetings/slots?date=${date}`);
      const data = await res.json();
      setSlots(data.available || []);
    } catch { setSlots([]); }
    setLoading(false);
  };

  const book = async () => {
    if (!form.name || !form.email) return;
    setLoading(true);
    try {
      const res = await fetch(`${window.__API}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, start_time: selectedSlot, name: form.name, email: form.email, notes: form.notes }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.meeting);
        setStep(4);
      } else {
        alert(data.error || 'Error al agendar');
      }
    } catch { alert('Error de conexión'); }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{maxWidth:'480px'}}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: 'var(--accent-soft)'}}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="accent">
                <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M2 6h12M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="text-[15px] font-medium">Agendar diagnóstico</div>
              <div className="font-mono text-[11px] text-mute uppercase tracking-wider">30 min · Gratis · Google Meet</div>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-surface-2 transition flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div>
              <div className="text-[14px] font-medium mb-3">Elegí una fecha</div>
              <input type="date" min={getMinDate()} value={selectedDate} onChange={(e) => loadSlots(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-line bg-surface text-ink text-[14px]" style={{colorScheme:'dark'}} />
              {selectedDate && (
                <div className="mt-4">
                  <div className="text-[13px] text-dim mb-2">Horarios disponibles</div>
                  {loading ? <div className="text-mute text-[13px]">Cargando...</div> :
                    slots.length === 0 ? <div className="text-mute text-[13px]">No hay horarios disponibles para esta fecha.</div> :
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map(s => (
                        <button key={s.start} onClick={() => { setSelectedSlot(s.start); setStep(2); }}
                          className="px-3 py-2 rounded-lg border text-[13px] font-mono transition"
                          style={{borderColor: selectedSlot === s.start ? 'var(--accent)' : 'var(--line)',
                                  background: selectedSlot === s.start ? 'var(--accent-soft)' : 'transparent',
                                  color: selectedSlot === s.start ? 'var(--accent)' : 'var(--dim)'}}>
                          {s.start}
                        </button>
                      ))}
                    </div>
                  }
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <button onClick={() => setStep(1)} className="text-[12px] text-dim mb-3 flex items-center gap-1 hover:text-ink transition">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Cambiar horario
              </button>
              <div className="rounded-lg border border-line bg-surface-2 p-3 mb-4 text-[13px]">
                <span className="text-dim">📅 {selectedDate} · 🕐 {selectedSlot} · 30 min</span>
              </div>
              <div className="text-[14px] font-medium mb-3">Tus datos</div>
              <input placeholder="Nombre completo" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-line bg-surface text-ink text-[14px] mb-3" />
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-line bg-surface text-ink text-[14px] mb-3" />
              <textarea placeholder="Contanos brevemente qué necesitás (opcional)" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-line bg-surface text-ink text-[14px] mb-4" rows="3" />
              <button onClick={() => { if (form.name && form.email) setStep(3); }}
                disabled={!form.name || !form.email}
                className="btn-primary w-full justify-center" style={{opacity: (!form.name || !form.email) ? 0.5 : 1}}>
                Confirmar reunión
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-6">
              <div className="rounded-lg border border-line bg-surface-2 p-4 mb-6 text-left text-[13px]">
                <div className="mb-1"><span className="text-dim">📅</span> {selectedDate}</div>
                <div className="mb-1"><span className="text-dim">🕐</span> {selectedSlot} — 30 minutos</div>
                <div className="mb-1"><span className="text-dim">👤</span> {form.name}</div>
                <div><span className="text-dim">📧</span> {form.email}</div>
                {form.notes && <div className="mt-2 text-dim">{form.notes}</div>}
              </div>
              <button onClick={book} disabled={loading} className="btn-primary w-full justify-center">
                {loading ? 'Agendando...' : 'Confirmar y agendar'}
              </button>
              <button onClick={() => setStep(2)} className="text-[12px] text-dim mt-3 hover:text-ink transition">Volver a editar</button>
            </div>
          )}

          {step === 4 && result && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{background:'rgba(34,197,94,.12)'}}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h3 className="text-[20px] font-semibold mb-2">Reunión confirmada</h3>
              <p className="text-dim text-[14px] mb-4">Te enviamos un email con los detalles.</p>
              <div className="rounded-lg border border-line bg-surface-2 p-4 mb-4 text-left text-[13px]">
                <div className="mb-1"><span className="text-dim">📅</span> {selectedDate} · {selectedSlot}</div>
                {result.meet_link && (
                  <div className="mt-2">
                    <a href={result.meet_link} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium" style={{background:'rgba(66,133,244,.12)', color:'#4285F4'}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 8l-7 5-7-5V6l7 5 7-5V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8z"/></svg>
                      Unirme con Google Meet
                    </a>
                  </div>
                )}
              </div>
              <button onClick={onClose} className="btn-ghost w-full justify-center">Cerrar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
window.BookingModal = BookingModal;
