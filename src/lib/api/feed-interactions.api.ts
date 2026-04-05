import { api } from '@/lib/api/http';
import { buildPublicUserIdentity } from '@/lib/user/buildPublicUser';
import type { FeedComment, FeedLike } from '@/type/feed';

type ApiFeedUser = {
  id: number | string;
  nom?: string | null;
  prenom?: string | null;
  pseudo?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

type ReviewLikeDto = {
  createdAt: string;
  user: ApiFeedUser;
};

type ReviewLikesResponse = {
  count: number;
  likes: ReviewLikeDto[];
};

type ReviewCommentDto = {
  id: number | string;
  content: string;
  createdAt: string;
  user?: ApiFeedUser | null;
};

type CreateReviewCommentResponse = {
  comment?: ReviewCommentDto | null;
};

type ReviewCommentsResponse = {
  comments: ReviewCommentDto[];
};

function buildFeedComment(comment: ReviewCommentDto): FeedComment {
  return {
    id: String(comment.id),
    content: comment.content,
    createdAt: comment.createdAt,
    author: buildPublicUserIdentity(comment.user),
  };
}

function buildFeedLike(like: ReviewLikeDto): FeedLike {
  return {
    createdAt: like.createdAt,
    user: buildPublicUserIdentity(like.user),
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

export async function getReviewLikes(reviewId: string): Promise<{
  count: number;
  likes: FeedLike[];
}> {
  const response = await api<ReviewLikesResponse>(
    `/reviews/${reviewId}/likes`,
    {
      auth: false,
    },
  );

  const likes = response.likes
    .map(buildFeedLike)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return {
    count: Math.max(response.count, likes.length),
    likes,
  };
}

export async function getReviewComments(
  reviewId: string,
): Promise<FeedComment[]> {
  const response = await api<ReviewCommentsResponse>(
    `/reviews/${reviewId}/comments`,
    {
      auth: false,
    },
  );

  return response.comments
    .map(buildFeedComment)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

export async function createReviewComment(reviewId: string, content: string) {
  const response = await api<CreateReviewCommentResponse | ReviewCommentDto>(
    `/reviews/${reviewId}/comments`,
    {
      method: 'POST',
      body: { content },
    },
  );

  const comment = 'comment' in response ? response.comment : response;

  return comment ? buildFeedComment(comment) : null;
}
