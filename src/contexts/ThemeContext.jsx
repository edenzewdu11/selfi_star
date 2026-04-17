import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    document.body.style.background = '#EEF2F8';
    document.body.style.color = '#111827';
  }, []);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const DARK = {
    pri: "#7C3AED",
    priD: "#6D28D9",
    priL: "rgba(124,58,237,0.1)",
    sec: "#F59E0B",
    secM: "#D97706",
    secL: "rgba(245,158,11,0.1)",
    gold: "#F59E0B",
    goldD: "#D97706",
    grn: "#10B981",
    red: "#EF4444",
    purple: "#7C3AED",
    txt: "#111827",
    sub: "#6B7280",
    bg: "#EEF2F8",
    cardBg: "#FFFFFF",
    border: "rgba(0,0,0,0.08)",
    dark: "#1F2937",
    inputBg: "#F9FAFB",
    navBg: "rgba(255,255,255,0.95)",
  };

  const theme = {
    darkMode: true,
    toggleDarkMode,
    colors: DARK,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
