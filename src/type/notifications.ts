export type NotificationType =
  | 'FOLLOW'
  | 'FOLLOW_REQUEST'
  | 'FOLLOW_REQUEST_ACCEPTED'
  | 'REVIEW_LIKED'
  | 'REVIEW_COMMENTED';

export type NotificationActor = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  theme?: string;
  displayColor?: string;
};

export type NotificationReview = {
  id: string;
  rating?: number | null;
  content?: string | null;
  mediaId?: string | null;
};

export type NotificationComment = {
  id: string;
  content: string;
  createdAt: string;
};

export type NotificationItem = {
  id: string;
  type: NotificationType;
  actorId?: string | null;
  reviewId?: string | null;
  commentId?: string | null;
  readAt?: string | null;
  createdAt: string;
  actor: NotificationActor;
  review?: NotificationReview | null;
  comment?: NotificationComment | null;
};

export type NotificationsPage = {
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
  nextCursor: number | null;
};
