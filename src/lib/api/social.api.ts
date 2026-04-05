import { api } from '@/lib/api/http';
import { buildPublicUserIdentity } from '@/lib/user/buildPublicUser';

type UnknownRecord = Record<string, unknown>;

export type SocialProfile = {
  id: string;
  email: string;
  name: string;
  handle: string;
  avatarUrl: string;
};

export type SocialFollowRequest = {
  id: string;
  status: string;
  createdAt: string;
  requester?: SocialProfile | null;
  target?: SocialProfile | null;
};

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' ? (value as UnknownRecord) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeUser(entry: unknown): SocialProfile | null {
  const item = asRecord(entry);
  if (!item) return null;

  return buildPublicUserIdentity(item);
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

function normalizeFollowRequest(entry: unknown): SocialFollowRequest | null {
  const item = asRecord(entry);
  if (!item) return null;

  const requester = normalizeUser(item.requester);
  const target = normalizeUser(item.target);
  const id = item.id;

  if (
    !(
      (typeof id === 'number' && Number.isFinite(id)) ||
      (typeof id === 'string' && id.trim())
    )
  ) {
    return null;
  }

  return {
    id: String(id),
    status:
      typeof item.status === 'string' && item.status.trim()
        ? item.status.trim()
        : 'PENDING',
    createdAt:
      typeof item.createdAt === 'string' && item.createdAt.trim()
        ? item.createdAt
        : new Date().toISOString(),
    requester,
    target,
  };
}

function normalizeFollowRequestsResponse(
  response: unknown,
): SocialFollowRequest[] {
  const root = asRecord(response);
  const items = Array.isArray(response)
    ? response
    : asArray(root?.requests).length > 0
      ? asArray(root?.requests)
      : asArray(root?.items).length > 0
        ? asArray(root?.items)
        : asArray(root?.data);

  return items
    .map(normalizeFollowRequest)
    .filter((request): request is SocialFollowRequest => Boolean(request?.id));
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

export async function getIncomingFollowRequests(): Promise<
  SocialFollowRequest[]
> {
  const response = await api<unknown>('/social/requests/incoming');
  return normalizeFollowRequestsResponse(response);
}

export function acceptFollowRequest(userId: string) {
  return api<{ accepted?: boolean }>(`/social/requests/${userId}/accept`, {
    method: 'POST',
  });
}

export function rejectFollowRequest(userId: string) {
  return api<{ rejected?: boolean }>(`/social/requests/${userId}/reject`, {
    method: 'POST',
  });
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
