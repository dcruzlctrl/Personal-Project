// ===== HABIT MODAL COMPONENT =====
// Shows habit details, streaks, history, and settings

const { useState, useEffect } = React;

import { 
    calculateCurrentStreak, 
    calculateLongestStreak, 
    calculateTotalCount,
    formatNYCTime,
    getCurrentNYCDate 
} from '../../js/services.js';
import { habitsAPI, habitLogsAPI } from '../../js/api.js';

export const HabitModal = ({ habit, onClose, onRefresh }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [streaks, setStreaks] = useState({ currentStreak: 0, longestStreak: 0 });

    useEffect(() => {
        loadLogs();
    }, [habit.id]);

    const loadLogs = async () => {
        try {
            const { data } = await habitLogsAPI.fetchAll(habit.id);
            const logData = data || [];
            
            setLogs(logData);
            setTotalCount(calculateTotalCount(logData));
            setStreaks({
                currentStreak: calculateCurrentStreak(logData),
                longestStreak: calculateLongestStreak(logData)
            });
        } catch (err) {
            console.error('Error loading logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleReset = async () => {
        try {
            await habitsAPI.update(habit.id, { 
                reset_daily: !habit.reset_daily,
                last_reset_date: getCurrentNYCDate()
            });
            onRefresh();
        } catch (err) {
            console.error('Error updating habit:', err);
        }
    };

    const handleResetTimer = async () => {
        try {
            await habitsAPI.update(habit.id, { 
                count: 0,
                last_reset_date: getCurrentNYCDate()
            });
            onRefresh();
            alert('✅ Daily timer reset to 0. All-time total unchanged.');
        } catch (err) {
            console.error('Error resetting timer:', err);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Delete this habit and all history?')) {
            try {
                await habitsAPI.delete(habit.id);
                onClose();
                onRefresh();
            } catch (err) {
                console.error('Error deleting habit:', err);
            }
        }
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{habit.name}</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {/* Streak Section */}
                <div className="streak-section">
                    <div className="streak-label">🔥 Current Streak</div>
                    <div className="streak-number">{streaks.currentStreak}</div>
                    <div className="streak-label">days</div>
                    <div className="streak-best">Best: {streaks.longestStreak} days</div>
                </div>

                {/* Stats Section */}
                <div className="modal-section">
                    <h3>📊 Stats</h3>
                    <div className="count-stats">
                        <div className="stat">
                            <div className="stat-label">Today</div>
                            <div className="stat-value">{habit.count}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-label">All-Time</div>
                            <div className="stat-value total">{totalCount}</div>
                        </div>
                    </div>
                </div>

                {/* Settings Section */}
                <div className="modal-section">
                    <h3>⚙️ Settings</h3>
                    <div className="toggle-switch">
                        <div style={{ flex: 1 }}>
                            <div className="info-text">Daily Reset</div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>Resets at 12 AM</div>
                        </div>
                        <input
                            type="checkbox"
                            className="toggle-checkbox"
                            checked={habit.reset_daily}
                            onChange={handleToggleReset}
                        />
                    </div>
                    {habit.reset_daily && (
                        <div className="reset-badge">✓ Daily reset enabled</div>
                    )}
                    <button 
                        className="btn-modal-primary" 
                        onClick={handleResetTimer}
                        style={{ marginTop: '12px', padding: '10px', fontSize: '13px' }}
                    >
                        🔄 Reset Daily Count
                    </button>
                </div>

                {/* History Section */}
                {!loading && (
                    <div className="modal-section">
                        <h3>📈 History</h3>
                        {logs.length === 0 ? (
                            <div style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
                                No history yet
                            </div>
                        ) : (
                            <div className="history-list">
                                {logs.map((log, idx) => {
                                    const timeStr = formatNYCTime(new Date(log.timestamp));
                                    const isPositive = log.change > 0;
                                    
                                    return (
                                        <div key={idx} className="history-item">
                                            <div className="history-time">{timeStr}</div>
                                            <div className={isPositive ? 'history-change-positive' : 'history-change-negative'}>
                                                {isPositive ? '+' : ''}{log.change}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="modal-actions">
                    <button className="btn-modal-primary" onClick={onClose}>
                        Close
                    </button>
                    <button className="btn-modal-danger" onClick={handleDelete}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HabitModal;
