import { api } from '@/lib/api/http';
import type { FeedMediaKind } from '@/type/feed';

type UpsertReviewPayload = {
  content: string;
  rating?: number;
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

  return {
    reviewId: readNumber(
      root?.reviewId,
      root?.id,
      review?.reviewId,
      review?.id,
    ),
  };
}

function toApiKind(kind: FeedMediaKind): string {
  return kind.toLowerCase();
}

function buildBodies(payload: UpsertReviewPayload) {
  const baseBody: Record<string, unknown> = {
    content: payload.content,
  };

  if (typeof payload.rating === 'number') {
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
  const pathVariants = [
    `/reviews/media/${toApiKind(kind)}/${spotifyId}/review`,
    `/reviews/media/${kind}/${spotifyId}/review`,
  ];
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
    for (const path of pathVariants) {
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
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Publication impossible.');
  })();
}
