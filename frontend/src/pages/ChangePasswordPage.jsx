import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../api/authApi';
import ErrorMessage, { extractErrorMessage } from '../components/common/ErrorMessage';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.changePassword(form.oldPassword, form.newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to change password. Check your current password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md space-y-4">
      <div className="card p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Change Password</h2>

        <ErrorMessage message={error} />
        {success && (
          <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Password changed successfully. Redirecting…
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              className="input"
              value={form.oldPassword}
              onChange={update('oldPassword')}
              required
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              className="input"
              value={form.newPassword}
              onChange={update('newPassword')}
              required
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              className="input"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              required
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
