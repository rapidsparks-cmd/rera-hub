import { useEffect, useRef, useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * AuthModal — Sign-in / Register modal.
 * Props:
 *   isOpen       {boolean}   show/hide the modal
 *   onClose      {function}  called when user dismisses the modal
 *   onSuccess    {function}  called after a successful login/register
 *   defaultTab   {'login'|'register'} which tab to show first (default: 'login')
 */
export default function AuthModal({ isOpen, onClose, onSuccess, defaultTab = 'login' }) {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();

  const [tab, setTab] = useState(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const firstInputRef = useRef(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      setEmail('');
      setPassword('');
      setError('');
      setLoading(false);
      setTimeout(() => firstInputRef.current?.focus(), 80);
    }
  }, [isOpen, defaultTab]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card auth-modal">
        {/* Header */}
        <div className="modal-header">
          <div>
            <p className="eyebrow">RERA Hub</p>
            <h2 id="auth-modal-title">{tab === 'login' ? 'Sign in' : 'Create account'}</h2>
            <p className="muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>
              {tab === 'login'
                ? 'Sign in to access premium downloads'
                : 'Create a free account to get started'}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
            type="button"
          >
            Sign in
          </button>
          <button
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
            type="button"
          >
            Register
          </button>
        </div>

        {/* Google OAuth button */}
        <button
          id="auth-google-btn"
          type="button"
          className="btn btn-google"
          onClick={handleGoogle}
          disabled={loading}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Divider */}
        <div className="auth-divider"><span>or</span></div>

        {/* Email/Password form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span className="field-label">Email</span>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input
                id="auth-email-input"
                ref={firstInputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </label>

          <label className="field">
            <span className="field-label">Password</span>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="auth-password-input"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === 'register' ? 'Min. 6 characters' : '••••••••'}
                required
                minLength={6}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                disabled={loading}
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>

          {error && <p className="form-error">{error}</p>}

          <button
            id="auth-submit-btn"
            type="submit"
            className="btn btn-accent btn-lg"
            disabled={loading}
          >
            {loading ? 'Please wait…' : tab === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" fill="#4285F4" />
      <path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.77-2.7.77-2.1 0-3.87-1.42-4.5-3.33H1.8v2.07A8 8 0 0 0 8.98 17z" fill="#34A853" />
      <path d="M4.48 10.49a4.8 4.8 0 0 1 0-3.03V5.39H1.8a8.02 8.02 0 0 0 0 7.17l2.68-2.07z" fill="#FBBC05" />
      <path d="M8.98 4.13c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.8 5.4l2.68 2.07c.63-1.9 2.4-3.34 4.5-3.34z" fill="#EA4335" />
    </svg>
  );
}

function friendlyError(err) {
  const code = err?.code || '';
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential')
    return 'Incorrect email or password. Please try again.';
  if (code === 'auth/email-already-in-use')
    return 'An account with this email already exists. Try signing in.';
  if (code === 'auth/weak-password')
    return 'Password must be at least 6 characters.';
  if (code === 'auth/invalid-email')
    return 'Please enter a valid email address.';
  if (code === 'auth/popup-closed-by-user')
    return 'Google sign-in was cancelled.';
  if (code === 'auth/network-request-failed')
    return 'Network error. Check your connection and try again.';
  return err?.message || 'Something went wrong. Please try again.';
}
