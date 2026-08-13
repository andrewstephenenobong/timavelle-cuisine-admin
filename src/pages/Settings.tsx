import { useCallback, useEffect, useState } from 'react';
import api, { type HealthResponse } from '../lib/api';
import { PUBLIC_SITE_URL } from '../lib/site';
import './settings.css';

type RuntimeState = 'loading' | 'connected' | 'degraded' | 'offline';

const runtimeCopy: Record<RuntimeState, { label: string; detail: string }> = {
  loading: { label: 'Checking', detail: 'Confirming API and database readiness.' },
  connected: { label: 'Connected', detail: 'API and database are ready for admin work.' },
  degraded: { label: 'Degraded', detail: 'The API responded, but database-backed work may be unavailable.' },
  offline: { label: 'Offline', detail: 'The backend is not responding; changes cannot be confirmed.' },
};

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { data?: { error?: string } } }).response?.data?.error;
  }
  return undefined;
}

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [runtimeState, setRuntimeState] = useState<RuntimeState>('loading');
  const [runtimeMessage, setRuntimeMessage] = useState(runtimeCopy.loading.detail);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const checkHealth = useCallback(async () => {
    setCheckingHealth(true);
    setRuntimeState('loading');
    setRuntimeMessage(runtimeCopy.loading.detail);
    try {
      const response = await api.get<HealthResponse>('/api/health', { timeout: 8000 });
      const nextState: RuntimeState = response.data.status === 'ok' && response.data.database === 'ready' ? 'connected' : 'degraded';
      setRuntimeState(nextState);
      setRuntimeMessage(response.data.message || runtimeCopy[nextState].detail);
    } catch (healthError: unknown) {
      const response = typeof healthError === 'object' && healthError !== null && 'response' in healthError
        ? (healthError as { response?: { data?: HealthResponse } }).response
        : undefined;
      const nextState: RuntimeState = response?.data?.status === 'degraded' ? 'degraded' : 'offline';
      setRuntimeState(nextState);
      setRuntimeMessage(response?.data?.message || runtimeCopy[nextState].detail);
    } finally {
      setCheckedAt(new Date().toISOString());
      setCheckingHealth(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(() => checkHealth()); }, [checkHealth]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) { setError('New password and confirmation do not match.'); return; }
    if (newPassword.length < 8) { setError('New password must be at least 8 characters.'); return; }
    setSaving(true);
    try {
      await api.put('/api/auth/change-password', { currentPassword, newPassword });
      setSuccess('Password updated successfully.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError) || 'Something went wrong changing your password.');
    } finally { setSaving(false); }
  }

  const runtime = runtimeCopy[runtimeState];
  const checkedLabel = checkedAt ? new Intl.DateTimeFormat('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Africa/Lagos' }).format(new Date(checkedAt)) : 'Not checked yet';

  return <div className="settings-page">
    <div className="settings-page__head"><div><div className="admin-page__eyebrow">Workspace / 07</div><h2>Settings <em>with intent.</em></h2><p className="settings-page__intro">Keep access, connection, and publishing expectations legible. This is the quiet infrastructure behind the public table.</p></div></div>
    <div className="settings-page__grid">
      <section className="settings-card settings-card--wide"><div className="settings-card__eyebrow">Account security</div><h3>Change password.</h3><p>Update the credential used for the existing admin authentication flow.</p><form onSubmit={handleSubmit} className="settings-form"><label htmlFor="current-password">Current password<input id="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required /></label><label htmlFor="new-password">New password<input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" required /></label><label htmlFor="confirm-password">Confirm new password<input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required /></label><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Update password ↗'}</button></form>{error && <p className="settings-message settings-message--error" role="alert">{error}</p>}{success && <p className="settings-message" role="status">{success}</p>}</section>
      <section className="settings-card"><div className="settings-card__eyebrow">Public surface</div><h3>Website connection.</h3><p>Open the public website in a separate tab while you shape content.</p><a className="settings-support" href={PUBLIC_SITE_URL} target="_blank" rel="noreferrer">View Timavelle Cuisine ↗</a></section>
      <section className="settings-card" data-runtime-state={runtimeState}><div className="settings-card__eyebrow">Runtime status</div><h3>API connection.</h3><p>{runtimeMessage}</p><div className="settings-list"><div className="settings-list__row"><span>Backend health<small>Live API and database readiness</small></span><strong className="settings-pill">{runtime.label}</strong></div><div className="settings-list__row"><span>Last checked<small>Lagos time · WAT</small></span><strong className="settings-pill">{checkedLabel}</strong></div></div><button type="button" className="settings-support" onClick={() => void checkHealth()} disabled={checkingHealth}>{checkingHealth ? 'Checking…' : 'Retry connection ↗'}</button></section>
    </div>
    <section className="settings-card" style={{ marginTop: 12 }}><div className="settings-card__eyebrow">Need a hand?</div><h3>Keep the room moving.</h3><p>For access questions or a new backend content resource, contact the Timavelle technical owner rather than changing production credentials in the browser.</p><a className="settings-support" href="mailto:hello@timavellecuisine.com">Contact support ↗</a></section>
  </div>;
}
