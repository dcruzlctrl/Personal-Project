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

// ===== HABITS VIEW =====
function HabitsView({ user }) {
    const [habits, setHabits]         = React.useState([]);
    const [loading, setLoading]       = React.useState(true);
    const [newHabitName, setNewHabitName] = React.useState('');
    const [selectedHabit, setSelectedHabit] = React.useState(null);
    const [habitSortBy, setHabitSortBy] = React.useState('created');
    const [showMasterCalendar, setShowMasterCalendar] = React.useState(false);

    React.useEffect(() => {
        loadHabits();
        const interval = setInterval(loadHabits, 60000);
        return () => clearInterval(interval);
    }, []);

    const loadHabits = async () => {
        try {
            const { data, error } = await supabase
                .from('habits').select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;

            const habitsWithReset = await Promise.all(
                (data || []).map(async (habit) => {
                    if (habit.reset_daily) {
                        const nycToday = getNYCDate();
                        const lastReset = habit.last_reset_date || nycToday;
                        if (lastReset !== nycToday) {
                            await supabase.from('habits')
                                .update({ last_reset_date: nycToday, count: 0 })
                                .eq('id', habit.id);
                            return { ...habit, last_reset_date: nycToday, count: 0 };
                        }
                    }
                    return habit;
                })
            );
            setHabits(habitsWithReset);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleAddHabit = async (e) => {
        e.preventDefault();
        if (!newHabitName.trim()) return;
        try {
            const { error } = await supabase.from('habits').insert({
                user_id: user.id,
                name: newHabitName,
                count: 0,
                reset_daily: false,
                last_reset_date: getNYCDate(),
                current_streak: 0,
                longest_streak: 0
            });
            if (error) throw error;
            setNewHabitName('');
            loadHabits();
        } catch (err) { console.error(err); }
    };

    const handleIncrement = async (habitId, e) => {
        e.stopPropagation();
        try {
            const habit = habits.find(h => h.id === habitId);
            await supabase.from('habits')
                .update({ count: habit.count + 1 }).eq('id', habitId);
            await supabase.from('habit_logs').insert({
                habit_id: habitId, change: 1,
                timestamp: new Date().toISOString()
            });
            loadHabits();
        } catch (err) { console.error(err); }
    };

    const handleDecrement = async (habitId, e) => {
        e.stopPropagation();
        try {
            const habit = habits.find(h => h.id === habitId);
            if (habit.count > 0) {
                await supabase.from('habits')
                    .update({ count: habit.count - 1 }).eq('id', habitId);
                await supabase.from('habit_logs').insert({
                    habit_id: habitId, change: -1,
                    timestamp: new Date().toISOString()
                });
                loadHabits();
            }
        } catch (err) { console.error(err); }
    };

    const getSortedHabits = () => {
        const sorted = [...habits];
        switch (habitSortBy) {
            case 'today':
                return sorted.sort((a, b) => b.count - a.count);
            case 'streak':
                return sorted.sort((a, b) => b.current_streak - a.current_streak);
            case 'name':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'created':
            default:
                return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div>Loading habits…</div>;

    return (
        <>
            <div className="page-header">
                <div className="page-title">My Habits</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                        className="btn btn-sm btn-sm-primary"
                        onClick={() => setShowMasterCalendar(true)}
                        style={{ padding: '6px 10px', fontSize: '13px' }}
                    >
                        📅 Overview
                    </button>
                    <select
                        value={habitSortBy}
                        onChange={(e) => setHabitSortBy(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', cursor: 'pointer' }}
                    >
                        <option value="created">Newest</option>
                        <option value="today">Today's Count</option>
                        <option value="streak">Current Streak</option>
                        <option value="name">Name (A-Z)</option>
                    </select>
                </div>
            </div>

            <form onSubmit={handleAddHabit}>
                <div className="add-habit-row">
                    <input
                        className="add-habit-input"
                        type="text"
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                        placeholder="Add a new habit…"
                        required
                    />
                    <button type="submit" className="add-habit-btn">+ Add</button>
                </div>
            </form>

            {habits.length === 0 ? (
                <div className="empty">
                    <div className="empty-icon">🌱</div>
                    <div className="empty-title">No habits yet</div>
                    <div className="empty-desc">Add your first habit above to get started</div>
                </div>
            ) : (
                <div>
                    {getSortedHabits().map(habit => (
                        <div key={habit.id} className="habit-card" onClick={() => setSelectedHabit(habit)}>
                            <div className="habit-row">
                                <div className="habit-name">
                                    {habit.name}
                                    {habit.reset_daily && <span style={{ marginLeft: '6px', fontSize: '12px', opacity: 0.6 }}>🕐</span>}
                                </div>
                                <div className="habit-counter">
                                    <button
                                        className="counter-btn counter-decrement"
                                        onClick={(e) => handleDecrement(habit.id, e)}
                                    >−</button>
                                    <div className="count-display">{habit.count}</div>
                                    <button
                                        className="counter-btn counter-increment"
                                        onClick={(e) => handleIncrement(habit.id, e)}
                                    >+</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedHabit && (
                <HabitDetailModal
                    habit={selectedHabit}
                    onClose={() => setSelectedHabit(null)}
                    onRefresh={loadHabits}
                />
            )}

            {showMasterCalendar && (
                <MasterCalendarModal
                    userId={user.id}
                    habits={habits}
                    onClose={() => setShowMasterCalendar(false)}
                />
            )}
        </>
    );
}
