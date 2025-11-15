import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, getUserProfile } from '../firebase';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const profile = await getUserProfile(user.uid);
        if (profile?.preferences?.darkMode) {
          setIsDarkMode(profile.preferences.darkMode);
        }
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const theme = {
    isDarkMode,
    setIsDarkMode,
    colors: isDarkMode ? darkColors : lightColors,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

const lightColors = {
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  primary: '#3fa58e',
  border: '#e0e0e0',
};

const darkColors = {
  background: '#1a1a1a',
  surface: '#2d2d2d',
  text: '#ffffff',
  textSecondary: '#b3b3b3',
  textTertiary: '#808080',
  primary: '#4db6ac',
  border: '#404040',
};