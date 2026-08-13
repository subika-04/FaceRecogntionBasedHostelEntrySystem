import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'frhes-theme';

function getInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  // No explicit choice saved yet -- follow the OS/browser preference.
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    // If the user never explicitly chose a theme in this app, keep following
    // the OS preference live (e.g. their system switches to dark at sunset).
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem(STORAGE_KEY + '-explicit')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    media.addEventListener?.('change', handleChange);
    return () => media.removeEventListener?.('change', handleChange);
  }, []);

  const toggleTheme = () => {
    localStorage.setItem(STORAGE_KEY + '-explicit', '1');
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  const setExplicitTheme = (value) => {
    localStorage.setItem(STORAGE_KEY + '-explicit', '1');
    setTheme(value);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setExplicitTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
