import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import storage from '../utils/storage';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const [stadium, setStadium] = useState({ id: '1', name: 'MetLife Stadium', city: 'East Rutherford', capacity: 82500 });
  const [toast, setToast] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadPreferences();
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Optionally sync with system theme
    });
    return () => subscription.remove();
  }, []);

  const loadPreferences = async () => {
    const savedTheme = await storage.getItem('theme');
    const savedLang = await storage.getItem('language');
    const savedStadium = await storage.getItem('selectedStadium');
    if (savedTheme) setTheme(savedTheme);
    if (savedLang) setLanguage(savedLang);
    if (savedStadium) setStadium(savedStadium);
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    await storage.setItem('theme', newTheme);
  };

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    await storage.setItem('language', lang);
  };

  const selectStadium = async (stad) => {
    setStadium(stad);
    await storage.setItem('selectedStadium', stad);
  };

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  };

  return (
    <AppContext.Provider value={{
      theme, setTheme, toggleTheme,
      language, setLanguage: changeLanguage,
      stadium, setStadium: selectStadium,
      toast, showToast,
      isOnline, setIsOnline,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
