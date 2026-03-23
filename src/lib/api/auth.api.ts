import { api } from '@/lib/api/http';
import { ResponseAPIUser, UpdateProfilePayload, User } from '@/type/user';

export function login(email: string, password: string) {
  return api<ResponseAPIUser>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export function register(email: string, password: string, nom?: string) {
  return api<ResponseAPIUser>('/auth/register', {
    method: 'POST',
    body: { email, password, nom },
    auth: false,
  });
}

export function logout() {
  return api<{ ok: true }>('/auth/logout', { method: 'POST' });
}

export function me() {
  return api<{ user: User } | User>('/auth/me');
}

export function updateProfile(payload: UpdateProfilePayload) {
  return api<{ user: User } | User>('/auth/profile', {
    method: 'PATCH',
    body: payload,
  });
}
