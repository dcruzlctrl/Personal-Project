// ===== AUTH COMPONENT =====
// Login and signup form

const { useState } = React;

import { authAPI } from '../js/api.js';
import { isValidEmail, validatePassword } from '../js/utils.js';

export const Auth = ({ onAuthSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validation
        if (!isValidEmail(email)) {
            setError('Invalid email address');
            setLoading(false);
            return;
        }

        if (!isSignUp) {
            const validation = validatePassword(password);
            if (!validation.valid) {
                setError(validation.message);
                setLoading(false);
                return;
            }
        }

        try {
            let result;
            if (isSignUp) {
                result = await authAPI.signUp(email, password);
                if (result.error) throw result.error;
                setError('Check your email to confirm!');
            } else {
                result = await authAPI.signIn(email, password);
                if (result.error) throw result.error;
                onAuthSuccess(result.data.user);
            }
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>{isSignUp ? 'Sign Up' : 'Sign In'}</h1>
                {error && <div className="error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>
                </form>

                <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError('');
                    }}
                >
                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
            </div>
        </div>
    );
};

export default Auth;
