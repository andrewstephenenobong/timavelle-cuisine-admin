import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import './login.css';
import './login-a11y.css';

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'We could not start password recovery.';
  }
  return 'We could not start password recovery.';
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return <main className="admin-login"><section className="admin-login__aside"><div className="admin-login__brand"><span className="ad-mark" aria-hidden="true"><i /><i /><i /></span><span><strong>Timavelle</strong><small>Admin workspace</small></span></div><div className="admin-login__aside-copy"><span className="admin-login__eyebrow">Secure recovery</span><h1>Access should<br /><em>never feel lost.</em></h1><p>Verify your work email and return to the content control room.</p></div><div className="admin-login__aside-foot"><span>02 / Recover access</span><span>Content control room</span></div></section><section className="admin-login__panel"><div className="admin-login__form-wrap"><div className="admin-login__eyebrow">Forgotten password</div><h2>Find your way<br /><em>back in.</em></h2>{sent ? <div className="admin-recovery__success" role="status"><p>If an admin account exists for that email, a reset link has been sent. Check your inbox and follow the link within 30 minutes.</p><Link className="admin-login__submit admin-login__submit--link" to="/login">Return to sign in ↗</Link></div> : <><p className="admin-login__intro">Enter your verified work email. We will send a single-use reset link if the account exists.</p><form onSubmit={handleSubmit} className="admin-login__form" autoComplete="off"><label htmlFor="recovery-email">Work email<input id="recovery-email" name="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@timavellecuisine.com" autoComplete="off" required /></label>{error && <p className="admin-login__error" role="alert">{error}</p>}<button type="submit" disabled={loading} className="admin-login__submit">{loading ? 'Sending secure link…' : 'Send reset link ↗'}</button></form></>}<Link className="admin-login__back" to="/login">← Back to sign in</Link></div><p className="admin-login__fineprint">For authorized team members only · Reset links expire after 30 minutes.</p></section></main>;
}
