// ===== HABIT CARD COMPONENT =====
// Displays a single habit with counters and reset indicator

const { useState } = React;

export const HabitCard = ({ habit, onIncrement, onDecrement, onClickCard }) => {
    return (
        <div 
            className="habit-card"
            onClick={() => onClickCard(habit)}
        >
            <div className="habit-card-content">
                <div className="habit-name">{habit.name}</div>
                <div className="habit-counter">
                    <button 
                        className="counter-btn counter-btn-decrement"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDecrement(habit.id);
                        }}
                    >
                        −
                    </button>
                    <div className="count-display">
                        {habit.count}
                        {habit.reset_daily && <div className="reset-indicator">↺</div>}
                    </div>
                    <button 
                        className="counter-btn counter-btn-increment"
                        onClick={(e) => {
                            e.stopPropagation();
                            onIncrement(habit.id);
                        }}
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HabitCard;
