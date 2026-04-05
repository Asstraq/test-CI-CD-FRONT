import { api } from '@/lib/api/http';
import { buildPublicUserIdentity } from '@/lib/user/buildPublicUser';
import {
  buildReview as buildPublicReview,
  buildReviewComment,
} from '@/lib/review/buildPublicReview';
import type {
  NotificationActor,
  NotificationComment,
  NotificationItem,
  NotificationsPage,
  NotificationReview,
  NotificationType,
} from '@/type/notifications';

type ApiNotificationActor = {
  id?: number | string | null;
  nom?: string | null;
  prenom?: string | null;
  pseudo?: string | null;
  avatarUrl?: string | null;
  theme?: string | null;
  displayColor?: string | null;
};

type ApiNotificationReview = {
  id?: number | string | null;
  rating?: number | null;
  content?: string | null;
  mediaId?: number | string | null;
};

type ApiNotificationComment = {
  id?: number | string | null;
  content?: string | null;
  createdAt?: string | null;
};

type ApiNotification = {
  id: number | string;
  actorId?: number | string | null;
  type: NotificationType;
  reviewId?: number | string | null;
  commentId?: number | string | null;
  readAt?: string | null;
  createdAt: string;
  actor?: ApiNotificationActor | null;
  review?: ApiNotificationReview | null;
  comment?: ApiNotificationComment | null;
};

type NotificationsResponse = {
  notifications: ApiNotification[];
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
  nextCursor: number | null;
};

type MarkNotificationReadResponse = {
  notification: {
    id: number | string;
    readAt: string | null;
  };
};

type MarkAllNotificationsReadResponse = {
  updatedCount: number;
  readAt: string;
};

function buildReview(
  review?: ApiNotificationReview | null,
): NotificationReview | null {
  const normalized = buildPublicReview(review);
  if (normalized.id <= 0) return null;

  return {
    id: String(normalized.id),
    rating: normalized.rating,
    content: normalized.content,
    mediaId: normalized.mediaId !== null ? String(normalized.mediaId) : null,
  };
}

function buildComment(
  comment?: ApiNotificationComment | null,
): NotificationComment | null {
  const normalized = buildReviewComment(comment);
  if (normalized.id <= 0 || !normalized.createdAt) return null;

  return {
    id: String(normalized.id),
    content: normalized.content,
    createdAt: normalized.createdAt,
  };
}

function buildNotification(entry: ApiNotification): NotificationItem {
  return {
    id: String(entry.id),
    type: entry.type,
    actorId:
      entry.actorId !== null && entry.actorId !== undefined
        ? String(entry.actorId)
        : null,
    reviewId:
      entry.reviewId !== null && entry.reviewId !== undefined
        ? String(entry.reviewId)
        : null,
    commentId:
      entry.commentId !== null && entry.commentId !== undefined
        ? String(entry.commentId)
        : null,
    readAt: entry.readAt ?? null,
    createdAt: entry.createdAt,
    actor: buildPublicUserIdentity(entry.actor) as NotificationActor,
    review: buildReview(entry.review),
    comment: buildComment(entry.comment),
  };
}

export async function listNotifications(
  limit = 6,
  cursor?: number,
): Promise<NotificationsPage> {
  const params = new URLSearchParams({
    limit: String(limit),
  });

  if (typeof cursor === 'number' && Number.isFinite(cursor) && cursor > 0) {
    params.set('cursor', String(cursor));
  }

  const response = await api<NotificationsResponse>(
    `/notifications?${params.toString()}`,
  );

  return {
    notifications: response.notifications.map(buildNotification),
    unreadNotificationsCount: response.unreadNotificationsCount,
    unreadMessagesCount: response.unreadMessagesCount,
    nextCursor: response.nextCursor,
  };
}

export async function markNotificationRead(notificationId: string) {
  const response = await api<MarkNotificationReadResponse>(
    `/notifications/${notificationId}/read`,
    {
      method: 'POST',
    },
  );

  return {
    id: String(response.notification.id),
    readAt: response.notification.readAt,
  };
}

export function markAllNotificationsRead() {
  return api<MarkAllNotificationsReadResponse>('/notifications/read-all', {
    method: 'POST',
  });
}
