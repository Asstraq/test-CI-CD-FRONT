'use client';

import { UserSessionProvider, useUserSession } from '@/lib/auth/userSession';
import { FavoritesProvider } from '@/lib/context/FavoritesContext';
import { CssBaseline } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

const DEFAULT_ACCENT = '#f97316';

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return '249, 115, 22';
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `${red}, ${green}, ${blue}`;
}

function AppThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useUserSession();

  const accent = user?.user.displayColor?.trim() || DEFAULT_ACCENT;
  const mode = user?.user.theme === 'DARK' ? 'dark' : 'light';

  const theme = useMemo(() => {
    const accentRgb = hexToRgb(accent);
    const background =
      mode === 'dark'
        ? `radial-gradient(1200px 600px at 20% -10%, rgba(${accentRgb}, 0.22) 0%, transparent 58%), radial-gradient(900px 500px at 120% 0%, rgba(148, 163, 184, 0.18) 0%, transparent 52%), #0f172a`
        : `radial-gradient(1200px 600px at 20% -10%, rgba(${accentRgb}, 0.18) 0%, transparent 58%), radial-gradient(900px 500px at 120% 0%, rgba(148, 163, 184, 0.16) 0%, transparent 52%), #f8fafc`;

    return createTheme({
      palette: {
        mode,
        primary: {
          main: accent,
        },
        background: {
          default: mode === 'dark' ? '#0f172a' : '#f8fafc',
          paper: mode === 'dark' ? '#111827' : '#ffffff',
        },
      },
      shape: {
        borderRadius: 14,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 600,
            },
          },
        },
        MuiCssBaseline: {
          styleOverrides: {
            ':root': {
              '--app-accent': accent,
              '--app-background': background,
              '--app-foreground': mode === 'dark' ? '#f8fafc' : '#111827',
            },
            body: {
              color: 'var(--app-foreground)',
              background: 'var(--app-background)',
              transition:
                'background 180ms ease, color 180ms ease, border-color 180ms ease',
            },
          },
        },
      },
    });
  }, [accent, mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: 'css', prepend: true }}>
      <UserSessionProvider>
        <AppThemeProvider>
          <FavoritesProvider>{children}</FavoritesProvider>
        </AppThemeProvider>
      </UserSessionProvider>
    </AppRouterCacheProvider>
  );
}
