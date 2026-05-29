import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const { login, user, error, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const pendingJoinCode = localStorage.getItem('pendingJoinInviteCode');
      if (pendingJoinCode) {
        navigate(`/join/${pendingJoinCode}`);
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    if (!email || !password) {
      setValidationError('Enter your email and password to continue');
      return;
    }
    const result = await login(email, password);
    if (result.success) {
      const pendingJoinCode = localStorage.getItem('pendingJoinInviteCode');
      if (pendingJoinCode) {
        navigate(`/join/${pendingJoinCode}`);
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-brand">Itinera</div>

        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">
          Sign in to return to your group planning spaces.
        </p>

        {(validationError || error) && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
            {validationError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            id="btn-login"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}
          >
            {loading ? 'Signing in…' : 'Continue to planning →'}
          </button>
        </form>

        <p className="auth-footer">
          New to Itinera?{' '}
          <Link to="/register" className="auth-link">
            Create a planning account
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;
