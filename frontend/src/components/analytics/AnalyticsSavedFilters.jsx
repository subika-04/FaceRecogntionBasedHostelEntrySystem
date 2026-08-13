import { useState } from 'react';
import { useSavedFilterPresets } from '../../hooks/useSavedFilterPresets';

const STORAGE_KEY = 'frhes-analytics-saved-filters';

/**
 * Deliberately has zero knowledge of what a "filter" contains -- it just
 * saves/restores whatever `currentFilters` object AnalyticsPage hands it.
 * That keeps this component from duplicating AnalyticsFilterPanel's field
 * definitions; if that panel ever gains a new field, this still works
 * unchanged since it treats filters as an opaque blob.
 */
export default function AnalyticsSavedFilters({ currentFilters, onApply }) {
  const { presets, savePreset, renamePreset, deletePreset } = useSavedFilterPresets(STORAGE_KEY);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    savePreset(newName.trim(), currentFilters);
    setNewName('');
  };

  const startRename = (preset) => {
    setRenamingId(preset.id);
    setRenameValue(preset.name);
  };

  const commitRename = (id) => {
    if (renameValue.trim()) renamePreset(id, renameValue.trim());
    setRenamingId(null);
  };

  return (
    <div className="card p-4">
      <h3 className="mb-2 font-display text-sm font-semibold text-ink dark:text-slate-100">Saved Filters</h3>

      <form onSubmit={handleSave} className="mb-3 flex gap-2">
        <input
          className="input"
          placeholder="Name this filter combination…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="btn-secondary shrink-0 text-xs" disabled={!newName.trim()}>
          Save Current
        </button>
      </form>

      {presets.length === 0 ? (
        <p className="text-xs text-slate-400">No saved filters yet. Set up filters above and save them for quick reuse.</p>
      ) : (
        <ul className="space-y-1">
          {presets.map((preset) => (
            <li key={preset.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/40">
              {renamingId === preset.id ? (
                <input
                  autoFocus
                  className="input flex-1 py-1 text-xs"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => commitRename(preset.id)}
                  onKeyDown={(e) => e.key === 'Enter' && commitRename(preset.id)}
                />
              ) : (
                <button
                  type="button"
                  className="flex-1 truncate text-left text-sm text-ink hover:text-brass-600 dark:text-slate-200"
                  onClick={() => onApply(preset.filters)}
                >
                  {preset.name}
                </button>
              )}
              <div className="flex shrink-0 gap-2 text-xs text-slate-400">
                <button type="button" onClick={() => startRename(preset)} aria-label={`Rename ${preset.name}`} className="hover:text-ink dark:hover:text-slate-200">
                  Rename
                </button>
                <button type="button" onClick={() => deletePreset(preset.id)} aria-label={`Delete ${preset.name}`} className="hover:text-denied-600">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
