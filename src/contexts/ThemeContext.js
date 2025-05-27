import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
const ThemeContext = createContext(undefined);
export function ThemeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark';
    });
    useEffect(() => {
        // Save theme preference
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        // Update document class
        document.documentElement.classList.toggle('dark', isDarkMode);
    }, [isDarkMode]);
    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };
    return (_jsx(ThemeContext.Provider, { value: { isDarkMode, toggleTheme }, children: children }));
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
//# sourceMappingURL=ThemeContext.js.map