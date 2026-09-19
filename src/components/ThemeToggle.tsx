'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'pill' | 'button';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  variant = 'icon',
  showLabel = false 
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Theme preferences only exist in the browser. Use a deterministic value for
  // SSR and the first client render, then reveal the resolved theme after mount.
  const displayDark = mounted && isDark;

  if (variant === 'pill') {
    return (
      <button
        type="button"
        id="theme-toggle-pill"
        onClick={toggleTheme}
        aria-label={`Switch to ${displayDark ? 'light' : 'dark'} mode`}
        className={`relative inline-flex h-8 w-14 items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
          displayDark ? 'bg-stone-800 border border-stone-700' : 'bg-amber-100 border border-amber-200'
        } ${className}`}
      >
        <span className="sr-only">Toggle theme</span>
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-300 shadow-xs ${
            displayDark
              ? 'translate-x-6 bg-stone-900 text-amber-400'
              : 'translate-x-0 bg-white text-amber-600'
          }`}
        >
          {displayDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
        </span>
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        id="theme-toggle-button"
        onClick={toggleTheme}
        aria-label={`Switch to ${displayDark ? 'light' : 'dark'} mode`}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 shadow-2xs min-h-[38px] ${
          displayDark
            ? 'bg-stone-900 border-stone-700 text-amber-400 hover:bg-stone-800 hover:text-amber-300'
            : 'bg-white border-stone-200 text-stone-700 hover:bg-amber-50 hover:text-amber-700'
        } ${className}`}
      >
        {displayDark ? (
          <>
            <Sun className="h-3.5 w-3.5 text-amber-400" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="h-3.5 w-3.5 text-stone-600" />
            <span>Dark Mode</span>
          </>
        )}
      </button>
    );
  }

  // Default 'icon' variant
  return (
    <button
      type="button"
      id="theme-toggle-icon"
      onClick={toggleTheme}
      title={displayDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={displayDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 shadow-2xs active:scale-95 ${
        displayDark
          ? 'bg-stone-900 border-stone-800 text-amber-400 hover:bg-stone-800 hover:border-stone-700'
          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-amber-600'
      } ${className}`}
    >
      {displayDark ? (
        <Sun className="h-4 w-4 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-300 hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="ml-1.5 text-xs font-medium">
          {displayDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};
