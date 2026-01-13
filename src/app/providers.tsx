'use client';

import { UserSessionProvider } from '@/lib/auth/userSession';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <UserSessionProvider>{children}</UserSessionProvider>;
}
