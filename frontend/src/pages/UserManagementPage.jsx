import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import * as userApi from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonTable } from '../components/ui/Skeleton';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatusBadge from '../components/common/StatusBadge';
import ErrorMessage, { extractErrorMessage } from '../components/common/ErrorMessage';
import { ROLES } from '../utils/constants';

const emptyCreateForm = { fullName: '', email: '', username: '', password: '', phone: '', role: ROLES.STAFF };

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState(null);

  const [pendingStatusChange, setPendingStatusChange] = useState(null); // { user, action: 'activate'|'deactivate' }
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const load = async (currentPage = pageIndex, currentQuery = query) => {
    setLoading(true);
    setError(null);
    try {
      const data = await userApi.searchUsers({
        query: currentQuery || undefined,
        page: currentPage,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'desc',
      });
      setPage(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load users.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPageIndex(0);
    load(0, query);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError(null);
    try {
      await userApi.createUser(createForm);
      toast.success(`Account created for ${createForm.username}.`);
      setCreateOpen(false);
      setCreateForm(emptyCreateForm);
      load(0, query);
    } catch (err) {
      setCreateError(extractErrorMessage(err, 'Failed to create the account.'));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetSubmitting(true);
    setResetError(null);
    try {
      await userApi.resetUserPassword(resetTarget.id, resetPassword);
      toast.success(`Password reset for ${resetTarget.username}. All their active sessions were signed out.`);
      setResetTarget(null);
      setResetPassword('');
    } catch (err) {
      setResetError(extractErrorMessage(err, 'Failed to reset the password.'));
    } finally {
      setResetSubmitting(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    setStatusSubmitting(true);
    try {
      if (pendingStatusChange.action === 'deactivate') {
        await userApi.deactivateUser(pendingStatusChange.user.id);
        toast.success(`${pendingStatusChange.user.username} was deactivated.`);
      } else {
        await userApi.activateUser(pendingStatusChange.user.id);
        toast.success(`${pendingStatusChange.user.username} was reactivated.`);
      }
      setPendingStatusChange(null);
      load(pageIndex, query);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'That action could not be completed.'));
      setPendingStatusChange(null);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (newRole === targetUser.role) return;
    try {
      await userApi.updateUserRole(targetUser.id, newRole);
      toast.success(`${targetUser.username} is now ${newRole}. Their active sessions were signed out.`);
      load(pageIndex, query);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to change the role.'));
    }
  };

  const users = page?.content || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex w-full max-w-md gap-2">
          <input
            className="input"
            placeholder="Search by name, username, or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" variant="secondary" className="shrink-0">
            Search
          </Button>
        </form>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 gap-1.5">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add account
        </Button>
      </div>

      <ErrorMessage message={error} onRetry={() => load(pageIndex, query)} />

      <div className="card">
        {loading ? (
          <SkeletonTable columns={5} />
        ) : users.length === 0 ? (
          <EmptyState
            title="No accounts yet"
            description="Create the first staff or admin account to get started."
            action={<Button onClick={() => setCreateOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" aria-hidden="true" /> Add account</Button>}
          />
        ) : (
          <>
            {/* Mobile: stacked cards (avoids the 6-column table overflowing
                horizontally on narrow screens) */}
            <ul className="divide-y divide-slate-100 dark:divide-slate-700 md:hidden">
              {users.map((u) => {
                const isSelf = u.username === currentUser?.username;
                return (
                  <li key={u.id} className="space-y-2.5 p-4">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                        {u.fullName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink dark:text-slate-100">{u.fullName}</p>
                        <p className="truncate font-id text-xs text-slate-500 dark:text-slate-400">{u.username}</p>
                      </div>
                      <StatusBadge value={u.locked ? 'FAILED' : u.status} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <select
                        className="input py-1 text-xs"
                        value={u.role}
                        disabled={isSelf}
                        title={isSelf ? "You can't change your own role." : undefined}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                      >
                        <option value={ROLES.ADMIN}>ADMIN</option>
                        <option value={ROLES.STAFF}>STAFF</option>
                      </select>
                      <span className="text-xs text-slate-400">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never logged in'}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <button
                        className="font-medium text-brass-600 hover:underline"
                        onClick={() => {
                          setResetTarget(u);
                          setResetPassword('');
                          setResetError(null);
                        }}
                      >
                        Reset password
                      </button>
                      {u.status === 'ACTIVE' ? (
                        <button
                          className="font-medium text-denied-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
                          disabled={isSelf}
                          title={isSelf ? "You can't deactivate your own account." : undefined}
                          onClick={() => setPendingStatusChange({ user: u, action: 'deactivate' })}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          className="font-medium text-verified-600 hover:underline"
                          onClick={() => setPendingStatusChange({ user: u, action: 'activate' })}
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop/tablet: full table, horizontally scrollable as a
                fallback if the viewport is ever narrower than the content */}
            <div className="hidden overflow-x-auto md:block">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last login</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.username === currentUser?.username;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="bg-brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                            {u.fullName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink dark:text-slate-100">{u.fullName}</p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-id">{u.username}</td>
                      <td>
                        <select
                          className="input py-1 text-xs"
                          value={u.role}
                          disabled={isSelf}
                          title={isSelf ? "You can't change your own role." : undefined}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                        >
                          <option value={ROLES.ADMIN}>ADMIN</option>
                          <option value={ROLES.STAFF}>STAFF</option>
                        </select>
                      </td>
                      <td>
                        <StatusBadge value={u.locked ? 'FAILED' : u.status} />
                        {u.locked && <p className="mt-0.5 text-xs text-caution-700">Locked out</p>}
                      </td>
                      <td className="font-id text-xs text-slate-500 dark:text-slate-400">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                      </td>
                      <td>
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            className="font-medium text-brass-600 hover:underline"
                            onClick={() => {
                              setResetTarget(u);
                              setResetPassword('');
                              setResetError(null);
                            }}
                          >
                            Reset password
                          </button>
                          {u.status === 'ACTIVE' ? (
                            <button
                              className="font-medium text-denied-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
                              disabled={isSelf}
                              title={isSelf ? "You can't deactivate your own account." : undefined}
                              onClick={() => setPendingStatusChange({ user: u, action: 'deactivate' })}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              className="font-medium text-verified-600 hover:underline"
                              onClick={() => setPendingStatusChange({ user: u, action: 'activate' })}
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            <Pagination page={page} onPageChange={(p) => { setPageIndex(p); load(p, query); }} />
          </>
        )}
      </div>

      <Modal open={createOpen} title="Add account" onClose={() => setCreateOpen(false)}>
        <form onSubmit={handleCreateSubmit} className="space-y-3">
          {createError && (
            <div role="alert" className="rounded-lg border border-denied-500/30 bg-denied-50 px-3 py-2 text-sm text-denied-700">
              {createError}
            </div>
          )}
          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              required
              value={createForm.fullName}
              onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                required
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select
                className="input"
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              >
                <option value={ROLES.STAFF}>STAFF</option>
                <option value={ROLES.ADMIN}>ADMIN</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Temporary password</label>
            <input
              type="password"
              className="input"
              required
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            />
            <p className="mt-1 text-xs text-slate-400">Must satisfy the current password policy (see Settings).</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createSubmitting}>
              Create account
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!resetTarget} title={`Reset password for ${resetTarget?.username || ''}`} onClose={() => setResetTarget(null)}>
        <form onSubmit={handleResetSubmit} className="space-y-3">
          {resetError && (
            <div role="alert" className="rounded-lg border border-denied-500/30 bg-denied-50 px-3 py-2 text-sm text-denied-700">
              {resetError}
            </div>
          )}
          <div>
            <label className="label">New password</label>
            <input
              type="password"
              className="input"
              required
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-400">
              This immediately signs {resetTarget?.username} out of every active session.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={resetSubmitting}>
              Reset password
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!pendingStatusChange}
        title={pendingStatusChange?.action === 'deactivate' ? 'Deactivate account' : 'Reactivate account'}
        message={
          pendingStatusChange?.action === 'deactivate'
            ? `${pendingStatusChange?.user?.username} will be signed out immediately and won't be able to log in until reactivated.`
            : `${pendingStatusChange?.user?.username} will be able to log in again.`
        }
        onConfirm={confirmStatusChange}
        onCancel={() => setPendingStatusChange(null)}
        confirming={statusSubmitting}
        confirmLabel={pendingStatusChange?.action === 'deactivate' ? 'Deactivate' : 'Reactivate'}
        confirmingLabel={pendingStatusChange?.action === 'deactivate' ? 'Deactivating…' : 'Reactivating…'}
        variant={pendingStatusChange?.action === 'deactivate' ? 'danger' : 'primary'}
      />
    </div>
  );
}
