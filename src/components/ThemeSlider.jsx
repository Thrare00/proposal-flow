import { useTheme } from '../contexts/ThemeContext.jsx';
import { Moon, Sun } from 'lucide-react';

const ThemeSlider = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative inline-flex h-7 w-14 items-center rounded-full border border-slate-300/70 bg-white/70 p-0.5 shadow-sm transition-colors hover:bg-white dark:border-slate-600 dark:bg-slate-900/70 dark:hover:bg-slate-900"
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      aria-pressed={isDarkMode}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <span className="sr-only">Toggle theme</span>
      <span className="absolute left-1 flex items-center text-slate-500 dark:text-slate-400">
        <Sun className="h-3.5 w-3.5" />
      </span>
      <span className="absolute right-1 flex items-center text-slate-500 dark:text-slate-400">
        <Moon className="h-3.5 w-3.5" />
      </span>
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition-transform duration-200 ease-in-out ${
          isDarkMode
            ? 'translate-x-7 bg-slate-800 text-slate-100'
            : 'translate-x-0 bg-white text-amber-500'
        }`}
      >
        {isDarkMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
};

export default ThemeSlider;
