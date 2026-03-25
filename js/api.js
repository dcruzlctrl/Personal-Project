// ===== API LAYER =====
// All Supabase calls isolated in one place
// Easy to mock for testing, easy to switch databases later

import { SUPABASE_CONFIG } from './config.js';

const { createClient } = window.supabase;
export const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);

// ===== AUTHENTICATION =====
export const authAPI = {
    signUp: (email, password) => 
        supabase.auth.signUp({ email, password }),
    
    signIn: (email, password) => 
        supabase.auth.signInWithPassword({ email, password }),
    
    signOut: () => 
        supabase.auth.signOut(),
    
    getSession: () => 
        supabase.auth.getSession(),
    
    onAuthStateChange: (callback) => 
        supabase.auth.onAuthStateChange(callback)
};

// ===== HABITS API =====
export const habitsAPI = {
    fetchAll: (userId) =>
        supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false }),
    
    create: (userId, name) =>
        supabase.from('habits').insert({
            user_id: userId,
            name: name,
            count: 0,
            reset_daily: false,
            current_streak: 0,
            longest_streak: 0,
            last_reset_date: new Date().toISOString().split('T')[0]
        }),
    
    update: (habitId, updates) =>
        supabase.from('habits').update(updates).eq('id', habitId),
    
    delete: (habitId) =>
        supabase.from('habits').delete().eq('id', habitId),
    
    increment: (habitId, currentCount) =>
        supabase
            .from('habits')
            .update({ count: currentCount + 1 })
            .eq('id', habitId),
    
    decrement: (habitId, currentCount) =>
        supabase
            .from('habits')
            .update({ count: currentCount - 1 })
            .eq('id', habitId)
};

// ===== HABIT LOGS API =====
export const habitLogsAPI = {
    fetchAll: (habitId) =>
        supabase
            .from('habit_logs')
            .select('*')
            .eq('habit_id', habitId)
            .order('timestamp', { ascending: false }),
    
    create: (habitId, change) =>
        supabase.from('habit_logs').insert({
            habit_id: habitId,
            change: change,
            timestamp: new Date().toISOString()
        })
};

// ===== PROJECTS API =====
export const projectsAPI = {
    fetchAll: (userId) =>
        supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false }),
    
    create: (userId, name, description, startDate, endDate) =>
        supabase.from('projects').insert({
            user_id: userId,
            name: name,
            description: description,
            start_date: startDate,
            end_date: endDate,
            status: 'active'
        }),
    
    update: (projectId, updates) =>
        supabase.from('projects').update(updates).eq('id', projectId),
    
    delete: (projectId) =>
        supabase.from('projects').delete().eq('id', projectId)
};

// ===== TASKS API =====
export const tasksAPI = {
    fetchByProject: (projectId) =>
        supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('updated_at', { ascending: false }),
    
    fetchAll: (projectIds) =>
        supabase
            .from('tasks')
            .select('*')
            .in('project_id', projectIds),
    
    create: (projectId, title, description, dueDate, priority) =>
        supabase.from('tasks').insert({
            project_id: projectId,
            title: title,
            description: description,
            due_date: dueDate,
            priority: priority,
            status: 'pending'
        }),
    
    update: (taskId, updates) =>
        supabase.from('tasks').update(updates).eq('id', taskId),
    
    delete: (taskId) =>
        supabase.from('tasks').delete().eq('id', taskId)
};

// ===== FILES API =====
export const filesAPI = {
    upload: async (projectId, file) => {
        const filename = `${projectId}/${Date.now()}_${file.name}`;
        return supabase.storage
            .from('project-files')
            .upload(filename, file);
    },
    
    delete: (filepath) =>
        supabase.storage.from('project-files').remove([filepath]),
    
    getPublicUrl: (filepath) =>
        supabase.storage.from('project-files').getPublicUrl(filepath)
};

// ===== ERROR HANDLING =====
export class APIError extends Error {
    constructor(message, originalError) {
        super(message);
        this.originalError = originalError;
        this.name = 'APIError';
    }
}

/**
 * Wrap API calls with error handling
 * @param {Promise} apiCall - The API call to execute
 * @param {string} errorMessage - Custom error message
 * @returns {Promise} Result or throws APIError
 */
export const executeAPI = async (apiCall, errorMessage) => {
    try {
        const { data, error } = await apiCall;
        if (error) {
            console.error(errorMessage, error);
            throw new APIError(errorMessage, error);
        }
        return data;
    } catch (err) {
        if (err instanceof APIError) throw err;
        console.error(errorMessage, err);
        throw new APIError(errorMessage, err);
    }
};
