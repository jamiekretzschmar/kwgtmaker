import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Leaf } from 'lucide-react';

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-2 p-1 bg-neutral-800 rounded-lg">
      <button onClick={() => setTheme('light')} className={`p-2 rounded-md ${theme === 'light' ? 'bg-neutral-700 text-white' : 'text-neutral-400'}`}><Sun className="w-4 h-4" /></button>
      <button onClick={() => setTheme('dark')} className={`p-2 rounded-md ${theme === 'dark' ? 'bg-neutral-700 text-white' : 'text-neutral-400'}`}><Moon className="w-4 h-4" /></button>
      <button onClick={() => setTheme('lettuce')} className={`p-2 rounded-md ${theme === 'lettuce' ? 'bg-neutral-700 text-white' : 'text-neutral-400'}`}><Leaf className="w-4 h-4" /></button>
    </div>
  );
};
