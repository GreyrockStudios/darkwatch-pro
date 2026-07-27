import { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';

export function useTheme() {
  const { theme, toggleTheme, setTheme } = useAppStore();

  useEffect(() => {
    // Apply theme on mount
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return { theme, toggleTheme, setTheme };
}