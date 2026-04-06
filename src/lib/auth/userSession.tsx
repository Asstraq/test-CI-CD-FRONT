'use client';

import type { User } from '@/type/user';
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'user';

export type SessionUser = {
  user: User;
};

type UserSessionContextValue = {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  clearUser: () => void;
};

const UserSessionContext = createContext<UserSessionContextValue | undefined>(
  undefined,
);

function readStoredUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function UserSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<SessionUser | null>(() =>
    readStoredUser(),
  );

  const setUser = useCallback((nextUser: SessionUser | null) => {
    setUserState(nextUser);
    if (typeof window === 'undefined') return;
    if (nextUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearUser = useCallback(() => setUser(null), [setUser]);
  const value = useMemo(
    () => ({ user, setUser, clearUser }),
    [clearUser, setUser, user],
  );

  return (
    <UserSessionContext.Provider value={value}>
      {children}
    </UserSessionContext.Provider>
  );
}

export function useUserSession() {
  const context = useContext(UserSessionContext);
  if (!context) {
    throw new Error('useUserSession must be used within UserSessionProvider');
  }
  return context;
}
