// ===== AUTH PAGE =====
const AuthPage = ({ onLogin, icon, appName, signInSub, signUpSub }) => {
    const [email, setEmail]       = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isSignUp, setIsSignUp] = React.useState(false);
    const [error, setError]       = React.useState('');
    const [loading, setLoading]   = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            if (isSignUp) {
                const { error: err } = await supabase.auth.signUp({ email, password });
                if (err) throw err;
                setError('✓ Check your email to confirm!');
            } else {
                const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
                if (err) throw err;
                onLogin(data.user);
            }
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const isSuccess = error.startsWith('✓');

    return (
        <div className="auth-wrap">
            <div className="auth-card">
                <div className="auth-brand">
                    <span style={{fontSize:'28px'}}>{icon}</span>
                    <span className="auth-brand-name">{appName}</span>
                </div>
                <h1>{isSignUp ? 'Create account' : 'Welcome back'}</h1>
                <p className="auth-sub">{isSignUp ? signUpSub : signInSub}</p>

                {error && <div className={`msg ${isSuccess ? 'msg-success' : 'msg-error'}`}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Loading…' : isSignUp ? 'Create account' : 'Sign in'}
                    </button>
                </form>
                <button type="button" className="btn btn-ghost" onClick={() => { setIsSignUp(!isSignUp); setError(''); }}>
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
            </div>
        </div>
    );
};
