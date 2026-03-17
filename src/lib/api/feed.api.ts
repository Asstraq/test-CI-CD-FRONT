import { api } from '@/lib/api/http';
import type {
  FeedComment,
  FeedEntry,
  FeedMediaKind,
  FeedShare,
  FeedSharedContent,
  FeedUser,
} from '@/type/feed';

type UnknownRecord = Record<string, unknown>;
type NormalizedFeedEntry = FeedEntry & {
  activityType: string;
};

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

function readId(...values: unknown[]): string | undefined {
  const stringValue = readString(...values);
  if (stringValue) return stringValue;

  const numericValue = readNumber(...values);
  if (numericValue !== undefined) return String(numericValue);

  return undefined;
}

function normalizeKind(value: unknown): FeedMediaKind {
  const raw = readString(value)?.toUpperCase();
  if (raw === 'ARTIST' || raw === 'ARTISTS') return 'ARTIST';
  if (raw === 'ALBUM' || raw === 'ALBUMS') return 'ALBUM';
  return 'TRACK';
}

function isLikeActivityType(activityType: string) {
  return /LIKE/.test(activityType);
}

function isCommentActivityType(activityType: string) {
  return /COMMENT/.test(activityType);
}

function getReviewGroupKey(entry: NormalizedFeedEntry) {
  if (typeof entry.share.reviewId === 'number') {
    return `review-${entry.share.reviewId}`;
  }

  return `activity-${entry.share.id}`;
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

function normalizeAuthor(
  item: UnknownRecord,
  review: UnknownRecord | null,
): FeedUser {
  const author =
    asRecord(item.author) ??
    asRecord(item.actor) ??
    asRecord(item.user) ??
    asRecord(item.owner) ??
    asRecord(review?.author) ??
    asRecord(review?.user);

  const id =
    readId(author?.id, author?.userId, item.authorId, item.userId) ??
    'unknown-author';
  const email = readString(author?.email) ?? '';
  const name =
    readString(author?.name, author?.nom, author?.username, author?.handle) ??
    'Utilisateur';
  const handleBase =
    readString(
      author?.handle,
      author?.username,
      author?.slug,
      author?.nom,
      author?.name,
    ) ?? name;

  return {
    id,
    email,
    name,
    handle: handleBase.startsWith('@')
      ? handleBase
      : `@${handleBase.replace(/\s+/g, '').toLowerCase()}`,
    avatarUrl:
      readString(
        author?.avatarUrl,
        author?.avatar,
        author?.imageUrl,
        author?.photoUrl,
      ) ?? '',
  };
}

function normalizeCommentAuthor(item: UnknownRecord | null): FeedUser {
  const author =
    asRecord(item?.author) ??
    asRecord(item?.actor) ??
    asRecord(item?.user) ??
    asRecord(item?.owner);

  const name =
    readString(
      author?.name,
      author?.nom,
      author?.username,
      author?.handle,
      author?.email,
    ) ?? 'Utilisateur';
  const handleBase =
    readString(
      author?.handle,
      author?.username,
      author?.slug,
      author?.name,
      author?.nom,
    ) ?? name;

  return {
    id: readId(author?.id, author?.userId, author?.email) ?? 'unknown-user',
    email: readString(author?.email) ?? '',
    name,
    handle: handleBase.startsWith('@')
      ? handleBase
      : `@${handleBase.replace(/\s+/g, '').toLowerCase()}`,
    avatarUrl:
      readString(
        author?.avatarUrl,
        author?.avatar,
        author?.imageUrl,
        author?.photoUrl,
      ) ?? '',
  };
}

function normalizeComments(value: unknown): FeedComment[] {
  const entries = Array.isArray(value) ? value : asRecord(value) ? [value] : [];

  return entries
    .map((entry) => {
      const wrapper = asRecord(entry);
      const item =
        asRecord(wrapper?.comment) ??
        asRecord(wrapper?.data) ??
        asRecord(wrapper?.item) ??
        wrapper;
      if (!item) return null;

      return {
        id: readId(item.id, item.commentId) ?? `comment-${Date.now()}`,
        content: readString(item.content, item.text, item.body) ?? '',
        createdAt:
          readString(item.createdAt, item.created_at) ??
          new Date().toISOString(),
        author: normalizeCommentAuthor(item),
      };
    })
    .filter((comment): comment is FeedComment => Boolean(comment));
}

function normalizeSharedContent(
  kind: FeedMediaKind,
  item: UnknownRecord,
  review: UnknownRecord | null,
): FeedSharedContent {
  const media =
    asRecord(item.media) ??
    asRecord(item.spotify) ??
    asRecord(item.item) ??
    asRecord(review?.media);

  const spotifyId = readString(
    item.spotifyId,
    item.mediaSpotifyId,
    media?.spotifyId,
    media?.id,
    review?.spotifyId,
  );
  const imageUrl = readString(
    media?.imageUrl,
    media?.image,
    media?.coverUrl,
    media?.photoUrl,
    item.imageUrl,
  );

  if (kind === 'ARTIST') {
    const genres =
      asArray(media?.genres).filter(
        (value): value is string => typeof value === 'string',
      ) || [];

    return {
      kind,
      spotifyId,
      name:
        readString(media?.name, item.title, item.name, review?.title) ??
        'Artiste inconnu',
      genres,
      imageUrl,
    };
  }

  if (kind === 'ALBUM') {
    return {
      kind,
      spotifyId,
      title:
        readString(media?.title, media?.name, item.title, review?.title) ??
        'Album inconnu',
      artist:
        readString(
          media?.artist,
          media?.artistName,
          media?.subtitle,
          item.artist,
          review?.artist,
        ) ?? 'Artiste inconnu',
      year: readNumber(
        media?.year,
        media?.releaseYear,
        item.year,
        review?.year,
      ),
      imageUrl,
    };
  }

  return {
    kind,
    spotifyId,
    title:
      readString(media?.title, media?.name, item.title, review?.title) ??
      'Titre inconnu',
    artist:
      readString(
        media?.artist,
        media?.artistName,
        item.artist,
        review?.artist,
      ) ?? 'Artiste inconnu',
    album: readString(
      media?.album,
      media?.albumName,
      item.album,
      review?.album,
    ),
    imageUrl,
  };
}

function getMediaKind(
  item: UnknownRecord,
  review: UnknownRecord | null,
): FeedMediaKind {
  const media =
    asRecord(item.media) ??
    asRecord(item.spotify) ??
    asRecord(item.item) ??
    asRecord(review?.media);

  return normalizeKind(
    media?.type ??
      item.mediaType ??
      review?.mediaType ??
      review?.type ??
      item.type,
  );
}

function normalizeFeedEntry(entry: unknown): NormalizedFeedEntry | null {
  const item = asRecord(entry);
  if (!item) return null;

  const review = asRecord(item.review);
  const reviewCount = asRecord(review?._count);
  const itemCount = asRecord(item._count);
  const activityType = readString(item.type)?.toUpperCase() ?? 'UNKNOWN';
  const kind = getMediaKind(item, review);
  const author = normalizeAuthor(item, review);
  const initialComments = normalizeComments(
    item.comment ??
      item.commentsList ??
      item.commentList ??
      item.comments ??
      review?.comment ??
      review?.commentsList ??
      review?.commentList ??
      review?.comments,
  );

  const share: FeedShare = {
    id: readId(item.id, review?.id) ?? `feed-${author.id}-${Date.now()}`,
    reviewId: readNumber(item.reviewId, review?.id),
    authorId: author.id,
    visibility:
      readString(item.visibility, review?.visibility)?.toUpperCase() ===
      'FOLLOWERS'
        ? 'FOLLOWERS'
        : 'PUBLIC',
    content:
      readString(item.content, review?.content, item.caption, item.text) ?? '',
    createdAt:
      readString(
        item.createdAt,
        item.created_at,
        review?.createdAt,
        review?.created_at,
      ) ?? new Date().toISOString(),
    shared: normalizeSharedContent(kind, item, review),
    rating: readNumber(item.rating, review?.rating) ?? 0,
    likes:
      readNumber(
        item.likes,
        item.likesCount,
        item.likeCount,
        itemCount?.likes,
        itemCount?.likeCount,
        review?.likes,
        review?.likesCount,
        review?.likeCount,
        reviewCount?.likes,
        reviewCount?.likeCount,
        asArray(item.likes).length,
        asArray(review?.likes).length,
      ) ?? 0,
    comments:
      readNumber(
        item.comments,
        item.commentsCount,
        item.commentCount,
        itemCount?.comments,
        itemCount?.commentCount,
        review?.comments,
        review?.commentsCount,
        review?.commentCount,
        reviewCount?.comments,
        reviewCount?.commentCount,
        asArray(item.commentList).length,
        asArray(item.comments).length,
        asArray(review?.commentList).length,
        asArray(review?.comments).length,
        initialComments.length,
      ) ?? 0,
    likedByMe:
      item.likedByMe === true ||
      item.isLiked === true ||
      item.liked === true ||
      review?.likedByMe === true ||
      review?.isLiked === true ||
      review?.liked === true,
    initialComments,
  };

  return { share, author, activityType };
}

export async function getFeed(limit = 40): Promise<FeedEntry[]> {
  const response = await api<unknown>(`/feed?limit=${limit}`);
  const root = asRecord(response);
  const items = Array.isArray(response)
    ? response
    : asArray(root?.activities).length > 0
      ? asArray(root?.activities)
      : asArray(root?.items).length > 0
        ? asArray(root?.items)
        : asArray(root?.feed).length > 0
          ? asArray(root?.feed)
          : asArray(root?.data);

  const normalizedEntries = items
    .map(normalizeFeedEntry)
    .filter((entry): entry is NormalizedFeedEntry => Boolean(entry));

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
    .map((group) => {
      const createdEntry = group.find(
        (entry) => entry.activityType === 'REVIEW_CREATED',
      );
      if (!createdEntry) return null;

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
    })
    .filter((entry): entry is FeedEntry => Boolean(entry))
    .sort((a, b) => {
      const scoreA = a.share.likes + a.share.comments * 2;
      const scoreB = b.share.likes + b.share.comments * 2;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return +new Date(b.share.createdAt) - +new Date(a.share.createdAt);
    });
}
