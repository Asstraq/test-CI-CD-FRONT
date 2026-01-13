'use client';

import { UserSessionProvider } from '@/lib/auth/userSession';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import type { ReactNode } from 'react';

const theme = createTheme();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: 'css', prepend: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <UserSessionProvider>{children}</UserSessionProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
