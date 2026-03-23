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

export async function uploadProfileAvatar(file: File) {
  const formData = new FormData();
  formData.set('file', file);

  const response = await fetch('/api/upload/profile-avatar', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };
      message = data.message || data.error || message;
    } catch {}
    throw new Error(message);
  }

  return (await response.json()) as { url: string };
}
