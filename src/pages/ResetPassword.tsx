import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';
import './login.css';
import './login-a11y.css';

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'We could not reset your password.';
  }
  return 'We could not reset your password.';
}

export default function ResetPassword() {
  const { token = '' } = useParams();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmation) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, newPassword: password });
      setPassword('');
      setConfirmation('');
      setComplete(true);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return <main className="admin-login"><section className="admin-login__aside"><div className="admin-login__brand"><span className="ad-mark" aria-hidden="true"><i /><i /><i /></span><span><strong>Timavelle</strong><small>Admin workspace</small></span></div><div className="admin-login__aside-copy"><span className="admin-login__eyebrow">Secure recovery</span><h1>A fresh key<br /><em>for the workspace.</em></h1><p>Choose a new password, then return to the Timavelle content control room.</p></div><div className="admin-login__aside-foot"><span>03 / Set password</span><span>Content control room</span></div></section><section className="admin-login__panel"><div className="admin-login__form-wrap"><div className="admin-login__eyebrow">Password reset</div><h2>Set a new<br /><em>password.</em></h2>{complete ? <div className="admin-recovery__success" role="status"><p>Your password has been reset. The previous password no longer works.</p><Link className="admin-login__submit admin-login__submit--link" to="/login">Return to sign in ↗</Link></div> : <><p className="admin-login__intro">Use at least 8 characters. This reset link can only be used once.</p><form onSubmit={handleSubmit} className="admin-login__form" autoComplete="off"><label htmlFor="new-password">New password<input id="new-password" name="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></label><label htmlFor="confirm-password">Confirm password<input id="confirm-password" name="confirm-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required /></label>{error && <p className="admin-login__error" role="alert">{error}</p>}<button type="submit" disabled={loading} className="admin-login__submit">{loading ? 'Resetting password…' : 'Reset password ↗'}</button></form></>}<Link className="admin-login__back" to="/login">← Back to sign in</Link></div><p className="admin-login__fineprint">Reset links expire after 30 minutes and can only be used once.</p></section></main>;
}
