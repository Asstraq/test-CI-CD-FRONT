'use client';

import * as Auth from '@/lib/api/auth.api';
import { clearToken, setToken } from '@/lib/auth/token';
import { useUserSession } from '@/lib/auth/userSession';

export function useAuth() {
  const { user, setUser, clearUser } = useUserSession();

  async function signIn(email: string, password: string) {
    const user = await Auth.login(email, password);
    setToken(user.token);
    setUser({ user: user.user });
  }

  async function signUp(email: string, password: string, name?: string) {
    const user = await Auth.register(email, password, name);
    if (user) {
      setUser({ user: user.user });
    }
  }

  async function signOut() {
    try {
      await Auth.logout();
    } catch {}
    clearToken();
    clearUser();
  }

  return { user, signIn, signUp, signOut };
}
