function Tweaks({ tweaks, setTweak }) {
  const [editMode, setEditMode] = React.useState(false);
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setEditMode(true);
      if (e.data?.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  if (!editMode) return null;

  const persist = (edits) => {
    Object.entries(edits).forEach(([k, v]) => setTweak(k, v));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
  };

  return (
    <div className="tweaks-panel">
      <div className="flex items-center justify-between mb-3">
        <div className="uppercase tracking-wider text-[11px] text-dim">Tweaks</div>
        <button onClick={() => setOpen(!open)} className="text-mute hover:text-ink">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{transform: open ? 'rotate(180deg)' : ''}}>
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      {open && (
        <div className="space-y-4">
          <div>
            <div className="text-mute mb-2">Accent hue</div>
            <input
              type="range" min="0" max="360" step="1"
              value={tweaks.accentHue}
              onChange={(e) => persist({ accentHue: +e.target.value })}
              className="w-full accent-[var(--accent)]"
            />
            <div className="flex justify-between mt-1 text-mute text-[10px]">
              <span>{tweaks.accentHue}°</span>
              <div className="w-4 h-4 rounded" style={{background: `oklch(0.74 0.14 ${tweaks.accentHue})`}}></div>
            </div>
          </div>

          <div>
            <div className="text-mute mb-2">Network density</div>
            <div className="flex gap-1">
              {['low','medium','high'].map(d => (
                <button key={d}
                  onClick={() => persist({ networkDensity: d })}
                  className={`flex-1 px-2 py-1.5 rounded text-[10.5px] uppercase tracking-wider transition ${tweaks.networkDensity === d ? 'bg-accent text-[var(--bg)]' : 'bg-surface-2 text-dim hover:text-ink'}`}
                >{d}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-mute mb-2">Hero particles</div>
            <button
              onClick={() => persist({ showParticles: !tweaks.showParticles })}
              className={`w-full px-2 py-1.5 rounded text-[10.5px] uppercase tracking-wider transition ${tweaks.showParticles ? 'bg-accent text-[var(--bg)]' : 'bg-surface-2 text-dim'}`}
            >{tweaks.showParticles ? 'On' : 'Off'}</button>
          </div>

          <div>
            <div className="text-mute mb-2">Calendly URL</div>
            <input
              type="text"
              value={tweaks.calendlyUrl}
              onChange={(e) => persist({ calendlyUrl: e.target.value })}
              className="w-full px-2 py-1.5 rounded bg-surface-2 border border-line text-ink text-[11px] font-mono outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
window.Tweaks = Tweaks;
