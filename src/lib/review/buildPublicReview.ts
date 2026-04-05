import { buildPublicUser, type PublicUser } from '@/lib/user/buildPublicUser';

export type ReviewSource = {
  id?: unknown;
  reviewId?: unknown;
  mediaId?: unknown;
  rating?: unknown;
  content?: unknown;
  containsSpoilers?: unknown;
  likedByMe?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  counts?: {
    likes?: unknown;
    comments?: unknown;
  } | null;
  user?: unknown;
};

export type ReviewCommentSource = {
  id?: unknown;
  content?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  user?: unknown;
};

export type ReviewLikeSource = {
  createdAt?: unknown;
  user?: unknown;
};

export type PublicReview = {
  id: number;
  mediaId: number | null;
  rating: number | null;
  content: string | null;
  containsSpoilers: boolean;
  likedByMe: boolean | null;
  likesCount: number | null;
  commentsCount: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  user: PublicUser | null;
};

export type PublicReviewComment = {
  id: number;
  content: string;
  createdAt: string | null;
  updatedAt: string | null;
  user: PublicUser | null;
};

export type PublicReviewLike = {
  createdAt: string | null;
  user: PublicUser | null;
};

function readString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

function readId(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function readNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function readBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
  }
  return undefined;
}

function readDateString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

export function buildReview(input?: ReviewSource | null): PublicReview {
  return {
    id: readId(input?.id, input?.reviewId) ?? 0,
    mediaId: readId(input?.mediaId) ?? null,
    rating: readNumber(input?.rating) ?? null,
    content: readString(input?.content) ?? null,
    containsSpoilers: readBoolean(input?.containsSpoilers) ?? false,
    likedByMe: readBoolean(input?.likedByMe) ?? null,
    likesCount: readNumber(input?.counts?.likes) ?? null,
    commentsCount: readNumber(input?.counts?.comments) ?? null,
    createdAt: readDateString(input?.createdAt) ?? null,
    updatedAt: readDateString(input?.updatedAt) ?? null,
    user: input?.user
      ? buildPublicUser(input.user as Record<string, unknown>)
      : null,
  };
}

export function buildReviewComment(
  input?: ReviewCommentSource | null,
): PublicReviewComment {
  return {
    id: readId(input?.id) ?? 0,
    content: readString(input?.content) ?? '',
    createdAt: readDateString(input?.createdAt) ?? null,
    updatedAt: readDateString(input?.updatedAt) ?? null,
    user: input?.user
      ? buildPublicUser(input.user as Record<string, unknown>)
      : null,
  };
}

export function buildReviewLike(
  input?: ReviewLikeSource | null,
): PublicReviewLike {
  return {
    createdAt: readDateString(input?.createdAt) ?? null,
    user: input?.user
      ? buildPublicUser(input.user as Record<string, unknown>)
      : null,
  };
}
