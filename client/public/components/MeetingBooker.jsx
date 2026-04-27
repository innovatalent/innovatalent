function MeetingBooker({ onClose }) {
  const [step, setStep] = React.useState(1);
  const [selectedDate, setSelectedDate] = React.useState('');
  const [slots, setSlots] = React.useState([]);
  const [selectedSlot, setSelectedSlot] = React.useState(null);
  const [form, setForm] = React.useState({ name: '', email: '', notes: '' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const today = new Date();
  const dates = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      dates.push(d.toISOString().split('T')[0]);
    }
  }

  const fetchSlots = async (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoading(true);
    try {
      const res = await fetch(`${window.__API}/meetings/slots?date=${date}`);
      const data = await res.json();
      setSlots(data.available || []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${window.__API}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          start_time: selectedSlot.start,
          email: form.email,
          name: form.name,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
  };

  if (success) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-panel flex items-center justify-center" onClick={e => e.stopPropagation()} style={{height:'auto',minHeight:'300px',padding:'48px'}}>
          <div className="text-center">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-2xl font-semibold mb-3">¡Reunión confirmada!</h3>
            <p className="text-dim text-lg mb-2">{formatDate(selectedDate)} a las {selectedSlot.start}hs</p>
            <p className="text-mute mb-6">Te enviamos un email de confirmación.</p>
            <button className="btn-primary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()} style={{height:'auto',maxHeight:'90vh',overflow:'auto',padding:'32px'}}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Agendar reunión</h3>
            <p className="text-dim text-sm mt-1">30 minutos · Google Meet</p>
          </div>
          <button onClick={onClose} className="text-mute hover:text-ink text-2xl leading-none">&times;</button>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">{error}</div>}

        {step === 1 && (
          <div>
            <label className="form-label mb-3">Elegí un día</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
              {dates.map(d => (
                <button key={d} onClick={() => fetchSlots(d)}
                  className="p-3 rounded-lg text-center text-sm border transition-all"
                  style={selectedDate === d
                    ? {borderColor:'var(--accent)',background:'var(--accent-soft)',color:'var(--ink)'}
                    : {borderColor:'var(--line)',background:'var(--bg)',color:'var(--ink-dim)'}
                  }>
                  {formatDate(d)}
                </button>
              ))}
            </div>

            {selectedDate && (
              <>
                <label className="form-label mb-3">Horarios disponibles</label>
                {loading ? (
                  <p className="text-mute text-sm">Cargando...</p>
                ) : slots.length === 0 ? (
                  <p className="text-mute text-sm">No hay horarios disponibles este día</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
                    {slots.map(s => (
                      <button key={s.start} onClick={() => setSelectedSlot(s)}
                        className="p-2.5 rounded-lg text-center text-sm border transition-all"
                        style={selectedSlot?.start === s.start
                          ? {borderColor:'var(--accent)',background:'var(--accent-soft)',color:'var(--ink)'}
                          : {borderColor:'var(--line)',background:'var(--bg)',color:'var(--ink-dim)'}
                        }>
                        {s.start}
                      </button>
                    ))}
                  </div>
                )}

                {selectedSlot && (
                  <div className="flex justify-end">
                    <button className="btn-primary" onClick={() => setStep(2)}>Continuar</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleBook}>
            <div className="mb-4 p-3 bg-surface rounded-lg text-sm text-dim">
              📅 {formatDate(selectedDate)} · {selectedSlot.start} - {selectedSlot.end}
              <button type="button" className="ml-2 accent underline" onClick={() => setStep(1)}>Cambiar</button>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="form-label">Tu nombre *</label>
                <input className="form-input" required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" required value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
              </div>
              <div>
                <label className="form-label">¿Qué te gustaría discutir?</label>
                <textarea className="form-input" rows={3} value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="Opcional" />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" className="btn-ghost" onClick={() => setStep(1)}>Volver</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Agendando...' : 'Confirmar reunión'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
