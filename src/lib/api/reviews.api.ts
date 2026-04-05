import { api } from '@/lib/api/http';
import { buildReview } from '@/lib/review/buildPublicReview';
import type { FeedMediaKind } from '@/type/feed';

type UpsertReviewPayload = {
  content: string;
  rating?: number | null;
  containsSpoilers?: boolean;
};

type UnknownRecord = Record<string, unknown>;

type UpsertReviewResult = {
  reviewId?: number;
};

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' ? (value as UnknownRecord) : null;
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

function normalizeUpsertReviewResponse(response: unknown): UpsertReviewResult {
  const root = asRecord(response);
  const review =
    asRecord(root?.review) ?? asRecord(root?.data) ?? asRecord(root?.item);
  const normalizedReview = buildReview(review);

  return {
    reviewId: readNumber(
      root?.reviewId,
      root?.id,
      review?.reviewId,
      normalizedReview.id > 0 ? normalizedReview.id : undefined,
    ),
  };
}

function buildBodies(payload: UpsertReviewPayload) {
  const baseBody: Record<string, unknown> = {
    content: payload.content,
  };

  if (payload.rating === null) {
    baseBody.rating = null;
  } else if (typeof payload.rating === 'number') {
    baseBody.rating = payload.rating;
  }

  const spoilerValue = payload.containsSpoilers ?? false;

  return [
    { ...baseBody, contains_spoilers: spoilerValue },
    { ...baseBody, containsSpoilers: spoilerValue },
    {
      ...baseBody,
      contains_spoilers: spoilerValue,
      containsSpoilers: spoilerValue,
    },
  ];
}

export function upsertReview(
  kind: FeedMediaKind,
  spotifyId: string,
  payload: UpsertReviewPayload,
): Promise<UpsertReviewResult> {
  const path = `/reviews/media/${kind}/${spotifyId}/review`;
  const bodyVariants = buildBodies(payload);

  let lastError: unknown;

  async function tryRequest(path: string, body: Record<string, unknown>) {
    const response = await api<unknown>(path, {
      method: 'PUT',
      body,
    });

    return normalizeUpsertReviewResponse(response);
  }

  return (async () => {
    for (const body of bodyVariants) {
      try {
        return await tryRequest(path, body);
      } catch (error) {
        lastError = error;
        if (!(error instanceof Error) || !/400/.test(error.message)) {
          throw error;
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Publication impossible.');
  })();
}
