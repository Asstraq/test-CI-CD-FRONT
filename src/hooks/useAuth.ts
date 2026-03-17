'use client';

import * as Auth from '@/lib/api/auth.api';
import { clearToken, getToken, setToken } from '@/lib/auth/token';
import { useUserSession } from '@/lib/auth/userSession';
import type { User } from '@/type/user';
import { useState } from 'react';

export function useAuth() {
  const { user, setUser, clearUser } = useUserSession();
  const [authLoading, setAuthLoading] = useState(false);

  function applySession(response: Awaited<ReturnType<typeof Auth.login>>) {
    setToken(response.token);
    setUser({ user: response.user });
    return response.user;
  }

  async function signIn(email: string, password: string): Promise<User> {
    setAuthLoading(true);
    try {
      const response = await Auth.login(email, password);
      return applySession(response);
    } finally {
      setAuthLoading(false);
    }
  }

  async function signUp(
    email: string,
    password: string,
    name?: string,
  ): Promise<User> {
    setAuthLoading(true);
    try {
      const response = await Auth.register(email, password, name);
      return applySession(response);
    } finally {
      setAuthLoading(false);
    }
  }

  async function signOut() {
    setAuthLoading(true);
    try {
      if (getToken()) {
        await Auth.logout();
      }
    } catch {
    } finally {
      clearToken();
      clearUser();
      setAuthLoading(false);
    }
  }

  return { user, signIn, signUp, signOut, authLoading };
}
