function AiChat() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [convId, setConvId] = React.useState(null);
  const messagesEnd = React.useRef(null);

  React.useEffect(() => {
    if (messagesEnd.current) messagesEnd.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`${window.__API}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, conversation_id: convId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.conversation_id) setConvId(data.conversation_id);
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, hubo un error. Intentá de nuevo o escribinos por WhatsApp.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (!open) {
    return (
      <button className="ai-chat-btn" onClick={() => { setOpen(true); if (!messages.length) setMessages([{ role: 'assistant', content: 'Hola 👋 Soy el asistente de Innova Talent. ¿En qué puedo ayudarte? Contame qué necesita tu empresa y te oriento.' }]); }} title="Chat con IA">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="oklch(0.12 0.008 250)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      </button>
    );
  }

  return (
    <>
      <button className="ai-chat-btn" onClick={() => setOpen(false)} title="Cerrar chat">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="oklch(0.12 0.008 250)" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div className="ai-chat-panel">
        <div style={{padding:'14px 16px',borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'var(--accent)',boxShadow:'0 0 10px var(--accent)'}}></div>
          <div>
            <div className="font-medium text-sm">Asistente Innova Talent</div>
            <div className="text-mute text-xs">Responde en segundos</div>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-msg ${msg.role}`}>{msg.content}</div>
          ))}
          {loading && <div className="ai-msg assistant" style={{opacity:0.6}}>Escribiendo...</div>}
          <div ref={messagesEnd} />
        </div>

        <div className="chat-input">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Escribí tu consulta..."
            disabled={loading}
          />
          <button onClick={send} disabled={loading || !input.trim()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>
          </button>
        </div>
      </div>
    </>
  );
}
