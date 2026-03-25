// ===== APP COMPONENT =====
// Main app structure, routing between projects and habits, auth state

const { useState, useEffect } = React;

import { Auth } from './Auth.js';
import { ProjectsView } from './ProjectsModule/ProjectsView.js';
import { HabitsView } from './HabitsModule/HabitsView.js';
import { authAPI } from '../js/api.js';
import { getNYCTimeString, APP_VIEWS } from '../js/services.js';

export const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(getNYCTimeString());
    const [view, setView] = useState(APP_VIEWS.PROJECTS);

    useEffect(() => {
        checkUser();
        
        // Listen for auth changes
        const { data: authListener } = authAPI.onAuthStateChange((event, session) => {
            setUser(session?.user || null);
        });

        // Update time display every second
        const timeInterval = setInterval(() => {
            setCurrentTime(getNYCTimeString());
        }, 1000);

        return () => {
            authListener?.subscription?.unsubscribe();
            clearInterval(timeInterval);
        };
    }, []);

    const checkUser = async () => {
        try {
            const { data } = await authAPI.getSession();
            setUser(data.session?.user || null);
        } catch (err) {
            console.error('Error checking user:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await authAPI.signOut();
            setUser(null);
            setView(APP_VIEWS.PROJECTS);
        } catch (err) {
            console.error('Error logging out:', err);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    if (!user) {
        return <Auth onAuthSuccess={(u) => setUser(u)} />;
    }

    return (
        <div className="dashboard">
            <nav className="navbar">
                <h1>📊 Dashboard</h1>
                <div className="navbar-links">
                    {view !== APP_VIEWS.PROJECTS && (
                        <a 
                            onClick={() => setView(APP_VIEWS.PROJECTS)}
                            style={{ cursor: 'pointer' }}
                        >
                            ← Projects
                        </a>
                    )}
                    <a 
                        onClick={() => setView(APP_VIEWS.HABITS)}
                        style={{ cursor: 'pointer' }}
                    >
                        🎯 Habits
                    </a>
                    <a href="crossword.html" target="_blank" rel="noopener noreferrer">🧩 Crossword</a>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <div className="content">
                <div className="time-display">
                    🕐 {currentTime}
                </div>
                
                {view === APP_VIEWS.PROJECTS ? (
                    <ProjectsView user={user} />
                ) : (
                    <HabitsView user={user} />
                )}
            </div>
        </div>
    );
};

export default App;
