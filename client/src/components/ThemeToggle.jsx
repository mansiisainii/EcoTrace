import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full border border-gray-700 hover:border-green-500 transition-all duration-200 text-gray-400 hover:text-green-500 bg-transparent flex items-center justify-center"
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Moon className="w-5 h-5 transition-all duration-300" />
      ) : (
        <Sun className="w-5 h-5 transition-all duration-300" />
      )}
    </button>
  );
};

export default ThemeToggle;
