/* Timavelle login direction: quiet control room, clear trust cues, warm paper surfaces, and no changes to the auth contract. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import './login.css';
import { PUBLIC_SITE_URL } from '../lib/site';
import './login-a11y.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/auth/login', { email, password });
      login(res.data.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      const response = typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response
        : undefined;
      setError(response?.data?.error || 'Something went wrong logging in.');
    } finally {
      setLoading(false);
    }
  }

  return <main className="admin-login"><section className="admin-login__aside"><div className="admin-login__brand"><span className="ad-mark" aria-hidden="true"><i /><i /><i /></span><span><strong>Timavelle</strong><small>Admin workspace</small></span></div><div className="admin-login__aside-copy"><span className="admin-login__eyebrow">Private culinary house</span><h1>A more considered<br /><em>table starts here.</em></h1><p>Keep the menu, the mood, and the moments in step with the house.</p></div><div className="admin-login__aside-foot"><span>01 / Secure access</span><span>Content control room</span></div></section><section className="admin-login__panel"><div className="admin-login__form-wrap"><div className="admin-login__eyebrow">Welcome back</div><h2>Sign in to the<br /><em>workspace.</em></h2><p className="admin-login__intro">Use your Timavelle admin credentials to continue.</p><form onSubmit={handleSubmit} className="admin-login__form"><label htmlFor="admin-email">Work email<input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@timavellecuisine.com" autoComplete="email" required /></label><label htmlFor="admin-password">Password<div className="admin-login__password"><input id="admin-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></label>{error && <p className="admin-login__error" role="alert">{error}</p>}<button type="submit" disabled={loading} className="admin-login__submit">{loading ? 'Checking access…' : 'Enter workspace ↗'}</button></form><a className="admin-login__back" href={PUBLIC_SITE_URL}>← Back to Timavelle Cuisine</a></div><p className="admin-login__fineprint">Authorized team members only · Session protected by the existing admin authentication flow.</p></section></main>;
}
