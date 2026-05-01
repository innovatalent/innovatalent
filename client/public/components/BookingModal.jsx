function BookingModal({ open, onClose }) {
  const [step, setStep] = React.useState(0);
  const [selectedDate, setSelectedDate] = React.useState('');
  const [slots, setSlots] = React.useState([]);
  const [selectedSlot, setSelectedSlot] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', email: '', password: '', notes: '' });
  const [result, setResult] = React.useState(null);
  const [authError, setAuthError] = React.useState('');
  const [authMode, setAuthMode] = React.useState('login');
  const [token, setToken] = React.useState(localStorage.getItem('accessToken') || '');
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    if (!open) {
      setStep(0); setSelectedDate(''); setSlots([]); setSelectedSlot('');
      setForm({ name: '', email: '', password: '', notes: '' }); setResult(null);
      setAuthError(''); setAuthMode('login');
    }
    if (open) {
      document.body.style.overflow = 'hidden';
      const t = localStorage.getItem('accessToken');
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      if (t && u) { setToken(t); setUser(u); setStep(1); }
      else { setStep(0); }
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const getNextFridays = () => {
    const fridays = [];
    const d = new Date();
    d.setDate(d.getDate() + 1);
    for (let i = 0; i < 30 && fridays.length < 4; i++) {
      const check = new Date(d);
      check.setDate(check.getDate() + i);
      if (check.getDay() === 5) {
        fridays.push(check.toISOString().split('T')[0]);
      }
    }
    return fridays;
  };

  const formatFriday = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
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

  const handleAuth = async () => {
    setAuthError('');
    setLoading(true);
    try {
      if (authMode === 'login') {
        const res = await fetch(`${window.__API}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) { setAuthError(data.error || 'Email o contraseña incorrectos'); setLoading(false); return; }
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.accessToken);
        setUser(data.user);
        setStep(1);
      } else {
        if (!form.name) { setAuthError('Ingresá tu nombre'); setLoading(false); return; }
        const res = await fetch(`${window.__API}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password, name: form.name, role: 'startup' }),
        });
        const data = await res.json();
        if (!res.ok) { setAuthError(data.error || 'Error al registrarse'); setLoading(false); return; }
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.accessToken);
        setUser(data.user);
        setStep(1);
      }
    } catch { setAuthError('Error de conexión'); }
    setLoading(false);
  };

  const book = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${window.__API}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, start_time: selectedSlot, name: user?.name || form.name, email: user?.email || form.email, notes: form.notes }),
      });
      const data = await res.json();
      if (res.ok) { setResult(data.meeting); setStep(4); }
      else { alert(data.error || 'Error al agendar'); }
    } catch { alert('Error de conexión'); }
    setLoading(false);
  };

  if (!open) return null;

  const fridays = getNextFridays();

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
          {step === 0 && (
            <div>
              <div className="text-center mb-5">
                <div className="text-[16px] font-medium mb-1">{authMode === 'login' ? 'Iniciá sesión para agendar' : 'Registrate para agendar'}</div>
                <div className="text-[13px] text-dim">Necesitás una cuenta para reservar tu diagnóstico gratuito.</div>
              </div>
              {authMode === 'register' && (
                <input placeholder="Nombre completo" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-surface text-ink text-[14px] mb-3" />
              )}
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-line bg-surface text-ink text-[14px] mb-3" />
              <input type="password" placeholder="Contraseña" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAuth(); }}
                className="w-full px-4 py-3 rounded-lg border border-line bg-surface text-ink text-[14px] mb-3" />
              {authError && <div className="text-[13px] mb-3" style={{color:'var(--red)'}}>{authError}</div>}
              <button onClick={handleAuth} disabled={loading || !form.email || !form.password}
                className="btn-primary w-full justify-center" style={{opacity: (!form.email || !form.password) ? 0.5 : 1}}>
                {loading ? 'Cargando...' : authMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
              <div className="text-center mt-4">
                {authMode === 'login' ? (
                  <button onClick={() => { setAuthMode('register'); setAuthError(''); }} className="text-[13px] text-dim hover:text-ink transition">
                    ¿No tenés cuenta? <span className="accent">Registrate</span>
                  </button>
                ) : (
                  <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className="text-[13px] text-dim hover:text-ink transition">
                    ¿Ya tenés cuenta? <span className="accent">Iniciá sesión</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="text-[13px] text-dim mb-1">Hola, {user?.name || user?.email}</div>
              <div className="text-[14px] font-medium mb-4">Elegí un viernes</div>
              <div className="space-y-2">
                {fridays.map(date => (
                  <button key={date} onClick={() => { loadSlots(date); setStep(2); }}
                    className="w-full text-left px-4 py-3 rounded-lg border transition flex items-center justify-between"
                    style={{borderColor:'var(--line)', background:'transparent'}}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.background='var(--accent-soft)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor='var(--line)'; e.currentTarget.style.background='transparent'; }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'var(--accent-soft)'}}>
                        <span className="text-[12px] font-bold accent">{new Date(date + 'T12:00:00').getDate()}</span>
                      </div>
                      <div>
                        <div className="text-[14px] font-medium capitalize">{formatFriday(date)}</div>
                        <div className="text-[11px] text-mute font-mono">09:00 — 17:00 · Buenos Aires</div>
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-dim"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                ))}
              </div>
              {fridays.length === 0 && <div className="text-mute text-[13px] text-center py-4">No hay viernes disponibles próximamente.</div>}
            </div>
          )}

          {step === 2 && (
            <div>
              <button onClick={() => setStep(1)} className="text-[12px] text-dim mb-3 flex items-center gap-1 hover:text-ink transition">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Cambiar fecha
              </button>
              <div className="rounded-lg border border-line bg-surface-2 p-3 mb-4 text-[13px]">
                <span className="text-dim capitalize">📅 {formatFriday(selectedDate)}</span>
              </div>
              <div className="text-[14px] font-medium mb-3">Elegí un horario</div>
              {loading ? <div className="text-mute text-[13px]">Cargando horarios...</div> :
                slots.length === 0 ? <div className="text-mute text-[13px]">No hay horarios disponibles para este viernes.</div> :
                <div className="grid grid-cols-3 gap-2">
                  {slots.map(s => (
                    <button key={s.start} onClick={() => { setSelectedSlot(s.start); setStep(3); }}
                      className="px-3 py-2.5 rounded-lg border text-[13px] font-mono transition"
                      style={{borderColor:'var(--line)', background:'transparent', color:'var(--dim)'}}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.background='var(--accent-soft)'; e.currentTarget.style.color='var(--accent)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor='var(--line)'; e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--dim)'; }}>
                      {s.start}
                    </button>
                  ))}
                </div>
              }
            </div>
          )}

          {step === 3 && (
            <div>
              <button onClick={() => setStep(2)} className="text-[12px] text-dim mb-3 flex items-center gap-1 hover:text-ink transition">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Cambiar horario
              </button>
              <div className="rounded-lg border border-line bg-surface-2 p-4 mb-4 text-[13px]">
                <div className="mb-1 capitalize"><span className="text-dim">📅</span> {formatFriday(selectedDate)}</div>
                <div className="mb-1"><span className="text-dim">🕐</span> {selectedSlot} — 30 minutos</div>
                <div><span className="text-dim">👤</span> {user?.name || user?.email}</div>
              </div>
              <textarea placeholder="Contanos brevemente qué necesitás (opcional)" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-line bg-surface text-ink text-[14px] mb-4" rows="3" />
              <button onClick={book} disabled={loading} className="btn-primary w-full justify-center">
                {loading ? 'Agendando...' : 'Confirmar y agendar'}
              </button>
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
                <div className="mb-1 capitalize"><span className="text-dim">📅</span> {formatFriday(selectedDate)} · {selectedSlot}</div>
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
