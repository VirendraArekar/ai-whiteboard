import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 'md' }) => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark/light theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative inline-flex items-center justify-center rounded-xl p-2 transition-all cursor-pointer ${
        isDark
          ? 'bg-gray-800 text-amber-300 hover:bg-gray-700 hover:text-amber-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
      } ${className}`}
    >
      {isDark ? (
        <Sun className={size === 'sm' ? 'w-4 h-4' : 'w-4 h-4'} />
      ) : (
        <Moon className={size === 'sm' ? 'w-4 h-4' : 'w-4 h-4'} />
      )}
    </button>
  );
};
