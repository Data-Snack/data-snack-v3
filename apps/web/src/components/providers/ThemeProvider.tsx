'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  systemTheme: 'dark' | 'light' | undefined;
  resolvedTheme: 'dark' | 'light' | undefined;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  systemTheme: undefined,
  resolvedTheme: undefined,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'data-snack-theme',
  attribute = 'class',
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    }
    return defaultTheme;
  });
  
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light' | undefined>();
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light' | undefined>();

  useEffect(() => {
    const root = window.document.documentElement;

    if (disableTransitionOnChange) {
      const css = document.createElement('style');
      css.appendChild(
        document.createTextNode(
          '*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}'
        )
      );
      document.head.appendChild(css);

      return () => {
        (() => window.getComputedStyle(document.body))();
        setTimeout(() => {
          document.head.removeChild(css);
        }, 1);
      };
    }
  }, [disableTransitionOnChange]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateSystemTheme = () => {
      const isDark = mediaQuery.matches;
      setSystemTheme(isDark ? 'dark' : 'light');
    };
    
    updateSystemTheme();
    mediaQuery.addEventListener('change', updateSystemTheme);
    
    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Calculate resolved theme
    let resolved: 'dark' | 'light';
    if (theme === 'system') {
      resolved = systemTheme || 'dark';
    } else {
      resolved = theme;
    }
    
    setResolvedTheme(resolved);
    
    // Apply theme to DOM
    root.classList.remove('light', 'dark');
    
    if (attribute === 'class') {
      root.classList.add(resolved);
    } else {
      root.setAttribute(attribute, resolved);
    }
    
    // Adaptive color scheme based on time
    const hour = new Date().getHours();
    root.classList.remove('adaptive-warm', 'adaptive-cool', 'adaptive-night');
    
    if (hour >= 6 && hour < 12) {
      root.classList.add('adaptive-warm'); // Morning - warm colors
    } else if (hour >= 12 && hour < 18) {
      root.classList.add('adaptive-cool'); // Afternoon - cool colors  
    } else {
      root.classList.add('adaptive-night'); // Evening/Night - deep colors
    }
  }, [theme, systemTheme, attribute]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    systemTheme,
    resolvedTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
