'use client';

import * as Auth from '@/lib/api/auth.api';
import { clearToken, setToken } from '@/lib/auth/token';
import { useUserSession } from '@/lib/auth/userSession';
import { useState } from 'react';

export function useAuth() {
  const { user, setUser, clearUser } = useUserSession();
  const [loading, setLoading] = useState(true);

  // async function refresh() {
  //   setLoading(true);
  //   try {
  //     setUser(u);
  //   } catch {
  //     setUser(null);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  async function signIn(email: string, password: string) {
    const user = await Auth.login(email, password);
    setToken(user.token);
    setUser(user);
  }

  async function signUp(email: string, password: string, name?: string) {
    const user = await Auth.register(email, password, name);
    if (user) {
      setUser(user);
    }
  }

  async function signOut() {
    try {
      await Auth.logout();
    } catch {}
    clearToken();
    clearUser();
  }

  // useEffect(() => {
  //   refresh();
  // }, []);

  return { user, loading, signIn, signUp, signOut };
}
