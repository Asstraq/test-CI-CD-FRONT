import { api } from '@/lib/api/http';

type UnknownRecord = Record<string, unknown>;

export type SocialProfile = {
  id: string;
  email: string;
  name: string;
  handle: string;
  avatarUrl: string;
};

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' ? (value as UnknownRecord) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

function readId(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return undefined;
}

function normalizeUser(entry: unknown): SocialProfile | null {
  const item = asRecord(entry);
  if (!item) return null;

  const name =
    readString(item.name, item.nom, item.prenom, item.username, item.email) ??
    'Utilisateur';
  const handleBase =
    readString(item.handle, item.username, item.slug, item.name, item.nom) ??
    name;

  return {
    id: readId(item.id, item.userId, item.email) ?? '',
    email: readString(item.email) ?? '',
    name,
    handle: handleBase.startsWith('@')
      ? handleBase
      : `@${handleBase.replace(/\s+/g, '').toLowerCase()}`,
    avatarUrl:
      readString(item.avatarUrl, item.avatar, item.imageUrl, item.photoUrl) ??
      '',
  };
}

function normalizeUsersResponse(response: unknown): SocialProfile[] {
  const root = asRecord(response);
  const items = Array.isArray(response)
    ? response
    : asArray(root?.users).length > 0
      ? asArray(root?.users)
      : asArray(root?.followers).length > 0
        ? asArray(root?.followers)
        : asArray(root?.following).length > 0
          ? asArray(root?.following)
          : asArray(root?.items).length > 0
            ? asArray(root?.items)
            : asArray(root?.data);

  return items
    .map(normalizeUser)
    .filter((user): user is SocialProfile => Boolean(user?.id));
}

export async function searchUsers(query: string): Promise<SocialProfile[]> {
  const attempts = [
    `/search/users?q=${encodeURIComponent(query)}`,
    `/search/users?query=${encodeURIComponent(query)}`,
  ];

  let lastError: unknown;

  for (const path of attempts) {
    try {
      const response = await api<unknown>(path, { auth: false });
      return normalizeUsersResponse(response);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Recherche impossible.');
}

export async function getMyFollowing(): Promise<SocialProfile[]> {
  const response = await api<unknown>('/social/me/following');
  return normalizeUsersResponse(response);
}

export async function getMyFollowers(): Promise<SocialProfile[]> {
  const response = await api<unknown>('/social/me/followers');
  return normalizeUsersResponse(response);
}

export async function getUserFollowing(
  userId: string,
): Promise<SocialProfile[]> {
  const response = await api<unknown>(`/social/following/${userId}`, {
    auth: false,
  });
  return normalizeUsersResponse(response);
}

export async function getUserFollowers(
  userId: string,
): Promise<SocialProfile[]> {
  const response = await api<unknown>(`/social/followers/${userId}`, {
    auth: false,
  });
  return normalizeUsersResponse(response);
}

export function followUser(userId: string) {
  return api<{ ok?: boolean }>(`/social/follow/${userId}`, { method: 'POST' });
}

export function unfollowUser(userId: string) {
  return api<{ ok?: boolean }>(`/social/follow/${userId}`, {
    method: 'DELETE',
  });
}
