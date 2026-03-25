// ===== BUSINESS LOGIC / SERVICES =====
// Pure functions - no side effects, easy to test
// Input → Process → Output

import { TIMEZONE, RESET_TIME } from './config.js';

/**
 * Calculate current streak from logs
 * @param {Array} logs - Array of habit log entries
 * @returns {number} Current streak count
 */
export const calculateCurrentStreak = (logs) => {
    if (!Array.isArray(logs) || logs.length === 0) return 0;
    
    const sortedDates = getUniqueDates(logs).sort().reverse();
    const today = getCurrentNYCDate();
    const yesterday = getYesterdayNYCDate();
    
    let streak = 0;
    let checkDate = today;
    
    for (const date of sortedDates) {
        if (date === checkDate || date === yesterday) {
            streak++;
            const prevDate = new Date(date);
            prevDate.setDate(prevDate.getDate() - 1);
            checkDate = getNYCDateString(prevDate);
        } else {
            break;
        }
    }
    
    return streak;
};

/**
 * Calculate longest streak ever achieved
 * @param {Array} logs - Array of habit log entries
 * @returns {number} Longest streak count
 */
export const calculateLongestStreak = (logs) => {
    if (!Array.isArray(logs) || logs.length === 0) return 0;
    
    const sortedDates = getUniqueDates(logs).sort();
    let longestStreak = 0;
    let tempStreak = 1;
    
    for (let i = 0; i < sortedDates.length - 1; i++) {
        const current = new Date(sortedDates[i]);
        const next = new Date(sortedDates[i + 1]);
        const diffDays = (next - current) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
            tempStreak++;
        } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
        }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    return longestStreak;
};

/**
 * Calculate total count from logs
 * @param {Array} logs - Array of habit log entries
 * @returns {number} Sum of all changes
 */
export const calculateTotalCount = (logs) => {
    if (!Array.isArray(logs)) return 0;
    return logs.reduce((sum, log) => sum + (log.change || 0), 0);
};

/**
 * Get unique dates from logs
 * @param {Array} logs - Habit logs
 * @returns {Array} Unique date strings
 */
const getUniqueDates = (logs) => {
    const dates = new Set();
    logs.forEach(log => {
        const date = new Date(log.timestamp);
        const dateStr = getNYCDateString(date);
        dates.add(dateStr);
    });
    return Array.from(dates);
};

/**
 * Check if daily reset is needed
 * @param {string} lastResetDate - Last reset date (YYYY-MM-DD)
 * @returns {boolean} True if reset is needed
 */
export const isResetNeeded = (lastResetDate) => {
    const today = getCurrentNYCDate();
    return lastResetDate !== today;
};

/**
 * Format timestamp to NYC timezone
 * @param {Date} date - JavaScript Date object
 * @returns {string} Formatted time string
 */
export const formatNYCTime = (date) => {
    const offset = TIMEZONE.OFFSET;
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    const nycTime = new Date(utcTime + (offset * 3600000));
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[nycTime.getUTCDay()];
    const monthName = months[nycTime.getUTCMonth()];
    const dateNum = nycTime.getUTCDate();
    const hours = nycTime.getUTCHours();
    const minutes = String(nycTime.getUTCMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    
    return `${dayName} ${monthName} ${dateNum} ${String(hours12).padStart(2, '0')}:${minutes} ${ampm}`;
};

/**
 * Get current date in NYC timezone
 * @returns {string} Current date (YYYY-MM-DD)
 */
export const getCurrentNYCDate = () => {
    return getNYCDateString(new Date());
};

/**
 * Get previous day's date in NYC timezone
 * @returns {string} Yesterday's date (YYYY-MM-DD)
 */
export const getYesterdayNYCDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return getNYCDateString(yesterday);
};

/**
 * Convert Date object to NYC date string
 * @param {Date} date - JavaScript Date
 * @returns {string} Date string (YYYY-MM-DD)
 */
export const getNYCDateString = (date) => {
    const offset = TIMEZONE.OFFSET;
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    const nycTime = new Date(utcTime + (offset * 3600000));
    
    const year = nycTime.getUTCFullYear();
    const month = String(nycTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(nycTime.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

/**
 * Get current time in NYC timezone
 * @returns {string} Current time with timezone
 */
export const getNYCTimeString = () => {
    const now = new Date();
    const offset = TIMEZONE.OFFSET;
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const nycTime = new Date(utcTime + (offset * 3600000));
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[nycTime.getUTCDay()];
    const monthName = months[nycTime.getUTCMonth()];
    const date = nycTime.getUTCDate();
    const hours = nycTime.getUTCHours();
    const minutes = String(nycTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(nycTime.getUTCSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    const tzName = TIMEZONE.NAME;
    
    return `${dayName} ${monthName} ${date} ${String(hours12).padStart(2, '0')}:${minutes}:${seconds} ${ampm} ${tzName}`;
};

// ===== PROJECT & TASK SERVICES =====

/**
 * Calculate project statistics from tasks
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Stats object
 */
export const calculateProjectStats = (tasks) => {
    if (!Array.isArray(tasks)) {
        return {
            total: 0,
            completed: 0,
            inProgress: 0,
            pending: 0,
            completionRate: 0
        };
    }

    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
        total,
        completed,
        inProgress,
        pending,
        completionRate
    };
};

/**
 * Check if task is overdue
 * @param {string} dueDate - Due date (YYYY-MM-DD)
 * @param {string} status - Task status
 * @returns {boolean} True if overdue
 */
export const isTaskOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completed') return false;
    const today = getCurrentNYCDate();
    return dueDate < today;
};

/**
 * Check if task is due soon (within 7 days)
 * @param {string} dueDate - Due date (YYYY-MM-DD)
 * @param {string} status - Task status
 * @returns {boolean} True if due within 7 days
 */
export const isTaskDueSoon = (dueDate, status) => {
    if (!dueDate || status === 'completed') return false;
    
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dueDateTime = new Date(dueDate);
    
    return dueDateTime >= today && dueDateTime <= sevenDaysFromNow;
};

/**
 * Get priority color
 * @param {string} priority - Priority level
 * @returns {string} Color code
 */
export const getPriorityColor = (priority) => {
    const colors = {
        'high': '#ef4444',      // Red
        'medium': '#f59e0b',    // Orange
        'low': '#10b981'        // Green
    };
    return colors[priority] || '#6b7280';
};

/**
 * Get status badge style
 * @param {string} status - Status
 * @returns {Object} Color and label
 */
export const getStatusBadge = (status) => {
    const badges = {
        'pending': { color: '#fef3c7', text: '#92400e', label: 'Pending' },
        'in-progress': { color: '#dbeafe', text: '#1e40af', label: 'In Progress' },
        'completed': { color: '#d1fae5', text: '#065f46', label: 'Completed' },
        'active': { color: '#dcfce7', text: '#166534', label: 'Active' },
        'paused': { color: '#f3f4f6', text: '#4b5563', label: 'Paused' }
    };
    return badges[status] || { color: '#f3f4f6', text: '#6b7280', label: status };
};

/**
 * Format date to readable string
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string} Formatted date
 */
export const formatDate = (dateStr) => {
    if (!dateStr) return 'No date';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [year, month, day] = dateStr.split('-');
    return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
};
