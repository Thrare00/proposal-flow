import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-secondary flex items-center space-x-2 dark:bg-gray-800 dark:text-gray-300"
      title="Toggle Dark Mode"
    >
      {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  );
};

export default ThemeToggle;
