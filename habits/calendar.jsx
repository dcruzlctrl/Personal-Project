// ===== STREAK CALCULATION =====
async function calculateStreaks(habitId, logs) {
    try {
        const allLogs = (logs || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const dates = new Set();
        allLogs.forEach(log => {
            const date = new Date(log.timestamp);
            const nycTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
            dates.add(`${nycTime.getFullYear()}-${String(nycTime.getMonth() + 1).padStart(2, '0')}-${String(nycTime.getDate()).padStart(2, '0')}`);
        });

        const sortedDates = Array.from(dates).sort().reverse();
        let currentStreak = 0;
        const today = getNYCDate();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getNYCDateFromDate(yesterday);

        let checkDate = today;
        for (const date of sortedDates) {
            if (date === checkDate || date === yesterdayStr) {
                currentStreak++;
                const prevDate = new Date(date);
                prevDate.setDate(prevDate.getDate() - 1);
                checkDate = prevDate.toISOString().split('T')[0];
            } else { break; }
        }

        let longestStreak = 0, tempStreak = 1;
        for (let i = 0; i < sortedDates.length - 1; i++) {
            const current = new Date(sortedDates[i]);
            const next    = new Date(sortedDates[i + 1]);
            const diff    = (current - next) / (1000 * 60 * 60 * 24);
            if (diff === 1) { tempStreak++; }
            else { longestStreak = Math.max(longestStreak, tempStreak); tempStreak = 1; }
        }
        longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

        if (longestStreak > 0) {
            await supabase.from('habits')
                .update({ current_streak: currentStreak, longest_streak: longestStreak })
                .eq('id', habitId);
        }
        return { currentStreak, longestStreak };
    } catch (err) {
        console.error('Error calculating streaks:', err);
        return { currentStreak: 0, longestStreak: 0 };
    }
}

// ===== CALENDAR UTILITIES =====
function buildDayMap(logs, year, month) {
    const dayMap = {};
    (logs || []).forEach(log => {
        const date = getNYCDateFromDate(new Date(log.timestamp));
        const logYear = parseInt(date.substring(0, 4));
        const logMonth = parseInt(date.substring(5, 7)) - 1; // 0-indexed
        if (logYear === year && logMonth === month) {
            const dayStr = date;
            dayMap[dayStr] = (dayMap[dayStr] || 0) + log.change;
        }
    });
    return dayMap;
}

function getStreakDateSet(logs) {
    const allLogs = (logs || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const dates = new Set();
    allLogs.forEach(log => {
        const date = getNYCDateFromDate(new Date(log.timestamp));
        dates.add(date);
    });
    const sortedDates = Array.from(dates).sort().reverse();
    const streakDates = new Set();
    const today = getNYCDate();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getNYCDateFromDate(yesterday);
    let checkDate = today;
    for (const date of sortedDates) {
        if (date === checkDate || date === yesterdayStr) {
            streakDates.add(date);
            const nextCheck = new Date(date.substring(0, 4), parseInt(date.substring(5, 7)) - 1, parseInt(date.substring(8, 10)));
            nextCheck.setDate(nextCheck.getDate() - 1);
            checkDate = getNYCDateFromDate(nextCheck);
        } else {
            break;
        }
    }
    return streakDates;
}

// ===== CALENDAR COMPONENTS =====
function CalendarGrid({ year, month, dayMap, maxVal, streakDates, today, onPrev, onNext }) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dowNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Build calendar cells
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push({ type: 'pad' });
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ type: 'day', date: dateStr, day: d });
    }
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

    const getHeatColor = (dateStr) => {
        const val = dayMap[dateStr] ?? 0;
        if (val === 0) return 'transparent';
        const ratio = maxVal === 0 ? 0 : val / maxVal;
        if (ratio <= 0.25) return '#ccfbf1';
        if (ratio <= 0.5) return '#99f6e4';
        if (ratio <= 0.75) return '#2dd4bf';
        return '#0d9488';
    };

    const getTextColor = (dateStr) => {
        const val = dayMap[dateStr] ?? 0;
        const ratio = maxVal === 0 ? 0 : val / maxVal;
        return ratio > 0.5 ? 'white' : 'var(--text)';
    };

    const getStreakRadii = (cell, rowIdx) => {
        if (cell.type === 'pad' || !streakDates.has(cell.date)) return 'var(--radius-xs)';
        const row = rows[rowIdx];
        const idx = row.indexOf(cell);
        const leftConnected = idx > 0 && row[idx - 1].type === 'day' && streakDates.has(row[idx - 1].date);
        const rightConnected = idx < row.length - 1 && row[idx + 1].type === 'day' && streakDates.has(row[idx + 1].date);

        if (leftConnected && rightConnected) return '0';
        if (leftConnected) return `0 var(--radius-xs) var(--radius-xs) 0`;
        if (rightConnected) return `var(--radius-xs) 0 0 var(--radius-xs)`;
        return 'var(--radius-xs)';
    };

    return (
        <div>
            <div className="cal-nav">
                <button className="cal-nav-btn" onClick={onPrev}>←</button>
                <div className="cal-month-label">{monthNames[month]} {year}</div>
                <button className="cal-nav-btn" onClick={onNext}>→</button>
            </div>
            <div className="cal-grid">
                {dowNames.map(dow => <div key={dow} className="cal-dow">{dow}</div>)}
                {rows.map((row, rowIdx) => row.map(cell => {
                    if (cell.type === 'pad') return <div key={`pad-${rowIdx}`} className="cal-day cal-day--pad"></div>;
                    const isStreak = streakDates.has(cell.date);
                    const isToday = cell.date === today;
                    return (
                        <div
                            key={cell.date}
                            className={`cal-day ${isStreak ? 'cal-day--streak' : ''} ${isToday ? 'cal-day--today' : ''}`}
                            style={{
                                background: isStreak ? '#a7f3d0' : getHeatColor(cell.date),
                                borderRadius: getStreakRadii(cell, rowIdx)
                            }}
                        >
                            <span className="cal-day-num" style={{ color: isStreak ? 'var(--accent)' : getTextColor(cell.date) }}>
                                {cell.day}
                            </span>
                        </div>
                    );
                }))}
            </div>
        </div>
    );
}

function CalendarStats({ year, month, dayMap, label }) {
    const today = getNYCDate();
    const todayYear = parseInt(today.substring(0, 4));
    const todayMonth = parseInt(today.substring(5, 7)) - 1;
    const isCurrentMonth = year === todayYear && month === todayMonth;
    const daysElapsed = isCurrentMonth ? parseInt(today.substring(8, 10)) : new Date(year, month + 1, 0).getDate();
    const activeDays = Object.values(dayMap).filter(v => v > 0).length;
    const totalVal = Object.values(dayMap).reduce((s, v) => s + v, 0);
    const avgDaily = daysElapsed > 0 ? (totalVal / daysElapsed).toFixed(1) : '0.0';
    const weeksElapsed = daysElapsed / 7;
    const avgPerWeek = weeksElapsed > 0 ? (activeDays / weeksElapsed).toFixed(1) : '0.0';

    return (
        <div className="cal-stats">
            <div className="cal-stat">
                <div className="cal-stat-lbl">Avg/day</div>
                <div className="cal-stat-val">{avgDaily}</div>
            </div>
            <div className="cal-stat">
                <div className="cal-stat-lbl">Active/week</div>
                <div className="cal-stat-val">{avgPerWeek}</div>
            </div>
            <div className="cal-stat">
                <div className="cal-stat-lbl">Total</div>
                <div className="cal-stat-val">{totalVal}</div>
            </div>
        </div>
    );
}

function HabitCalendar({ logs, habitName }) {
    const today = getNYCDate();
    const [viewYear, setViewYear] = React.useState(parseInt(today.substring(0, 4)));
    const [viewMonth, setViewMonth] = React.useState(parseInt(today.substring(5, 7)) - 1);

    const dayMap = buildDayMap(logs, viewYear, viewMonth);
    const maxVal = Math.max(0, ...Object.values(dayMap));
    const streakDates = getStreakDateSet(logs);

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
        <div>
            <CalendarGrid
                year={viewYear}
                month={viewMonth}
                dayMap={dayMap}
                maxVal={maxVal}
                streakDates={streakDates}
                today={today}
                onPrev={handlePrev}
                onNext={handleNext}
            />
            <CalendarStats year={viewYear} month={viewMonth} dayMap={dayMap} label="actions" />
        </div>
    );
}
