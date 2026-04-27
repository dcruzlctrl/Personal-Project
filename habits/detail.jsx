// ===== HABIT DETAIL MODAL =====
function HabitDetailModal({ habit, onClose, onRefresh }) {
    const [logs, setLogs]           = React.useState([]);
    const [loading, setLoading]     = React.useState(true);
    const [totalCount, setTotalCount] = React.useState(0);
    const [streaks, setStreaks]     = React.useState({ currentStreak: 0, longestStreak: 0 });
    const [resetDaily, setResetDaily] = React.useState(habit.reset_daily);
    const [activeTab, setActiveTab] = React.useState('overview');
    const [notes, setNotes]         = React.useState([]);
    const [newNote, setNewNote]     = React.useState('');
    const [savingNote, setSavingNote] = React.useState(false);
    const [editingName, setEditingName] = React.useState(false);
    const [nameValue, setNameValue]     = React.useState(habit.name);
    const nameInputRef = React.useRef(null);

    React.useEffect(() => {
        if (editingName) nameInputRef.current?.select();
    }, [editingName]);

    const handleSaveName = async () => {
        const trimmed = nameValue.trim();
        if (!trimmed || trimmed === habit.name) { setEditingName(false); setNameValue(habit.name); return; }
        try {
            await supabase.from('habits').update({ name: trimmed }).eq('id', habit.id);
            onRefresh();
        } catch (err) { console.error(err); }
        setEditingName(false);
    };

    React.useEffect(() => { setResetDaily(habit.reset_daily); }, [habit.reset_daily]);
    React.useEffect(() => { loadLogs(); loadNotes(); }, [habit.id]);

    const loadLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('habit_logs').select('*')
                .eq('habit_id', habit.id)
                .order('timestamp', { ascending: false });
            if (error) throw error;
            setLogs(data || []);
            setTotalCount((data || []).reduce((sum, log) => sum + log.change, 0));
            const streakData = await calculateStreaks(habit.id, data || []);
            setStreaks(streakData);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const [notesTableMissing, setNotesTableMissing] = React.useState(false);

    const loadNotes = async () => {
        try {
            const { data, error } = await supabase
                .from('habit_notes').select('*')
                .eq('habit_id', habit.id)
                .order('created_at', { ascending: false });
            if (error) {
                if (error.code === '42P01') { setNotesTableMissing(true); return; } // table doesn't exist
                throw error;
            }
            setNotes(data || []);
        } catch (err) { console.error(err); }
    };

    const handleAddNote = async () => {
        if (!newNote.trim() || notesTableMissing) return;
        setSavingNote(true);
        try {
            const { error } = await supabase.from('habit_notes').insert({
                habit_id: habit.id,
                note: newNote.trim()
            });
            if (error) throw error;
            setNewNote('');
            loadNotes();
        } catch (err) { console.error(err); }
        finally { setSavingNote(false); }
    };

    const handleDeleteNote = async (noteId) => {
        try {
            await supabase.from('habit_notes').delete().eq('id', noteId);
            setNotes(prev => prev.filter(n => n.id !== noteId));
        } catch (err) { console.error(err); }
    };

    const handleToggleReset = async () => {
        const newValue = !resetDaily;
        setResetDaily(newValue);
        try {
            await supabase.from('habits')
                .update({ reset_daily: newValue, last_reset_date: getNYCDate() })
                .eq('id', habit.id);
            onRefresh();
        } catch (err) {
            console.error(err);
            setResetDaily(resetDaily);
        }
    };

    const handleResetDaily = async () => {
        if (window.confirm('Reset today\'s count to 0? (All-time count stays the same)')) {
            try {
                await supabase.from('habits')
                    .update({ count: 0, last_reset_date: getNYCDate() })
                    .eq('id', habit.id);
                onRefresh();
            } catch (err) { console.error(err); }
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Delete this habit and all history?')) {
            try {
                await supabase.from('habits').delete().eq('id', habit.id);
                onClose(); onRefresh();
            } catch (err) { console.error(err); }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <div className="modal-head">
                    {editingName ? (
                        <input
                            ref={nameInputRef}
                            className="modal-title-input"
                            value={nameValue}
                            onChange={e => setNameValue(e.target.value)}
                            onBlur={handleSaveName}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setEditingName(false); setNameValue(habit.name); } }}
                        />
                    ) : (
                        <div className="modal-title modal-title-editable" onClick={() => setEditingName(true)} title="Click to rename">
                            {nameValue} <span className="edit-pencil">✎</span>
                        </div>
                    )}
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-tabs">
                    <button
                        className={`modal-tab ${activeTab === 'overview' ? 'modal-tab--active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >Overview</button>
                    <button
                        className={`modal-tab ${activeTab === 'calendar' ? 'modal-tab--active' : ''}`}
                        onClick={() => setActiveTab('calendar')}
                    >Calendar</button>
                    <button
                        className={`modal-tab ${activeTab === 'notes' ? 'modal-tab--active' : ''}`}
                        onClick={() => setActiveTab('notes')}
                    >
                        Notes {notes.length > 0 && <span className="notes-badge">{notes.length}</span>}
                    </button>
                </div>

                {activeTab === 'overview' && (
                <>
                {/* Streak */}
                <div className="streak-block">
                    <div className="streak-fire">🔥</div>
                    <div className="streak-num">{streaks.currentStreak}</div>
                    <div className="streak-unit">day streak</div>
                    <div className="streak-best">Best: {streaks.longestStreak} days</div>
                </div>

                {/* Stats */}
                <div className="modal-section">
                    <div className="section-label">Stats</div>
                    <div className="stats-row">
                        <div className="stat-box">
                            <div className="stat-lbl">Today</div>
                            <div className="stat-val">{habit.count}</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-lbl">All-Time</div>
                            <div className="stat-val all-time">{totalCount}</div>
                        </div>
                    </div>
                </div>

                {/* Settings */}
                <div className="modal-section">
                    <div className="section-label">Settings</div>
                    <div className="toggle-row">
                        <div>
                            <div className="toggle-label">Daily Reset</div>
                            <div className="toggle-hint">Resets count at midnight</div>
                        </div>
                        <input
                            type="checkbox"
                            className="toggle-check"
                            checked={resetDaily}
                            onChange={handleToggleReset}
                        />
                    </div>
                    {resetDaily && (
                        <div className="reset-badge">✓ Daily reset enabled</div>
                    )}
                    <button className="btn btn-ghost" style={{ width: '100%', marginTop: '12px', background: 'var(--warning-light)', color: 'var(--warning)', border: 'none' }} onClick={handleResetDaily}>
                        Reset Today's Count
                    </button>
                </div>

                {/* History */}
                {!loading && (
                    <div className="modal-section">
                        <div className="section-label">History</div>
                        {logs.length === 0 ? (
                            <div style={{ color: 'var(--text-subtle)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                                No history yet
                            </div>
                        ) : (
                            <div className="history-list">
                                {logs.map((log, idx) => {
                                    const timestamp = new Date(log.timestamp);
                                    const formatter = new Intl.DateTimeFormat('en-US', {
                                        timeZone: 'America/New_York',
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                    });
                                    const timeStr = formatter.format(timestamp);
                                    const isPos = log.change > 0;
                                    return (
                                        <div key={idx} className="history-item">
                                            <div className="history-time">{timeStr}</div>
                                            <div className={isPos ? 'history-pos' : 'history-neg'}>
                                                {isPos ? '+' : ''}{log.change}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
                </>
                )}

                {activeTab === 'notes' && (
                    <div style={{ paddingTop: '4px' }}>
                        {notesTableMissing && (
                            <div style={{ background: 'var(--warning-light)', border: '1px solid var(--amber)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: '12px', fontSize: '12px', color: 'var(--warning)' }}>
                                Run this in Supabase SQL editor to enable notes:<br />
                                <code style={{ display: 'block', marginTop: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px', whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{`create table habit_notes (\n  id uuid default gen_random_uuid() primary key,\n  habit_id uuid references habits(id) on delete cascade,\n  note text not null,\n  created_at timestamptz default now()\n);`}</code>
                            </div>
                        )}
                        <div className="note-compose">
                            <textarea
                                className="note-input"
                                placeholder="Add a note…"
                                value={newNote}
                                onChange={e => setNewNote(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote(); }}
                                rows={3}
                            />
                            <button
                                className="note-save-btn"
                                onClick={handleAddNote}
                                disabled={savingNote || !newNote.trim() || notesTableMissing}
                            >
                                {savingNote ? '…' : 'Save'}
                            </button>
                        </div>

                        {notes.length === 0 ? (
                            <div style={{ color: 'var(--text-subtle)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
                                No notes yet
                            </div>
                        ) : (
                            <div className="notes-list">
                                {notes.map(n => {
                                    const fmt = new Intl.DateTimeFormat('en-US', {
                                        timeZone: 'America/New_York',
                                        month: 'short', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit', hour12: true
                                    });
                                    return (
                                        <div key={n.id} className="note-item">
                                            <div className="note-text">{n.note}</div>
                                            <div className="note-meta">
                                                <span className="note-time">{fmt.format(new Date(n.created_at))}</span>
                                                <button className="note-delete" onClick={() => handleDeleteNote(n.id)}>✕</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'calendar' && (
                    loading ? (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                        </div>
                    ) : (
                        <div style={{ paddingTop: '12px' }}>
                            <HabitCalendar logs={logs} habitName={habit.name} />
                        </div>
                    )
                )}

                <div className="modal-footer">
                    <button className="btn btn-primary" onClick={onClose}>Close</button>
                    <button className="btn btn-ghost" style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: 'none', margin: 0 }} onClick={handleDelete}>
                        Delete Habit
                    </button>
                </div>
            </div>
        </div>
    );
}
