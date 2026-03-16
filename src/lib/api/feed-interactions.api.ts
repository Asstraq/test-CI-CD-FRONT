import { api } from '@/lib/api/http';
import type { FeedComment, FeedUser } from '@/type/feed';

type UnknownRecord = Record<string, unknown>;

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

function normalizeAuthor(source: UnknownRecord | null): FeedUser {
  const name =
    readString(
      source?.name,
      source?.nom,
      source?.username,
      source?.handle,
      source?.email,
    ) ?? 'Utilisateur';
  const handleBase =
    readString(source?.handle, source?.username, source?.slug, source?.name) ??
    name;

  return {
    id: readString(source?.id, source?.userId, source?.email) ?? 'unknown-user',
    email: readString(source?.email) ?? '',
    name,
    handle: handleBase.startsWith('@')
      ? handleBase
      : `@${handleBase.replace(/\s+/g, '').toLowerCase()}`,
    avatarUrl:
      readString(
        source?.avatarUrl,
        source?.avatar,
        source?.imageUrl,
        source?.photoUrl,
      ) ?? '',
  };
}

function normalizeComment(entry: unknown): FeedComment | null {
  const wrapper = asRecord(entry);
  const item =
    asRecord(wrapper?.comment) ??
    asRecord(wrapper?.data) ??
    asRecord(wrapper?.item) ??
    wrapper;
  if (!item) return null;

  const author =
    asRecord(item.author) ??
    asRecord(item.actor) ??
    asRecord(item.user) ??
    asRecord(item.owner);

  return {
    id: readString(item.id, item.commentId) ?? `comment-${Date.now()}`,
    content: readString(item.content, item.text, item.body) ?? '',
    createdAt:
      readString(item.createdAt, item.created_at) ?? new Date().toISOString(),
    author: normalizeAuthor(author),
  };
}

export function likeReview(reviewId: string) {
  return api<{ ok?: boolean }>(`/reviews/${reviewId}/like`, {
    method: 'POST',
  });
}

export function unlikeReview(reviewId: string) {
  return api<{ ok?: boolean }>(`/reviews/${reviewId}/like`, {
    method: 'DELETE',
  });
}

export async function getReviewComments(
  reviewId: string,
): Promise<FeedComment[]> {
  const response = await api<unknown>(`/reviews/${reviewId}/comments`, {
    auth: false,
  });
  const root = asRecord(response);
  const items = Array.isArray(response)
    ? response
    : Array.isArray(root?.comments)
      ? root.comments
      : Array.isArray(asRecord(root?.data)?.comments)
        ? (asRecord(root?.data)?.comments as unknown[])
        : asArray(root?.items).length > 0
          ? asArray(root?.items)
          : asArray(root?.data).length > 0
            ? asArray(root?.data)
            : root?.comment
              ? [root.comment]
              : root?.comments && typeof root.comments === 'object'
                ? [root.comments]
                : [];

  return items
    .map(normalizeComment)
    .filter((comment): comment is FeedComment => Boolean(comment))
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

export async function createReviewComment(reviewId: string, content: string) {
  const response = await api<unknown>(`/reviews/${reviewId}/comments`, {
    method: 'POST',
    body: { content },
  });

  return normalizeComment(response);
}
