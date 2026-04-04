import { api } from '@/lib/api/http';
import type {
  FeedComment,
  FeedEntry,
  FeedMediaKind,
  FeedShare,
  FeedSharedContent,
  FeedUser,
} from '@/type/feed';

type ApiFeedUser = {
  id?: number | string | null;
  nom?: string | null;
  prenom?: string | null;
  pseudo?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

type ApiFeedComment = {
  id: number | string;
  content: string;
  createdAt: string;
  user?: ApiFeedUser | null;
  author?: ApiFeedUser | null;
};

type ApiFeedMedia = {
  id?: number | null;
  type?: string | null;
  spotifyId?: string | null;
  title?: string | null;
  name?: string | null;
  artist?: string | null;
  imageUrl?: string | null;
  album?: string | null;
  albumName?: string | null;
  year?: number | null;
  releaseYear?: number | null;
  genres?: string[] | null;
};

type ApiFeedReview = {
  id?: number | null;
  rating?: number | null;
  content?: string | null;
  containsSpoilers?: boolean | null;
  mediaId?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  visibility?: string | null;
  likedByMe?: boolean | null;
  counts?: {
    comments?: number | null;
    likes?: number | null;
  } | null;
  media?: ApiFeedMedia | null;
  user?: ApiFeedUser | null;
  comments?: ApiFeedComment[] | null;
  comment?: ApiFeedComment | null;
};

type ApiFeedList = {
  id?: number | null;
  name?: string | null;
  isPublic?: boolean | null;
};

type ApiFeedActivity = {
  id: number;
  type: string;
  actorId?: number | string | null;
  targetUserId?: number | string | null;
  mediaId?: number | null;
  reviewId?: number | null;
  listId?: number | null;
  createdAt: string;
  actor?: ApiFeedUser | null;
  targetUser?: ApiFeedUser | null;
  media?: ApiFeedMedia | null;
  review?: ApiFeedReview | null;
  list?: ApiFeedList | null;
  comments?: ApiFeedComment[] | null;
  commentList?: ApiFeedComment[] | null;
  comment?: ApiFeedComment | null;
};

type FeedResponse = {
  activities: ApiFeedActivity[];
};

type NormalizedFeedEntry = FeedEntry & {
  activityType: string;
};

function normalizeKind(value?: string | null): FeedMediaKind {
  const raw = value?.trim().toUpperCase();
  if (raw === 'ARTIST' || raw === 'ARTISTS') return 'ARTIST';
  if (raw === 'ALBUM' || raw === 'ALBUMS') return 'ALBUM';
  return 'TRACK';
}

function isLikeActivityType(activityType: string) {
  return activityType.includes('LIKE');
}

function isCommentActivityType(activityType: string) {
  return activityType.includes('COMMENT');
}

function buildFeedUser(
  user?: ApiFeedUser | null,
  fallbackId?: string,
): FeedUser {
  const fullName = [user?.prenom?.trim(), user?.nom?.trim()]
    .filter(Boolean)
    .join(' ');
  const name =
    fullName ||
    user?.nom?.trim() ||
    user?.prenom?.trim() ||
    user?.pseudo?.trim() ||
    user?.email?.trim() ||
    'Utilisateur';
  const handleBase = user?.pseudo?.trim() || name;

  return {
    id:
      (user?.id !== null && user?.id !== undefined ? String(user.id) : '') ||
      fallbackId ||
      'unknown-user',
    email: user?.email?.trim() || '',
    name,
    handle: handleBase.startsWith('@')
      ? handleBase
      : `@${handleBase.replace(/\s+/g, '').toLowerCase()}`,
    avatarUrl: user?.avatarUrl?.trim() || '',
  };
}

function buildComment(comment: ApiFeedComment): FeedComment {
  return {
    id: String(comment.id),
    content: comment.content,
    createdAt: comment.createdAt,
    author: buildFeedUser(comment.user ?? comment.author),
  };
}

function mergeComments(...groups: FeedComment[][]): FeedComment[] {
  const comments = new Map<string, FeedComment>();

  for (const group of groups) {
    for (const comment of group) {
      const key = comment.id || `${comment.author.id}-${comment.createdAt}`;
      if (!comments.has(key)) {
        comments.set(key, comment);
      }
    }
  }

  return [...comments.values()].sort(
    (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
  );
}

function getReviewGroupKey(entry: NormalizedFeedEntry) {
  if (typeof entry.share.reviewId === 'number') {
    return `review-${entry.share.reviewId}`;
  }

  return `activity-${entry.share.id}`;
}

function collectComments(activity: ApiFeedActivity): FeedComment[] {
  const entries = [
    ...(activity.comments ?? []),
    ...(activity.commentList ?? []),
    ...(activity.comment ? [activity.comment] : []),
    ...(activity.review?.comments ?? []),
    ...(activity.review?.comment ? [activity.review.comment] : []),
  ];

  return entries.map(buildComment);
}

function buildSharedContent(activity: ApiFeedActivity): FeedSharedContent {
  const media = activity.media ?? activity.review?.media ?? null;
  const kind = normalizeKind(media?.type);
  const spotifyId = media?.spotifyId?.trim() || undefined;
  const imageUrl = media?.imageUrl?.trim() || undefined;
  const title = media?.title?.trim() || media?.name?.trim();
  const artist = media?.artist?.trim();

  if (kind === 'ARTIST') {
    return {
      kind: 'ARTIST',
      spotifyId,
      name: title || 'Artiste inconnu',
      genres: media?.genres?.filter(Boolean) ?? [],
      imageUrl,
    };
  }

  if (kind === 'ALBUM') {
    return {
      kind: 'ALBUM',
      spotifyId,
      title: title || 'Album inconnu',
      artist: artist || 'Artiste inconnu',
      year: media?.year ?? media?.releaseYear ?? undefined,
      imageUrl,
    };
  }

  return {
    kind: 'TRACK',
    spotifyId,
    title: title || 'Titre inconnu',
    artist: artist || 'Artiste inconnu',
    album: media?.album?.trim() || media?.albumName?.trim() || undefined,
    imageUrl,
  };
}

function normalizeFeedEntry(activity: ApiFeedActivity): NormalizedFeedEntry {
  const activityType = activity.type.trim().toUpperCase();
  const author = buildFeedUser(
    activity.actor,
    activity.actorId !== null && activity.actorId !== undefined
      ? String(activity.actorId)
      : undefined,
  );
  const initialComments = collectComments(activity);
  const review = activity.review;

  const share: FeedShare = {
    id: String(activity.id),
    reviewId: review?.id ?? activity.reviewId ?? undefined,
    authorId: author.id,
    visibility: review?.visibility === 'FOLLOWERS' ? 'FOLLOWERS' : 'PUBLIC',
    content: review?.content?.trim() || '',
    createdAt: review?.createdAt || activity.createdAt,
    shared: buildSharedContent(activity),
    rating: review?.rating ?? 0,
    likes: review?.counts?.likes ?? 0,
    comments: Math.max(review?.counts?.comments ?? 0, initialComments.length),
    likedByMe: review?.likedByMe === true,
    initialComments,
  };

  return { activityType, author, share };
}

function buildFeedFromGroup(group: NormalizedFeedEntry[]): FeedEntry | null {
  const createdEntry = group.find(
    (entry) => entry.activityType === 'REVIEW_CREATED',
  );

  if (createdEntry) {
    const likeActivities = group.filter((entry) =>
      isLikeActivityType(entry.activityType),
    );
    const commentActivities = group.filter((entry) =>
      isCommentActivityType(entry.activityType),
    );
    const mergedComments = mergeComments(
      createdEntry.share.initialComments ?? [],
      ...commentActivities.map((entry) => entry.share.initialComments ?? []),
    );

    return {
      author: createdEntry.author,
      share: {
        ...createdEntry.share,
        likes: Math.max(
          createdEntry.share.likes,
          ...group.map((entry) => entry.share.likes),
          likeActivities.length,
        ),
        comments: Math.max(
          createdEntry.share.comments,
          ...group.map((entry) => entry.share.comments),
          commentActivities.length,
          mergedComments.length,
        ),
        likedByMe: group.some((entry) => entry.share.likedByMe === true),
        initialComments: mergedComments,
      },
    };
  }

  const listItemEntry = group.find(
    (entry) => entry.activityType === 'LIST_ITEM_ADDED',
  );
  if (listItemEntry) {
    return {
      author: listItemEntry.author,
      share: listItemEntry.share,
    };
  }

  return null;
}

export async function getFeed(limit = 40): Promise<FeedEntry[]> {
  const response = await api<FeedResponse>(`/feed?limit=${limit}`);
  const normalizedEntries = response.activities.map(normalizeFeedEntry);

  const groupedEntries = new Map<string, NormalizedFeedEntry[]>();
  for (const entry of normalizedEntries) {
    const key = getReviewGroupKey(entry);
    const existing = groupedEntries.get(key);
    if (existing) {
      existing.push(entry);
    } else {
      groupedEntries.set(key, [entry]);
    }
  }

  return [...groupedEntries.values()]
    .map(buildFeedFromGroup)
    .filter((entry): entry is FeedEntry => entry !== null)
    .sort((a, b) => {
      const scoreA = a.share.likes + a.share.comments * 2;
      const scoreB = b.share.likes + b.share.comments * 2;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return +new Date(b.share.createdAt) - +new Date(a.share.createdAt);
    });
}
