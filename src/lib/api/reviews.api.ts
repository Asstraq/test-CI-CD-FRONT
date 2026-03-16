import { api } from '@/lib/api/http';
import type { FeedMediaKind } from '@/type/feed';

type UpsertReviewPayload = {
  content: string;
  rating?: number;
  containsSpoilers?: boolean;
};

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
) {
  const pathVariants = [
    `/reviews/media/${toApiKind(kind)}/${spotifyId}/review`,
    `/reviews/media/${kind}/${spotifyId}/review`,
  ];
  const bodyVariants = buildBodies(payload);

  let lastError: unknown;

  async function tryRequest(path: string, body: Record<string, unknown>) {
    return api<unknown>(path, {
      method: 'PUT',
      body,
    });
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
