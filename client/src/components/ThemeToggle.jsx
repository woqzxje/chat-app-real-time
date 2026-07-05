import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Switch from './ui/star-wars-toggle-switch';

export function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className={`fixed bottom-6 left-6 z-50 hover:scale-110 transition-transform duration-300 ${className || ''}`}>
      <Switch checked={theme === 'dark'} onChange={toggleTheme} />
    </div>
  );
}
