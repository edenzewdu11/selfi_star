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
    document.body.style.background = 'linear-gradient(160deg, #060D1F 0%, #0A1628 60%, #0D1E3A 100%)';
    document.body.style.color = '#FFFFFF';
  }, []);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const DARK = {
    pri: "#00D4E0",
    priD: "#0891B2",
    priL: "rgba(0,212,224,0.15)",
    sec: "#FFD700",
    secM: "#F5A623",
    secL: "rgba(255,215,0,0.15)",
    gold: "#FFD700",
    goldD: "#F5A623",
    grn: "#00E5A0",
    red: "#FF4B6E",
    purple: "#A855F7",
    txt: "#FFFFFF",
    sub: "#7ABFCC",
    bg: "#060D1F",
    cardBg: "rgba(10,22,40,0.85)",
    border: "rgba(0,212,224,0.2)",
    dark: "#020810",
    inputBg: "rgba(0,20,50,0.6)",
    navBg: "rgba(6,13,31,0.95)",
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
