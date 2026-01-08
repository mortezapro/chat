import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';

const ThemeContext = createContext();

export const useThemeSettings = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeSettings must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { user } = useAuthStore();
  const [themeMode, setThemeMode] = useState(() => {
    const stored = localStorage.getItem('ui-storage');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.theme) {
          return parsed.state.theme;
        }
      } catch {}
    }
    return 'light';
  });
  const [primaryColor, setPrimaryColor] = useState('#1976d2');
  const [chatBackground, setChatBackground] = useState(null);

  useEffect(() => {
    if (user?.preferences) {
      setThemeMode(user.preferences.theme || 'light');
      setPrimaryColor(user.preferences.primaryColor || '#1976d2');
      setChatBackground(user.preferences.chatBackground || null);
    }
  }, [user]);

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('ui-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.state?.theme && parsed.state.theme !== themeMode) {
            setThemeMode(parsed.state.theme);
          }
        } catch {}
      }
    };

    const interval = setInterval(handleStorageChange, 500);
    return () => clearInterval(interval);
  }, [themeMode]);

  const theme = useMemo(() => {
    const isDark = themeMode === 'dark' || (themeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    return createTheme({
      direction: 'rtl',
      palette: {
        mode: isDark ? 'dark' : 'light',
        primary: {
          main: primaryColor,
          light: primaryColor,
          dark: primaryColor
        },
        background: {
          default: isDark ? '#121212' : '#f5f5f5',
          paper: isDark ? '#1e1e1e' : '#ffffff'
        }
      },
      typography: {
        fontFamily: user?.preferences?.fontFamily === 'default' 
          ? 'Bon, Vazir, Arial, sans-serif'
          : user?.preferences?.fontFamily || 'Bon, Vazir, Arial, sans-serif',
        fontSize: user?.preferences?.fontSize || 14
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              fontSize: user?.preferences?.fontSize || 14
            }
          }
        }
      }
    });
  }, [themeMode, primaryColor, user]);

  const updateTheme = async (updates) => {
    try {
      await api.put('/users/preferences', updates);
      if (updates.theme !== undefined) {
        setThemeMode(updates.theme);
        const stored = localStorage.getItem('ui-storage');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.state.theme = updates.theme;
            localStorage.setItem('ui-storage', JSON.stringify(parsed));
          } catch {}
        }
      }
      if (updates.primaryColor !== undefined) setPrimaryColor(updates.primaryColor);
      if (updates.chatBackground !== undefined) setChatBackground(updates.chatBackground);
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  const value = {
    themeMode,
    primaryColor,
    chatBackground,
    updateTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

