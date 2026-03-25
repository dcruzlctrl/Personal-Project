// ===== UNIFIED CONFIGURATION =====
// Shared constants for Projects and Habits

const SUPABASE_CONFIG = {
    URL: "https://wthjcbkfpjgjsqyqcghx.supabase.co",
    KEY: "sb_publishable_Que8SpJa0CzVEQbgC8Mv5A_mjJfTu_B"
};

const TIMEZONE = {
    OFFSET: -4,  // EDT (UTC-4)
    NAME: 'EDT'
};

// Projects & Tasks
const PROJECT_STATUS = {
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed'
};

const TASK_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed'
};

const TASK_PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
};

// Habits
const HABIT_STATUS = {
    ACTIVE: 'active',
    PAUSED: 'paused'
};

const RESET_TIME = {
    HOUR: 0,    // Midnight (12 AM)
    MINUTE: 0
};

const UI_CONSTANTS = {
    MODAL_ANIMATION_DURATION: 200,
    DEBOUNCE_DELAY: 300,
    ITEMS_PER_PAGE: 50,
    STREAK_COLORS: {
        CURRENT: '#f59e0b',
        BEST: '#10b981'
    }
};

const APP_VIEWS = {
    PROJECTS: 'projects',
    HABITS: 'habits',
    PROJECT_DETAIL: 'project-detail'
};

// Expose to global
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.TIMEZONE = TIMEZONE;
window.PROJECT_STATUS = PROJECT_STATUS;
window.TASK_STATUS = TASK_STATUS;
window.TASK_PRIORITY = TASK_PRIORITY;
window.HABIT_STATUS = HABIT_STATUS;
window.RESET_TIME = RESET_TIME;
window.UI_CONSTANTS = UI_CONSTANTS;
window.APP_VIEWS = APP_VIEWS;
