import { useTheme } from '../contexts/ThemeContext.jsx';
import { Moon, Sun } from 'lucide-react';

const ThemeSlider = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="relative inline-block w-12 h-6">
      <div 
        className="absolute inset-0 bg-gray-200 dark:bg-gray-800 rounded-full transition-colors"
        onClick={toggleTheme}
      >
        <div 
          className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full transition-transform duration-200 ease-in-out transform ${
            isDarkMode ? 'translate-x-6 bg-primary-600' : 'bg-white'
          }`} 
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-yellow-400" />
          ) : (
            <Moon className="w-4 h-4 text-gray-600" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeSlider;
