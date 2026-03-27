// ===== MAIN APP =====
function App() {
    const [user, setUser]           = React.useState(null);
    const [loading, setLoading]     = React.useState(true);
    const [currentTime, setCurrentTime] = React.useState(getNYCTimeString());

    React.useEffect(() => {
        checkUser();
        const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
            setUser(session?.user || null);
        });
        const timer = setInterval(() => setCurrentTime(getNYCTimeString()), 1000);
        return () => {
            authListener?.subscription?.unsubscribe();
            clearInterval(timer);
        };
    }, []);

    const checkUser = async () => {
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user || null);
        setLoading(false);
    };

    if (loading) return <div className="loading"><div className="spinner"></div>Loading…</div>;
    if (!user)   return <AuthPage onLogin={(u) => setUser(u)} icon="🎯" appName="Habits Tracker" signInSub="Sign in to your tracker" signUpSub="Start building better habits" />;

    return (
        <div className="dashboard">
            <nav className="navbar">
                <div className="nav-brand">
                    <div className="nav-brand-icon">🎯</div>
                    <span className="nav-brand-text">Habits</span>
                </div>
                <div className="nav-right">
                    <a href="index.html" className="nav-link">← Dashboard</a>
                    <button className="nav-link-danger" onClick={handleLogout}>Sign out</button>
                </div>
            </nav>

            <div className="content">
                <div className="time-chip">
                    <div className="time-chip-dot"></div>
                    {currentTime}
                </div>
                <HabitsView user={user} />
            </div>
        </div>
    );

    async function handleLogout() {
        await supabase.auth.signOut();
        setUser(null);
    }
}

// Render app
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
