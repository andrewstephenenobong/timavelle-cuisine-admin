import { useState } from 'react';
import api from '../lib/api';

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

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    setSaving(true);
    try {
      await api.put('/api/auth/change-password', { currentPassword, newPassword });
      setSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong changing your password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-emerald-deep">Settings</h2>
      <form onSubmit={handleSubmit} className="mt-6 max-w-md rounded-3xl bg-white p-6 shadow-lg">
        <h3 className="mb-4 font-display text-lg font-semibold text-ink">Change Password</h3>

        <div className="mb-4">
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" required className="w-full rounded-xl border border-stone/20 px-4 py-2 font-body" />
        </div>
        <div className="mb-4">
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" required className="w-full rounded-xl border border-stone/20 px-4 py-2 font-body" />
        </div>
        <div className="mb-4">
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required className="w-full rounded-xl border border-stone/20 px-4 py-2 font-body" />
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {success && <p className="mb-4 text-sm text-emerald">{success}</p>}

        <button type="submit" disabled={saving} className="rounded-full bg-emerald px-6 py-2 font-utility text-sm text-ivory hover:bg-emerald-deep disabled:opacity-50">
          {saving ? 'Saving…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
