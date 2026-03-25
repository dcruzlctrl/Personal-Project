// ===== HABITS VIEW COMPONENT =====
// Main view: list of habits and add new habit form

const { useState, useEffect } = React;

import { HabitCard } from './HabitCard.js';
import { HabitModal } from './HabitModal.js';
import { habitsAPI, habitLogsAPI } from '../../js/api.js';
import { getCurrentNYCDate, isResetNeeded } from '../../js/services.js';

export const HabitsView = ({ user }) => {
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newHabitName, setNewHabitName] = useState('');
    const [selectedHabit, setSelectedHabit] = useState(null);

    useEffect(() => {
        loadHabits();
        const interval = setInterval(loadHabits, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const loadHabits = async () => {
        try {
            const { data } = await habitsAPI.fetchAll(user.id);
            const rawHabits = data || [];
            
            // Check if daily reset needed
            const habitsWithReset = await Promise.all(
                rawHabits.map(async (habit) => {
                    if (habit.reset_daily && isResetNeeded(habit.last_reset_date)) {
                        await habitsAPI.update(habit.id, { 
                            last_reset_date: getCurrentNYCDate(), 
                            count: 0 
                        });
                        return { ...habit, last_reset_date: getCurrentNYCDate(), count: 0 };
                    }
                    return habit;
                })
            );
            
            setHabits(habitsWithReset);
        } catch (err) {
            console.error('Error loading habits:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddHabit = async (e) => {
        e.preventDefault();
        if (!newHabitName.trim()) return;

        try {
            await habitsAPI.create(user.id, newHabitName);
            setNewHabitName('');
            loadHabits();
        } catch (err) {
            console.error('Error adding habit:', err);
        }
    };

    const handleIncrement = async (habitId) => {
        const habit = habits.find(h => h.id === habitId);
        try {
            await habitsAPI.increment(habitId, habit.count);
            await habitLogsAPI.create(habitId, 1);
            loadHabits();
        } catch (err) {
            console.error('Error incrementing habit:', err);
        }
    };

    const handleDecrement = async (habitId) => {
        const habit = habits.find(h => h.id === habitId);
        if (habit.count > 0) {
            try {
                await habitsAPI.decrement(habitId, habit.count);
                await habitLogsAPI.create(habitId, -1);
                loadHabits();
            } catch (err) {
                console.error('Error decrementing habit:', err);
            }
        }
    };

    if (loading) return <div className="loading">Loading habits...</div>;

    return (
        <>
            <div className="section-header">
                <h2>My Habits</h2>
            </div>

            <div className="add-habit-form">
                <form onSubmit={handleAddHabit} style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <input
                        type="text"
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                        placeholder="Add habit..."
                        required
                        style={{ flex: 1 }}
                    />
                    <button type="submit">+ Add</button>
                </form>
            </div>

            {habits.length === 0 ? (
                <div className="empty-state">
                    <h3>No habits yet</h3>
                    <p>Add one above to get started</p>
                </div>
            ) : (
                <div>
                    {habits.map(habit => (
                        <HabitCard
                            key={habit.id}
                            habit={habit}
                            onIncrement={handleIncrement}
                            onDecrement={handleDecrement}
                            onClickCard={setSelectedHabit}
                        />
                    ))}
                </div>
            )}

            {selectedHabit && (
                <HabitModal
                    habit={selectedHabit}
                    onClose={() => setSelectedHabit(null)}
                    onRefresh={loadHabits}
                />
            )}
        </>
    );
};

export default HabitsView;
