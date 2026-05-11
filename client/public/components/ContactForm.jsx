function ContactForm({ onClose, onSuccess }) {
  const [form, setForm] = React.useState({
    company_name: '', contact_name: '', email: '', whatsapp: '',
    country: '', industry: '', employee_count: '', services: [],
    urgency: 'medium', budget: '', description: ''
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const serviceOptions = [
    { value: 'recruitment', label: 'Reclutamiento IT' },
    { value: 'automation', label: 'Automatización' },
    { value: 'data', label: 'Data / Dashboards' },
    { value: 'web_dev', label: 'Desarrollo Web' },
    { value: 'ai', label: 'IA Aplicada' },
  ];

  const toggleService = (val) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(val)
        ? prev.services.filter(s => s !== val)
        : [...prev.services, val]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.services.length) { setError('Seleccioná al menos un servicio'); return; }
    setLoading(true); setError('');

    try {
      const res = await fetch(`${window.__API}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');
      setSuccess(true);
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-panel flex items-center justify-center" onClick={e => e.stopPropagation()} style={{height:'auto',minHeight:'300px',padding:'48px'}}>
          <div className="text-center">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-2xl font-semibold mb-3">¡Solicitud recibida!</h3>
            <p className="text-dim text-lg mb-4">Te contactaremos en menos de 24 horas.</p>
            <p className="text-dim text-[14px] mb-6">Mientras tanto, podés escribirnos por WhatsApp.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="https://wa.me/5492617172768?text=Hola%2C%20acabo%20de%20enviar%20una%20solicitud%20en%20la%20web" target="_blank" rel="noopener" className="btn-ghost" style={{borderColor: 'oklch(0.65 0.16 150 / 0.45)', color: 'oklch(0.85 0.13 150)'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.68-1.63-.93-2.23-.25-.6-.5-.5-.68-.5h-.58c-.2 0-.52.07-.8.37-.28.3-1.07 1.05-1.07 2.55s1.1 2.97 1.25 3.17c.15.2 2.15 3.3 5.22 4.6.73.3 1.3.5 1.74.64.73.23 1.4.2 1.92.12.58-.08 1.78-.72 2.03-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35M12 2C6.48 2 2 6.48 2 12c0 1.74.45 3.38 1.23 4.8L2 22l5.33-1.4A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2"/></svg>
                WhatsApp
              </a>
              <button className="btn-ghost" onClick={onClose}>Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()} style={{height:'auto',maxHeight:'90vh',overflow:'auto',padding:'16px'}}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Contanos sobre tu empresa</h3>
            <p className="text-dim text-sm mt-1">Completá el formulario y te contactamos</p>
          </div>
          <button onClick={onClose} className="text-mute hover:text-ink text-2xl leading-none">&times;</button>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Empresa *</label>
            <input className="form-input" required value={form.company_name} onChange={e => setForm(p => ({...p, company_name: e.target.value}))} placeholder="Nombre de tu empresa" />
          </div>
          <div>
            <label className="form-label">Tu nombre *</label>
            <input className="form-input" required value={form.contact_name} onChange={e => setForm(p => ({...p, contact_name: e.target.value}))} placeholder="Nombre completo" />
          </div>
          <div>
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" required value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="email@empresa.com" />
          </div>
          <div>
            <label className="form-label">WhatsApp</label>
            <input className="form-input" value={form.whatsapp} onChange={e => setForm(p => ({...p, whatsapp: e.target.value}))} placeholder="+54 11 1234-5678" />
          </div>
          <div>
            <label className="form-label">País</label>
            <input className="form-input" value={form.country} onChange={e => setForm(p => ({...p, country: e.target.value}))} placeholder="Argentina" />
          </div>
          <div>
            <label className="form-label">Industria</label>
            <input className="form-input" value={form.industry} onChange={e => setForm(p => ({...p, industry: e.target.value}))} placeholder="Fintech, SaaS, etc." />
          </div>
          <div>
            <label className="form-label">Tamaño del equipo</label>
            <select className="form-input form-select" value={form.employee_count} onChange={e => setForm(p => ({...p, employee_count: e.target.value}))}>
              <option value="">Seleccionar</option>
              <option value="1-10">1-10</option>
              <option value="11-50">11-50</option>
              <option value="51-200">51-200</option>
              <option value="200+">200+</option>
            </select>
          </div>
          <div>
            <label className="form-label">Urgencia</label>
            <select className="form-input form-select" value={form.urgency} onChange={e => setForm(p => ({...p, urgency: e.target.value}))}>
              <option value="low">Baja - explorando</option>
              <option value="medium">Media - próximas semanas</option>
              <option value="high">Alta - esta semana</option>
              <option value="critical">Crítica - ya</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="form-label">¿Qué servicio necesitás? *</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {serviceOptions.map(s => (
                <label key={s.value} className="form-checkbox px-3 py-2 rounded-lg bg-surface border border-line cursor-pointer" style={form.services.includes(s.value) ? {borderColor:'var(--accent)', background:'var(--accent-soft)'} : {}}>
                  <input type="checkbox" checked={form.services.includes(s.value)} onChange={() => toggleService(s.value)} className="hidden" />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Presupuesto estimado (USD)</label>
            <input className="form-input" value={form.budget} onChange={e => setForm(p => ({...p, budget: e.target.value}))} placeholder="$2,000 - $5,000" />
          </div>

          <div className="md:col-span-2">
            <label className="form-label">Contanos tu necesidad</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="¿Qué problema querés resolver? ¿Qué perfiles buscás?" />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar solicitud'}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
