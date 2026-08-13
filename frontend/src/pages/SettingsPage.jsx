import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import * as settingsApi from '../api/settingsApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage, { extractErrorMessage } from '../components/common/ErrorMessage';
import { formatDateTime } from '../utils/formatters';
import { SETTING_KEYS } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';

// Human-readable descriptions for the known settings keys, sourced from the
// backend's validation package (ThresholdSettingValidator, TokenExpirySettingValidator,
// CameraSourcesSettingValidator) and db/sample_data.sql seed values.
const DESCRIPTIONS = {
  [SETTING_KEYS.RECOGNITION_THRESHOLD]:
    'Minimum face-match confidence (0.0–1.0) required to accept a recognition as MATCHED.',
  [SETTING_KEYS.JWT_EXPIRATION_MS]: 'Access token lifetime, in milliseconds.',
  [SETTING_KEYS.CAMERA_SOURCES]: 'JSON list of registered cameras: [{"id":"CAM01","label":"..."}]',
  JWT_REFRESH_TOKEN_EXPIRY: 'Refresh token lifetime, in milliseconds, before a session must fully re-authenticate.',
  PASSWORD_POLICY: 'Password strength required for new accounts and password changes: LOW, SIMPLE, MEDIUM, or STRICT.',
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState(null);
  const [successKey, setSuccessKey] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await settingsApi.getAllSettings();
      setSettings(data);
      setDrafts(Object.fromEntries(data.map((s) => [s.key, s.value])));
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load settings.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (key) => {
    setSavingKey(key);
    setError(null);
    setSuccessKey(null);
    try {
      const updated = await settingsApi.updateSetting(key, drafts[key]);
      setSettings((prev) => prev.map((s) => (s.key === key ? updated : s)));
      setSuccessKey(key);
      setTimeout(() => setSuccessKey(null), 2000);
    } catch (err) {
      setError(extractErrorMessage(err, `Failed to update ${key}. Check the value format.`));
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) return <LoadingSpinner full label="Loading settings…" />;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="card p-5">
        <h3 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Appearance</h3>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          This preference is saved on this device only, not shared across your other sessions.
        </p>
        <div className="mt-3 inline-flex rounded-lg border border-slate-200 p-1 dark:border-slate-600">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              theme === 'light' ? 'bg-brand-gradient text-white shadow-sm' : 'text-slate-500 dark:text-slate-300'
            }`}
          >
            <Sun className="h-4 w-4" aria-hidden="true" /> Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              theme === 'dark' ? 'bg-brand-gradient text-white shadow-sm' : 'text-slate-500 dark:text-slate-300'
            }`}
          >
            <Moon className="h-4 w-4" aria-hidden="true" /> Dark
          </button>
        </div>
      </div>

      <ErrorMessage message={error} onRetry={load} />

      <div className="space-y-4">
        {settings.map((setting) => (
          <div key={setting.key} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{setting.key}</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{DESCRIPTIONS[setting.key] || 'System setting'}</p>
              </div>
              {successKey === setting.key && (
                <span className="text-xs font-medium text-emerald-600">Saved</span>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              {setting.key === SETTING_KEYS.CAMERA_SOURCES ? (
                <textarea
                  className="input font-mono text-xs"
                  rows={3}
                  value={drafts[setting.key] ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [setting.key]: e.target.value }))}
                />
              ) : (
                <input
                  className="input"
                  value={drafts[setting.key] ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [setting.key]: e.target.value }))}
                />
              )}
              <button
                onClick={() => handleSave(setting.key)}
                disabled={savingKey === setting.key || drafts[setting.key] === setting.value}
                className="btn-primary shrink-0"
              >
                {savingKey === setting.key ? 'Saving…' : 'Save'}
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Last updated {formatDateTime(setting.updatedAt)} by {setting.updatedByUsername || 'system'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
