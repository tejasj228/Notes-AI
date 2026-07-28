'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeProvider';

// Compact icon button that flips light/dark. Drop it in any top bar/header.
const ThemeToggle = ({ className = '', iconSize = 18 }) => {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      className={`brutal-btn bg-card text-ink p-2 flex-shrink-0 ${className}`}
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle light/dark theme"
    >
      {theme === 'dark' ? <Sun size={iconSize} strokeWidth={2.75} /> : <Moon size={iconSize} strokeWidth={2.75} />}
    </button>
  );
};

export default ThemeToggle;
