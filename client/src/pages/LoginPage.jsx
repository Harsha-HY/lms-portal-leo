import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API } from '../services/api';

const LoginPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  useEffect(() => {
    // Apply active theme
    const activeTheme = localStorage.getItem('leo-theme') || 'theme-dark-slate';
    document.body.className = activeTheme;

    // If user is already logged in, redirect them
    if (user) {
      if (user.role === 'admin' || user.role === 'faculty') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    try {
      if (isSignUpMode) {
        const data = await API.register(name, email, password);
        if (data.error) {
          setAlert({ type: 'error', message: data.error });
        } else {
          setAlert({ type: 'success', message: 'Registration successful! Redirecting...' });
          setTimeout(() => {
            // Auto login or session reload
            window.location.reload();
          }, 1000);
        }
      } else {
        const data = await login(email, password);
        if (data.error) {
          setAlert({ type: 'error', message: data.error });
        } else {
          setAlert({ type: 'success', message: 'Login successful! Redirecting...' });
          setTimeout(() => {
            if (data.user.role === 'admin' || data.user.role === 'faculty') {
              navigate('/admin');
            } else {
              navigate('/dashboard');
            }
          }, 1000);
        }
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Network error. Please try again.' });
    }
  };

  return (
    <div className="auth-container">
      {/* Left Intro Column */}
      <div className="auth-sidebar">
        <div className="auth-brand">
          <div className="auth-brand-logo">L</div>
          <span>LeoAxis</span>
        </div>
        
        <div className="auth-intro-content">
          <h1 className="auth-intro-title">Empower Your Learning Journey</h1>
          <p className="auth-intro-subtitle">
            Access high-quality recorded lectures, track your milestones, and complete growth cycles with real-time feedback.
          </p>
        </div>

        <div className="auth-cards-container">
          <div className="auth-feature-card">
            <h4>Recorded Lectures</h4>
            <p>Learn at your own pace with curated multi-stage lessons.</p>
          </div>
          <div className="auth-feature-card">
            <h4>Progress Tracking</h4>
            <p>Track your milestones, assignments, and weekly goals.</p>
          </div>
        </div>
      </div>

      {/* Right Form Column */}
      <div className="auth-form-side">
        <div className="auth-form-wrapper">
          
          <div className="auth-header">
            <h2>{isSignUpMode ? 'Create Account' : 'Welcome Back'}</h2>
            <p>
              {isSignUpMode ? (
                <>
                  Already have an account?{' '}
                  <span className="auth-toggle-link" onClick={() => { setIsSignUpMode(false); setAlert({ type: '', message: '' }); }}>
                    Sign In
                  </span>
                </>
              ) : (
                <>
                  New to LeoAxis?{' '}
                  <span className="auth-toggle-link" onClick={() => { setIsSignUpMode(true); setAlert({ type: '', message: '' }); }}>
                    Create an account
                  </span>
                </>
              )}
            </p>
          </div>

          {alert.message && (
            <div className={`alert ${alert.type === 'error' ? 'alert-danger' : 'alert-success'}`} style={{ display: 'block' }}>
              {alert.message}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignUpMode && (
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">Full Name</label>
                <input 
                  className="form-input" 
                  type="text" 
                  id="reg-name" 
                  placeholder="John Doe" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">Email Address</label>
              <input 
                className="form-input" 
                type="email" 
                id="auth-email" 
                placeholder="name@domain.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="auth-password">Password</label>
              <input 
                className="form-input" 
                type="password" 
                id="auth-password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '1rem' }}>
              {isSignUpMode ? 'Register Account' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/" style={{ color: 'var(--text-muted)', decoration: 'none', fontSize: '0.9rem' }}>
              ← Back to Home
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
