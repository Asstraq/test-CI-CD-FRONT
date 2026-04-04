'use client';

import {
  getReviewLikes,
  likeReview,
  unlikeReview,
} from '@/lib/api/feed-interactions.api';
import { getToken } from '@/lib/auth/token';
import { useUserSession } from '@/lib/auth/userSession';
import type { FeedLike, FeedUser } from '@/type/feed';
import { useCallback, useEffect, useState } from 'react';

type UseReviewLikesOptions = {
  reviewId?: number;
  initialLikes: number;
  initialLikedByMe?: boolean;
};

function isSameUser(
  profile: FeedUser,
  currentUserId: string | null,
  currentUserEmail: string | null,
) {
  if (currentUserId && String(profile.id) === currentUserId) return true;

  return Boolean(
    currentUserEmail && profile.email.trim().toLowerCase() === currentUserEmail,
  );
}

export function useReviewLikes({
  reviewId,
  initialLikes,
  initialLikedByMe,
}: UseReviewLikesOptions) {
  const { user: sessionUser } = useUserSession();
  const isAuthenticated = Boolean(getToken());
  const currentUserId = sessionUser?.user.id
    ? String(sessionUser.user.id)
    : null;
  const currentUserEmail = sessionUser?.user.email
    ? sessionUser.user.email.trim().toLowerCase()
    : null;
  const canInteract = isAuthenticated && typeof reviewId === 'number';

  const [likes, setLikes] = useState(initialLikes);
  const [likeEntries, setLikeEntries] = useState<FeedLike[]>([]);
  const [likesLoaded, setLikesLoaded] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);
  const [likesError, setLikesError] = useState('');
  const [likeLoading, setLikeLoading] = useState(false);

  const likedByMe = likesLoaded
    ? likeEntries.some((entry) =>
        isSameUser(entry.user, currentUserId, currentUserEmail),
      )
    : Boolean(initialLikedByMe);

  const refreshLikes = useCallback(async () => {
    if (likesLoading || typeof reviewId !== 'number') return;

    setLikesLoading(true);
    setLikesError('');

    try {
      const nextLikes = await getReviewLikes(String(reviewId));
      setLikes(nextLikes.count);
      setLikeEntries(nextLikes.likes);
      setLikesLoaded(true);
    } catch (error) {
      setLikesError(
        error instanceof Error
          ? error.message
          : 'Impossible de charger les likes.',
      );
    } finally {
      setLikesLoading(false);
    }
  }, [likesLoading, reviewId]);

  const toggleLike = useCallback(async () => {
    if (
      !canInteract ||
      likeLoading ||
      likesLoading ||
      !likesLoaded ||
      typeof reviewId !== 'number'
    ) {
      return;
    }

    setLikeLoading(true);
    setLikesError('');

    try {
      if (likedByMe) {
        await unlikeReview(String(reviewId));
      } else {
        await likeReview(String(reviewId));
      }

      const nextLikes = await getReviewLikes(String(reviewId));
      setLikes(nextLikes.count);
      setLikeEntries(nextLikes.likes);
      setLikesLoaded(true);
    } catch (error) {
      setLikesError(
        error instanceof Error ? error.message : 'Interaction impossible.',
      );
    } finally {
      setLikeLoading(false);
    }
  }, [
    canInteract,
    likeLoading,
    likedByMe,
    likesLoaded,
    likesLoading,
    reviewId,
  ]);

  useEffect(() => {
    setLikes(initialLikes);
    setLikeEntries([]);
    setLikesLoaded(false);
    setLikesError('');
  }, [initialLikedByMe, initialLikes, reviewId]);

  useEffect(() => {
    if (!canInteract || likesLoaded || likesLoading) return;
    void refreshLikes();
  }, [canInteract, likesLoaded, likesLoading, refreshLikes]);

  return {
    canInteract,
    likeEntries,
    likeLoading,
    likedByMe,
    likes,
    likesError,
    likesLoaded,
    likesLoading,
    refreshLikes,
    toggleLike,
  };
}
