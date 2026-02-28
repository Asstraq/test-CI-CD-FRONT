'use client';

import * as Auth from '@/lib/api/auth.api';
import { clearToken, setToken } from '@/lib/auth/token';
import { useUserSession } from '@/lib/auth/userSession';
import type { User } from '@/type/user';

export function useAuth() {
  const { user, setUser, clearUser } = useUserSession();

  async function signIn(email: string, password: string): Promise<User> {
    const response = await Auth.login(email, password);
    setToken(response.token);
    setUser({ user: response.user });
    return response.user;
  }

  async function signUp(
    email: string,
    password: string,
    name?: string,
  ): Promise<User> {
    const response = await Auth.register(email, password, name);
    setToken(response.token);
    setUser({ user: response.user });
    return response.user;
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
