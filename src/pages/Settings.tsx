/* Timavelle settings: make security, site connection, and support visible in one calm, useful control room. */
import { useState } from 'react';
import api from '../lib/api';
import { PUBLIC_SITE_URL } from '../lib/site';
import './settings.css';

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) { setError('New password and confirmation do not match.'); return; }
    if (newPassword.length < 8) { setError('New password must be at least 8 characters.'); return; }
    setSaving(true);
    try {
      await api.put('/api/auth/change-password', { currentPassword, newPassword });
      setSuccess('Password updated successfully.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message || 'Something went wrong changing your password.');
    } finally { setSaving(false); }
  }

  return <div className="settings-page"><div className="settings-page__head"><div className="admin-page__eyebrow">Workspace / 07</div><h2>Settings <em>with intent.</em></h2><p className="settings-page__intro">Keep access, connection, and publishing expectations legible. This is the quiet infrastructure behind the public table.</p></div><div className="settings-page__grid"><section className="settings-card settings-card--wide"><div className="settings-card__eyebrow">Account security</div><h3>Change password.</h3><p>Update the credential used for the existing admin authentication flow.</p><form onSubmit={handleSubmit} className="settings-form"><label htmlFor="current-password">Current password<input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required /></label><label htmlFor="new-password">New password<input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required /></label><label htmlFor="confirm-password">Confirm new password<input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required /></label><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Update password ↗'}</button></form>{error && <p className="settings-message settings-message--error" role="alert">{error}</p>}{success && <p className="settings-message" role="status">{success}</p>}</section><section className="settings-card"><div className="settings-card__eyebrow">Public surface</div><h3>Website connection.</h3><p>Open the public website in a separate tab while you shape content.</p><a className="settings-support" href={PUBLIC_SITE_URL} target="_blank" rel="noreferrer">View Timavelle Cuisine ↗</a></section><section className="settings-card"><div className="settings-card__eyebrow">Runtime status</div><h3>API connection.</h3><div className="settings-list"><div className="settings-list__row"><span>Authentication<small>Existing admin token flow</small></span><strong className="settings-pill">Active</strong></div><div className="settings-list__row"><span>Content writes<small>Protected API managers</small></span><strong className="settings-pill">Staged</strong></div><div className="settings-list__row"><span>Static content<small>Services, FAQs, Contact</small></span><strong className="settings-pill">Draft</strong></div></div></section></div><section className="settings-card" style={{ marginTop: 12 }}><div className="settings-card__eyebrow">Need a hand?</div><h3>Keep the room moving.</h3><p>For access questions or a new backend content resource, contact the Timavelle technical owner rather than changing production credentials in the browser.</p><a className="settings-support" href="mailto:hello@timavellecuisine.com">Contact support ↗</a></section></div>;
}
