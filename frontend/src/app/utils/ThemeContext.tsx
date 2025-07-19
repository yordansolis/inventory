"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'feminine' | 'original';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('feminine');

  useEffect(() => {
    // Recuperar el tema guardado en localStorage al cargar
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && (savedTheme === 'feminine' || savedTheme === 'original')) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'feminine' ? 'original' : 'feminine';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
} 