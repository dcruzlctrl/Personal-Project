// ===== UNIFIED CONFIGURATION =====
// Shared constants for Projects and Habits

export const SUPABASE_CONFIG = {
    URL: "https://wthjcbkfpjgjsqyqcghx.supabase.co",
    KEY: "sb_publishable_Que8SpJa0CzVEQbgC8Mv5A_mjJfTu_B"
};

export const TIMEZONE = {
    OFFSET: -4,  // EDT (UTC-4)
    NAME: 'EDT'
};

// Projects & Tasks
export const PROJECT_STATUS = {
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed'
};

export const TASK_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed'
};

export const TASK_PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
};

// Habits
export const HABIT_STATUS = {
    ACTIVE: 'active',
    PAUSED: 'paused'
};

export const RESET_TIME = {
    HOUR: 0,    // Midnight (12 AM)
    MINUTE: 0
};

export const UI_CONSTANTS = {
    MODAL_ANIMATION_DURATION: 200,
    DEBOUNCE_DELAY: 300,
    ITEMS_PER_PAGE: 50,
    STREAK_COLORS: {
        CURRENT: '#f59e0b',
        BEST: '#10b981'
    }
};

export const APP_VIEWS = {
    PROJECTS: 'projects',
    HABITS: 'habits',
    PROJECT_DETAIL: 'project-detail'
};
