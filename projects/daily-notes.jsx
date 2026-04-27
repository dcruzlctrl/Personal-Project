// ===== DAILY NOTES VIEW (full-screen overlay) =====
function DailyNotesView({ user, projects, onClose }) {
    const [viewDate, setViewDate] = React.useState(getNYCDate());
    const [notes, setNotes]       = React.useState({});
    const [saving, setSaving]     = React.useState({});
    const touchStartX = React.useRef(null);

    React.useEffect(() => { loadNotes(); }, [viewDate, projects.length]);

    // Close on Escape
    React.useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const loadNotes = async () => {
        if (!projects.length) return;
        const { data } = await supabase
            .from('project_notes')
            .select('project_id, note')
            .eq('user_id', user.id)
            .eq('note_date', viewDate);
        const map = {};
        (data || []).forEach(r => { map[r.project_id] = r.note; });
        setNotes(map);
    };

    const saveNote = async (projectId, value) => {
        setNotes(prev => ({ ...prev, [projectId]: value }));
        setSaving(prev => ({ ...prev, [projectId]: true }));
        await supabase.from('project_notes').upsert({
            user_id: user.id,
            project_id: projectId,
            note_date: viewDate,
            note: value,
            updated_at: new Date().toISOString()
        }, { onConflict: 'project_id,note_date' });
        setSaving(prev => ({ ...prev, [projectId]: false }));
    };

    const shiftDate = (delta) => {
        const d = new Date(viewDate + 'T12:00:00');
        d.setDate(d.getDate() + delta);
        setViewDate([d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'));
    };

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(dx) < 50) return; // too short, ignore
        if (dx < 0) shiftDate(1);  // swipe left = next day
        else if (viewDate !== getNYCDate() || dx > 0) shiftDate(-1); // swipe right = prev day
    };

    const isToday = viewDate === getNYCDate();

    const displayDate = (() => {
        const d = new Date(viewDate + 'T12:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    })();

    return (
        <div className="dn-fullscreen" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

            {/* ── Title bar ── */}
            <div className="dn-fs-header">
                <span className="dn-fs-title">📝 Daily Notes</span>
                <button className="dn-close-btn" onClick={onClose} title="Close (Esc)">✕ Close</button>
            </div>

            {/* ── Date nav ── */}
            <div className="dn-date-nav">
                <button className="dn-arrow-btn" onClick={() => shiftDate(-1)}>‹</button>
                <div className="dn-date-center">
                    <div className="dn-date-label">{displayDate}</div>
                    {!isToday && (
                        <button className="dn-today-btn" onClick={() => setViewDate(getNYCDate())}>Today</button>
                    )}
                </div>
                <button className="dn-arrow-btn" onClick={() => shiftDate(1)} disabled={isToday}>›</button>
            </div>

            {/* ── Table ── */}
            <div className="dn-fs-body">
                <div className="dn-table">
                    <div className="dn-table-head">
                        <div className="dn-col-project">Project</div>
                        <div className="dn-col-note">Notes / Updates</div>
                    </div>
                    <div className="dn-table-body">
                        {projects.map(p => (
                            <div key={p.id} className="dn-row">
                                <div className="dn-col-project">
                                    <span className={`dn-project-name ${p.status !== 'active' ? 'dn-inactive' : ''}`}>{p.name}</span>
                                    {p.status !== 'active' && <span className="dn-status-tag">{p.status}</span>}
                                </div>
                                <div className="dn-col-note">
                                    <textarea
                                        className="dn-textarea"
                                        value={notes[p.id] || ''}
                                        onChange={(e) => saveNote(p.id, e.target.value)}
                                        placeholder="Add update…"
                                    />
                                    {saving[p.id] && <span className="dn-saving">saving…</span>}
                                </div>
                            </div>
                        ))}
                        {projects.length === 0 && (
                            <div className="dn-empty">No projects yet. Add some projects first.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
