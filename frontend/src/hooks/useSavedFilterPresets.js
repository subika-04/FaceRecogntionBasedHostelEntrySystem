import { useCallback, useEffect, useState } from 'react';

/**
 * Named filter presets persisted to localStorage, scoped by `storageKey` so
 * different pages (Analytics today; Reports or Recognition Module later)
 * don't collide. Deliberately client-only -- a "saved filter" is a personal
 * browser preference, not data that needs a backend record or to sync
 * across devices, so no new endpoint was added for this.
 */
export function useSavedFilterPresets(storageKey) {
  const [presets, setPresets] = useState([]); // [{ id, name, filters }]

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setPresets(raw ? JSON.parse(raw) : []);
    } catch {
      setPresets([]);
    }
  }, [storageKey]);

  const persist = useCallback((next) => {
    setPresets(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }, [storageKey]);

  const savePreset = useCallback((name, filters) => {
    const preset = { id: Date.now().toString(36), name, filters };
    persist([...presets, preset]);
    return preset;
  }, [presets, persist]);

  const renamePreset = useCallback((id, newName) => {
    persist(presets.map((p) => (p.id === id ? { ...p, name: newName } : p)));
  }, [presets, persist]);

  const deletePreset = useCallback((id) => {
    persist(presets.filter((p) => p.id !== id));
  }, [presets, persist]);

  return { presets, savePreset, renamePreset, deletePreset };
}
