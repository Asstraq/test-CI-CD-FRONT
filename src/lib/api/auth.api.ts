import { api } from '@/lib/api/http';
import { ResponseAPIUser } from '@/type/user';

export type LoginResponse = { accessToken: string };
export type MeResponse = { id: string; email: string; name?: string };

export function login(email: string, password: string) {
  return api<ResponseAPIUser>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export function register(email: string, password: string, name?: string) {
  return api<ResponseAPIUser>('/auth/register', {
    method: 'POST',
    body: { email, password, name },
    auth: false,
  });
}

export function logout() {
  // si backend a un endpoint logout
  return api<{ ok: true }>('/auth/logout', { method: 'POST' });
}
