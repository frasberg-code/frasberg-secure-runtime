import React, { createContext, useContext, useState } from 'react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'dark',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div
        data-theme={theme}
        style={{
          minHeight: '100vh',
          background: theme === 'dark' ? '#111' : '#fff',
          color: theme === 'dark' ? '#eee' : '#111',
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);