import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Login() {
  const { login, goAfterLogin, isLoggedIn, user } = useAuth();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isLoggedIn && user) goAfterLogin(user.role, redirect);
  }, [isLoggedIn, user, redirect, goAfterLogin]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter email and password.');
      return;
    }
    setSubmitting(true);
    try {
      const loggedInUser = await login(email.trim(), password);
      goAfterLogin(loggedInUser.role, redirect);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      setSubmitting(false);
    }
  }

  async function forgotPassword() {
    const emailInput = prompt('Enter your email:');
    if (!emailInput) return;
    try {
      await api.post('/api/auth/forgot-password', { email: emailInput.trim() });
      alert('OTP sent to your email.');
    } catch (err) {
      alert(err.message || 'Failed to send OTP');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-logo">
          <h1>MediFlow</h1>
          <p>Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" className="form-control" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" className="form-control" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p style={{ display: 'block', marginBottom: 12, color: 'var(--red)', fontSize: 14 }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="auth-footer">
          <p>Don&apos;t have an account? <Link to="/register">Register</Link></p>
          <p className="mt-1"><a href="#" onClick={(e) => { e.preventDefault(); forgotPassword(); }}>Forgot password?</a></p>
        </div>
      </div>
    </div>
  );
}
