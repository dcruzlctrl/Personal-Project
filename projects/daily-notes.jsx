// ===== DAILY NOTES VIEW (full-screen overlay) =====
function DailyNotesView({ user, projects, onClose }) {
    const [viewDate, setViewDate] = React.useState(getNYCDate());
    const [notes, setNotes]       = React.useState({});
    const [saving, setSaving]     = React.useState({});

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

    const isToday = viewDate === getNYCDate();

    const displayDate = (() => {
        const d = new Date(viewDate + 'T12:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    })();

    return (
        <div className="dn-fullscreen">
            <div className="dn-fs-header">
                <div className="dn-fs-left">
                    <span className="dn-fs-title">📝 Daily Notes</span>
                    <button className="dn-nav-btn" onClick={() => shiftDate(-1)}>← Prev</button>
                    <span className="dn-date-label">{displayDate}</span>
                    {!isToday && (
                        <button className="dn-today-btn" onClick={() => setViewDate(getNYCDate())}>Today</button>
                    )}
                    <button className="dn-nav-btn" onClick={() => shiftDate(1)} disabled={isToday}>Next →</button>
                </div>
                <button className="dn-close-btn" onClick={onClose} title="Close (Esc)">✕ Close</button>
            </div>

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
