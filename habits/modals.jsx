// ===== MASTER CALENDAR MODAL =====
function MasterCalendarModal({ userId, habits, onClose }) {
    const [allLogs, setAllLogs] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const today = getNYCDate();
    const [viewYear, setViewYear] = React.useState(parseInt(today.substring(0, 4)));
    const [viewMonth, setViewMonth] = React.useState(parseInt(today.substring(5, 7)) - 1);

    React.useEffect(() => {
        loadAllLogs();
    }, []);

    const loadAllLogs = async () => {
        try {
            const habitIds = habits.map(h => h.id);
            if (habitIds.length === 0) {
                setAllLogs([]);
                setLoading(false);
                return;
            }
            const { data, error } = await supabase
                .from('habit_logs')
                .select('habit_id, change, timestamp')
                .in('habit_id', habitIds);
            if (error) throw error;
            setAllLogs(data || []);
        } catch (err) {
            console.error('Error loading all logs:', err);
            setAllLogs([]);
        } finally {
            setLoading(false);
        }
    };

    // Build dayMap where each day = distinct habit count
    const buildMasterDayMap = (logs, year, month) => {
        const dayMap = {};
        const dayHabits = {}; // date -> Set of habit_ids
        (logs || []).forEach(log => {
            const date = getNYCDateFromDate(new Date(log.timestamp));
            const logYear = parseInt(date.substring(0, 4));
            const logMonth = parseInt(date.substring(5, 7)) - 1;
            if (logYear === year && logMonth === month && log.change > 0) {
                if (!dayHabits[date]) dayHabits[date] = new Set();
                dayHabits[date].add(log.habit_id);
            }
        });
        Object.keys(dayHabits).forEach(date => {
            dayMap[date] = dayHabits[date].size;
        });
        return dayMap;
    };

    const masterDayMap = buildMasterDayMap(allLogs, viewYear, viewMonth);
    const maxVal = Math.max(0, ...Object.values(masterDayMap), habits.length);

    const handlePrev = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const handleNext = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-head">
                    <div className="modal-title">Habits Overview</div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                    </div>
                ) : (
                    <>
                        <CalendarGrid
                            year={viewYear}
                            month={viewMonth}
                            dayMap={masterDayMap}
                            maxVal={maxVal}
                            streakDates={new Set()}
                            today={today}
                            onPrev={handlePrev}
                            onNext={handleNext}
                        />
                        <CalendarStats
                            year={viewYear}
                            month={viewMonth}
                            dayMap={masterDayMap}
                            label="habits"
                        />
                    </>
                )}

                <div className="modal-footer">
                    <button className="btn btn-primary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

// ===== HABIT DETAIL MODAL =====
function HabitDetailModal({ habit, onClose, onRefresh }) {
    const [logs, setLogs]           = React.useState([]);
    const [loading, setLoading]     = React.useState(true);
    const [totalCount, setTotalCount] = React.useState(0);
    const [streaks, setStreaks]     = React.useState({ currentStreak: 0, longestStreak: 0 });
    const [resetDaily, setResetDaily] = React.useState(habit.reset_daily);
    const [activeTab, setActiveTab] = React.useState('overview');

    React.useEffect(() => { setResetDaily(habit.reset_daily); }, [habit.reset_daily]);
    React.useEffect(() => { loadLogs(); }, [habit.id]);

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
                    <div className="modal-title">{habit.name}</div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-tabs">
                    <button
                        className={`modal-tab ${activeTab === 'overview' ? 'modal-tab--active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`modal-tab ${activeTab === 'calendar' ? 'modal-tab--active' : ''}`}
                        onClick={() => setActiveTab('calendar')}
                    >
                        Calendar
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
