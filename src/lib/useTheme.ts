import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

// Apply stored theme synchronously at module load — prevents flash on page reload
try {
  const stored = localStorage.getItem('theme') as Theme | null;
  if (stored) applyTheme(stored);
} catch { /* localStorage unavailable (private mode, etc.) */ }

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem('theme') as Theme | null;
      return stored ?? getSystemTheme();
    } catch {
      return getSystemTheme();
    }
  });

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem('theme', theme); } catch { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      try {
        if (!localStorage.getItem('theme')) setTheme(getSystemTheme());
      } catch {
        setTheme(getSystemTheme());
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggle };
}
