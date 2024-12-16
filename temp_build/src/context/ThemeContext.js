import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const themes = {
  light: {
    dark: false,
    background: '#FFFFFF',
    text: '#000000',
    cardBackground: '#F5F5F5',
    textSecondary: '#666666',
    primary: '#2196F3',
    border: '#E0E0E0',
    surface: '#FFFFFF',
    noteBackground: 'rgba(255, 255, 255, 0.9)',
  },
  dark: {
    dark: true,
    background: '#121212',
    text: '#FFFFFF',
    cardBackground: '#1E1E1E',
    textSecondary: '#FFFFFF',
    primary: '#FFFFFF',
    border: '#333333',
    surface: '#1E1E1E',
    noteBackground: 'rgba(30, 30, 30, 0.9)',
  },
};

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState(systemColorScheme === 'dark' ? themes.dark : themes.light);
  const [isSystemTheme, setIsSystemTheme] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    if (isSystemTheme) {
      setTheme(systemColorScheme === 'dark' ? themes.dark : themes.light);
    }
  }, [systemColorScheme, isSystemTheme]);

  const loadThemePreference = async () => {
    try {
      const [savedTheme, savedIsSystem] = await Promise.all([
        AsyncStorage.getItem('theme'),
        AsyncStorage.getItem('isSystemTheme')
      ]);
      
      if (savedIsSystem !== null) {
        setIsSystemTheme(savedIsSystem === 'true');
      }
      
      if (!isSystemTheme && savedTheme !== null) {
        setTheme(savedTheme === 'dark' ? themes.dark : themes.light);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = theme.dark ? themes.light : themes.dark;
      setTheme(newTheme);
      setIsSystemTheme(false);
      await Promise.all([
        AsyncStorage.setItem('theme', newTheme.dark ? 'dark' : 'light'),
        AsyncStorage.setItem('isSystemTheme', 'false')
      ]);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const useSystemTheme = async () => {
    try {
      setIsSystemTheme(true);
      setTheme(systemColorScheme === 'dark' ? themes.dark : themes.light);
      await Promise.all([
        AsyncStorage.removeItem('theme'),
        AsyncStorage.setItem('isSystemTheme', 'true')
      ]);
    } catch (error) {
      console.error('Error saving system theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      useSystemTheme, 
      isSystemTheme 
    }}>
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
