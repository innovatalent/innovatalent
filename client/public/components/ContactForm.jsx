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
            <p className="text-dim text-lg mb-6">Te contactaremos en menos de 24 horas.</p>
            <button className="btn-primary" onClick={onClose}>Cerrar</button>
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
