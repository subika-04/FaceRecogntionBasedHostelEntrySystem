import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as profileApi from '../api/profileApi';
import ErrorMessage, { extractErrorMessage } from '../components/common/ErrorMessage';
import StatusBadge from '../components/common/StatusBadge';
import { titleCase } from '../utils/formatters';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatarUrl: user?.avatarUrl || '',
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await profileApi.updateProfile(form);
      await refreshProfile();
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-lg space-y-4">
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brass-100 text-xl font-semibold text-brass-700">
            {user.fullName?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{user.fullName}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">@{user.username}</p>
            <div className="mt-1 flex gap-2">
              <span className="badge bg-brass-100 text-brass-700">{titleCase(user.role)}</span>
              <StatusBadge value={user.status} />
            </div>
          </div>
        </div>

        <ErrorMessage message={error} />
        {success && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Profile updated successfully.
          </p>
        )}

        {editing ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.fullName} onChange={update('fullName')} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={update('email')} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={update('phone')} />
            </div>
            <div>
              <label className="label">Avatar URL</label>
              <input className="input" value={form.avatarUrl} onChange={update('avatarUrl')} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs uppercase text-slate-400">Email</dt>
              <dd className="text-slate-700 dark:text-slate-300">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Phone</dt>
              <dd className="text-slate-700 dark:text-slate-300">{user.phone || '—'}</dd>
            </div>
            <button onClick={() => setEditing(true)} className="btn-secondary col-span-2 w-fit">
              Edit Profile
            </button>
          </dl>
        )}
      </div>
    </div>
  );
}
