// src/themes/ThemeProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Theme, ThemeName } from './base/types';
import { defaultTheme } from './base/default';
import { corporateBlueTheme } from './corporate/blue';
import { titaCorporateTheme } from './corporate/tita';

interface ThemeContextType {
  currentTheme: Theme;
  themeName: ThemeName;
  setTheme: (themeName: ThemeName) => void;
  availableThemes: ThemeName[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes: Record<ThemeName, Theme> = {
  'default': defaultTheme,
  'tita-corporate': titaCorporateTheme,
  'corporate-blue': corporateBlueTheme,
  'corporate-green': defaultTheme, // Placeholder
  'corporate-red': defaultTheme, // Placeholder
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
}

export function ThemeProvider({ children, defaultTheme: initialTheme = 'tita-corporate' }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(initialTheme);

  // Cargar tema desde localStorage al inicio
  useEffect(() => {
    const savedTheme = localStorage.getItem('inventory-theme') as ThemeName;
    if (savedTheme && themes[savedTheme]) {
      setThemeName(savedTheme);
    }
  }, []);

  // Aplicar tema al documento
  useEffect(() => {
    const theme = themes[themeName];
    const root = document.documentElement;
    
    // Aplicar variables CSS para cada color
    Object.entries(theme.colors).forEach(([colorName, colorShades]) => {
      Object.entries(colorShades).forEach(([shade, value]) => {
        root.style.setProperty(`--color-${colorName}-${shade}`, value as string);
      });
    });

    // Aplicar otras variables del tema
    root.style.setProperty('--font-heading', theme.fonts.heading);
    root.style.setProperty('--font-body', theme.fonts.body);
    
    Object.entries(theme.borderRadius).forEach(([size, value]) => {
      root.style.setProperty(`--radius-${size}`, value);
    });
    
    Object.entries(theme.shadows).forEach(([size, value]) => {
      root.style.setProperty(`--shadow-${size}`, value);
    });
    
    // Guardar en localStorage
    localStorage.setItem('inventory-theme', themeName);
  }, [themeName]);

  const setTheme = (newThemeName: ThemeName) => {
    if (themes[newThemeName]) {
      setThemeName(newThemeName);
    }
  };

  const value: ThemeContextType = {
    currentTheme: themes[themeName],
    themeName,
    setTheme,
    availableThemes: Object.keys(themes) as ThemeName[],
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}